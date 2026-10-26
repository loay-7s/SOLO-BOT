// plugins/قططي.js
import { catsStore } from '../../config.js';

export default {
    name: "قططي",
    description: "عرض قائمة قططك المسجلة كجهات اتصال",
    category: "ألعاب",
    aliases: ["mycats", "قطط"],

    async run({ sock, message, react, reply }) { 
        const jid = message.key.remoteJid;
        const sender = message.sender || message.key.participant || "";

        await react('🐈');

        await catsStore.load();
        let myCats = catsStore.get(sender) || [];

        if (!Array.isArray(myCats) || myCats.length === 0) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🐈 قـائـمـة قـطـطـي*

*───━━━⊱  📋  ⊰━━━───*

*📭 لـيـس لـديـك أي قـطـط مـسـجـلـة*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.قطوتي @منشن* - *لـتـسـجـيـل قـطـة*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // تجهيز جهات الاتصال (VCards) للقطط
        const catContacts = myCats.map((catJid, index) => {
            const num = catJid.split('@')[0];
            return {
                displayName: `🐈 القطة رقم ${index + 1}`,
                vcard: `BEGIN:VCARD
VERSION:3.0
FN:🐈 SOLO CAT #${index + 1}
TEL;type=CELL;waid=${num}:${num}
ORG:𝑺𝑶𝑳𝑶 𝑺𝒀𝑺𝑻𝑬𝑴
NOTE:🐱 هذه القطة تابعة للمستخدم المسجل في نظام SOLO
END:VCARD`
            };
        });

        // النص التعريفي بزخرفة SOLO
        const caption = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🐈 قـائـمـة قـطـطـي*

*───━━━⊱  📋  ⊰━━━───*

*👤 الـمـالـك:* ⦓ @${sender.split('@')[0]} ⦔

*📊 عـدد الـقـطـط:* ⦓ *${myCats.length}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 تـم جـلـب الـبـيـانـات مـن قـاعـدة الـمـجـلـد 👇*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

        await sock.sendMessage(jid, { 
            text: caption, 
            mentions: [sender, ...myCats] 
        }, { quoted: message });

        // إرسال القطط كبطاقات اتصال
        await sock.sendMessage(jid, {
            contacts: {
                displayName: `🐈 قائمة قططك (${myCats.length})`,
                contacts: catContacts
            }
        }, { quoted: message });

        await react('✅');
    }
};