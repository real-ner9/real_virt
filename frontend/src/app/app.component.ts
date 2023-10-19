import { Component, HostListener, OnDestroy } from '@angular/core';
import { UserService } from './shared/services/user.service';
import { SocketService } from './shared/services/user-socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  title = 'frontend';
  webApp = window.Telegram.WebApp;
  user: any = {};
  error = '';

  constructor(
    private readonly userService: UserService,
    private readonly socketUserService: SocketService,
  ) {
    const params = new URLSearchParams(window.location.hash.slice(1));

    console.log(this.webApp);

    this.webApp.sendData('dsadsa');
    //
    // // Convert it to more user-friendly object.
    const initDataString = params.get('tgWebAppData'); // user=...&query_id=...&...
    // console.log('initDataString', initDataString);
    const initData = new URLSearchParams(initDataString as any);
    // console.log('query_id', initData.get('query_id')); // jsHS198czozxk7s
    // console.log('user', JSON.parse(initData.get('user') as any)); // jsHS198czozxk7s
    const user = initData.get('user') || localStorage.getItem('user');

    if (user) {
      this.user = JSON.parse(user);
    }
    // console.log('auth_date', initData.get('auth_date')); // jsHS198czozxk7s
    // console.log('hash', initData.get('hash')); // jsHS198czozxk7s
    //
    //
    //
    // this.userService.authorize(initDataString as any).subscribe(
    //   response => console.log('response: ', response),
    //   error => console.error('error', error)
    // );

    console.log('localstore', localStorage.getItem('logout'))

    this.updateTelegramData();

    this.userService.authorize().subscribe(
      response => console.log('response: ', response),
      error => {
        console.log(error);
        this.error = error.error.reason
      },
    );

    this.webApp.expand();
  }

  updateTelegramData() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const initDataString = params.get('tgWebAppData');

    if (initDataString) {
      const initData = new URLSearchParams(initDataString);
      const hash = initData.get('hash');
      if (hash) {
        localStorage.setItem('authData', initDataString);
        const userData = initData.get('user');
        if (userData) {
          localStorage.setItem('user', userData)
        }
      }
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    localStorage.setItem('logout', 'true');
    // const url = 'your-server-endpoint';
    // const data = {}; // ваш данные
    // navigator.sendBeacon(url, JSON.stringify(data));
  }

  ngOnDestroy() {
    console.log('destroy');
  }
}
