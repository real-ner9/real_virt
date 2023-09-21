import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { UserService } from '../bot-users/user.service';
import { UserState } from '../bot-users/types/user-state';

async function safeExecute(fn: Function, ctx, ...args: any[]) {
  try {
    await fn(ctx, ...args);
  } catch (error) {
    console.error('profile-actions SafeExecute error:', error.message);

    // ctx
    //   .reply(
    //     `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
    //     this.getFindPartnerKeyboard(),
    //   )
    //   .catch((err) =>
    //     console.error('profile-actions sageExecute error: ', err),
    //   );
  }
}

@Injectable()
export class ProfileMatchActionsService {
  bot: Telegraf;

  constructor(private readonly userService: UserService) {}

  init(bot: Telegraf) {
    this.bot = bot;

    this.bot
      .action('browsing_profiles', async (ctx) =>
        safeExecute(this.onBrowsingProfile.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('browsing_profiles error: ', err, ctx);
      });


    this.bot
      .action('open_profile', async (ctx) =>
        safeExecute(this.onOpenProfile.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('open_profile error: ', err, ctx);
      });
  }

  async handleBotEventError(event: string, err: any, ctx) {
    console.error(`${event}: `, err.message);

    if (err.code === 403) {
      // код ошибки для "заблокированного пользователя"
      const userId = ctx?.from?.id.toString();
      if (userId) {
        try {
          await this.userService.blockUser(userId);
        } catch (err) {
          console.error('user-actions error: ', err.message);
        }
      }
    }
  }

  async onBrowsingProfile(ctx) {
    const userId = this.getUserId(ctx);

    try {
      const userName = await this.userService.getName(userId);
      const profileIsVisible = await this.userService.getProfileVisible(userId);

      if (userName && profileIsVisible) {
        console.log('browsing');
        await this.userService.setState(userId, UserState.BROWSING_PROFILES);
        return;
      }

      if (!userName) {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('Заполнить профиль', 'edit_profile'),
        ]);

        return await ctx
          .reply('Прежде чем смотреть анкеты, заполни свой профиль', keyboard)
          .catch(async (err) => {
            await this.handleBotEventError(
              'onBrowsingProfile ctx error:  ',
              err,
              ctx,
            );
          });
      }

      if (!profileIsVisible) {
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback('Открыть профиль', 'open_profile'),
        ]);

        return await ctx
          .reply('Прежде чем смотреть анкеты, открой свой профиль', keyboard)
          .catch(async (err) => {
            await this.handleBotEventError(
              'onBrowsingProfile ctx error:  ',
              err,
              ctx,
            );
          });
      }
    } catch (e) {
      console.error('onBrowsingProfile error: ', e.message);
    }
  }

  async onOpenProfile(ctx) {
    const userId = this.getUserId(ctx);

    try {
      await this.userService.setProfileVisible(userId, true);

      await this.onBrowsingProfile(ctx);
    } catch (e) {
      console.error('onOpenProfile error: ', e.message);
    }
  }

  getUserId(ctx): string {
    return ctx.from.id.toString();
  }
}
