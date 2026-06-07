export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RegisterRequestDTO {
  fullname: string;
  email: string;
  ddd: number;
  phoneNumber: number;
  cpf_cnpj: string;
  password: string;
  zipcode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface UpdateProfileRequestDTO extends Partial<RegisterRequestDTO> {}

export interface ApiErrorDTO {
  message?: string;
}

export interface RegisterFormDataDTO extends RegisterRequestDTO {
  confirmPassword: string;
}
