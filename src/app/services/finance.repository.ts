import { FinanceState } from '../models/finance';
import { Observable } from 'rxjs';

export interface FinanceRepository {
  load(userKey: string): Observable<FinanceState>;
  save(userKey: string, state: FinanceState): Observable<FinanceState>;
}

export interface FinanceStateResponse {
  exists: boolean;
  serverVersion: number;
  updatedAt: string | null;
  state: FinanceState;
}

export interface FinanceSyncResponse {
  source: 'local' | 'remote' | 'merged';
  serverVersion: number;
  state: FinanceState;
  conflicts: FinanceSyncConflict[];
}

export interface FinanceSyncConflict {
  entity: string;
  entityId: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
}
