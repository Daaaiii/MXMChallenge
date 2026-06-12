import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FinanceSyncStatus = 'local' | 'checking' | 'syncing' | 'synced' | 'offline' | 'error';

export interface FinanceSyncStatusState {
  status: FinanceSyncStatus;
  label: string;
  detail: string;
  conflictCount: number;
  lastSyncedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceSyncStatusService {
  private readonly statusSubject = new BehaviorSubject<FinanceSyncStatusState>({
    status: 'local',
    label: 'Local',
    detail: 'Dados salvos neste navegador',
    conflictCount: 0,
  });

  readonly status$ = this.statusSubject.asObservable();

  snapshot(): FinanceSyncStatusState {
    return this.statusSubject.getValue();
  }

  setChecking(): void {
    this.statusSubject.next({
      status: 'checking',
      label: 'Verificando',
      detail: 'Consultando dados remotos',
      conflictCount: 0,
    });
  }

  setSyncing(): void {
    this.statusSubject.next({
      status: 'syncing',
      label: 'Sincronizando',
      detail: 'Enviando alteracoes',
      conflictCount: 0,
    });
  }

  setSynced(conflictCount = 0): void {
    this.statusSubject.next({
      status: conflictCount > 0 ? 'error' : 'synced',
      label: conflictCount > 0 ? 'Com conflitos' : 'Sincronizado',
      detail: conflictCount > 0 ? `${conflictCount} conflito(s) pendente(s)` : 'Dados atualizados no backend',
      conflictCount,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  setOffline(): void {
    this.statusSubject.next({
      status: 'offline',
      label: 'Local',
      detail: 'Usando fallback local',
      conflictCount: 0,
    });
  }

  setError(): void {
    this.statusSubject.next({
      status: 'error',
      label: 'Sem sincronizar',
      detail: 'Backend indisponivel; dados mantidos localmente',
      conflictCount: 0,
    });
  }
}
