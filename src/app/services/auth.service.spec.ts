import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { BrowserStorageService } from './browser-storage.service';
import { environment } from '../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storage: jasmine.SpyObj<BrowserStorageService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    storage = jasmine.createSpyObj<BrowserStorageService>('BrowserStorageService', [
      'getItem',
      'setItem',
      'removeItem',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
    imports: [],
    providers: [
        AuthService,
        { provide: BrowserStorageService, useValue: storage },
        { provide: Router, useValue: router },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('stores token and user name after authentication', () => {
    service.authenticate({ email: 'user@test.com', password: 'Password1!' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth`);
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'token-123',
      userId: 'user-1',
      email: 'user@test.com',
      fullname: 'User Test',
    });

    expect(storage.setItem).toHaveBeenCalledWith('AuthToken', 'token-123');
    expect(storage.setItem).toHaveBeenCalledWith('User', 'User Test');
  });

  it('clears only application storage keys on logout', () => {
    storage.getItem.and.returnValue('token-123');

    service.logout();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(storage.removeItem).toHaveBeenCalledWith('AuthToken');
    expect(storage.removeItem).toHaveBeenCalledWith('User');
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('returns a controlled error when profile is requested without a token', (done) => {
    storage.getItem.and.returnValue(null);

    service.getProfile().subscribe({
      next: () => fail('expected an error'),
      error: (error: Error) => {
        expect(error.message).toBe('Token missing');
        done();
      },
    });
  });
});
