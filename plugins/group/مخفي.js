// plugins/مخفي.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { configHelper } from '../../config.js';

const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

export default {
    name: "مخفي",
    aliases: ["منشن_مخفي"],
    description: "إرسال منشن لجميع أعضاء المجموعة برسالة مخفية أو ميديا",
    category: "إدارة",
    group: true,
    admin: true,

    async run({ sock, message, reply, text, args, isDeveloper, react }) {
        const chatId = message.key.remoteJid;

        // ✅ التحقق من الصلاحيات
        const metadata = await sock.groupMetadata(chatId);
        const sender = metadata.participants.find(p => p.id === message.key.participant);
        const isAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';

        if (!isAdmin && !isDeveloper) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*⛔ عـذراً..*

*───━━━⊱  🔒  ⊰━━━───*

*📌 هـذا الأمـر لـلـمـشـرفـيـن فـقـط*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("👻");

        try {
            // ✅ جلب قائمة المشاركين
            const participants = metadata.participants.map(p => p.id);
            
            if (!participants || participants.length === 0) {
                return reply(`*❌ لا تـوجـد أعـضـاء فـي الـمـجـمـوعـة*`);
            }

            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            // ✅ دالة تحميل الميديا
            const downloadMedia = async (mediaMsg, type) => {
                const stream = await downloadContentFromMessage(mediaMsg, type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                return buffer;
            };

            // ✅ تحديد النص المرسل
            let messageText = "";

            if (text) {
                messageText = text;
            } else if (quoted) {
                messageText = quoted.conversation || 
                              quoted.extendedTextMessage?.text || 
                              "";
            }

            if (!messageText.trim() && !quoted) {
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*👻 مـنـشـن جـمـاعـي مـخـفـي*

*───━━━⊱  📋  ⊰━━━───*

📌 *.مخفي رسالتك هنا* - *لإرسـال نـص*

📌 *رد على صورة/فيديو/ملصق/صوت واكتب .مخفي* - *لإرسـال مـيـديـا*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // ✅ إرسال النص أو الميديا
            if (quoted?.stickerMessage) {
                const buffer = await downloadMedia(quoted.stickerMessage, 'sticker');
                await sock.sendMessage(chatId, {
                    sticker: buffer,
                    mentions: participants,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                });
            } else if (quoted?.imageMessage) {
                const buffer = await downloadMedia(quoted.imageMessage, 'image');
                const caption = quoted.imageMessage.caption || messageText || "📸";
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: caption,
                    mentions: participants,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                });
            } else if (quoted?.videoMessage) {
                const buffer = await downloadMedia(quoted.videoMessage, 'video');
                const caption = quoted.videoMessage.caption || messageText || "🎬";
                await sock.sendMessage(chatId, {
                    video: buffer,
                    caption: caption,
                    mentions: participants,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                });
            } else if (quoted?.audioMessage) {
                const buffer = await downloadMedia(quoted.audioMessage, 'audio');
                await sock.sendMessage(chatId, {
                    audio: buffer,
                    mimetype: quoted.audioMessage.mimetype || 'audio/mpeg',
                    ptt: false,
                    mentions: participants,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                });
            } else {
                // ✅ إرسال نص مع منشن مخفي
                await sock.sendMessage(chatId, {
                    text: messageText,
                    mentions: participants,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                });
            }

            await react("✅");

        } catch (error) {
            console.error("❌ مخفي Error:", error);
            await react("❌");
            await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ حـدث خـطـأ*

*───━━━⊱  ⚠️  ⊰━━━───*

*📌 ${error.message}*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};