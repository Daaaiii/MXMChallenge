import { FormControl, FormGroup } from '@angular/forms';

import { cepValidator } from './checkCEP';
import { confirmPasswordValidator } from './checkConfirmPassword';
import { cpfCnpjValidator } from './checkCPF_CNPJ';
import { nameValidator } from './checkName';
import { passwordComplexityValidator } from './checkPassword';
import { phoneValidator } from './checkPhone';

describe('custom validators', () => {
  it('validates CEP format', () => {
    expect(cepValidator()(new FormControl('01001000'))).toBeNull();
    expect(cepValidator()(new FormControl('01001-000'))).toEqual({ cepInvalid: true });
  });

  it('validates CPF and CNPJ values', () => {
    expect(cpfCnpjValidator()(new FormControl('52998224725'))).toBeNull();
    expect(cpfCnpjValidator()(new FormControl('11222333000181'))).toBeNull();
    expect(cpfCnpjValidator()(new FormControl('11111111111'))).toEqual({ invalidCpf: 'CPF inválido.' });
  });

  it('validates password complexity', () => {
    expect(passwordComplexityValidator()(new FormControl('Strong1!'))).toBeNull();
    expect(passwordComplexityValidator()(new FormControl('weak'))).toEqual(jasmine.objectContaining({
      uppercaseRequired: jasmine.any(String),
      numericRequired: jasmine.any(String),
      specialCharRequired: jasmine.any(String),
      minLengthRequired: jasmine.any(String),
    }));
  });

  it('validates matching passwords', () => {
    const matchingForm = new FormGroup({
      password: new FormControl('Strong1!'),
      confirmPassword: new FormControl('Strong1!'),
    });
    const mismatchingForm = new FormGroup({
      password: new FormControl('Strong1!'),
      confirmPassword: new FormControl('Other1!'),
    });

    expect(confirmPasswordValidator()(matchingForm)).toBeNull();
    expect(confirmPasswordValidator()(mismatchingForm)).toEqual({ passwordMismatch: true });
  });

  it('validates full names and phone numbers', () => {
    expect(nameValidator()(new FormControl('João Silva'))).toBeNull();
    expect(nameValidator()(new FormControl('João'))).toEqual({ nameInvalid: true, reason: 'Not enough words' });
    expect(phoneValidator()(new FormControl('912345678'))).toBeNull();
    expect(phoneValidator()(new FormControl('812345678'))).toEqual({ phoneInvalid: true });
  });
});
