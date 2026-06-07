import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { AuthInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  it('adds Authorization header when a token exists', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['getAuthToken']);
    authService.getAuthToken.and.returnValue('token-123');
    const interceptor = new AuthInterceptor(authService);
    const request = new HttpRequest('GET', '/user');
    const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);

    next.handle.and.returnValue(of(new HttpResponse()));

    interceptor.intercept(request, next).subscribe();

    const handledRequest = next.handle.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(handledRequest.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('keeps the request unchanged when no token exists', () => {
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['getAuthToken']);
    authService.getAuthToken.and.returnValue(null);
    const interceptor = new AuthInterceptor(authService);
    const request = new HttpRequest('GET', '/user');
    const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);

    next.handle.and.returnValue(of(new HttpResponse()));

    interceptor.intercept(request, next).subscribe();

    expect(next.handle).toHaveBeenCalledWith(request);
  });
});
