import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SearchCepService {

  constructor(private http: HttpClient) { }

  buscarCEP(cep: string): Observable<CepData> {
    return this.http.get<CepData>(`https://viacep.com.br/ws/${cep}/json/`);
  }
}
