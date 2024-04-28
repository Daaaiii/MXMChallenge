export interface RegisterDTO {
    id: string;
    fullname: string;
    email: string;
    ddd: number;
    phoneNumber: number;
    cpf_cnpj: string;
    zipcode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  
}