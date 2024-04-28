import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
    selector: 'app-welcome',
    standalone: true,
    templateUrl: './welcome.component.html',
    styleUrl: './welcome.component.css',
    imports: [SidebarComponent]
})
export class WelcomeComponent {
  username:string = localStorage.getItem('User') || '';
}
