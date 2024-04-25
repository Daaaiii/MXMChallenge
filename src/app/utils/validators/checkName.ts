import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function nameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').trim();
    const words = value.split(' ').filter(Boolean);

    const validCharsRegex = /^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ ]+$/;

    if (words.length < 2) {
      return { 'nameInvalid': true, 'reason': 'Not enough words' };
    }
    for (let word of words) {
      if (word.length < 2) {
        return { 'nameInvalid': true, 'reason': 'Word too short' };
      }
      if (!validCharsRegex.test(word)) {
        return { 'nameInvalid': true, 'reason': 'Invalid characters' };
      }
    }

    return null;
  };
}