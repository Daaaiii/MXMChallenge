import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterDTO } from '../../models/registerDTO';
import { ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';



@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ RouterLink, ReactiveFormsModule, SidebarComponent],

  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
 
  
  constructor(private authService: AuthService, private router:Router) {}

  username:string = localStorage.getItem('User') || '';
  user: RegisterDTO = {} as RegisterDTO;

  ngOnInit() {
    this.getUserInfo();
  }
  getUserInfo() {
    if (this.authService.isLoggedIn()) {  
      this.authService.getProfile() 
        .subscribe({
          next: (data) => this.user = data,
          error: (err) => console.error('Failed to get user data', err)
        });
    } else {
      console.error('Authentication token missing');
    }
  }
  onLogout():void {
    this.authService.logout();
  }  
 
  deleteProfile() {
    this.router.navigate(['/delete']);
    
  }

  updateProfile() {
    this.router.navigate(['/update']);
  }
}
