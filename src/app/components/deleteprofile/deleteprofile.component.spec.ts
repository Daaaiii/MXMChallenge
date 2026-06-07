import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteprofileComponent } from './deleteprofile.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

describe('DeleteprofileComponent', () => {
  let component: DeleteprofileComponent;
  let fixture: ComponentFixture<DeleteprofileComponent>;

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
