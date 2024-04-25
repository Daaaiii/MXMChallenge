import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;     }

    let errors: ValidationErrors = {};
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[@$!%*?&]/.test(value);
    const isMinLength = value.length >= 8;
    const isMaxLength = value.length <= 32;

    if (!hasUpperCase) {
      errors['uppercaseRequired'] = 'Senha deve conter pelo menos uma letra maiúscula.';
    }
    if (!hasLowerCase) {
      errors['lowercaseRequired'] = 'Senha deve conter pelo menos uma letra minúscula.';
    }
    if (!hasNumeric) {
      errors['numericRequired'] = 'Senha deve conter pelo menos um número.';
    }
    if (!hasSpecialChar) {
      errors['specialCharRequired'] = 'Senha deve conter pelo menos um símbolo especial (@, $, !, %, *, ?, &).';
    }
    if (!isMinLength) {
      errors['minLengthRequired'] = 'Senha deve ter pelo menos 8 caracteres.';
    }
    if (!isMaxLength) {
      errors['maxLength'] = 'Senha deve ter no máximo 32 caracteres.';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
