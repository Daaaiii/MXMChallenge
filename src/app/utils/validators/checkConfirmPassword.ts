import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';


export function confirmPasswordValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {

    if (!(formGroup instanceof FormGroup)) {
      return null;
    }

    const passwordControl = formGroup.get('password');
    const confirmPasswordControl = formGroup.get('confirmPassword');
    


    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    const password = passwordControl.value;
    const confirmPassword = confirmPasswordControl.value;


    if (!password || !confirmPassword) {
      return null;
    }


    return password === confirmPassword ? null : { 'passwordMismatch': true };
  };
}