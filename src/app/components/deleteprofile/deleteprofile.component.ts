import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-deleteprofile',
    imports: [SidebarComponent],
    templateUrl: './deleteprofile.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './deleteprofile.component.css'
})
export class DeleteprofileComponent {
  feedbackMessage = '';
  isDeleting = false;

  constructor(private router: Router, private authService: AuthService) {}

  confirmarExclusao() {
    if (this.authService.isLoggedIn()) {
      this.isDeleting = true;
      this.authService.deleteProfile().subscribe({
        next: () => {
          this.feedbackMessage = 'Perfil excluído com sucesso.';
          this.authService.logout();
          this.router.navigate(['/home']);
        },
        error: () => {
          this.feedbackMessage = 'Não foi possível excluir o perfil. Tente novamente.';
          this.isDeleting = false;
        },
      });
    } else {
      this.feedbackMessage = 'Token de autenticação ausente.';
    }
  }

  cancelarExclusao() {
    this.router.navigate(['/profile']);
  }
}
