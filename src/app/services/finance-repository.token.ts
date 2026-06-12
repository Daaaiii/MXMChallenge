import { inject, InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiFinanceRepository } from './api-finance.repository';
import { AuthService } from './auth.service';
import { FinanceRepository } from './finance.repository';
import { LocalFinanceRepository } from './local-finance.repository';

export const FINANCE_REPOSITORY = new InjectionToken<FinanceRepository>('FINANCE_REPOSITORY', {
  providedIn: 'root',
  factory: () => {
    const authService = inject(AuthService, { optional: true });
    const hasToken = typeof authService?.getAuthToken === 'function' && !!authService.getAuthToken();

    return environment.financeApiEnabled && hasToken ? inject(ApiFinanceRepository) : inject(LocalFinanceRepository);
  },
});
