import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function cpfCnpjValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    if (/^\d{11}$/.test(value)) {
      if (isAllDigitsEqual(value) || !isValidCPF(value)) {
        return { invalidCpf: 'CPF inválido.' };
      }
    } else if (/^\d{14}$/.test(value)) {
      if (isAllDigitsEqual(value) || !isValidCNPJ(value)) {
        return { invalidCnpj: 'CNPJ inválido.' };
      }
    } else {
      return { invalidCpfCnpj: 'O valor deve ser um CPF ou CNPJ válido.' };
    }

    return null;
  };
}

function isAllDigitsEqual(digits: string): boolean {
  return digits.split('').every((digit) => digit === digits[0]);
}

function isValidCPF(cpf: string): boolean {
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cpf.substring(9, 10), 10)) {
    return false;
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  return remainder === parseInt(cpf.substring(10, 11), 10);
}

function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) {
    return false;
  }

  const digits = cnpj.split('').map(Number);
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, ...firstWeights];

  const firstDigit = calculateCnpjDigit(digits.slice(0, 12), firstWeights);
  const secondDigit = calculateCnpjDigit(digits.slice(0, 13), secondWeights);

  return firstDigit === digits[12] && secondDigit === digits[13];
}

function calculateCnpjDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index], 0);
  const remainder = sum % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}
