import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DefaultEventsMap } from '@socket.io/component-emitter';

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
}
