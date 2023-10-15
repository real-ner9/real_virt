import { Component } from '@angular/core';
import { UserService } from './common/services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frontend';
  webApp = window.Telegram.WebApp;
  user: any = {};
  error = '';

  constructor(
    private readonly userService: UserService,
  ) {
    const params = new URLSearchParams(window.location.hash.slice(1));
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
}
