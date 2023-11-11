import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { UserRoleMap } from '../bot-users/types/user-role';
import { User } from '../bot-users/schemas/user.entity';
import * as process from 'process';

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
  // placeholderImageUrl =
  //   'AgACAgIAAxkBAAEGVmVlDYRn7xEuIKXedWtKRwABalzIReoAApfMMRv6e2lI7c3KWa4Izr0BAAMCAANzAAMwBA';

  // for dev
  placeholderImageUrl = 'placeholder.jpg';

  constructor() {} // private readonly userService: UserService

  init(bot: Telegraf) {
    this.bot = bot;
  }

  async handleBotEventError(event: string, err: any, ctx) {
    console.error(`${event}: `, err.message);

    if (err.code === 403) {
      // код ошибки для "заблокированного пользователя"
      const userId = ctx?.from?.id.toString();
      if (userId) {
        try {
          // await this.userService.blockUser(userId);
        } catch (err) {
          console.error('user-actions error: ', err.message);
        }
      }
    }
  }

  async like({
    user,
    partnerId,
    hasPartnerLikedUser,
  }: {
    user: User;
    partnerId: string;
    hasPartnerLikedUser: boolean;
  }) {
    try {
      const userImageUrlToSend = `${process.env.S3_URL}/${
        user?.photoUrl || this.placeholderImageUrl
      }`;
      const partnerKeyboard = hasPartnerLikedUser
        ? [
            [
              Markup.button.webApp(
                'Смотреть мэтчи',
                `${process.env.WEB_APP_URL}/matches`,
              ),
            ],
          ]
        : [
            [
              Markup.button.webApp(
                'Смотреть лайки',
                `${process.env.WEB_APP_URL}/likes`,
              ),
            ],
          ];
      await this.bot.telegram
        .sendPhoto(partnerId, userImageUrlToSend, {
          reply_markup: Markup.inlineKeyboard(partnerKeyboard).reply_markup,
          parse_mode: 'HTML',
          caption: `${
            hasPartnerLikedUser ? 'У тебя мэтч с' : 'Ты понравился'
          }\n${this.getCaptionText(user, user.showUsername)}`,
        })
        .catch(async (err) => {
          console.error('like error: ', err.message);
        });
    } catch (e) {
      console.error('like error: ', e.message);
    }
  }

  async onRequestToChat(user: User, { partnerId }: { partnerId?: string }) {
    try {
      const partnerKeyboard = [
        [
          Markup.button.webApp(
            'Перейти в чат',
            `${process.env.WEB_APP_URL}/requests`,
          ),
        ],
        [
          Markup.button.webApp(
            'Заблокировать',
            `${process.env.WEB_APP_URL}/requests`,
          ),
        ],
      ];
      const userImageUrlToSend = `${process.env.S3_URL}/${
        user?.photoUrl || this.placeholderImageUrl
      }`;
      await this.bot.telegram.sendPhoto(partnerId, userImageUrlToSend, {
        reply_markup: Markup.inlineKeyboard(partnerKeyboard).reply_markup,
        parse_mode: 'HTML',
        caption: `Тебя в чат пригласил\n${this.getCaptionText(
          user,
          user.showUsername,
        )}`,
      });
    } catch (e) {
      console.error('onBrowsingLikes error: ', e.message);
    }
  }

  async onStartChat({
    partnerId,
    userId,
  }: {
    partnerId: string;
    userId: string;
  }) {
    // const userId = this.getUserId(ctx);
    try {
      const partnerChatKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Завершить чат', 'end_chat'),
      ]);

      await this.bot.telegram
        .sendMessage(
          userId,
          '💑 Комната создана. Приятного общения!',
          partnerChatKeyboard,
        )
        .catch((error) => {
          console.error('An onStartChat:', error.message);
        });

      await this.bot.telegram
        .sendMessage(
          partnerId,
          '💑 Комната создана. Приятного общения!',
          partnerChatKeyboard,
        )
        .catch((error) => {
          console.error('An onStartChat:', error.message);
        });
    } catch (e) {
      console.error('onStartChat error: ', e.message);
    }
  }

  getYearsCount(dateOfBirth: Date | string): number | undefined {
    if (!dateOfBirth) return undefined;

    const birthdate = new Date(dateOfBirth);
    if (isNaN(birthdate.getTime())) {
      return undefined;
    }
    const timeDiff = Math.abs(Date.now() - birthdate.getTime());
    const age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25); // Учитывает високосные годы

    return age;
  }

  getCaptionText(user, showUsername = false): string {
    return `${
      showUsername && user.username
        ? `<a href="https://t.me/${user.username}">${user.name}</a>`
        : user.name || ''
    }\n${this.getYearsCount(user.dateOfBirth) || user.age || ''}\n${
      UserRoleMap[user.role] || ''
    }\n${user.description || ''}`;
  }

  getUserId(ctx): string {
    return ctx.from.id.toString();
  }
}
