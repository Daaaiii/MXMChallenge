import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterSuccessComponent } from './register-success.component';
import { provideRouter } from '@angular/router';

describe('RegisterSuccessComponent', () => {
  let component: RegisterSuccessComponent;
  let fixture: ComponentFixture<RegisterSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSuccessComponent],
      providers: [provideRouter([])],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
