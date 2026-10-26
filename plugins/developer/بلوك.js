import fs from 'fs-extra';
import { configHelper } from '../../config.js';

export default {
    name: "بلوك",
    aliases: ["block"],
    developer:true,
  async run({ handler, m, isDeveloper, userJid }) {

        // 2. جلب الهدف (المنشن أو الرد)
        let target = m.mentionedJid?.[0] || m.quoted?.sender || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!target) {
            return handler.sendMessage(m.key.remoteJid, { 
                text: "*⚠️ حـددلـي الـعـاق عـشـان احـظـࢪه (مـنـشـنـه أو ࢪد عـلـى ࢪسـالـتـه)*" 
            }, { quoted: m });
        }

        // 👑 منع حظر الماستر
        if (configHelper.isMaster(target)) {
            return handler.sendMessage(m.key.remoteJid, { 
                text: "*👑 لا يـمـكـن حـظـر عـمـك الـمـاسـتـࢪ.*" 
            }, { quoted: m });
        }

        // منع حظر البوت نفسه
        const botJid = handler.bot.sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (target === botJid) {
            return handler.sendMessage(m.key.remoteJid, { 
                text: "*🤖 مـش هـتـقـدر تـحـظـر نـفـسـك يـا عـبـيـط*" 
            }, { quoted: m });
        }

        const path = './data/blacklist.json';
        if (!fs.existsSync(path)) fs.writeJSONSync(path, []);
        
        let blacklist = fs.readJSONSync(path);
        const userNumber = target.split('@')[0];

        // 3. حالة إذا كان محظوراً بالفعل
        if (blacklist.includes(target)) {
            return handler.sendMessage(m.key.remoteJid, { 
                text: `*┏─━━━━ • ◈ • ━━━━─┓*\n\n*👤 الـعـاق : ⦓ @${userNumber} ⦔*\n\n*☣️ الـحـالـة : هـذا الـعـاق مـحـظـوࢪ بـالـفـعـل*\n\n*┗─━━━━ • ◈ • ━━━━─┛*`, 
                mentions: [target] 
            }, { quoted: m });
        }

        // 4. تنفيذ الحظر الجديد بنجاح
        blacklist.push(target);
        fs.writeJSONSync(path, blacklist);

        return handler.sendMessage(m.key.remoteJid, { 
            text: `*┏─━━━━ • ◈ • ━━━━─┓*\n\n*👤 الـعـاق : ⦓ @${userNumber} ⦔*\n\n*☣️ الـحـالـة : تـم حـظـࢪه مـن اسـتـخـدام الـبـوت بـنـجـاح👋🏼*\n\n*┗─━━━━ • ◈ • ━━━━─┛*`, 
            mentions: [target] 
        }, { quoted: m });
    }
};