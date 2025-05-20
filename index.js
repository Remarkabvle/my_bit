const { Telegraf } = require('telegraf');

// Bot token va admin ID
const BOT_TOKEN = '7945447391:AAFU9Gq58xFSMelJAbFjAYgZPW6PzJdVboQ';
const ADMIN_ID = '777318750';

// Debug rejimini yoqish
const DEBUG = true;

function debug(message) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`);
  }
}

// Bot yaratish
debug('Bot ishga tushmoqda...');
const bot = new Telegraf(BOT_TOKEN);

// Middleware - har bir xabarni tekshirish
bot.use((ctx, next) => {
  const update = ctx.update;
  debug(`Yangi update: ${JSON.stringify(update, null, 2)}`);
  return next();
});

// Start buyrug'i
bot.start((ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name || 'Nomsiz';
  
  debug(`Start komandasi: ${userName} (${userId})`);
  ctx.reply(`Salom, ${userName}! Sizning ID'ingiz: ${userId}`);
  
  // Admindan boshqa bo'lsa, adminga xabar yuborish
  if (userId.toString() !== ADMIN_ID) {
    debug(`Admin ga xabar yuborilmoqda: ${userName} (${userId})`);
    bot.telegram.sendMessage(ADMIN_ID, `🆕 Yangi foydalanuvchi:\nIsm: ${userName}\nID: ${userId}`)
      .then(() => debug('Admin ga xabar yuborildi'))
      .catch(e => debug(`XATO! Admin ga xabar yuborilmadi: ${e.message}`));
  }
});

// Test komandasi - bot ishlayotganini tekshirish uchun
bot.command('test', (ctx) => {
  debug('Test komandasi ishga tushdi');
  ctx.reply('Bot ishlayapti ✅');
});

// /send komandasi - adminga foydalanuvchilarga xabar yuborish imkonini beradi
bot.command('send', async (ctx) => {
  const userId = ctx.from.id;
  
  // Faqat admin uchun
  if (userId.toString() !== ADMIN_ID) {
    debug(`Admin bo'lmagan foydalanuvchi send komandasi ishlatmoqchi: ${userId}`);
    return;
  }
  
  debug(`Admin /send komandasi ishlatmoqda: ${ctx.message.text}`);
  
  // /send USER_ID MESSAGE formatini ajratish
  const commandText = ctx.message.text.trim();
  const commandParts = commandText.split(/\s+/); // bo'sh joylar bo'yicha ajratish
  
  debug(`Komanda qismlari: ${JSON.stringify(commandParts)}`);
  
  // Formatni tekshirish
  if (commandParts.length < 3) {
    debug('Noto\'g\'ri format');
    return ctx.reply('Noto\'g\'ri format. Ishlatish: /send USER_ID XABAR');
  }
  
  const targetId = commandParts[1];
  const message = commandParts.slice(2).join(' ');
  
  debug(`Xabar yuborilmoqda: "${message}" to ID ${targetId}`);
  
  try {
    await bot.telegram.sendMessage(targetId, message);
    debug(`Xabar muvaffaqiyatli yuborildi ID ${targetId} ga`);
    await ctx.reply(`✅ Xabar yuborildi ID: ${targetId}`);
  } catch (error) {
    debug(`XATO! Xabar yuborilmadi: ${error.message}`);
    await ctx.reply(`❌ Xatolik: ${error.message}`);
  }
});

// Oddiy xabarni qayta ishlash
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const userName = ctx.from.first_name || 'Nomsiz';
  
  // Admin xabarlarini alohida qayta ishlash
  if (userId.toString() === ADMIN_ID) {
    // Admin maxsus format orqali xabar yubormoqchi bo'lsa
    if (text.startsWith('user:')) {
      debug('Admin maxsus xabar formatini ishlatmoqda');
      
      try {
        const parts = text.split(' ');
        const targetId = parts[0].replace('user:', '');
        
        if (parts.length < 2) {
          return ctx.reply('Noto\'g\'ri format. Ishlatish: user:ID XABAR');
        }
        
        const message = parts.slice(1).join(' ');
        
        debug(`Admin maxsus format orqali ${targetId} ID ga "${message}" xabarini yubormoqda`);
        
        await bot.telegram.sendMessage(targetId, message);
        await ctx.reply(`✅ Xabar yuborildi ID: ${targetId}`);
        debug('Xabar muvaffaqiyatli yuborildi');
      } catch (error) {
        debug(`XATO! Xabar yuborilmadi: ${error.message}`);
        await ctx.reply(`❌ Xatolik: ${error.message}`);
      }
    }
    return;
  }
  
  // Oddiy foydalanuvchilar xabarlarini qayta ishlash
  debug(`Xabar keldi: ${userName} (${userId}): ${text}`);
  
  try {
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `📨 Yangi xabar:\nIsm: ${userName}\nID: ${userId}\nXabar: ${text}`
    );
    debug('Admin ga xabar yuborildi');
    
    await ctx.reply('Xabaringiz qabul qilindi ✅');
  } catch (error) {
    debug(`XATO! Admin ga xabar yuborishda: ${error.message}`);
  }
});

// Sodda reply komandasi
bot.command('reply', async (ctx) => {
  const userId = ctx.from.id;
  
  if (userId.toString() !== ADMIN_ID) {
    return;
  }
  
  const text = ctx.message.text;
  const match = text.match(/^\/reply\s+(\d+)\s+(.+)$/s);
  
  if (!match) {
    return ctx.reply('Format: /reply USER_ID XABAR');
  }
  
  const targetId = match[1];
  const message = match[2];
  
  debug(`/reply komandasi orqali ${targetId} ID ga "${message}" xabarini yubormoqda`);
  
  try {
    await bot.telegram.sendMessage(targetId, message);
    await ctx.reply(`✅ Xabar yuborildi ID: ${targetId}`);
    debug('Xabar muvaffaqiyatli yuborildi');
  } catch (error) {
    debug(`XATO! Xabar yuborilmadi: ${error.message}`);
    await ctx.reply(`❌ Xatolik: ${error.message}\n\nFoydalanuvchi botni bloklagan bo'lishi mumkin`);
  }
});

// Botni ishga tushirish
bot.launch()
  .then(() => {
    console.log('✅ Bot muvaffaqiyatli ishga tushdi!');
    // Botning ishlayotganini tekshirish uchun adminga xabar yuborish
    return bot.telegram.sendMessage(ADMIN_ID, '🤖 Bot qayta ishga tushdi va ishlayapti!');
  })
  .then(() => {
    debug('Admin ga xabar yuborildi - bot ishlayapti');
  })
  .catch((error) => {
    console.error('❌ Bot ishga tushmadi:', error);
    debug(`XATO! Bot ishga tushmadi: ${error.message}`);
  });

// Xavfsiz to'xtatish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Istisno xatolarni qayta ishlash
process.on('unhandledRejection', (error) => {
  console.error('Qayta ishlanmagan promise rejection:', error);
  debug(`XATO! Qayta ishlanmagan xato: ${error.message}`);
});