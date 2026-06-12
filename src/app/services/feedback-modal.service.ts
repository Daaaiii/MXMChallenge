import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export type FeedbackModalType = 'success' | 'error' | 'warning' | 'confirm';

export interface FeedbackModalState {
  open: boolean;
  title: string;
  message: string;
  type: FeedbackModalType;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
}

const CLOSED_STATE: FeedbackModalState = {
  open: false,
  title: '',
  message: '',
  type: 'success',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  closeLabel: 'Fechar',
};

@Injectable({
  providedIn: 'root',
})
export class FeedbackModalService {
  private readonly stateSubject = new BehaviorSubject<FeedbackModalState>(CLOSED_STATE);
  private confirmSubject?: Subject<boolean>;
  readonly state$ = this.stateSubject.asObservable();

  showSuccess(message: string, title = 'Tudo certo'): void {
    this.open({ title, message, type: 'success', confirmLabel: 'OK' });
  }

  showError(message: string, title = 'Atenção'): void {
    this.open({ title, message, type: 'error', confirmLabel: 'OK' });
  }

  showWarning(message: string, title = 'Atenção'): void {
    this.open({ title, message, type: 'warning', confirmLabel: 'OK' });
  }

  confirm(message: string, title = 'Confirmar ação'): Observable<boolean> {
    this.confirmSubject?.next(false);
    this.confirmSubject?.complete();
    this.confirmSubject = new Subject<boolean>();
    this.open({ title, message, type: 'confirm', confirmLabel: 'Confirmar' });
    return this.confirmSubject.asObservable();
  }

  confirmAction(): void {
    this.resolveConfirm(true);
  }

  cancelAction(): void {
    this.resolveConfirm(false);
  }

  close(): void {
    this.resolveConfirm(false);
  }

  private open(state: Partial<FeedbackModalState> & Pick<FeedbackModalState, 'title' | 'message' | 'type'>): void {
    this.stateSubject.next({
      ...CLOSED_STATE,
      ...state,
      open: true,
      cancelLabel: state.cancelLabel || CLOSED_STATE.cancelLabel,
      closeLabel: state.closeLabel || CLOSED_STATE.closeLabel,
    });
  }

  private resolveConfirm(value: boolean): void {
    const currentState = this.stateSubject.getValue();
    this.stateSubject.next(CLOSED_STATE);

    if (currentState.type === 'confirm') {
      this.confirmSubject?.next(value);
      this.confirmSubject?.complete();
      this.confirmSubject = undefined;
    }
  }
}
