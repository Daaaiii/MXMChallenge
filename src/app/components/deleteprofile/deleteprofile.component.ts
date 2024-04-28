import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-deleteprofile',
  standalone: true,
  imports: [],
  templateUrl: './deleteprofile.component.html',
  styleUrl: './deleteprofile.component.css',
})
export class DeleteprofileComponent {
  constructor(private router: Router, private authService: AuthService) {}

  confirmarExclusao() {
    if (this.authService.isLoggedIn()) {
      this.authService.deleteProfile().subscribe({
        next: () => {
          alert('Profile deleted');
        },
        error: (err) => console.error('Deletion failed', err),
      });
    } else {
      console.error('Authentication token missing');
    }
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  cancelarExclusao() {
   
    this.router.navigate(['/profile']); 
  }
}
