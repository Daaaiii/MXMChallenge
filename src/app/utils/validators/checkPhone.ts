import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    
    const regex = /^9\d{8}$/;
    const valid = regex.test(control.value);
    return valid ? null : { 'phoneInvalid': true };
  };
}