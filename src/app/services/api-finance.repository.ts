import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { FinanceState } from '../models/finance';
import { AuthService } from './auth.service';
import { BrowserStorageService } from './browser-storage.service';
import { FinanceRepository, FinanceStateResponse, FinanceSyncResponse } from './finance.repository';
import { FinanceSyncStatusService } from './finance-sync-status.service';
import { LocalFinanceRepository } from './local-finance.repository';

@Injectable({
  providedIn: 'root',
})
export class ApiFinanceRepository implements FinanceRepository {
  private readonly stateUrl = `${environment.apiUrl}/api/finance/state`;
  private readonly syncUrl = `${environment.apiUrl}/api/finance/sync`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private storage: BrowserStorageService,
    private syncStatus: FinanceSyncStatusService,
    private localRepository: LocalFinanceRepository
  ) {}

  load(userKey: string): Observable<FinanceState> {
    if (!this.canUseApi()) {
      this.syncStatus.setOffline();
      return this.localRepository.load(userKey);
    }

    this.syncStatus.setChecking();

    return this.localRepository.load(userKey).pipe(
      switchMap((localState) =>
        this.http.get<FinanceStateResponse>(this.stateUrl).pipe(
          switchMap((response) => this.resolveInitialState(userKey, localState, response)),
          catchError(() => {
            this.syncStatus.setError();
            return of(localState);
          })
        )
      )
    );
  }

  save(userKey: string, state: FinanceState): Observable<FinanceState> {
    if (!this.canUseApi()) {
      this.syncStatus.setOffline();
      return this.localRepository.save(userKey, state);
    }

    this.syncStatus.setSyncing();

    return this.http.put<FinanceStateResponse>(this.stateUrl, state).pipe(
      tap((response) => {
        this.storeServerVersion(userKey, response.serverVersion);
        this.syncStatus.setSynced();
      }),
      switchMap((response) => this.localRepository.save(userKey, response.state)),
      catchError(() => {
        this.syncStatus.setError();
        return this.localRepository.save(userKey, state);
      })
    );
  }

  private resolveInitialState(userKey: string, localState: FinanceState, response: FinanceStateResponse): Observable<FinanceState> {
    const hasLocalState = !isEmptyState(localState);

    if (!response.exists) {
      this.storeServerVersion(userKey, 0);

      if (hasLocalState) {
        return this.save(userKey, localState);
      }

      return of(localState);
    }

    if (!hasLocalState) {
      this.storeServerVersion(userKey, response.serverVersion);
      this.syncStatus.setSynced();
      return this.localRepository.save(userKey, response.state);
    }

    return this.sync(userKey, localState);
  }

  private sync(userKey: string, localState: FinanceState): Observable<FinanceState> {
    this.syncStatus.setSyncing();

    return this.http
      .post<FinanceSyncResponse>(this.syncUrl, {
        baseVersion: this.getServerVersion(userKey),
        localState,
      })
      .pipe(
        tap((response) => {
          this.storeServerVersion(userKey, response.serverVersion);
          this.syncStatus.setSynced(response.conflicts.length);
        }),
        switchMap((response) => this.localRepository.save(userKey, response.state))
      );
  }

  private getServerVersion(userKey: string): number {
    return Number(this.storage.getItem(this.versionKey(userKey)) || 0);
  }

  private storeServerVersion(userKey: string, version: number): void {
    this.storage.setItem(this.versionKey(userKey), String(version));
  }

  private versionKey(userKey: string): string {
    return `${userKey}:ServerVersion`;
  }

  private canUseApi(): boolean {
    return environment.financeApiEnabled && !!this.authService.getAuthToken();
  }
}

function isEmptyState(state: FinanceState): boolean {
  return (
    state.incomes.length === 0 &&
    state.expenses.length === 0 &&
    state.cards.length === 0 &&
    state.goals.length === 0 &&
    state.accounts.length === 0 &&
    state.investments.length === 0
  );
}
