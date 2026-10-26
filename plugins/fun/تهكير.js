export default {
    name: "تهكير",
    aliases: ["اختراق", "hack", "اخترق"],
    description: "أمر مقلب - اختراق وهمي للترفيه",
    category: "fun",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, reply, react, userJid, args }) {
        const jid = message.key.remoteJid;
        
        // ✅ تحديد الهدف (منشن أو رد)
        const quoted = message.message?.extendedTextMessage?.contextInfo;
        let targetJid = quoted?.participant || quoted?.mentionedJid?.[0];

        if (!targetJid) {
            return reply(`*⚠️ مـنـشـن الـشـخـص أو رد عـلـى رسـالـتـه عـشـان تـهـكـره*`);
        }

        // منع تهكير الماستر
        const { configHelper } = await import('../config.js');
        if (configHelper.isMaster(targetJid)) {
            return reply(`*👑 لا يـمـكـن تـهـكـيـر الـمـاسـتـر*`);
        }

        // منع تهكير البوت نفسه
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (targetJid === botJid) {
            return reply(`*🤖 مـش هـتـقـدر تـهـكـر الـبـوت يـا عـبـيـط*`);
        }

        await react("👾");

        const targetName = targetJid.split('@')[0];
        
        // ✅ رسالة بدء الاختراق
        const msg1 = await sock.sendMessage(jid, {
            text: `*╭─━━━━━━━━━━━━━━━─╮*
      *🔓 𝐇𝐀𝐂𝐊𝐈𝐍𝐆 𝐓𝐎𝐎𝐋 𝐯3.7 🔓*
*╰─━━━━━━━━━━━━━━━─╯*

*🎯 الـهـدف: ⦓ @${targetName} ⦔*

*📡 جـارٍ اخـتـراق الـهـدف...*

*[░░░░░░░░░░] 0%*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,
            mentions: [userJid, targetJid]
        });

        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const stages = [
            { percent: 20, text: "🔓 *جاري كسر جدار الحماية...*" },
            { percent: 40, text: "🛜 *جاري اختراق قاعدة البيانات...*" },
            { percent: 60, text: "📡 *جاري تتبع الموقع الجغرافي...*" },
            { percent: 80, text: "💾 *جاري تنزيل الملفات والصور...*" },
            { percent: 100, text: "✅ *اكتمل الاختراق بنجاح!*" }
        ];

        let lastMsg = msg1;

        for (const stage of stages) {
            await wait(3000);
            
            const barLength = 10;
            const filled = Math.floor(stage.percent / 10);
            const empty = barLength - filled;
            const bar = "█".repeat(filled) + "░".repeat(empty);
            
            const updateText = `*╭─━━━━━━━━━━━━━━─╮*
      *🔓 𝐇𝐀𝐂𝐊𝐈𝐍𝐆 𝐓𝐎𝐎𝐋 𝐯3.7 🔓*
*╰─━━━━━━━━━━━━━━─╯*

*🎯 الـهـدف: ⦓ @${targetName} ⦔*

*📡 جـارٍ اخـتـراق الـهـدف...*

[${bar}] ${stage.percent}%

${stage.text}

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            lastMsg = await sock.sendMessage(jid, {
                text: updateText,
                edit: lastMsg.key,
                mentions: [userJid, targetJid]
            });
        }

        // ✅ رسالة اكتمال الاختراق (رد على آخر رسالة)
        await wait(3000);

        const randomImages = Math.floor(Math.random() * 5000) + 1000;
        const randomMessages = Math.floor(Math.random() * 20000) + 5000;
        const randomCalls = Math.floor(Math.random() * 1000) + 100;
        const randomPasswords = Math.floor(Math.random() * 50) + 5;
        const randomCards = Math.floor(Math.random() * 5) + 1;

        const completeMsg = await sock.sendMessage(jid, {
            text: `*╭─━━━━━━━━━━━━━━━━━─╮*
      *🔓 𝐇𝐀𝐂𝐊 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄 🔓*
*╰─━━━━━━━━━━━━━━━━━─╯*

*🎯 الـهـدف: ⦓ @${targetName} ⦔*

*<██████████> 100%*


✅ *تـم فـشـخ @${targetName} بـنـجـاح!*

*📊 الـمـلـخـص:*

├─ 📸 الـصـور: ${randomImages}
├─ 💬 الـرسـائـل: ${randomMessages}
├─ 📞 الـمـكـالـمـات: ${randomCalls}
├─ 🔑 كـلـمـات الـمـرور: ${randomPasswords}
└─ 📍 *الـمـوقـع: تـم تـحـديـده و إࢪسـالـه لـك فـي الـخـاص*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,
            mentions: [targetJid],
            quoted: lastMsg
        });

        // ✅ رسالة المقلب بعد 10 ثواني (رد على رسالة اكتمال الاختراق)
        await wait(12000);

        await sock.sendMessage(jid, {
            text: `*╭─━━━━━━━━━━━━━━━━━─╮*
      *⚠️ مـجـرد مـقـلـب! ⚠️*
*╰─━━━━━━━━━━━━━━━━━─╯*

*😂 متخافش يا ⦓ @${targetName} ⦔*

_ده كان أمر ترفيهي من سـولـو بوت_
_لم يحدث أي اختراق حقيقي_

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,
            mentions: [targetJid],
            quoted: completeMsg
        });

        await react("😂");
    }
};