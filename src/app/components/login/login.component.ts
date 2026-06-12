import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FeedbackModalService } from '../../services/feedback-modal.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  public showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private feedbackModal: FeedbackModalService
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
          this.feedbackModal.showError('Erro ao autenticar o usuario. Por favor, tente novamente.', 'Erro no login');
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
      this.form.reset();
    } else {
      this.isLoading = false;
      this.feedbackModal.showWarning('Por favor, preencha todos os campos corretamente.', 'Formulario invalido');
    }
  }
}
