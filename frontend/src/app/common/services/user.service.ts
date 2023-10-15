import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private path = 'api/user'

  constructor(private http: HttpClient) {
  }

  authorize() {
    return this.http.get(`${this.path}/authorize`, {
      observe: 'body',
      responseType: 'json',
    },);
  }
}
