// plugins/بروفايل.js
// ⚔️ SOLO PROFILE COMMAND ⚔️

import axios from 'axios';

export default {
    name: "بروفايل",
    aliases: ["profile", "userinfo", "معلومات_العضو"],
    description: "عرض صورة العضو ودوره في الجروب",
    category: "tools",
    group: true,
    developer: false,

    async run({ sock, message, args, reply, react, userJid, handler }) {
        const chatId = message.key.remoteJid;
        const quoted = message.message?.extendedTextMessage?.contextInfo;

        let targetJid = null;

        // ✅ 1. لو كتب "انا" → ياخد المستخدم نفسه
        if (args[0]?.toLowerCase() === 'انا') {
            targetJid = message.key.participant || message.key.remoteJid;
        }

        // ✅ 2. التحقق من المنشن
        if (!targetJid && quoted?.mentionedJid && quoted.mentionedJid.length > 0) {
            targetJid = quoted.mentionedJid[0];
        }

        // ✅ 3. التحقق من الرد على رسالة
        if (!targetJid && quoted?.participant) {
            targetJid = quoted.participant;
        }

        // ✅ 4. التحقق من رقم مكتوب
        if (!targetJid && args.length > 0) {
            const phoneMatch = args[0].match(/(\+?\d{10,15})/);
            if (phoneMatch) {
                let phoneNumber = phoneMatch[0];
                if (!phoneNumber.startsWith('+')) {
                    phoneNumber = '+' + phoneNumber;
                }
                const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
                targetJid = `${cleanNumber}@s.whatsapp.net`;
            }
        }

        // ✅ 5. لو مفيش حاجة → استمارة شرح
        if (!targetJid) {
            await react("👤");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│   👤 أفـاتـاࢪ الـعـضـو*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 استخدم الأمر بالشكل التالي:*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.بروفايل انا* - عرض صورتك
📌 *.بروفايل @منشن* - عرض صورة الشخص
📌 رد على رسالة شخص بـ *.بروفايل*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ✅ لو في مجموعة، تأكد إن العضو موجود
        if (chatId.endsWith('@g.us')) {
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                const participant = groupMetadata.participants.find(p => p.id === targetJid);
                if (!participant) {
                    await react("❌");
                    return reply(`*❌ هـذا الـعـضـو غـيـر مـوجـود فـي الـمـجـمـوعـة*`);
                }
            } catch (error) {
                console.error('❌ فشل جلب بيانات المجموعة:', error);
            }
        }

        await react("👤");

        try {
            // ✅ جلب صورة البروفايل
            let profilePic = null;
            let hasImage = true;

            try {
                profilePic = await sock.profilePictureUrl(targetJid, 'image');
                if (!profilePic) {
                    hasImage = false;
                }
            } catch (error) {
                hasImage = false;
            }

            // ✅ جلب اسم المستخدم (بسيط)
            let userName = targetJid.split('@')[0];
            try {
                await sock.presenceSubscribe(targetJid).catch(() => {});
                await new Promise(r => setTimeout(r, 500));
                const contact = sock.contacts[targetJid];
                if (contact) {
                    userName = contact.name || contact.notify || contact.verifiedName || targetJid.split('@')[0];
                }
            } catch (e) {}

            // ✅ الدور في المجموعة
            let groupRole = 'عضو 👥';
            if (chatId.endsWith('@g.us')) {
                try {
                    const groupMetadata = await sock.groupMetadata(chatId);
                    const participant = groupMetadata.participants.find(p => p.id === targetJid);
                    if (participant) {
                        if (participant.admin === 'superadmin') {
                            groupRole = 'مؤسس 👑';
                        } else if (participant.admin === 'admin') {
                            groupRole = 'مشرف 🛡️';
                        }
                    }
                } catch (e) {}
            }

            // ✅ لو البوت
            const botJid = sock.user?.id;
            if (targetJid === botJid) {
                groupRole = '🤖 بوت';
            }

            // ✅ التحقق من المطور
            const isDev = handler?.isDeveloper ? handler.isDeveloper(targetJid) : false;
            if (isDev) {
                groupRole = '👑 مطور';
            }

            // ✅ بناء الرسالة (بسيطة)
            const caption = `*⎔┄┄─── ⊱╎⌯ 👤 ⌯╎⊰ ───┄┄⎔*

     *🏮┇ أفـاتـاࢪ الـعـضـو ┇🏮*

*⎔┄┄─── ⊱╎⌯ 📋 ⌯╎⊰ ───┄┄⎔*

*┋ الـدور : ⦓ ${groupRole} ⦔*

*┋ الصـورة : ⦓ ${hasImage ? '✅ مـتـوفـرة' : '❌ غـيـر مـتـوفـرة'} ⦔*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            // ✅ إرسال الصورة مع الكابشن
            if (hasImage && profilePic) {
                try {
                    const imgResponse = await axios.get(profilePic, {
                        responseType: 'arraybuffer',
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                    const imageBuffer = Buffer.from(imgResponse.data);

                    await sock.sendMessage(chatId, {
                        image: imageBuffer,
                        caption: caption,
                        mentions: [targetJid]
                    }, { quoted: message });
                } catch (imageError) {
                    await sock.sendMessage(chatId, {
                        text: caption,
                        mentions: [targetJid]
                    }, { quoted: message });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: caption,
                    mentions: [targetJid]
                }, { quoted: message });
            }

            await react("✅");

        } catch (error) {
            console.error("❌ Profile Error:", error);
            await react("❌");
            await reply(`*❌ فـشـل جـلـب مـعـلـومـات الـعـضـو*\n📌 ${error.message || 'حـاول مـرة اخـرى'}`);
        }
    }
};