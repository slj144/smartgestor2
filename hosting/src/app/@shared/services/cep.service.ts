import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CEPService {

  constructor(
    private http: HttpClient
  ) { }

  public search(cep: string): Observable<any> {

    cep = cep.replace(/\D/g, '');

    if (cep !== '') {
      if (/^[0-9]{8}$/.test(cep)) {
        return this.http.get(`https://viacep.com.br/ws/${cep}/json/`);
      } else {
        return of({ erro: true });
      }
    }
  }

}
