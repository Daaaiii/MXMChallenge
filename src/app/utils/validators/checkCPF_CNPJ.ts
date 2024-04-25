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
    sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

function isValidCNPJ(cnpj: string): boolean {
  let length = cnpj.length;
  if (length !== 14) return false;

  const digits = cnpj.split('').map(Number);
  const validators = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];


  let sum = digits.slice(0, 12).reduce((acc, val, idx) => acc + (val * validators[idx + 1]), 0);
  let remainder = (sum % 11);
  if (remainder < 2 ? 0 : 11 - remainder !== digits[12]) return false;

  sum = digits.slice(0, 13).reduce((acc, val, idx) => acc + (val * validators[idx]), 0);
  remainder = (sum % 11);
  return Boolean(remainder < 2 ? 0 : 11 - remainder === digits[13]);
}
