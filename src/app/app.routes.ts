import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'register-success',
    loadComponent: () =>
      import('./components/register-success/register-success.component').then(
        (m) => m.RegisterSuccessComponent
      ),
  },
];
