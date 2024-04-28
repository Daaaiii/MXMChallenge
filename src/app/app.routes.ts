import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth-guard.guard';




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
 
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'welcome',
        loadComponent: () =>
          import('./components/welcome/welcome.component').then(
            (m) => m.WelcomeComponent
          ),
      },
      {
        path: 'delete',
        loadComponent: () =>
          import('./components/deleteprofile/deleteprofile.component').then(
            (m) => m.DeleteprofileComponent
          ),
      }
     
      
    ],
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
