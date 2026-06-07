
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  public showPassword: boolean = false;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.isLoading = true;
      this.authService.authenticate(this.form.value).subscribe({
        next: () => {
          this.router.navigate(['/welcome']);
        },
        error: (err) => {
          console.error('Authentication error:', err);
          this.errorMessage = 'Erro ao autenticar o usuário. Por favor, tente novamente.';
            this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
      this.form.reset();
    } else {
      this.isLoading = false;
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
    }
  }
}
