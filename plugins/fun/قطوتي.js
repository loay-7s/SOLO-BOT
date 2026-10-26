// plugins/قطوتي.js
import { catsStore } from '../../config.js';

export default {
    name: "قطوتي",
    aliases: ["قطة", "cat"],
    description: "تسجيل أو حذف قطتك في النظام",
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

            // 📋 عرض القطط المسجلة (استخدم أمر قططي بدلاً من ذلك)
            if (!args.length && !targetId) {
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🐈 نـظـام الـقـطـط*

*───━━━⊱  📋  ⊰━━━───*

*📌 لـعـرض قـائـمـة قـطـطـك اسـتـخـدم الأمـر:*
\`.قططي\`

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.قطوتي @منشن* - *لـتـسـجـيـل قـطـة*
📌 *.قطوتي حذف @منشن* - *لـحـذف قـطـة*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // 🗑️ حذف قطة
            if (args[0]?.toLowerCase() === 'حذف' || args[0]?.toLowerCase() === 'delete') {
                if (!targetId) {
                    return reply(`*⚠️ مـنـشـن الـقـطـة الـلـي عـايـز تـحـذفـهـا!*`);
                }

                // جلب الميتاداتا لتحديد الـ JID الحقيقي
                const metadata = await sock.groupMetadata(chatId).catch(() => ({ participants: [] }));
                const participant = metadata.participants.find(p => p.id === targetId);
                const realJid = participant?.phoneNumber || targetId || "";

                let myCats = catsStore.get(sender) || [];
                if (!Array.isArray(myCats)) myCats = [];

                const index = myCats.indexOf(realJid);
                if (index === -1) {
                    return reply(`*❌ هـذا الـشـخـص لـيـس مـسـجـلاً كـقـطـة عـنـدك*`);
                }

                myCats.splice(index, 1);
                catsStore.set(sender, myCats);
                await catsStore.save();

                await react("🗑️");

                const senderNumber = sender.split('@')[0];
                const targetNumber = realJid.split('@')[0];

                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🗑️ تـم حـذف الـقـطـة*

*───━━━⊱  ❌  ⊰━━━───*

*👤 الـمـالـك:* ⦓ @${senderNumber} ⦔
*🐈 الـقـطـة:* ⦓ @${targetNumber} ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📊 تـم حـذفـهـا مـن قـائـمـتـك*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`, { mentions: [sender, realJid] });
            }

            // ➕ تسجيل قطة جديدة
            if (!targetId) {
                return reply(`*⚠️ مـنـشـن الـقـطـة أو رد عـلـى رسـالـتـهـا!*`);
            }

            // جلب الميتاداتا لتحديد الـ JID الحقيقي
            const metadata = await sock.groupMetadata(chatId).catch(() => ({ participants: [] }));
            const participant = metadata.participants.find(p => p.id === targetId);
            const realJid = participant?.phoneNumber || targetId || "";

            if (!realJid) {
                return reply(`*❌ لـم أتـمـكـن مـن تـحـديـد هـويـة الـقـطـة*`);
            }

            // 👑 منع تسجيل الماستر كقطة
            if (configHelper.isMaster(realJid)) {
                return reply(`*👑 لا يـمـكـن تـسـجـيـل عـمـك كـقـطـة*`);
            }

            if (realJid === sender) {
                return reply(`*😹 مـش هـتـقـدر تـسـجـل نـفـسـك يـا قـطـو*`);
            }

            // منع تسجيل البوت نفسه
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            if (realJid === botJid) {
                return reply(`*🤖 الـبـوت مـش قـطـة يـا عـبـيـط*`);
            }

            let myCats = catsStore.get(sender) || [];
            if (!Array.isArray(myCats)) myCats = [];

            if (myCats.includes(realJid)) {
                return reply(`*✅ هـذا الـشـخـص مـسـجـل عـنـدك مـسـبـقـاً كـقـطـة*`);
            }

            // الحد الأقصى 10 قطط
            if (myCats.length >= 50) {
                return reply(`*❌ لـقـد وصـلـت لـلـحـد الأقـصـى (50 قـطـط)*`);
            }

            myCats.push(realJid);
            catsStore.set(sender, myCats);
            await catsStore.save();

            await react("🐈");

            const senderNumber = sender.split('@')[0];
            const targetNumber = realJid.split('@')[0];

            const text = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🐈 تـم تـسـجـيـل قـطـة جـديـدة*

*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـالـك:* ⦓ @${senderNumber} ⦔
*🐈 الـقـطـة:* ⦓ @${targetNumber} ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📊 عـدد قـطـطـك:* ⦓ *${myCats.length}* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await sock.sendMessage(chatId, { text, mentions: [sender, realJid] }, { quoted: m });

        } catch (error) {
            console.error("❌ قطوتي Error:", error);
            await reply(`*❌ فـشـل الـنـظـام*\n📌 جـرب مـرة اخـرى`);
        }
    }
};