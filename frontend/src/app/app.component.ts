import { Component, OnDestroy } from '@angular/core';
import { UserService } from './shared/services/user.service';
import { SocketService } from './shared/services/user-socket.service';
import { Subject, take, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  static SNACKBAR_DURATION = 5000;
  title = 'frontend';
  webApp = window.Telegram.WebApp;
  user: any = {};
  error = '';

  private destroy$ = new Subject<void>();

  constructor(
    private readonly userService: UserService,
    private readonly socketUserService: SocketService,
    private _snackBar: MatSnackBar,
    private readonly router: Router,
  ) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const initDataString = params.get('tgWebAppData');
    const initData = new URLSearchParams(initDataString as any);
    const user = initData.get('user') || localStorage.getItem('user');

    if (user) {
      this.user = JSON.parse(user);
    }

    this.updateTelegramData();

    this.userService.authorize().pipe(take(1)).subscribe(
      response => console.log('response: ', response),
      error => {
        console.log(error);
        this.error = error.error.reason
      },
    );

    this.webApp.expand();

    // Если пользователи согласились чатиться, то закрываем приложение
    this.socketUserService.onApproveRequestResponse()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.webApp.close();
      });

    this.socketUserService.onRequestApproved()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.webApp.close();
      });

    this.snackbarsInit();
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

  snackbarsInit() {
    this.socketUserService.liked()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ hasPartnerLikedUser }) => {
        if (hasPartnerLikedUser ? this.router.url.includes('matches') : this.router.url.includes('likes')) return;

        const snackbarRef = this._snackBar.open(
          hasPartnerLikedUser ? 'У тебя с кем то мэтч' : 'Тебя кто-то лайкнул',
          'Посмотреть',
          { duration: AppComponent.SNACKBAR_DURATION }
        );

        snackbarRef
          .onAction()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.router.navigate([hasPartnerLikedUser ? '/matches/list' : '/feed/likes']);
          });
      })

    this.socketUserService.onMatchRequest()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.router.url.includes('requests')) return;

        const snackbarRef = this._snackBar.open(
          'Тебя кто-то позвал в чат',
          'Посмотреть',
          { duration: AppComponent.SNACKBAR_DURATION }
        );

        snackbarRef
          .onAction()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.router.navigate(['/matches/requests']);
          });
      })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
