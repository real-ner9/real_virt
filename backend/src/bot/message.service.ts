import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { UserService } from './user.service';
import { I18nService } from 'nestjs-i18n';

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

  async forwardMessage(bot: Telegraf, ctx): Promise<void> {
    const userId = ctx.from.id.toString();
    const currentPartnerId = this.userService.getCurrentPartner(userId);

    if (!currentPartnerId) {
      const findPartnerKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Найти партнера', 'find_partner'),
      ]);

      ctx.reply(
        'Кажется, ты заблудился...\nПо вопросам работы сервиса пиши в чат @govirtchat',
        findPartnerKeyboard,
      );
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

      return bot.telegram[method](currentPartnerId, content.file_id || content);
    }
  }
}
