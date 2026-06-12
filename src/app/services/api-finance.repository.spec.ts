import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { FinanceState } from '../models/finance';
import { ApiFinanceRepository } from './api-finance.repository';
import { AuthService } from './auth.service';
import { BrowserStorageService } from './browser-storage.service';
import { FinanceSyncStatusService } from './finance-sync-status.service';
import { LocalFinanceRepository } from './local-finance.repository';

describe('ApiFinanceRepository', () => {
  const emptyState: FinanceState = {
    incomes: [],
    expenses: [],
    cards: [],
    goals: [],
    accounts: [],
    investments: [],
  };

  let repository: ApiFinanceRepository;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let storage: jasmine.SpyObj<BrowserStorageService>;
  let syncStatus: FinanceSyncStatusService;
  let localRepository: jasmine.SpyObj<LocalFinanceRepository>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getAuthToken']);
    storage = jasmine.createSpyObj<BrowserStorageService>('BrowserStorageService', ['getItem', 'setItem']);
    localRepository = jasmine.createSpyObj<LocalFinanceRepository>('LocalFinanceRepository', ['load', 'save']);
    storage.getItem.and.returnValue(null);
    localRepository.load.and.returnValue(of(emptyState));
    localRepository.save.and.callFake((_userKey, state) => of(state));

    TestBed.configureTestingModule({
      providers: [
        ApiFinanceRepository,
        { provide: AuthService, useValue: authService },
        { provide: BrowserStorageService, useValue: storage },
        { provide: LocalFinanceRepository, useValue: localRepository },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    repository = TestBed.inject(ApiFinanceRepository);
    httpMock = TestBed.inject(HttpTestingController);
    syncStatus = TestBed.inject(FinanceSyncStatusService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads remote state and mirrors it locally when authenticated', async () => {
    authService.getAuthToken.and.returnValue('token-123');
    const remoteState: FinanceState = {
      ...emptyState,
      incomes: [
        {
          id: 'income-1',
          description: 'Pagamento',
          amount: 1000,
          date: '2026-06-12',
          category: 'Pagamento',
          recurring: false,
          active: true,
        },
      ],
    };

    const resultPromise = firstValueFrom(repository.load('FinanceState:User'));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/finance/state`);
    expect(req.request.method).toBe('GET');
    req.flush({
      exists: true,
      serverVersion: 1,
      updatedAt: '2026-06-12T00:00:00Z',
      state: remoteState,
    });

    const result = await resultPromise;

    expect(result).toBe(remoteState);
    expect(localRepository.save).toHaveBeenCalledWith('FinanceState:User', remoteState);
    expect(storage.setItem).toHaveBeenCalledWith('FinanceState:User:ServerVersion', '1');
    expect(syncStatus.snapshot().status).toBe('synced');
  });

  it('loads local state when remote state does not exist and local state is empty', async () => {
    authService.getAuthToken.and.returnValue('token-123');

    const resultPromise = firstValueFrom(repository.load('FinanceState:User'));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/finance/state`);
    req.flush({
      exists: false,
      serverVersion: 0,
      updatedAt: null,
      state: emptyState,
    });

    const result = await resultPromise;

    expect(result).toBe(emptyState);
    expect(localRepository.load).toHaveBeenCalledWith('FinanceState:User');
    expect(storage.setItem).toHaveBeenCalledWith('FinanceState:User:ServerVersion', '0');
  });

  it('migrates local state to remote when remote state does not exist', async () => {
    authService.getAuthToken.and.returnValue('token-123');
    const localState: FinanceState = {
      ...emptyState,
      expenses: [
        {
          id: 'expense-1',
          description: 'Mercado',
          category: 'Outros',
          amount: 250,
          date: '2026-06-12',
          paymentMethod: 'pix',
          installments: 1,
        },
      ],
    };
    localRepository.load.and.returnValue(of(localState));

    const resultPromise = firstValueFrom(repository.load('FinanceState:User'));

    const getReq = httpMock.expectOne(`${environment.apiUrl}/api/finance/state`);
    getReq.flush({
      exists: false,
      serverVersion: 0,
      updatedAt: null,
      state: emptyState,
    });

    const putReq = httpMock.expectOne(`${environment.apiUrl}/api/finance/state`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toBe(localState);
    putReq.flush({
      exists: true,
      serverVersion: 1,
      updatedAt: '2026-06-12T00:00:00Z',
      state: localState,
    });

    const result = await resultPromise;

    expect(result).toBe(localState);
    expect(storage.setItem).toHaveBeenCalledWith('FinanceState:User:ServerVersion', '1');
  });

  it('syncs local and remote state when both exist', async () => {
    authService.getAuthToken.and.returnValue('token-123');
    storage.getItem.and.returnValue('3');
    const localState: FinanceState = {
      ...emptyState,
      incomes: [
        {
          id: 'income-1',
          description: 'Pagamento local',
          amount: 1000,
          date: '2026-06-12',
          category: 'Pagamento',
          recurring: false,
          active: true,
        },
      ],
    };
    localRepository.load.and.returnValue(of(localState));

    const resultPromise = firstValueFrom(repository.load('FinanceState:User'));

    const getReq = httpMock.expectOne(`${environment.apiUrl}/api/finance/state`);
    getReq.flush({
      exists: true,
      serverVersion: 4,
      updatedAt: '2026-06-12T00:00:00Z',
      state: emptyState,
    });

    const syncReq = httpMock.expectOne(`${environment.apiUrl}/api/finance/sync`);
    expect(syncReq.request.method).toBe('POST');
    expect(syncReq.request.body).toEqual({ baseVersion: 3, localState });
    syncReq.flush({
      source: 'merged',
      serverVersion: 5,
      state: localState,
      conflicts: [
        {
          entity: 'incomes',
          entityId: 'income-1',
          field: 'amount',
          localValue: 1000,
          remoteValue: 900,
          createdAt: '2026-06-12T00:00:00Z',
        },
      ],
    });

    const result = await resultPromise;

    expect(result).toBe(localState);
    expect(localRepository.save).toHaveBeenCalledWith('FinanceState:User', localState);
    expect(storage.setItem).toHaveBeenCalledWith('FinanceState:User:ServerVersion', '5');
    expect(syncStatus.snapshot().status).toBe('error');
    expect(syncStatus.snapshot().conflictCount).toBe(1);
    expect(syncStatus.snapshot().conflicts[0].field).toBe('amount');
  });

  it('saves remote state and mirrors the response locally when authenticated', async () => {
    authService.getAuthToken.and.returnValue('token-123');

    const resultPromise = firstValueFrom(repository.save('FinanceState:User', emptyState));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/finance/state`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBe(emptyState);
    req.flush({
      exists: true,
      serverVersion: 1,
      updatedAt: '2026-06-12T00:00:00Z',
      state: emptyState,
    });

    const result = await resultPromise;

    expect(result).toBe(emptyState);
    expect(localRepository.save).toHaveBeenCalledWith('FinanceState:User', emptyState);
  });

  it('falls back to local repository when there is no token', async () => {
    authService.getAuthToken.and.returnValue(null);

    const result = await firstValueFrom(repository.save('FinanceState:User', emptyState));

    expect(result).toBe(emptyState);
    expect(localRepository.save).toHaveBeenCalledWith('FinanceState:User', emptyState);
    expect(syncStatus.snapshot().status).toBe('offline');
    httpMock.expectNone(`${environment.apiUrl}/api/finance/state`);
  });

  it('falls back to local repository when the API fails', async () => {
    authService.getAuthToken.and.returnValue('token-123');

    const resultPromise = firstValueFrom(repository.load('FinanceState:User'));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/finance/state`);
    req.flush({ message: 'unavailable' }, { status: 503, statusText: 'Service Unavailable' });

    const result = await resultPromise;

    expect(result).toBe(emptyState);
    expect(localRepository.load).toHaveBeenCalledWith('FinanceState:User');
    expect(syncStatus.snapshot().status).toBe('error');
  });
});
