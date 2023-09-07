import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { I18nService } from 'nestjs-i18n';
import { MessageService } from './message.service';
import { RoomsService } from './room.service';
import { UserService } from './user.service';
import * as process from 'process';

async function safeExecute(fn: Function, ctx, ...args: any[]) {
  try {
    await fn(ctx, ...args);
  } catch (error) {
    console.error('An error:', error);
    ctx
      .reply(
        `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
        this.getFindPartnerKeyboard(),
      )
      .catch((err) => console.log(err));
  }
}

@Injectable()
export class BotActionsService {
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
          console.error(err.message);
        }
      }
    }
  }

  init(): void {
    this.bot = new Telegraf(process.env.BOT_TOKEN);

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
      .hears('/end', (ctx) => safeExecute(this.onEndChat.bind(this), ctx))
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
      .on('message', async (ctx) => {
        try {
          await this.messageService.forwardMessage(this.bot, ctx);
        } catch (error) {
          console.error('An error occurred while forwarding a message:', error);
          ctx
            .reply(
              `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пишите в чат @govirtchat`,
              this.getFindPartnerKeyboard(),
            )
            .catch((err) => console.log(err));
          return;
        }
      })
      .catch(async (err, ctx) => {
        await this.handleBotEventError('message error: ', err, ctx);
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
        safeExecute(this.onEndChat.bind(this), ctx),
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

    this.bot.launch().catch((err) => {
      console.error('launch error: ', err);
    });
  }

  async onBotStart(ctx): Promise<void> {
    await this.onEndChat(ctx, false);
    ctx
      .reply(
        this.i18n.t('events.welcome', { lang: this.lang }),
        this.getFindPartnerKeyboard(),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('events.welcome: ', err, ctx);
      });
  }

  async onBotRestart(ctx): Promise<void> {
    await this.onEndChat(ctx, false);
    await ctx
      .reply(
        this.i18n.t('events.botRestarted', { lang: this.lang }),
        this.getFindPartnerKeyboard(),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('events.botRestarted: ', err, ctx);
      });
  }

  async onHideNotification(ctx): Promise<void> {
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
  }

  async onShowNotification(ctx): Promise<void> {
    await this.toggleNotification(ctx, true);
  }

  async onFindPartner(ctx): Promise<void> {
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
  }

  async onStopSearch(ctx): Promise<void> {
    await this.onEndChat(ctx, false);
    await ctx
      .reply(
        this.i18n.t('events.stopPartnerSearch', { lang: this.lang }),
        this.getFindPartnerKeyboard(),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('events.stopPartnerSearch: ', err, ctx);
      });
    await this.stopSearch(ctx);
  }

  getFindPartnerKeyboard(hideNotificationButton = false): any {
    const buttons = [
      Markup.button.callback(
        this.i18n.t('events.findPartner', { lang: this.lang }),
        'find_partner',
      ),
    ];

    if (hideNotificationButton) {
      buttons.push(
        Markup.button.callback(
          this.i18n.t('events.hideNotification', { lang: this.lang }),
          'hide_notification',
        ),
      );
    }
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
        .then()
        .catch((error) => {
          console.error('An error:', error.message);
          ctx
            .reply(
              `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
              this.getFindPartnerKeyboard(),
            )
            .catch((err) => console.log(err.message));
        });
    } else {
      room = this.roomsService.createRoom(userId);
      await this.userService.setActiveRoom(userId, room.id);
      await this.notificationOtherUsers(userId);
    }
  }

  async onEndChat(ctx, showKeyboard = true): Promise<void> {
    const userId = ctx.from.id.toString();
    const room = this.roomsService.findRoomByUserId(userId);

    if (room && room.active) {
      const partnerId = room.users.find((u) => u !== userId);
      if (partnerId) {
        await this.userService.setCurrentPartner(partnerId, null);
        await this.userService.addPastPartner(userId, partnerId);
        await this.userService.addPastPartner(partnerId, userId);
        await this.userService.setActiveRoom(partnerId, null);
        await this.roomsService.deactivateRoom(room);
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
    }

    await this.userService.setCurrentPartner(userId, null);
    await this.userService.setActiveRoom(userId, null);
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

    room && this.roomsService.deactivateRoom(room);
  }

  async onChangePartner(ctx): Promise<void> {
    await this.onEndChat(ctx, false);
    await this.onFindPartner(ctx);
  }

  async notificationOtherUsers(userId: string) {
    // Защита от флуда
    const TEN_MINUTES = 30 * 60 * 1000;
    const lastSearchTimestamp =
      await this.userService.getLastSearchTimestamp(userId);
    const timeSinceLastSearch = Date.now() - lastSearchTimestamp;
    if (lastSearchTimestamp && timeSinceLastSearch <= TEN_MINUTES) {
      return;
    }

    await this.userService.setLastSearchTimestamp(userId);
    // Получаем всех пользователей, которые не в комнате и не в чате
    const usersWithoutRoom = await this.userService.usersWithoutRoom(userId);

    const THIRTY_MINUTES = 60 * 60 * 1000;
    for (const userId of usersWithoutRoom) {
      const lastNotificationTimestamp =
        await this.userService.getLastNotificationTimestamp(userId);
      const timeSinceLastNotification = Date.now() - lastNotificationTimestamp;
      if (
        lastNotificationTimestamp &&
        timeSinceLastNotification <= THIRTY_MINUTES
      ) {
        continue;
      }

      await this.userService.setLastNotificationTimestamp(userId);

      await this.bot.telegram
        .sendMessage(
          userId,
          'Кто-то начал поиск. Начинай скорее поиск, чтобы присоединиться! 👇',
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
