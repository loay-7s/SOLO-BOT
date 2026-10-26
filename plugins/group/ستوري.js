// plugins/ستوري.js
// ⚔️ SOLO STATUS STORY SYSTEM ⚔️

import { prepareWAMessageMedia, generateWAMessageFromContent, proto, downloadContentFromMessage } from '@whiskeysockets/baileys';

const COLORS = [
    0xFFF44336, 0xFFE91E63, 0xFF9C27B0, 0xFF673AB7, 0xFF3F51B5,
    0xFF2196F3, 0xFF03A9F4, 0xFF00BCD4, 0xFF009688, 0xFF4CAF50,
    0xFF8BC34A, 0xFFCDDC39, 0xFFFFEB3B, 0xFFFFC107, 0xFFFF9800, 0xFFFF5722
];

// ✅ دالة تحميل الميديا
async function downloadMedia(message, type) {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (error) {
        console.error('❌ فشل تحميل الميديا:', error);
        return null;
    }
}

export default {
    name: "ستوري",
    aliases: ["status", "story", "استوري"],
    description: "نشر حالة (ستوري) في المجموعة (للمشرفين فقط)",
    category: "tools",
    group: true,          // ✅ يعمل في المجموعات فقط
    developer: false,
    admin: false,

    async run({ sock, message, args, reply, react, userJid, isDeveloper }) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ').trim();
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // ============================================================
        // ✅ التحقق من صلاحيات المستخدم (مشرف أو مطور)
        // ============================================================
        const metadata = await sock.groupMetadata(chatId);
        const sender = metadata.participants.find(p => p.id === userJid);
        const isAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';

        if (!isAdmin && !isDeveloper) {
            await react("🚫");
            return reply(`*❌ هـذا الأمـر لـلـمـشـرفـيـن فـقـط.*`);
        }

        // ✅ التحقق من الميديا المرفقة
        let isImage = false;
        let isVideo = false;
        let isAudio = false;
        let isVoice = false;
        let mediaType = null;
        let mediaMessage = null;

        if (quoted) {
            if (quoted.imageMessage) {
                isImage = true;
                mediaType = 'image';
                mediaMessage = quoted.imageMessage;
            } else if (quoted.videoMessage) {
                isVideo = true;
                mediaType = 'video';
                mediaMessage = quoted.videoMessage;
            } else if (quoted.audioMessage) {
                isAudio = true;
                isVoice = quoted.audioMessage?.ptt || false;
                mediaType = 'audio';
                mediaMessage = quoted.audioMessage;
            }
        }

        // ✅ إعدادات الجمهور
        let audienceType = 1;
        let listEmoji = '🏮';
        let listName = '𝑺𝑶𝑳𝑶';
        let postText = '';
        let colorIndex = -1;
        let remainingText = text || '';

        if (remainingText) {
            let parts = remainingText.split(' ');
            let firstWord = parts[0]?.toLowerCase();

            if (firstWord === 'عام') {
                audienceType = 0;
                listEmoji = '';
                listName = '';
                remainingText = parts.slice(1).join(' ');
            } else if (firstWord === 'خاص' || firstWord === 'اقارب' || firstWord === 'اصدقاء') {
                audienceType = 2;
                listEmoji = '⭐';
                listName = 'الأقارب';
                remainingText = parts.slice(1).join(' ');
            } else if (firstWord === 'قائمة' && parts.length >= 3) {
                audienceType = 1;
                listEmoji = parts[1];
                listName = parts[2];
                remainingText = parts.slice(3).join(' ');
            }

            if (remainingText) {
                let colorParts = remainingText.split(' ');
                let potentialColor = parseInt(colorParts[0]);
                if (!isNaN(potentialColor) && potentialColor >= 0 && potentialColor <= 15) {
                    colorIndex = potentialColor;
                    remainingText = colorParts.slice(1).join(' ');
                }
            }

            postText = remainingText;
        }

        const finalColor = (colorIndex >= 0 && colorIndex < COLORS.length)
            ? COLORS[colorIndex]
            : COLORS[Math.floor(Math.random() * COLORS.length)];

        // ✅ لو مفيش نص ولا ميديا
        if (!postText && !isImage && !isVideo && !isAudio && !isVoice) {
            await react("📱");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│  📱 نـشـر سـتـوري جـروب*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 اكتب النص أو ارفع ميديا*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

👥 *أنـواع الـجـمـهـور:*
• عام - للجميع
• خاص ⭐ - للأقارب
• قائمة <ايموجي> <اسم> - تخصيص

🎨 *الألـوان (0-15):*
0-أحمر | 1-وردي | 2-بنفسجي | 3-نيلي
4-أزرق | 5-سماوي | 6-تركواز | 7-فيروزي
8-أخضر | 9-ليموني | 10-أصفر | 11-ذهبي
12-برتقالي | 13-مرجاني | 14-ناري | 15-ياقوتي

✏️ *أمـثلـة:*

• *.ستوري عام 5 مرحبا*
• *.ستوري قائمة 🏮 سـولـو 12*
• *رد على صورة/فيديو + .ستوري*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("⏳");

        try {
            // ✅ حالة بالميديا (صورة/فيديو/صوت)
            if (isImage || isVideo || isAudio || isVoice) {
                let mediaBuffer = null;
                
                try {
                    mediaBuffer = await downloadMedia(mediaMessage, mediaType);
                } catch (downloadError) {
                    console.error('❌ فشل تحميل الميديا:', downloadError);
                    await react("❌");
                    return reply(`*❌ فـشـل تـحـمـيـل الـمـيـديـا*\n📌 حاول مرة أخرى`);
                }

                if (!mediaBuffer) {
                    await react("❌");
                    return reply(`*❌ فـشـل تـحـمـيـل الـمـيـديـا*`);
                }

                let mediaOptions = { [mediaType]: mediaBuffer };
                if (isVoice) mediaOptions = { audio: mediaBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: false };

                let prepared = await prepareWAMessageMedia(mediaOptions, { upload: sock.waUploadToServer });
                let messageKey = isImage ? 'imageMessage' : isVideo ? 'videoMessage' : 'audioMessage';

                const contentMsg = {
                    [messageKey]: {
                        ...prepared[messageKey],
                        caption: postText || '',
                        contextInfo: {
                            isGroupStatus: true,
                            pairedMediaType: 'NOT_PAIRED_MEDIA',
                            statusAudienceMetadata: {
                                audienceType: audienceType,
                                ...(listEmoji && { listEmoji }),
                                ...(listName && { listName })
                            }
                        }
                    }
                };

                const webMsg = proto.Message.fromObject(contentMsg);
                const waMsg = generateWAMessageFromContent(chatId, webMsg, { userJid: sock.user.jid, quoted: message });
                await sock.relayMessage(chatId, waMsg.message, { messageId: waMsg.key.id });
                
                await react("✅");
                return;
            }

            // ✅ حالة نصية
            const groupMetadata = await sock.groupMetadata(chatId);
            const statusJidList = groupMetadata.participants.map(p => p.id);

            await sock.relayMessage(chatId, {
                statusJidList,
                messageContextInfo: {
                    messageSecret: Buffer.from(Array(32).fill(0).map(() => Math.floor(Math.random() * 256)))
                },
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text: `𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮\n\n${postText}`,
                            thumbnailUrl: 'https://i.imgur.com/8TnZ4Rv.png',
                            textArgb: 4294967040,
                            backgroundArgb: finalColor,
                            font: 5,
                            previewType: 0,
                            contextInfo: {
                                statusAttributions: [{ type: 10 }],
                                featureEligibilities: { canBeReshared: true, canReceiveMultiReact: true },
                                statusSourceType: 4,
                                statusAudienceMetadata: {
                                    audienceType: audienceType,
                                    ...(listEmoji && { listEmoji }),
                                    ...(listName && { listName })
                                }
                            },
                            inviteLinkGroupTypeV2: 0
                        }
                    }
                }
            }, {});

            await react("✅");

        } catch (error) {
            console.error("❌ Status Error:", error);
            await react("❌");
            await reply(`*❌ فـشـل نـشـر الـسـتـوري*\n📌 ${error.message || 'حـاول مـرة اخـرى'}`);
        }
    }
};