import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RegisterDTO } from '../../models/registerDTO';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  const profile: RegisterDTO = {
    id: 'user-1',
    fullname: 'User Test',
    email: 'user@test.com',
    ddd: 11,
    phoneNumber: 912345678,
    cpf_cnpj: '52998224725',
    zipcode: '01001000',
    street: 'Praça da Sé',
    number: '100',
    neighborhood: 'Sé',
    city: 'São Paulo',
    state: 'SP',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: jasmine.createSpyObj<AuthService>('AuthService', {
            getStoredUserName: 'User Test',
            isLoggedIn: true,
            getProfile: of(profile),
            logout: undefined,
          }),
        },
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
