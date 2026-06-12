import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackModalComponent } from './components/feedback-modal/feedback-modal.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, FeedbackModalComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'MXMChallenge';
}
