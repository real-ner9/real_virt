import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { UserService } from './user.service';

@Injectable()
export class MessageService {
  private MESSAGE_TYPES = {
    text: 'sendMessage',
    sticker: 'sendSticker',
    photo: 'sendPhoto',
    document: 'sendDocument',
    voice: 'sendVoice',
    video: 'sendVideo',
    video_note: 'sendVideoNote',
  };

  constructor(private readonly userService: UserService) {}

  findPartnerKeyboard = Markup.inlineKeyboard([
    Markup.button.callback('Найти партнера', 'find_partner'),
  ]);

  async forwardMessage(bot: Telegraf, ctx): Promise<void> {
    const userId = ctx.from.id.toString();
    const currentPartnerId = await this.userService.getCurrentPartner(userId);

    if (!currentPartnerId) {
      await ctx
        .reply(
          'Кажется, ты заблудился...\nПо вопросам работы сервиса пиши в чат @govirtchat',
          this.findPartnerKeyboard,
        )
        .catch((err) => console.log(err));
      return;
    }

    const messageType = Object.keys(this.MESSAGE_TYPES).find(
      (type) => ctx.message[type],
    );
    if (messageType) {
      const method = this.MESSAGE_TYPES[messageType];
      let content = ctx.message[messageType];
      if (messageType === 'photo' && Array.isArray(content)) {
        content = content[0];
      }

      return bot.telegram[method](
        currentPartnerId,
        content.file_id || content,
      ).catch(async (err: any) => {
        console.error('message to user error: ', err.message);

        if (err.code === 403) {
          if (currentPartnerId) {
            await this.userService.blockUser(currentPartnerId);

            await ctx
              .reply('Упс, пользователь покинул чат', this.findPartnerKeyboard)
              .catch((err) => console.log(err));
          }
        }
      });
    }
  }
}
