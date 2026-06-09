import { FinanceState } from '../models/finance';
import { Observable } from 'rxjs';

export interface FinanceRepository {
  load(userKey: string): Observable<FinanceState>;
  save(userKey: string, state: FinanceState): Observable<FinanceState>;
}
