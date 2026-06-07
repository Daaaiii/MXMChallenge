import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink],
    templateUrl: './navbar.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  
  @Input() page: string = '';
  @Input() route: string = '';



  
  
}
