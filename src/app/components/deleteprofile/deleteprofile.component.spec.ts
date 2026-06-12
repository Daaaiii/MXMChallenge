import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteprofileComponent } from './deleteprofile.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FeedbackModalService, FeedbackModalState } from '../../services/feedback-modal.service';

describe('DeleteprofileComponent', () => {
  let component: DeleteprofileComponent;
  let fixture: ComponentFixture<DeleteprofileComponent>;
  let modalState = {} as FeedbackModalState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteprofileComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: jasmine.createSpyObj<AuthService>('AuthService', {
            isLoggedIn: true,
            deleteProfile: of(undefined),
            logout: undefined,
          }),
        },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeleteprofileComponent);
    component = fixture.componentInstance;
    TestBed.inject(FeedbackModalService).state$.subscribe((state) => {
      modalState = state;
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens a success modal when the profile is deleted', () => {
    component.confirmarExclusao();

    expect(modalState.open).toBeTrue();
    expect(modalState.type).toBe('success');
    expect(modalState.message).toContain('Perfil excluido');
  });
});
