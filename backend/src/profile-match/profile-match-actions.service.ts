import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { UserService } from '../bot-users/user.service';
import { UserState } from '../bot-users/types/user-state';
import { UserRoleMap } from '../bot-users/types/user-role';
import { User } from '../bot-users/schemas/user.entity';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

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
  placeholderImageUrl =
    'AgACAgIAAxkBAAEGVmVlDYRn7xEuIKXedWtKRwABalzIReoAApfMMRv6e2lI7c3KWa4Izr0BAAMCAANzAAMwBA';

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

    this.bot
      .action(
        /request_to_chat\?partnerId=([^&]+)(?:&offset=([^&]+))?/,
        async (ctx) =>
          safeExecute(this.onRequestToChat.bind(this), ctx, {
            partnerId: ctx.match[1],
            offset: +ctx.match[2],
          }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('open_profile error: ', err, ctx);
      });

    this.bot
      .action('browsing_likes', async (ctx) =>
        safeExecute(this.onBrowsingLikes.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('open_profile error: ', err, ctx);
      });
    this.bot
      .action(/browsing_matches\?offset=([^&]+)/, async (ctx) =>
        safeExecute(this.onBrowsingMatches.bind(this), ctx, {
          offset: +ctx.match[1],
        }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('open_profile error: ', err, ctx);
      });

    this.bot
      .action(/dislike\?partnerId=([^&]+)/, async (ctx) =>
        safeExecute(this.dislike.bind(this), ctx, {
          partnerId: ctx.match[1],
        }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('open_profile error: ', err, ctx);
      });

    this.bot
      .action(/like\?partnerId=([^&]+)/, async (ctx) =>
        safeExecute(this.like.bind(this), ctx, {
          partnerId: ctx.match[1],
        }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('open_profile error: ', err, ctx);
      });

    this.bot
      .action(/start_chat\?partnerId=([^&]+)/, async (ctx) =>
        safeExecute(this.onStartChat.bind(this), ctx, {
          partnerId: ctx.match[1],
        }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('open_profile error: ', err, ctx);
      });

    this.bot
      .action(/blocked\?partnerId=([^&]+)/, async (ctx) =>
        safeExecute(this.onBlockedUser.bind(this), ctx, {
          partnerId: ctx.match[1],
        }),
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
        const userState = await this.userService.getUserState(userId);
        if (
          userState === UserState.BROWSING_LIKES ||
          userState === UserState.BROWSING_MATCHES
        ) {
          await this.userService.setState(userId, UserState.BROWSING_PROFILES);
        }
        await this.browsingProfile(ctx);
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

  async browsingProfile(ctx, offset = 0) {
    try {
      const userId = this.getUserId(ctx);
      let user: User;
      const userState = await this.userService.getUserState(userId);
      let captionText = 'Пока подходящих профилей нет, попробуй чуть позже';
      let keyboard = [];

      if (userState === UserState.BROWSING_LIKES) {
        user = await this.userService.getLikedUser(userId);
        keyboard = [[Markup.button.callback('🔙', 'browsing_profiles')]];
      } else if (userState === UserState.BROWSING_MATCHES) {
        user = await this.userService.getMatchesUser(userId, offset || 0);
        keyboard = [[Markup.button.callback('🔙', 'browsing_profiles')]];
      } else {
        user = await this.userService.getRandomUser(userId);
        keyboard = [
          [Markup.button.callback('🔍 Лайки', 'browsing_likes')],
          [Markup.button.callback('💑 Мэтчи', 'browsing_matches?offset=0')],
          [Markup.button.callback('🔙', 'main_menu')],
        ];
      }

      if (user) {
        captionText = this.getCaptionText(user);

        if (userState === UserState.BROWSING_MATCHES) {
          keyboard = [
            [
              Markup.button.callback(
                '⬅️',
                `browsing_matches?offset=${Math.max(offset - 1, 0)}`,
              ),
              Markup.button.callback(
                '➡️',
                `browsing_matches?offset=${Math.max(offset + 1, 0)}`,
              ),
            ],
            [
              Markup.button.callback(
                'Перейти в чат',
                `request_to_chat?partnerId=${user.userId}&offset=${offset}`,
              ),
            ],
            ...keyboard,
          ];
        } else {
          keyboard = [
            [
              Markup.button.callback('👍', `like?partnerId=${user.userId}`),
              Markup.button.callback('👎', `dislike?partnerId=${user.userId}`),
            ],
            ...keyboard,
          ];
        }
      }

      const replyOptions = {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        caption: captionText,
      };

      const imageUrlToSend = user?.photoUrl || this.placeholderImageUrl;

      if (
        userState !== UserState.BROWSING_PROFILES &&
        userState !== UserState.BROWSING_LIKES &&
        userState !== UserState.BROWSING_MATCHES
      ) {
        await this.userService.setState(userId, UserState.BROWSING_PROFILES);
        return await ctx
          .replyWithPhoto(imageUrlToSend, {
            reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
            caption: captionText,
          })
          .catch(async (err) => {
            await this.handleBotEventError(
              'onEditProfile ctx error:  ',
              err,
              ctx,
            );
          });
      }

      await ctx.telegram
        .editMessageMedia(
          ctx.chat.id,
          ctx.callbackQuery.message.message_id,
          null,
          {
            type: 'photo',
            media: imageUrlToSend,
            caption: captionText,
            parse_mode: 'Markdown',
          },
          replyOptions,
        )
        .catch((e) => console.error('editMessageMedia error: ', e.message));
    } catch (e) {
      console.error('onBrowsingProfile error', e.message);
    }
  }

  async like(ctx, { partnerId }: { partnerId: string }) {
    const userId = this.getUserId(ctx);
    try {
      await this.userService.addLike(userId, partnerId);
      await this.browsingProfile(ctx);
    } catch (e) {
      console.error('like error: ', e.message);
    }
  }

  async dislike(ctx, { partnerId }: { partnerId: string }) {
    const userId = this.getUserId(ctx);

    try {
      await this.userService.addDislike(userId, partnerId);
      await this.userService.addDislike(partnerId, userId);
      await this.browsingProfile(ctx);
    } catch (e) {
      console.error('dislike error: ', e.message);
    }
  }

  async onBrowsingLikes(ctx) {
    const userId = this.getUserId(ctx);

    try {
      await this.userService.setState(userId, UserState.BROWSING_LIKES);

      await this.browsingProfile(ctx);
    } catch (e) {
      console.error('onBrowsingLikes error: ', e.message);
    }
  }
  async onBrowsingMatches(ctx, { offset }: { offset?: number }) {
    const userId = this.getUserId(ctx);
    try {
      await this.userService.setState(userId, UserState.BROWSING_MATCHES);

      await this.browsingProfile(ctx, offset);
    } catch (e) {
      console.error('onBrowsingLikes error: ', e.message);
    }
  }

  async onRequestToChat(
    ctx,
    { partnerId, offset }: { partnerId?: string; offset?: number },
  ) {
    const userId = this.getUserId(ctx);
    try {
      const partner = await this.userService.getUserFromCacheOrDB(partnerId);
      const currentUserKeyboard = [
        [Markup.button.callback('Отмена', `browsing_matches?offset=${offset}`)],
      ];
      const captionText = 'Ожидаем пользователя';
      const replyOptions = {
        reply_markup: Markup.inlineKeyboard(currentUserKeyboard).reply_markup,
        caption: captionText,
      };
      const partnerImageUrlToSend =
        partner?.photoUrl || this.placeholderImageUrl;

      // отображаем пользователю ожидание
      await ctx.telegram
        .editMessageMedia(
          ctx.chat.id,
          ctx.callbackQuery.message.message_id,
          null,
          {
            type: 'photo',
            media: partnerImageUrlToSend,
            caption: captionText,
            parse_mode: 'Markdown',
          },
          replyOptions,
        )
        .catch((e) => console.error('editMessageMedia error: ', e.message));

      const user = await this.userService.getUserFromCacheOrDB(userId);
      const partnerKeyboard = [
        [
          Markup.button.callback(
            'Перейти в чат',
            `start_chat?partnerId=${userId}`,
          ),
        ],
        [
          Markup.button.callback(
            'Заблокировать',
            `blocked?partnerId=${userId}`,
          ),
        ],
      ];
      const userImageUrlToSend = user?.photoUrl || this.placeholderImageUrl;
      // Партнеру кидаем приглашение
      return await ctx.telegram
        .sendPhoto(partnerId, userImageUrlToSend, {
          reply_markup: Markup.inlineKeyboard(partnerKeyboard).reply_markup,
          caption: `Тебя в чат пригласил\n${this.getCaptionText(user)}`,
        })
        .catch(async (err) => {
          await this.handleBotEventError(
            'onEditProfile ctx error:  ',
            err,
            ctx,
          );
        });
    } catch (e) {
      console.error('onBrowsingLikes error: ', e.message);
    }
  }

  async onStartChat(ctx, { partnerId }: { partnerId: string }) {
    const userId = this.getUserId(ctx);
    try {
      await ctx
        .deleteMessage()
        .catch((e) =>
          console.error('feelingAge deleteMessage error: ', e.message),
        );
      const room = randomStringGenerator();
      await this.userService.setState(userId, UserState.QUICK_SEARCH);
      await this.userService.setState(partnerId, UserState.QUICK_SEARCH);
      await this.userService.setActiveRoom(userId, room);
      await this.userService.setActiveRoom(partnerId, room);
      await this.userService.setCurrentPartner(userId, partnerId);
      await this.userService.setCurrentPartner(partnerId, userId);
      const partnerChatKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Завершить чат', 'end_chat'),
      ]);

      await ctx
        .reply('💑 Комната создана. Приятного общения!', partnerChatKeyboard)
        .catch(async (err, ctx) => {
          await this.handleBotEventError(
            'events.connectedWithPartner: ',
            err,
            ctx,
          );
        });

      await this.bot.telegram
        .sendMessage(
          partnerId,
          '💑 Комната создана. Приятного общения!',
          partnerChatKeyboard,
        )
        .catch((error) => {
          console.error('An error:', error.message);
          ctx
            .reply(
              `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
            )
            .catch((err) => console.error(err.message));
        });
    } catch (e) {
      console.error('like error: ', e.message);
    }
  }

  async onBlockedUser(ctx, { partnerId }: { partnerId: string }) {
    const userId = this.getUserId(ctx);
    try {
      await ctx
        .deleteMessage()
        .catch((e) =>
          console.error('feelingAge deleteMessage error: ', e.message),
        );
      await this.userService.addDislike(userId, partnerId);
      await this.userService.addDislike(partnerId, userId);
    } catch (e) {
      console.error('like error: ', e.message);
    }
  }

  getCaptionText(user): string {
    return `${user.name}\n${user.age}\n${UserRoleMap[user.role]}\n${
      user.description
    }`;
  }

  getUserId(ctx): string {
    return ctx.from.id.toString();
  }
}
