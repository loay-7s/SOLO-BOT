// plugins/عبيدي.js
import { catsStore } from '../../config.js';

export default {
    name: "عبيدي",
    description: "عرض قائمة عبيدك المسجلة كجهات اتصال",
    category: "ألعاب",
    aliases: ["myslaves", "عبيد"],

    async run({ sock, message, react, reply }) { 
        const jid = message.key.remoteJid;
        const sender = message.sender || message.key.participant || "";

        await react('⛓️');

        await catsStore.load();
        let mySlaves = catsStore.get(`slaves_${sender}`) || [];

        if (!Array.isArray(mySlaves) || mySlaves.length === 0) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*⛓️ قـائـمـة عـبـيـدي*

*───━━━⊱  📋  ⊰━━━───*

*📭 لـيـس لـديـك أي عـبـيـد مـسـجـلـيـن*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.عبدي @منشن* - *لـتـسـجـيـل عـبـد*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // تجهيز جهات الاتصال (VCards) للعبيد
        const slaveContacts = mySlaves.map((slaveJid, index) => {
            const num = slaveJid.split('@')[0];
            return {
                displayName: `⛓️ العبد رقم ${index + 1}`,
                vcard: `BEGIN:VCARD
VERSION:3.0
FN:⛓️ SOLO SLAVE #${index + 1}
TEL;type=CELL;waid=${num}:${num}
ORG:𝑺𝑶𝑳𝑶 𝑺𝒀𝑺𝑻𝑬𝑴
NOTE:⛓️ هذا العبد تابع للمستخدم المسجل في نظام SOLO
END:VCARD`
            };
        });

        // النص التعريفي بزخرفة SOLO
        const caption = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*⛓️ قـائـمـة عـبـيـدي*

*───━━━⊱  📋  ⊰━━━───*

*👤 الـمـالـك:* ⦓ @${sender.split('@')[0]} ⦔

*📊 عـدد الـعـبـيـد:* ⦓ *${mySlaves.length}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 تـم جـلـب الـبـيـانـات مـن قـاعـدة الـمـجـلـد 👇*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

        await sock.sendMessage(jid, { 
            text: caption, 
            mentions: [sender, ...mySlaves] 
        }, { quoted: message });

        // إرسال العبيد كبطاقات اتصال
        await sock.sendMessage(jid, {
            contacts: {
                displayName: `⛓️ قائمة عبيدك (${mySlaves.length})`,
                contacts: slaveContacts
            }
        }, { quoted: message });

        await react('✅');
    }
};