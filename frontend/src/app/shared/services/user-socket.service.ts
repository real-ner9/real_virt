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
    const authData = sessionStorage.getItem('authData');

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

  sendApproveRequest(id: number): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.emit('approveRequest', { id }, (response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  sendCancelRequest(id: number): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.emit('cancelRequest', { id }, (response: any) => {
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

  public onRequestApproved(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('requestApproved', ({ user }: { user: User }) => observer.next(user));
    });
  }

  public onRequestCanceled(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('requestCanceled', ({ user }: { user: User }) => observer.next(user));
    });
  }

  sendLike(id: number): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.emit('sendLike', { id }, (response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  sendDislike(id: number): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.emit('sendDislike', { id }, (response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  liked() {
    return new Observable<{ user: User; hasPartnerLikedUser: boolean }>(observer => {
      this.socket.on('liked', ({ user, hasPartnerLikedUser }: { user: User; hasPartnerLikedUser: boolean }) =>
        observer.next({user, hasPartnerLikedUser}));
    });
  }

  disliked() {
    return new Observable<{ user: User }>(observer => {
      this.socket.on('disliked', ({ user }: { user: User }) =>
        observer.next({ user }));
    });
  }

  public onApproveRequestResponse(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('approveRequestResponse', (response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response);
        }
      });
    });
  }
}
