import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';

import { AuthGuard } from './auth-guard.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('allows access when user is logged in', () => {
    authService.isLoggedIn.and.returnValue(true);

    expect(guard.canActivate({} as never, { url: '/profile' } as RouterStateSnapshot)).toBeTrue();
  });

  it('redirects to home when user is not logged in', () => {
    authService.isLoggedIn.and.returnValue(false);

    expect(guard.canActivate({} as never, { url: '/profile' } as RouterStateSnapshot)).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/home'], { queryParams: { returnUrl: '/profile' } });
  });
});
