import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { RegisterFormDataDTO } from '../models/authDTO';


@Injectable({ providedIn: 'root' })
export class FormService {
  private formData = new BehaviorSubject<Partial<RegisterFormDataDTO> | null>(null);



  setFormData(data: Partial<RegisterFormDataDTO>) {
    const currentData = this.formData.getValue();
    const combinedData = { ...currentData, ...data };

    this.formData.next(combinedData);
  }


  getFormData() {
    return this.formData.asObservable().pipe(
      distinctUntilChanged((prev, curr) => shallowEqual(prev, curr)),
    );
  }
  clearFormData() {
    this.formData.next(null);
  }
}

function shallowEqual(
  prev: Partial<RegisterFormDataDTO> | null,
  curr: Partial<RegisterFormDataDTO> | null
): boolean {
  if (prev === curr) {
    return true;
  }

  if (!prev || !curr) {
    return false;
  }

  const prevKeys = Object.keys(prev) as Array<keyof RegisterFormDataDTO>;
  const currKeys = Object.keys(curr) as Array<keyof RegisterFormDataDTO>;

  return (
    prevKeys.length === currKeys.length &&
    prevKeys.every((key) => prev[key] === curr[key])
  );
}
