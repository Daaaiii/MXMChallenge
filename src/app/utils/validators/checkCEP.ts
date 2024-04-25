
import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export function cepValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
     
      return null;
    }
    
  
    const cepRegex = /^[0-9]{8}$/;
    const isValid = cepRegex.test(control.value);
    
    return isValid ? null : { cepInvalid: true };
  };
}