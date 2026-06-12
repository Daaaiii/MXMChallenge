import { Component, ElementRef, ViewChild } from '@angular/core';
import { FeedbackModalService, FeedbackModalState } from '../../services/feedback-modal.service';

@Component({
  selector: 'app-feedback-modal',
  imports: [],
  templateUrl: './feedback-modal.component.html',
  styleUrl: './feedback-modal.component.css',
})
export class FeedbackModalComponent {
  @ViewChild('primaryButton') primaryButton?: ElementRef<HTMLButtonElement>;
  state: FeedbackModalState = {
    open: false,
    title: '',
    message: '',
    type: 'success',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    closeLabel: 'Fechar',
  };

  constructor(private feedbackModalService: FeedbackModalService) {
    this.feedbackModalService.state$.subscribe((state) => {
      this.state = state;
      if (state.open) {
        setTimeout(() => this.primaryButton?.nativeElement.focus());
      }
    });
  }

  confirm(): void {
    this.feedbackModalService.confirmAction();
  }

  cancel(): void {
    this.feedbackModalService.cancelAction();
  }

  close(): void {
    this.feedbackModalService.close();
  }

  iconClass(): string {
    const icons: Record<FeedbackModalState['type'], string> = {
      success: 'bi-check-circle',
      error: 'bi-x-circle',
      warning: 'bi-exclamation-triangle',
      confirm: 'bi-question-circle',
    };

    return icons[this.state.type];
  }
}
