// plugins/خش.js
import { configHelper } from '../../config.js';

export default {
    name: "خش",
    aliases: ["انضم", "join"],
    description: "الدخول إلى مجموعة عبر رابط أو طلب انضمام",
    category: "admin",
    group: true, // يعمل في الخاص
    developer: true,

    async run({ sock, message, reply, react, args, userJid }) {
        const chatId = message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        // التحقق من أن المستخدم مطور
        if (!configHelper.isDeveloper(userJid)) {
            return reply("*❌ هـذا الأمـر لـلـمـطـوࢪ فـقـط*");
        }

        // جلب الرابط من الرد أو من args
        let link = '';

        // 1. التحقق من الرد على رسالة
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted) {
            link = quoted.conversation || quoted.extendedTextMessage?.text || '';
        }

        // 2. لو مفيش رد، جيب من args
        if (!link && args.length > 0) {
            link = args.join(' ');
        }

        // 3. لو مفيش حاجة
        if (!link) {
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 🔗 الـدخـول إلـى مـجـمـوعـة*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 أرسل رابط المجموعة أو رد على رسالة فيها الرابط*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.خش https://chat.whatsapp.com/xxxxx*
📌 رد على رسالة فيها الرابط واكتب *.خش*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // استخراج الرابط من النص
        const urlMatch = link.match(/(https?:\/\/[^\s]+)/);
        if (!urlMatch) {
            return reply("*❌ لـم يـتـم الـعـثـور عـلـى رابـط صـحـيـح!*");
        }

        const groupLink = urlMatch[0];

        // التأكد أن الرابط هو رابط واتساب
        if (!groupLink.includes('chat.whatsapp.com')) {
            return reply("*❌ هـذا لـيـس رابـط مـجـمـوعـة واتـسـاب صـالـح*\n📌 تأكد من الرابط");
        }

        await react("⏳");

        try {
            // ✅ محاولة الدخول إلى المجموعة
            const inviteMatch = groupLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);

if (!inviteMatch) {
    return reply("*❌ رابـط المـجـمـوعـة غـيـر صـالـح*");
}

const inviteCode = inviteMatch[1];

const result = await sock.groupAcceptInvite(inviteCode);
            if (result) {
                await react("✅");
                
                const successMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*✅ تـم الـدخـول إلـى الـمـجـمـوعـة*

*───━━━⊱  🔗  ⊰━━━───*

*🔗 الرابط:*
*⦓ ${groupLink} ⦔*

*🆔 المعرف:*
${result}

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

                return reply(successMsg);
            }

        } catch (error) {
            console.error("❌ Join Group Error:", error);

            // ✅ محاولة طلب انضمام (request to join)
            if (error.message?.includes('request')) {
                try {
                    // محاولة إرسال طلب انضمام
                    const requestResult = await sock.groupRequestJoin(groupLink);
                    
                    if (requestResult) {
                        await react("📨");
                        return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*📨 تـم إرسـال طـلـب الانـضـمـام*

*───━━━⊱  🔗  ⊰━━━───*

*🔗 الرابط:* 
*⦓ ${groupLink} ⦔*

*⏳ فـي انـتـظـار مـوافـقـة الـمـشـرف*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`);
                    }
                } catch (requestError) {
                    console.error("❌ Request Join Error:", requestError);
                }
            }

            // تحليل الأخطاء
            let errorMsg = "*❌ فـشـل الـدخـول إلـى الـمـجـمـوعـة*";

            if (error.message?.includes('expired')) {
                errorMsg = "*❌ الـرابـط مـنـتـهـي الصـلاحـيـة*";
            } else if (error.message?.includes('full')) {
                errorMsg = "*❌ الـمـجـمـوعـة مـمـتـلـئـة*";
            } else if (error.message?.includes('not found')) {
                errorMsg = "*❌ الـرابـط غـيـر صـالـح*";
            } else if (error.message?.includes('already')) {
                errorMsg = "*✅ الـبـوت بـالـفـعـل فـي الـمـجـمـوعـة*";
            }

            await react("❌");
            return reply(`${errorMsg}\n\n📌 تأكد من الرابط وحاول مرة أخرى`);
        }
    }
};