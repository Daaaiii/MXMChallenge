import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FeedbackModalService } from '../../services/feedback-modal.service';

@Component({
  selector: 'app-deleteprofile',
  imports: [SidebarComponent],
  templateUrl: './deleteprofile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './deleteprofile.component.css',
})
export class DeleteprofileComponent {
  isDeleting = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private feedbackModal: FeedbackModalService
  ) {}

  confirmarExclusao() {
    if (this.authService.isLoggedIn()) {
      this.isDeleting = true;
      this.authService.deleteProfile().subscribe({
        next: () => {
          this.feedbackModal.showSuccess('Perfil excluido com sucesso.', 'Perfil excluido');
          this.authService.logout();
          this.router.navigate(['/home']);
        },
        error: () => {
          this.feedbackModal.showError('Nao foi possivel excluir o perfil. Tente novamente.', 'Erro ao excluir');
          this.isDeleting = false;
        },
      });
    } else {
      this.feedbackModal.showError('Token de autenticacao ausente.', 'Sessao invalida');
    }
  }

  cancelarExclusao() {
    this.router.navigate(['/profile']);
  }
}
