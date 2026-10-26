// plugins/github.js
// ════════════════════════════════════════════════════════════════════
//  ⚡ SOLO BOT — GitHub Search & Download
// ════════════════════════════════════════════════════════════════════

import axios from 'axios';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;

// ════════════════════════════════════════════════════════════════════
//  🔍 البحث في GitHub
// ════════════════════════════════════════════════════════════════════
const searchGitHub = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.sendMessage(m.chat, {
      text:
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
        `*🔎 الـبـحـث فـي GitHub*\n\n` +
        `*───━━━⊱  🔍  ⊰━━━───*\n\n` +
        `*📌 يـرجـى إدخـال اسـم الـمـشـروع لـلـبـحـث*\n\n` +
        `*🔍 مـثـال:*\n` +
        `*➤ ${usedPrefix + command} WhatsApp-Bot*\n\n` +
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
        `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
    }, { quoted: m });
  }

  await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(text)}&per_page=100`;
    const { data } = await axios.get(url);

    if (!data.items.length) throw new Error('❌ لـم يـتـم الـعـثـور عـلـى أي مـسـتـودع مـطـابـق');

    // ─── بناء rows ───
    const rows = data.items.map((repo) => {
      const cmdId = `${usedPrefix}جيت ${repo.html_url}`;
      return {
        title: `📂 ${repo.name}`,
        description: `⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} | 👤 ${repo.owner.login}`,
        id: cmdId,
        rowId: cmdId  // ← مهم للتوافق
      };
    });

    const interactiveMessage = {
      body: {
        text:
          `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
          `*🔎 نـتـائـج الـبـحـث*\n\n` +
          `*───━━━⊱  📊  ⊰━━━───*\n\n` +
          `*📌 تـم الـعـثـور عـلـى ${data.items.length} مـسـتـودع*\n\n` +
          `> *اخـتـࢪ الـمـسـتـودع الـمـطـلـوب لـلـتـحـمـيـل 👇*`
      },
      footer: { text: '『𝑺𝑶𝑳𝑶⊰🏮⊱𝑮𝑰𝑻𝑯𝑼𝑩』' },
      nativeFlowMessage: {
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: '📜 قـائـمـة الـمـسـتـودعـات',
              sections: [
                {
                  title: `📚 الـنـتـائـج (${data.items.length})`,
                  rows
                }
              ]
            })
          }
        ]
      }
    };

    const waMessage = generateWAMessageFromContent(
      m.chat,
      { interactiveMessage },
      { userJid: conn.user?.id, quoted: m }
    );

    await conn.relayMessage(m.chat, waMessage.message, {
      messageId: waMessage.key.id,
      additionalNodes: [
        {
          tag: 'biz',
          attrs: {},
          content: [
            {
              tag: 'interactive',
              attrs: { type: 'native_flow', v: '1' },
              content: [
                { tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }
              ]
            }
          ]
        }
      ]
    });

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (error) {
    conn.sendMessage(m.chat, {
      text:
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
        `*❌ فـشـل الـبـحـث فـي GitHub*\n\n` +
        `*───━━━⊱  ⚠️  ⊰━━━───*\n\n` +
        `*📌 الـتـفـاصـيـل:* ${error.message}\n\n` +
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
        `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
    }, { quoted: m });
  }
};

// ════════════════════════════════════════════════════════════════════
//  📥 تحميل المستودع
// ════════════════════════════════════════════════════════════════════
const downloadGitHubRepo = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return conn.sendMessage(m.chat, {
      text:
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
        `*📥 تـحـمـيـل مـن GitHub*\n\n` +
        `*───━━━⊱  🔗  ⊰━━━───*\n\n` +
        `*📌 يـرجـى إدخـال رابـط الـمـسـتـودع*\n\n` +
        `*🔽 مـثـال:*\n` +
        `*➤ ${usedPrefix + command} https://github.com/user/repo*\n\n` +
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
        `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
    }, { quoted: m });
  }

  if (!regex.test(args[0])) {
    return conn.sendMessage(m.chat, {
      text:
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
        `*❌ الـرابـط غـيـر صـالـح*\n\n` +
        `*───━━━⊱  ⚠️  ⊰━━━───*\n\n` +
        `*📌 تـأكـد مـن أنـه رابـط GitHub صـحـيـح*\n\n` +
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
        `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
    }, { quoted: m });
  }

  let [_, user, repo] = args[0].match(regex) || [];
  repo = repo.replace(/.git$/, '');
  const url = `https://api.github.com/repos/${user}/${repo}/zipball`;

  try {
    await conn.sendMessage(m.chat, { react: { text: '📥', key: m.key } });

    await conn.sendMessage(m.chat, {
      document: { url },
      mimetype: 'application/zip',
      fileName: `${repo}.zip`,
      caption:
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
        `*✅ تـم تـحـمـيـل الـمـسـتـودع*\n\n` +
        `*───━━━⊱  📦  ⊰━━━───*\n\n` +
        `*📂 الاسـم:* ${repo}\n` +
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
        `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
    }, { quoted: m });

    await conn.sendMessage(m.chat, { react: { text: '✔️', key: m.key } });

  } catch (error) {
    conn.sendMessage(m.chat, {
      text:
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
        `*❌ فـشـل تـحـمـيـل الـمـسـتـودع*\n\n` +
        `*───━━━⊱  ⚠️  ⊰━━━───*\n\n` +
        `*📌 الـتـفـاصـيـل:* ${error.message}\n\n` +
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
        `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
    }, { quoted: m });
  }
};

// ════════════════════════════════════════════════════════════════════
//  🔌 SOLO WRAPPER — كشف تلقائي (بحث أو تحميل)
// ════════════════════════════════════════════════════════════════════
export default {
  name       : 'جيتهاب',
  aliases    : ['جيت', 'github', 'git'],
  description: 'البحث وتحميل المستودعات من GitHub',
  category   : 'تحميل',
  cooldown   : 5000,

  async run({ sock, message, args, reply, react, command }) {
    try {
      const m = message;
      m.chat   = message.key.remoteJid;
      m.sender = message.key.participant || message.key.remoteJid;
      m.reply  = (content) =>
        reply(typeof content === 'string' ? content : content.text || '');

      const text = args.join(' ').trim();

      // ─── تشخيص ───
      console.log('═══════════════════════════════════');
      console.log('🔍 COMMAND:', command);
      console.log('🔍 ARGS:', args);
      console.log('🔍 TEXT:', text);
      console.log('🔍 IS_DOWNLOAD:', regex.test(text));
      console.log('═══════════════════════════════════');

      // ─── كشف تلقائي: لو فيه رابط GitHub → تحميل ───
      if (regex.test(text)) {
        return await downloadGitHubRepo(m, {
          conn: sock,
          args: args,
          usedPrefix: '.',
          command: 'جيت'
        });
      }

      // ─── بحث ───
      return await searchGitHub(m, {
        conn: sock,
        text: text,
        usedPrefix: '.',
        command: 'جيتهاب'
      });

    } catch (err) {
      console.error('[GITHUB WRAPPER]', err?.message);
      await react('❌');
      return reply(
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n\n` +
        `*❌ حـدث خـطـأ غـيـر مـتـوقـع*\n\n` +
        `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
        `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
      );
    }
  }
};