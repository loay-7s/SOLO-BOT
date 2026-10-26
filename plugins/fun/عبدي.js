// plugins/عبدي.js
import { catsStore } from '../../config.js';

export default {
    name: "عبدي",
    aliases: ["عبد", "slave"],
    description: "تسجيل أو حذف عبدك في النظام",
    category: "ألعاب",
    group: true,

    async run({ sock, m, args, react, reply }) {
        try {
            const chatId = m.key.remoteJid;
            const sender = m.sender || m.key.participant || "";

            // ✅ تحديد الهدف (منشن أو رد)
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            const quotedSender = contextInfo?.participant;
            const mentionedJid = contextInfo?.mentionedJid || [];
            let targetId = quotedSender || (mentionedJid.length > 0 ? mentionedJid[0] : null);

            // 👑 التحقق من الماستر
            const { configHelper } = await import('../config.js');
            const isMaster = configHelper.isMaster(sender);

            // 📋 عرض الأوامر
            if (!args.length && !targetId) {
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*⛓️ نـظـام الـعـبـيـد*

*───━━━⊱  📋  ⊰━━━───*

*📌 لـعـرض قـائـمـة عـبـيـدك اسـتـخـدم الأمـر:*
\`.عبيدي\`

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.عبدي @منشن* - *لـتـسـجـيـل عـبـد*
📌 *.عبدي حذف @منشن* - *لـحـذف عـبـد*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // 🗑️ حذف عبد
            if (args[0]?.toLowerCase() === 'حذف' || args[0]?.toLowerCase() === 'delete') {
                if (!targetId) {
                    return reply(`*⚠️ مـنـشـن الـعـبـد الـلـي عـايـز تـحـذفـه!*`);
                }

                // جلب الميتاداتا لتحديد الـ JID الحقيقي
                const metadata = await sock.groupMetadata(chatId).catch(() => ({ participants: [] }));
                const participant = metadata.participants.find(p => p.id === targetId);
                const realJid = participant?.phoneNumber || targetId || "";

                let mySlaves = catsStore.get(`slaves_${sender}`) || [];
                if (!Array.isArray(mySlaves)) mySlaves = [];

                const index = mySlaves.indexOf(realJid);
                if (index === -1) {
                    return reply(`*❌ هـذا الـشـخـص لـيـس مـسـجـلاً كـعـبـد عـنـدك*`);
                }

                mySlaves.splice(index, 1);
                catsStore.set(`slaves_${sender}`, mySlaves);
                await catsStore.save();

                await react("🗑️");

                const senderNumber = sender.split('@')[0];
                const targetNumber = realJid.split('@')[0];

                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🗑️ تـم حـذف الـعـبـد*

*───━━━⊱  ❌  ⊰━━━───*

*👤 الـمـالـك:* ⦓ @${senderNumber} ⦔
*⛓️ الـعـبـد:* ⦓ @${targetNumber} ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📊 تـم حـذفـه مـن قـائـمـتـك*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`, { mentions: [sender, realJid] });
            }

            // ➕ تسجيل عبد جديد
            if (!targetId) {
                return reply(`*⚠️ مـنـشـن الـعـبـد أو رد عـلـى رسـالـتـه!*`);
            }

            // جلب الميتاداتا لتحديد الـ JID الحقيقي
            const metadata = await sock.groupMetadata(chatId).catch(() => ({ participants: [] }));
            const participant = metadata.participants.find(p => p.id === targetId);
            const realJid = participant?.phoneNumber || targetId || "";

            if (!realJid) {
                return reply(`*❌ لـم أتـمـكـن مـن تـحـديـد هـويـة الـعـبـد*`);
            }

            // 👑 منع تسجيل الماستر كعبد
            if (configHelper.isMaster(realJid)) {
                return reply(`*👑 لا يـمـكـن تـسـجـيـل الـمـاسـتـࢪ كـعـبـد، انـت عـبـد لـلـمـاسـتـࢪ.*`);
            }

            if (realJid === sender) {
                return reply(`*😹 مـش هـتـقـدر تـسـجـل نـفـسـك يـا عـبـد*`);
            }

            // منع تسجيل البوت نفسه
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            if (realJid === botJid) {
                return reply(`*🤖 الـبـوت مـش عـبـد يـا عـبـيـط*`);
            }

            let mySlaves = catsStore.get(`slaves_${sender}`) || [];
            if (!Array.isArray(mySlaves)) mySlaves = [];

            if (mySlaves.includes(realJid)) {
                return reply(`*✅ هـذا الـشـخـص مـسـجـل عـنـدك مـسـبـقـاً كـعـبـد*`);
            }

            mySlaves.push(realJid);
            catsStore.set(`slaves_${sender}`, mySlaves);
            await catsStore.save();

            await react("⛓️");

            const senderNumber = sender.split('@')[0];
            const targetNumber = realJid.split('@')[0];

            const text = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*⛓️ تـم تـسـجـيـل عـبـد جـديـد*

*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـالـك:* ⦓ @${senderNumber} ⦔

*⛓️ الـعـبـد:* ⦓ @${targetNumber} ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📊 عـدد عـبـيـدك:* ⦓ *${mySlaves.length}* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await sock.sendMessage(chatId, { text, mentions: [sender, realJid] }, { quoted: m });

        } catch (error) {
            console.error("❌ عبدي Error:", error);
            await reply(`*❌ فـشـل الـنـظـام*\n📌 جـرب مـرة اخـرى`);
        }
    }
};