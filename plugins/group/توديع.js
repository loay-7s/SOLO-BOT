import fs from 'fs-extra';

export default {
    name: "توديع",
    aliases: ["farewell", "وداع"],
    description: "نظام التوديع التلقائي للأعضاء المغادرين",
    category: "group",
    admin: true,
    group: true,

    async run({ bot, message, args, isGroup, userJid, reply, react }) {
        const jid = message.key.remoteJid;
        const settingsPath = './data/farewell_settings.json';

        if (!isGroup) {
            return reply("*❌ هـذا الأمـر يـعـمـل فـي الـمـجـمـوعـات فـقـط*");
        }

        // ✅ التحقق من أن المستخدم مشرف
        try {
            const groupMetadata = await bot.sock.groupMetadata(jid);
            const senderParticipant = groupMetadata.participants.find(p => p.id === userJid);
            
            if (!senderParticipant?.admin) {
                return reply("*❌ هـذا الأمـر لـلـمـشـرفـيـن فـقـط*");
            }
        } catch (error) {
            console.error("❌ خطأ في جلب معلومات المجموعة:", error);
            return reply("*❌ خـلـيـنـي مـشـرف الأول.*");
        }

        await react("👋");

        // قراءة الإعدادات
        if (!fs.existsSync(settingsPath)) {
            fs.writeJsonSync(settingsPath, {}, { spaces: 2 });
        }

        let settings = fs.readJsonSync(settingsPath, { throws: false }) || {};

        if (!settings[jid]) {
            settings[jid] = { enabled: false };
        }

        const subCommand = args[0]?.toLowerCase();

        // عرض الحالة الحالية
        if (!subCommand || subCommand === "حالة") {
            const status = settings[jid].enabled ? "مـفـعـل ✅" : "مـغـلق ❌";

            const statusMsg = `*╭━─━─━─≪✠≫─━─━─━╮*
*💠 𝐅𝐀𝐑𝐄𝐖𝐄𝐋𝐋 𝐒𝐘𝐒𝐓𝐄𝐌 💠*
*╰━─━─━─≪✠≫─━─━─━╯*

*🔰┇الـتـوديع الـتـلـقـائـي*

*👤┇الـمـشـرف:* ⦓ *@${userJid.split('@')[0]}* ⦔

*📊┇الـحـالـة:* ⦓ *${status}* ⦔

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*📜┇الأوامـر الـمـتـوفـرة:*

*✅┇.توديع فتح* - *لـتـفـعـيـل الـنـظـام*

*❌┇.توديع غلق* - *لـتـعـطـيـل الـنـظـام*

*╰━─━─━─≪✠≫─━─━─━╯*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            return await bot.sendMessage(jid, {
                text: statusMsg,
                mentions: [userJid]
            }, { quoted: message });
        }

        // تفعيل التوديع
        if (subCommand === "فتح" || subCommand === "تشغيل") {
            if (settings[jid].enabled) {
                return reply("*⚠️┇الـتـوديع مـفـعـل بـالـفـعـل*");
            }

            settings[jid].enabled = true;

            fs.writeJsonSync(settingsPath, settings, { spaces: 2 });

            const enableMsg = `*╭━─━─━─≪✠≫─━─━─━╮*
*💠 𝐅𝐀𝐑𝐄𝐖𝐄𝐋𝐋 𝐒𝐘𝐒𝐓𝐄𝐌 💠*
*╰━─━─━─≪✠≫─━─━─━╯*

*✅┇تـم تـفـعـيـل الـنـظـام*

*👤┇الـمـشـرف:* ⦓ *@${userJid.split('@')[0]}* ⦔

*👋┇سـيـتـم تـوديع أي عـضـو يـخـرج مـن الـمـجـمـوعـة*

*╰━─━─━─≪✠≫─━─━─━╯*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await bot.sendMessage(jid, {
                text: enableMsg,
                mentions: [userJid]
            }, { quoted: message });

            await react("✅");
            return;
        }

        // تعطيل التوديع
        if (subCommand === "غلق" || subCommand === "تعطيل") {
            if (!settings[jid].enabled) {
                return reply("*⚠️┇الـتـوديع مـغـلق بـالـفـعـل*");
            }

            settings[jid].enabled = false;

            fs.writeJsonSync(settingsPath, settings, { spaces: 2 });

            const disableMsg = `*╭━─━─━─≪✠≫─━─━─━╮*
*💠 𝐅𝐀𝐑𝐄𝐖𝐄𝐋𝐋 𝐒𝐘𝐒𝐓𝐄𝐌 💠*
*╰━─━─━─≪✠≫─━─━─━╯*

*❌┇تـم تـعـطـيـل الـنـظـام*

*👤┇الـمـشـرف:* ⦓ *@${userJid.split('@')[0]}* ⦔

*🔇┇لـن يـتـم تـوديع الأعـضـاء الـمـغـادريـن*

*╰━─━─━─≪✠≫─━─━─━╯*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await bot.sendMessage(jid, {
                text: disableMsg,
                mentions: [userJid]
            }, { quoted: message });

            await react("✅");
            return;
        }

        // أمر غير معروف
        return reply("*📜┇الأوامـر الـمـتـوفـرة:*\n• .توديع حالة\n• .توديع فتح\n• .توديع غلق");
    }
};