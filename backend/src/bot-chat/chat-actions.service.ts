import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { I18nService } from 'nestjs-i18n';
import { MessageService } from './message.service';
import { RoomsService } from './room.service';
import { UserService } from '../bot-users/user.service';
import * as cron from 'node-cron';
import { UserState } from '../bot-users/types/user-state';

async function safeExecute(fn: Function, ctx, ...args: any[]) {
  try {
    await fn(ctx, ...args);
  } catch (error) {
    console.error('chat-actions SafeExecute error:', error.message);

    ctx
      .reply(
        `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
        this.getFindPartnerKeyboard(),
      )
      .catch((err) => console.error('chat-actions sageExecute error: ', err));
  }
}

@Injectable()
export class ChatActionsService {
  lang = 'ru';
  bot: Telegraf;

  constructor(
    private readonly i18n: I18nService,
    private readonly messageService: MessageService,
    private readonly roomsService: RoomsService,
    private readonly userService: UserService,
  ) {}

  async handleBotEventError(event: string, err: any, ctx) {
    console.error(`${event}: `, err.message);

    if (err.code === 403) {
      // код ошибки для "заблокированного пользователя"
      const userId = ctx?.from?.id.toString();
      if (userId) {
        try {
          await this.userService.blockUser(userId);
        } catch (err) {
          console.error('chat-actions error: ', err.message);
        }
      }
    }
  }

  init(bot: Telegraf): void {
    this.bot = bot;

    cron.schedule(
      '0 0 16 * * *',
      async () => {
        const activeUsers = await this.userService.getAllActiveUsers();
        const blockedUsers: string[] = [];
        const unblockedUsers: string[] = [];

        for (let i = 0; i < activeUsers.length; i++) {
          setTimeout(async () => {
            const user = activeUsers[i];
            await this.bot.telegram
              .sendMessage(
                user.userId,
                '🌆 Вечер наступил, и мы так заждались тебя! Самое время завести интересный разговор в нашем чате. 🥳🌟',
                this.getFindPartnerKeyboard(),
              )
              .then(async () => {
                if (user.isBlocked) {
                  unblockedUsers.push(user.userId);
                }
              })
              .catch(async (e) => {
                if (!user.isBlocked) {
                  blockedUsers.push(user.userId);
                }
                console.error('cron schedule catch test error ', e.message);
              });

            if (i === activeUsers.length - 1) {
              await this.userService.updateBlockStatusForUsers(
                blockedUsers,
                unblockedUsers,
              );
            }
          }, i * 500);
        }
      },
      {
        timezone: 'Europe/Moscow',
      },
    );

    this.bot.catch(async (err, ctx) => {
      await this.handleBotEventError('bot error', err, ctx);
    });

    this.bot
      .start((ctx) => safeExecute(this.onBotStart.bind(this), ctx))
      .catch(async (err, ctx) => {
        await this.handleBotEventError('start error: ', err, ctx);
      });
    this.bot
      .hears('/restart', (ctx) =>
        safeExecute(this.onBotRestart.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('restart error: ', err, ctx);
      });
    this.bot
      .hears('/find', (ctx) => safeExecute(this.onFindPartner.bind(this), ctx))
      .catch(async (err, ctx) => {
        await this.handleBotEventError('find error: ', err, ctx);
      });
    this.bot
      .hears('/stop', (ctx) => safeExecute(this.onStopSearch.bind(this), ctx))
      .catch((err) => {
        console.error('stop error: ', err);
      });
    this.bot
      .hears('/change', (ctx) =>
        safeExecute(this.onChangePartner.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('change error: ', err, ctx);
      });
    this.bot
      .hears('/end', (ctx) => safeExecute(this.feedBack.bind(this), ctx))
      .catch(async (err, ctx) => {
        await this.handleBotEventError('end error: ', err, ctx);
      });
    this.bot
      .hears('/showNotification', (ctx) =>
        safeExecute(this.onShowNotification.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('end error: ', err, ctx);
      });

    this.bot
      .action('main_menu', (ctx) =>
        safeExecute(this.onMainMenu.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('main_menu error: ', err, ctx);
      });
    this.bot
      .action('find_partner', (ctx) =>
        safeExecute(this.onFindPartner.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('find_partner error: ', err, ctx);
      });
    this.bot
      .action('stop_search', (ctx) =>
        safeExecute(this.onStopSearch.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('stop_search: ', err, ctx);
      });
    this.bot
      .action('change_partner', (ctx) =>
        safeExecute(this.onChangePartner.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('change_partner: ', err, ctx);
      });
    this.bot
      .action('end_chat', async (ctx) =>
        safeExecute(this.feedBack.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('end_chat error: ', err, ctx);
      });
    this.bot
      .action('hide_notification', async (ctx) =>
        safeExecute(this.onHideNotification.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('hide_notification error: ', err, ctx);
      });

    this.bot
      .action(
        /positive_feedback\?partnerId=(\d+)(?:&event=(\/?\w+(_\w+)*))?/,
        (ctx) =>
          safeExecute(this.onPositiveFeedback.bind(this), ctx, {
            partnerId: ctx.match[1],
            event: ctx.match[2],
          }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('positive_feedback error: ', err, ctx);
      });

    this.bot
      .action(
        /negative_feedback\?partnerId=(\d+)(?:&event=(\/?\w+(_\w+)*))?/,
        (ctx) =>
          safeExecute(this.onNegativeFeedback.bind(this), ctx, {
            partnerId: ctx.match[1],
            event: ctx.match[2],
          }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('negative_feedback error: ', err, ctx);
      });
  }

  async onSendMessage(ctx) {
    try {
      await this.messageService.forwardMessage(this.bot, ctx);
    } catch (error) {
      console.error('An error occurred while forwarding a message:', error);
      return ctx
        .reply(
          `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пишите в чат @govirtchat`,
          this.getFindPartnerKeyboard(),
        )
        .catch((err) => console.error(err));
    }
  }

  async onPositiveFeedback(
    ctx,
    { partnerId, event }: { partnerId: string; event: string },
  ) {
    try {
      const userId = ctx.from.id.toString();
      await ctx
        .deleteMessage()
        .catch((e) =>
          console.error('onPositiveFeedback deleteMessage error: ', e.message),
        );
      await this.userService.addLike(userId, partnerId);
      const isChangePartner = event === 'change_partner' || event === '/change';
      await this.onEndChat(ctx, !isChangePartner);
      isChangePartner && (await this.onFindPartner(ctx));
    } catch (e) {
      console.error('onPositiveFeedback error', e.message);
    }
  }

  async onNegativeFeedback(
    ctx,
    { partnerId, event }: { partnerId: string; event: string },
  ) {
    try {
      const userId = ctx.from.id.toString();
      await ctx
        .deleteMessage()
        .catch((e) =>
          console.error('onPositiveFeedback deleteMessage error: ', e.message),
        );
      await this.userService.addDislike(userId, partnerId);
      const isChangePartner = event === 'change_partner' || event === '/change';
      await this.onEndChat(ctx, !isChangePartner);
      isChangePartner && (await this.onFindPartner(ctx));
    } catch (e) {
      console.error('onPositiveFeedback error', e.message);
    }
  }

  async onBotStart(ctx): Promise<void> {
    try {
      await this.onEndChat(ctx, false);
      await ctx
        .reply(
          this.i18n.t('events.welcome', { lang: this.lang }),
          this.getFindPartnerKeyboard(),
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError('events.welcome: ', err, ctx);
        });
    } catch (e) {
      console.error('onBotStart error', e.message);
    }
  }

  async onBotRestart(ctx): Promise<void> {
    try {
      await this.onEndChat(ctx, false);
      await ctx
        .reply(
          this.i18n.t('events.botRestarted', { lang: this.lang }),
          this.getFindPartnerKeyboard(),
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError('events.botRestarted: ', err, ctx);
        });
    } catch (e) {
      console.error('onBotRestart error', e.message);
    }
  }

  async onHideNotification(ctx): Promise<void> {
    try {
      await this.onEndChat(ctx, false);
      await ctx
        .reply(
          this.i18n.t('events.searchPartner', { lang: this.lang }),
          this.getFindPartnerKeyboard(),
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError('events.searchPartner: ', err, ctx);
        });
      await this.toggleNotification(ctx, false);
    } catch (e) {
      console.error('onHideNotification error', e.message);
    }
  }

  async onShowNotification(ctx): Promise<void> {
    try {
      await this.toggleNotification(ctx, true);
    } catch (e) {
      console.error('onShowNotification error', e.message);
    }
  }

  async onFindPartner(ctx): Promise<void> {
    try {
      await this.onEndChat(ctx, false);
      await ctx
        .reply(
          this.i18n.t('events.searchPartner', { lang: this.lang }),
          this.getStopSearchKeyboard(),
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError('events.searchPartner: ', err, ctx);
        });
      await this.findPartner(ctx);
    } catch (e) {
      console.error('onFindPartner error', e.message);
    }
  }
  async onMainMenu(ctx): Promise<void> {
    try {
      const userId = ctx.from.id.toString();
      await this.userService.setState(userId, UserState.QUICK_SEARCH);
      await ctx
        .reply('Выбери, чем хочешь заняться', this.getFindPartnerKeyboard())
        .catch(async (err, ctx) => {
          await this.handleBotEventError('events.searchPartner: ', err, ctx);
        });
    } catch (e) {
      console.error('onFindPartner error', e.message);
    }
  }

  async onStopSearch(ctx): Promise<void> {
    try {
      await this.onEndChat(ctx, false);
      await ctx
        .reply(
          this.i18n.t('events.stopPartnerSearch', { lang: this.lang }),
          this.getFindPartnerKeyboard(),
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError(
            'events.stopPartnerSearch: ',
            err,
            ctx,
          );
        });
      await this.stopSearch(ctx);
    } catch (e) {
      console.error('onStopSearch error', e.message);
    }
  }

  getFindPartnerKeyboard(hideNotificationButton = false): any {
    const buttons = [
      [
        Markup.button.callback(
          this.i18n.t('events.findPartner', { lang: this.lang }),
          'find_partner',
        ),
      ],
      // [Markup.button.callback('📄 Смотреть анкеты', 'browsing_profiles')],
      [
        Markup.button.webApp(
          '📄 Смотреть анкеты',
          'https://45dc-104-232-36-21.ngrok-free.app/',
        ),
      ],
      [Markup.button.callback('✏️ Редактировать профиль', 'edit_profile')],
    ];

    // if (hideNotificationButton) {
    //   buttons.push([
    //     Markup.button.callback(
    //       this.i18n.t('events.hideNotification', { lang: this.lang }),
    //       'hide_notification',
    //     ),
    //   ]);
    // }
    return Markup.inlineKeyboard(buttons);
  }

  getStopSearchKeyboard(): any {
    return Markup.inlineKeyboard([
      Markup.button.callback(
        this.i18n.t('events.stopSearch', { lang: this.lang }),
        'stop_search',
      ),
    ]);
  }

  async findPartner(ctx): Promise<void> {
    const userId = ctx.from.id.toString();
    let room = this.roomsService.findSingleUserRoom(
      userId,
      await this.userService.getPastPartners(userId),
    );

    if (room) {
      try {
        room = this.roomsService.addUserToRoom(userId, room);
        await this.userService.setActiveRoom(userId, room.id);

        // Клавиатура с двумя кнопками
        const partnerChatKeyboard = Markup.inlineKeyboard([
          Markup.button.callback(
            this.i18n.t('events.changePartner', { lang: this.lang }),
            'change_partner',
          ),
          Markup.button.callback(
            this.i18n.t('events.endChat', { lang: this.lang }),
            'end_chat',
          ),
        ]);

        await ctx
          .reply(
            this.i18n.t('events.connectedWithPartner', { lang: this.lang }),
            partnerChatKeyboard,
          )
          .catch(async (err, ctx) => {
            await this.handleBotEventError(
              'events.connectedWithPartner: ',
              err,
              ctx,
            );
          });

        const partnerId = room.users.find((u) => u !== userId);
        await this.userService.setActiveRoom(partnerId, room.id);
        await this.userService.setCurrentPartner(userId, partnerId);
        await this.userService.setCurrentPartner(partnerId, userId);

        await this.bot.telegram
          .sendMessage(
            partnerId,
            this.i18n.t('events.connectedWithPartner', { lang: this.lang }),
            partnerChatKeyboard,
          )
          .catch((error) => {
            console.error('An error:', error.message);
            ctx
              .reply(
                `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
                this.getFindPartnerKeyboard(),
              )
              .catch((err) => console.error(err.message));
          });
      } catch (e) {
        console.error('findPartner if room error', e.message);
      }
    } else {
      try {
        const dislikes = await this.userService.getDislikes(userId);
        room = this.roomsService.createRoom(userId, dislikes);
        await this.userService.setActiveRoom(userId, room.id);
        // await this.notificationOtherUsers(userId);
      } catch (e) {
        console.error('findPartner if not room error', e.message);
      }
    }
  }

  async feedBack(ctx) {
    try {
      const userId = ctx.from.id.toString();
      const currentPartner = await this.userService.getCurrentPartner(userId);
      if (!currentPartner) return;
      const match = ctx.match && ctx.match[0];
      const feedbackKeyboard = Markup.inlineKeyboard([
        Markup.button.callback(
          '👍',
          `positive_feedback?partnerId=${currentPartner}${
            match ? `&event=${match}` : ''
          }`,
        ),
        Markup.button.callback(
          '👎',
          `negative_feedback?partnerId=${currentPartner}${
            match ? `&event=${match}` : ''
          }`,
        ),
      ]);

      return await ctx
        .reply(
          'Понравилось ли тебе общение с этим партнером?\nЕсли нет, то он больше тебе не попадется',
          feedbackKeyboard,
        )
        .catch((error) => {
          console.error('feedBack keyboard error:', error.message);
        });
    } catch (e) {
      console.error('feedback error', e.message);
    }
  }

  async onEndChat(ctx, showKeyboard = true): Promise<void> {
    const userId = ctx.from.id.toString();
    const room = this.roomsService.findRoomByUserId(userId);

    try {
      const partnerId = await this.userService.getCurrentPartner(userId);
      if (partnerId) {
        await this.userService.setCurrentPartner(partnerId, null);
        await this.userService.addPastPartner(userId, partnerId);
        await this.userService.addPastPartner(partnerId, userId);
        await this.userService.setActiveRoom(partnerId, null);
        room?.active && this.roomsService.deactivateRoom(room.id);
        await this.bot.telegram
          .sendMessage(
            partnerId,
            this.i18n.t('events.chatEnded', { lang: this.lang }),
            this.getFindPartnerKeyboard(),
          )
          .then()
          .catch((error) => {
            console.error('An error:', error.message);
            ctx.reply(
              `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
              this.getFindPartnerKeyboard(),
            );
          });
      }
    } catch (e) {
      console.error('onEndChat if partnerId error', e.message);
    }

    try {
      await this.userService.setCurrentPartner(userId, null);
      await this.userService.setActiveRoom(userId, null);
    } catch (e) {
      console.error(
        'onEndChat setCurrentPartner setActiveRoom error',
        e.message,
      );
    }
    if (showKeyboard) {
      ctx
        .reply(
          this.i18n.t('events.chatEnded', { lang: this.lang }),
          this.getFindPartnerKeyboard(),
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError('events.chatEnded: ', err, ctx);
        });
    }
  }

  // false - скрываем
  // true - показываем снова
  async toggleNotification(ctx, flag: boolean) {
    const userId = ctx.from.id.toString();
    await this.userService.toggleNotification(userId, flag);
  }

  async stopSearch(ctx): Promise<void> {
    const userId = ctx.from.id.toString();
    const room = this.roomsService.findRoomByUserId(userId);

    room && this.roomsService.deactivateRoom(room.id);
  }

  async onChangePartner(ctx): Promise<void> {
    const userId = ctx.from.id.toString();
    try {
      const partnerId = await this.userService.getCurrentPartner(userId);

      if (partnerId) {
        await this.feedBack(ctx);
      } else {
        await this.onEndChat(ctx, false);
        await this.onFindPartner(ctx);
      }
    } catch (e) {
      console.error('onChangePartner error: ', e.message);
    }
  }

  async notificationOtherUsers(userId: string) {
    // Защита от флуда
    const TEN_MINUTES = 10 * 60 * 1000;
    const lastSearchTimestamp =
      await this.userService.getLastSearchTimestamp(userId);
    const timeSinceLastSearch = Date.now() - lastSearchTimestamp;
    if (lastSearchTimestamp && timeSinceLastSearch <= TEN_MINUTES) {
      return;
    }

    await this.userService.setLastSearchTimestamp(userId);
    // Получаем всех пользователей, которые не в комнате и не в чате
    const usersWithoutRoom = await this.userService.usersWithoutRoom(userId);

    for (const userId of usersWithoutRoom) {
      await this.userService.setLastNotificationTimestamp(userId);

      await this.bot.telegram
        .sendMessage(
          userId,
          'Кто-то из тех, кого ты отметил симпатией, начал поиск 😊 Присоединяйся скорей!',
          this.getFindPartnerKeyboard(true),
        )
        .catch(async (err) => {
          console.error(`notification error`, err.message);

          if (err.code === 403) {
            // код ошибки для "заблокированного пользователя"
            if (userId) {
              try {
                await this.userService.blockUser(userId);
              } catch (err) {
                console.error(err.message);
              }
            }
          }
        });
    }
  }
}
