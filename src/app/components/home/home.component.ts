import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginComponent } from '../login/login.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
    selector: 'app-home',
    imports: [LoginComponent, NavbarComponent],
    templateUrl: './home.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './home.component.css'
})
export class HomeComponent {
  page= 'Cadastrar';
  route= '/register';

}
