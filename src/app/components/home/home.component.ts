import { Component } from '@angular/core';
import { LoginComponent } from '../login/login.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Router } from 'express';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LoginComponent, NavbarComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  page= 'Cadastrar';
  route= '/register';

}
