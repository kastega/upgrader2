const { Telegraf, Markup } = require('telegraf');

// ↓↓↓ ЗАМЕНИ НА НОВЫЙ ТОКЕН ОТ @BotFather ↓↓↓
const BOT_TOKEN = '5736387230:AAGt-OSdmCceRJUHRLb_y2MdSZ7d8F4G8vE';

// ↓↓↓ ССЫЛКА НА RAILWAY-СЕРВЕР ↓↓↓
const WEBAPP_URL = 'https://upgrader2-production.up.railway.app';

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        'Привет! Нажми кнопку ниже, чтобы открыть апгрейдер.',
        Markup.keyboard([
            [Markup.button.webApp('🎮 Открыть апгрейдер', WEBAPP_URL)]
        ]).resize()
    );
});

bot.launch()
    .then(() => console.log('Бот запущен!'))
    .catch((err) => console.error('Ошибка запуска:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
