import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  private path = 'user'

  constructor() {
    const authData = localStorage.getItem('authData');
    this.socket = io(`${environment.socketUrl}/${this.path}`, { query: { authData }});
  }

  public onEvent(event: string): Observable<any> {
    return new Observable<Event>(observer => {
      this.socket.on(event, () => observer.next());
    });
  }

  sendRequestMatch(id: number): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.emit('requestMatch', { id }, (response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  sendCancelRequestMatch(id: number): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.emit('cancelRequestMatch', { id }, (response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  public onMatchRequest(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('matchRequest', ({ user }: { user: User }) => observer.next(user));
    });
  }

  public onMatchRequestCanceled(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('matchRequestCanceled', ({ user }: { user: User }) => observer.next(user));
    });
  }
}
