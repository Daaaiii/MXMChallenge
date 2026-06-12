import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { SearchCepService } from '../../services/search-cep.service';
import { provideRouter } from '@angular/router';
import { FeedbackModalService, FeedbackModalState } from '../../services/feedback-modal.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let modalState = {} as FeedbackModalState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['register']) },
        { provide: SearchCepService, useValue: jasmine.createSpyObj<SearchCepService>('SearchCepService', ['buscarCEP']) },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterComponent);
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
