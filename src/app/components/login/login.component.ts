import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  public showPassword: boolean = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.authService.authenticate(this.form.value).subscribe({
        next: (response) => {
          this.router.navigate(['/profile']);
        },
        error: (err) => {
          console.error('Authentication error:', err);
          this.errorMessage = 'Falha na autenticação. Por favor, verifique seus dados e tente novamente.';
        }
      });
      this.form.reset();
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
    }
     
  }
}
