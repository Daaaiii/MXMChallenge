import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-register-success',
    imports: [RouterLink],
    templateUrl: './register-success.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './register-success.component.css'
})
export class RegisterSuccessComponent {
  constructor(private router: Router) { }

  ngOnInit() {
    setTimeout(() => {
      this.router.navigate(['/']); 
    }, 5000); 
  }
}
