import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { UserService } from './user.service';
import { UserState } from './types/user-state';
import { UserRole, UserRoleMap } from './types/user-role';

async function safeExecute(fn: Function, ctx, ...args: any[]) {
  try {
    await fn(ctx, ...args);
  } catch (error) {
    console.error('user-actions SafeExecute error:', error.message);

    // ctx
    //   .reply(
    //     `Кажется, что-то пошло не так...\nПо вопросам работы сервиса пиши в чат @govirtchat`,
    //     this.getFindPartnerKeyboard(),
    //   )
    //   .catch((err) => console.error('user-actions sageExecute error: ', err));
  }
}

@Injectable()
export class UserActionsService {
  bot: Telegraf;

  constructor(private readonly userService: UserService) {}

  init(bot: Telegraf) {
    this.bot = bot;

    this.bot
      .action('edit_profile', async (ctx) =>
        safeExecute(this.onEditProfile.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_profile error: ', err, ctx);
      });

    this.bot
      .action('without_photo', async (ctx) =>
        safeExecute(this.withoutPhoto.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_profile error: ', err, ctx);
      });

    this.bot
      .action(/set_role\?role=([^&]+)(?:&from=([^&]+))?/, async (ctx) =>
        safeExecute(this.onSetRole.bind(this), ctx, {
          role: ctx.match[1],
          from: ctx.match[2],
        }),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_profile error: ', err, ctx);
      });

    this.bot
      .action('edit_age', async (ctx) =>
        safeExecute(this.onEditAge.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_age error: ', err, ctx);
      });

    this.bot
      .action('edit_name', async (ctx) =>
        safeExecute(this.onEditName.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_name error: ', err, ctx);
      });

    this.bot
      .action('edit_role', async (ctx) =>
        safeExecute(this.feelRole.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_role error: ', err, ctx);
      });

    this.bot
      .action('edit_description', async (ctx) =>
        safeExecute(this.onEditDescription.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_description error: ', err, ctx);
      });

    this.bot
      .action('edit_photo', async (ctx) =>
        safeExecute(this.onEditPhoto.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError('edit_photo error: ', err, ctx);
      });

