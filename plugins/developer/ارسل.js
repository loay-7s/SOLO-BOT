// plugins/ارسل.js
// ⚔️ SOLO SEND MESSAGE COMMAND ⚔️

export default {
    name: "ارسل",
    aliases: ["send", "بعت", "msg"],
    description: "إرسال رسالة لأي رقم أو منشن (خاص)",
    category: "tools",
    developer: true,
    group: true,

    async run({ sock, message, args, reply, react, userJid, handler }) {
        const chatId = message.key.remoteJid;

        // ✅ التحقق من أن المستخدم مطور
        const isDev = handler?.isDeveloper ? handler.isDeveloper(userJid) : false;
        if (!isDev) {
            await react("🚫");
            return reply(`*❌ هـذا الأمـر لـلـمـطـوريـن فـقـط*`);
        }

        // ✅ استخراج النص الكامل
        const fullText = args.join(' ').trim();
        if (!fullText) {
            await react("📨");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 📨 إرسـال رسـالـة*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 اكتب الأمر بالشكل التالي:*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.ارسل @منشن الرسالة*
📌 *.ارسل 0123456789 الرسالة*
📌 *.ارسل +20123456789 الرسالة*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ✅ استخراج الـ JID أو الرقم والرسالة
        let targetJid = null;
        let messageText = '';

        // ✅ 1. التحقق من وجود منشن
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentionedJid && mentionedJid.length > 0) {
            targetJid = mentionedJid[0];
            // ✅ استخراج الرسالة (بعد إزالة المنشن)
            const mentionText = `@${targetJid.split('@')[0]}`;
            messageText = fullText.replace(mentionText, '').trim();
        }

        // ✅ 2. لو مفيش منشن، نحاول استخراج رقم
        if (!targetJid) {
            // ✅ البحث عن رقم في النص (يدعم + وبدون +)
            const phoneMatch = fullText.match(/(?:^|\s)(\+?\d{10,15})(?:\s|$)/);
            if (phoneMatch) {
                const phoneNumber = phoneMatch[1].replace(/[^0-9]/g, '');
                targetJid = `${phoneNumber}@s.whatsapp.net`;
                // ✅ استخراج الرسالة (بعد إزالة الرقم)
                messageText = fullText.replace(phoneMatch[1], '').trim();
            }
        }

        // ✅ 3. لو مفيش رقم ولا منشن
        if (!targetJid) {
            await react("❌");
            return reply(`*❌ لـم يـتـم الـعـثـور عـلـى رقـم أو مـنـشـن*\n📌 مثال: .ارسل @منشن السلام عليكم`);
        }

        // ✅ 4. لو مفيش رسالة
        if (!messageText) {
            await react("❌");
            return reply(`*❌ لـم تـكـتـب الـرسـالـة*\n📌 مثال: .ارسل @منشن السلام عليكم`);
        }

        await react("⏳");

        try {
            // ✅ إرسال الرسالة للهدف
            await sock.sendMessage(targetJid, {
                text: messageText,
                mentions: [userJid]
            });

            // ✅ إرسال تأكيد للمستخدم
            await react("✅");
            await reply(`*⎔┄┄─ ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
*┋ تـم إرسـال الـرسـالـة*

*┋ إلـى : ${targetJid.split('@')[0]}*
*┋ الـرسـالـة : ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

        } catch (error) {
            console.error("❌ Send Error:", error);
            await react("❌");
            
            let errorMsg = 'فشل إرسال الرسالة';
            if (error.message.includes('not-authorized')) {
                errorMsg = 'الرقم غير مصرح له أو غير موجود';
            } else if (error.message.includes('invalid')) {
                errorMsg = 'الرقم غير صحيح';
            }

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل إرسـال الـرسـالـة*
*┋ السـبب : ${errorMsg}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};