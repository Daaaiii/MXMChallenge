import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { FeedbackModalService, FeedbackModalState } from '../../services/feedback-modal.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let modalState = {} as FeedbackModalState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['authenticate']) },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    TestBed.inject(FeedbackModalService).state$.subscribe((state) => {
      modalState = state;
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens a warning modal when submitting an invalid form', () => {
    component.onSubmit();

    expect(modalState.open).toBeTrue();
    expect(modalState.type).toBe('warning');
    expect(modalState.title).toBe('Formulario invalido');
  });
});