    this.bot
      .action('toggle_profile_visible', async (ctx) =>
        safeExecute(this.onToggleProfileVisible.bind(this), ctx),
      )
      .catch(async (err, ctx) => {
        await this.handleBotEventError(
          'toggle_profile_visible error: ',
          err,
          ctx,
        );
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

  async onToggleProfileVisible(ctx) {
    const userId = this.getUserId(ctx);
    try {
      const isVisible = await this.userService.getProfileVisible(userId);

      await this.userService.setProfileVisible(userId, !isVisible);
      await this.onEditProfile(ctx);
    } catch (e) {
      console.error('withoutPhoto error: ', e.message);
    }
  }

  async withoutPhoto(ctx) {
    const userId = this.getUserId(ctx);
    try {
      const photo = await this.userService.getPhoto(userId);

      if (photo) {
        await this.userService.setPhoto(userId, null);
      }
      await this.onEditProfile(ctx);
    } catch (e) {
      console.error('withoutPhoto error: ', e.message);
    }
  }

  async onEditProfile(ctx) {
    const userId = this.getUserId(ctx);
    try {
      const user = await this.userService.getUserFromCacheOrDB(userId);
      if (!user.name) {
        return await this.onCreateProfile(ctx);
      }

      await this.userService.setState(userId, UserState.PROFILE);
      // Отправляем фотографию пользователю с использованием file_id и добавляем подпись
      const captionText = `${user.name}\n${user.age}\n${
        UserRoleMap[user.role]
      }\n${user.description}`;
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Редактировать имя', 'edit_name')],
        [Markup.button.callback('Редактировать возраст', 'edit_age')],
        [Markup.button.callback('Редактировать роль', 'edit_role')],
        [Markup.button.callback('Редактировать описание', 'edit_description')],
        [Markup.button.callback('Редактировать фото', 'edit_photo')],
        [
          Markup.button.callback(
            user.isVisibleToOthers ? 'Скрыть профиль' : 'Открыть профиль',
            'toggle_profile_visible',
          ),
        ],
        [Markup.button.callback('Назад', 'main_menu')],
      ]);

      if (user.photoUrl) {
        return await ctx
          .replyWithPhoto(user.photoUrl, {
            reply_markup: keyboard.reply_markup,
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

      return await ctx.reply(captionText, keyboard).catch(async (err) => {
        await this.handleBotEventError('onEditProfile ctx error:  ', err, ctx);
      });
    } catch (e) {
      console.error('onEditProfile error: ', e.message);
    }
  }

  async onCreateProfile(ctx) {
    try {
      await this.onEditName(ctx);
    } catch (e) {
      console.error('onCreateProfile filling age error: ', e.message);
    }
  }

  async onSendMessage(ctx) {
    const userId = this.getUserId(ctx);
    try {
      switch (ctx.state.userState) {
        case UserState.FILLING_NAME:
          await this.feelName(ctx, userId);
          break;
        case UserState.FILLING_AGE:
          await this.feelAge(ctx, userId);
          break;
        case UserState.FILLING_DESCRIPTION:
          await this.feelDescription(ctx, userId);
          break;
        case UserState.FILLING_PHOTO:
          await this.feelPhoto(ctx, userId);
          break;
        default:
          await ctx
            .deleteMessage()
            .catch((e) =>
              console.error('user action delete message error: ', e.message),
            );
          console.log('other state handler');
      }
    } catch (e) {
      console.error('user action onSendMessage error: ', e.message);
    }
  }

  async feelName(ctx, userId: string) {
    const content = ctx.message?.text?.trim();

    if (!content.length || content.length > 40) {
      await ctx
        .deleteMessage()
        .catch((e) =>
          console.error('feelingAge deleteMessage error: ', e.message),
        );
      return;
    }

    try {
      await this.userService.setName(userId, content);
      const age = await this.userService.getAge(userId);
      age ? await this.onEditProfile(ctx) : await this.onEditAge(ctx);
    } catch (e) {
      console.error('feelingAge save age error', e.message);
    }
  }

  async onEditName(ctx) {
    const userId = this.getUserId(ctx);
    try {
      await this.userService.setState(userId, UserState.FILLING_NAME);
      await ctx
        .reply('Введи свое имя или псевдоним')
        .catch(async (err, ctx) => {
          await this.handleBotEventError(
            'onEditName filling age error:  ',
            err,
            ctx,
          );
        });
    } catch (e) {
      console.error('onEditName filling age error: ', e.message);
    }
  }

  async onEditAge(ctx) {
    const userId = this.getUserId(ctx);
    try {
      await this.userService.setState(userId, UserState.FILLING_AGE);
      await ctx
        .reply(
          'Введи свой возраст. Отвечай только числом от 18 до 99\n🚫 Не забывай, сервис 18+ 🚫',
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError(
            'onEditAge filling age error:  ',
            err,
            ctx,
          );
        });
    } catch (e) {
      console.error('onEditAge filling age error: ', e.message);
    }
  }

  async feelAge(ctx, userId: string) {
    const content = ctx.message?.text?.trim();

    const ageRegex = /^([1-9][8-9]|[2-9][0-9])$/;

    if (!content.trim().length || !ageRegex.test(content)) {
      await ctx
        .deleteMessage()
        .catch((e) =>
          console.error('feelingAge deleteMessage error: ', e.message),
        );
      return;
    }

    try {
      await this.userService.setAge(userId, content);
      const userRole = await this.userService.getUserRole(userId);
      userRole ? await this.onEditProfile(ctx) : await this.feelRole(ctx);
    } catch (e) {
      console.error('feelingAge save age error', e.message);
    }
  }

  async feelRole(ctx) {
    const userId = this.getUserId(ctx);
    try {
      await this.userService.setState(userId, UserState.FILLING_ROLE);
      const userRole = await this.userService.getUserRole(userId);
      const roles = Object.values(UserRole);
      const buttons = Markup.inlineKeyboard(
        roles.map((role) => [
          Markup.button.callback(
            UserRoleMap[role],
            `set_role?role=${role}&from=${userRole ? 'edit' : 'create'}`,
          ),
        ]),
      );

      await ctx
        .reply('Какая у тебя роль?', buttons)
        .catch((e) => console.error('Какая у тебя роль?: ', e.message));
    } catch (e) {
      console.error('feelRole error', e.message);
    }
  }

  async onSetRole(
    ctx,
    { role, from }: { role: UserRole; from: 'create' | 'edit' },
  ) {
    const userId = this.getUserId(ctx);

    try {
      await this.userService.setRole(userId, role);
      from === 'edit'
        ? await this.onEditProfile(ctx)
        : await this.onEditDescription(ctx);
    } catch (e) {
      console.error('onSetRole error', e.message);
    }
  }

  async onEditDescription(ctx) {
    const userId = this.getUserId(ctx);
    try {
      await this.userService.setState(userId, UserState.FILLING_DESCRIPTION);
      await ctx
        .reply(
          'Введи краткое описание своего профиля 20-600 символов. Например:\n' +
            '\n' +
            '«Ищу парня для вирта от 18 до 45 лет. Мои параметры...»',
        )
        .catch(async (err, ctx) => {
          await this.handleBotEventError(
            'onEditDescription ctx error:  ',
            err,
            ctx,
          );
        });
    } catch (e) {
      console.error('onEditDescription error', e.message);
    }
  }

  async feelDescription(ctx, userId: string) {
    const content = ctx.message?.text;

    if (!content.trim().length || content.length < 20 || content.length > 600) {
      await ctx
        .deleteMessage()
        .catch((e) =>
          console.error('feelDescription deleteMessage error: ', e.message),
        );
      return;
    }

    try {
      const userDescription = await this.userService.getDescription(userId);
      await this.userService.setDescription(userId, content);
      userDescription
        ? await this.onEditProfile(ctx)
        : await this.onEditPhoto(ctx);
    } catch (e) {
      console.error('feelDescription save age error', e.message);
    }
  }

  async onEditPhoto(ctx) {
    const userId = this.getUserId(ctx);
    try {
      await this.userService.setState(userId, UserState.FILLING_PHOTO);

      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Оставить без фото', 'without_photo'),
      ]);

      await ctx.reply('Загрузи фото профиля', keyboard).catch(async (err) => {
        await this.handleBotEventError('onEditPhoto ctx error:  ', err, ctx);
      });
    } catch (e) {
      console.error('onEditPhoto error', e.message);
    }
  }

  async feelPhoto(ctx, userId: string) {
    const withoutPhoto = 'Оставить без фото' === ctx.message?.text;
    const photo = ctx.message?.photo;

    try {
      if ((photo && Array.isArray(photo)) || withoutPhoto) {
        if (photo?.[0]) {
          await this.userService.setPhoto(userId, photo[0].file_id);
        }

        const isVisible = await this.userService.getProfileVisible(userId);
        if (!isVisible) {
          await this.userService.setProfileVisible(userId, true);
        }
        await this.onEditProfile(ctx);
        return;
      }
    } catch (e) {
      console.error('feelPhoto error: ', e.message);
    }

    await ctx
      .deleteMessage()
      .catch((e) =>
        console.error('feelPhoto deleteMessage error: ', e.message),
      );
  }

  getUserId(ctx): string {
    return ctx.from.id.toString();
  }
}
