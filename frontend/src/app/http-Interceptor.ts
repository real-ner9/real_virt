import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('intercept');
    const authData = localStorage.getItem('authData');
    if (authData) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `twa-init-data ${authData}`),
      });
      return next.handle(authReq);
    } else {
      return next.handle(req);
    }
  }
}
