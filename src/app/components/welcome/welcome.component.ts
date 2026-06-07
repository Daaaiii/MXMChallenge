import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.component.html',
    styleUrl: './welcome.component.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [SidebarComponent]
})
export class WelcomeComponent {
  constructor(private authService: AuthService) {}

  username:string = this.authService.getStoredUserName();
}
