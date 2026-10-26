import * as baileys from '@whiskeysockets/baileys';

const pendingLiveImages = new Map();

function getUserKey(m) {
    return `${m.key.remoteJid}:${m.key.participant || m.key.remoteJid}`;
}

function unwrapMessage(message) {
    if (!message) return null;

    if (message.ephemeralMessage?.message) {
        return unwrapMessage(message.ephemeralMessage.message);
    }

    if (message.viewOnceMessage?.message) {
        return unwrapMessage(message.viewOnceMessage.message);
    }

    if (message.viewOnceMessageV2?.message) {
        return unwrapMessage(message.viewOnceMessageV2.message);
    }

    if (message.viewOnceMessageV2Extension?.message) {
        return unwrapMessage(message.viewOnceMessageV2Extension.message);
    }

    return message;
}

function getQuotedMessage(m) {
    const context =
        m.message?.extendedTextMessage?.contextInfo ||
        m.message?.imageMessage?.contextInfo ||
        m.message?.videoMessage?.contextInfo;

    if (!context?.quotedMessage) return null;

    return unwrapMessage(context.quotedMessage);
}

async function downloadMedia(media, type) {
    const stream = await baileys.downloadContentFromMessage(
        media,
        type
    );

    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

export default {
    name: "صورة_حية",

    aliases: [
        "صوره_حية",
        "حية","حيه","صوره_حيه"
    ],

    category: "media",

    async run({ sock, m, reply }) {
        const chatId = m.key.remoteJid;
        const userKey = getUserKey(m);

        try {
            const quoted = getQuotedMessage(m);

            // ========================================================
            // 🎬 المرحلة الثانية
            // Reply على الفيديو + .حية
            // ========================================================

            if (pendingLiveImages.has(userKey)) {

                if (!quoted?.videoMessage) {
                    return reply(
                        `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ صــورة حــيــة ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ❌ يـجـب الـرد عـلـى الـفـيـديـو┋*

*┋ 🎬 اعـمـل Reply عـلـى الـفـيـديـو┋*
*┋ ⬡ ثـم اكـتـب [ .حـيـة ]┋*

*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                    );
                }

                const session =
                    pendingLiveImages.get(userKey);

                await reply(
                    `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ صــورة حــيــة ┇🏮*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*┋ 🖼️ الـصـورة : ✅┋*
*┋ 🎬 الـفـيـديـو : ✅┋*

*┋ ⏳ جـاري تـجـهـيـز الـصـورة الـحـيـة...┋*

*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                );

                // ====================================================
                // 🎬 تحميل الفيديو
                // ====================================================

                const videoBuffer =
                    await downloadMedia(
                        quoted.videoMessage,
                        "video"
                    );

                if (!videoBuffer.length) {
                    throw new Error(
                        "فشل تحميل الفيديو"
                    );
                }

                // ====================================================
                // 🎬 تجهيز الفيديو
                // ====================================================

                const video =
                    await baileys.prepareWAMessageMedia(
                        {
                            video: videoBuffer,

                            mimetype:
                                quoted.videoMessage.mimetype ||
                                "video/mp4"
                        },
                        {
                            upload:
                                sock.waUploadToServer
                        }
                    );

                // ====================================================
                // 🖼️ الصورة تم تجهيزها مسبقًا كـBuffer
                // ====================================================

                const image =
                    await baileys.prepareWAMessageMedia(
                        {
                            image: session.imageBuffer,

                            mimetype:
                                session.imageMimetype ||
                                "image/jpeg"
                        },
                        {
                            upload:
                                sock.waUploadToServer
                        }
                    );

                // ====================================================
                // 🖼️ Parent
                // نفس بنية البوت الأصلي
                // ====================================================

                const msg =
                    baileys.generateWAMessageFromContent(
                        chatId,
                        {
                            imageMessage: {
                                ...image.imageMessage,

                                contextInfo: {
                                    pairedMediaType: 5,
                                    statusSourceType: 0
                                }
                            }
                        },
                        {}
                    );

                // ====================================================
                // 🖼️ إرسال الصورة
                // ====================================================

                await sock.relayMessage(
                    chatId,
                    msg.message,
                    {
                        messageId:
                            msg.key.id
                    }
                );

                // ====================================================
                // 🎬 إرسال الفيديو
                // نفس كود البوت الأصلي حرفيًا
                // ====================================================

                await sock.relayMessage(
                    chatId,
                    {
                        videoMessage: {
                            ...video.videoMessage,

                            contextInfo: {
                                pairedMediaType: 6,
                                statusSourceType: 0
                            }
                        },

                        messageContextInfo: {
                            messageAssociation: {
                                associationType: 12,
                                parentMessageKey:
                                    msg.key
                            }
                        }
                    },
                    {}
                );

                pendingLiveImages.delete(
                    userKey
                );

                return;
            }

            // ========================================================
            // 🖼️ المرحلة الأولى
            // Reply على الصورة + .حية
            // ========================================================

            if (!quoted?.imageMessage) {
                return reply(
                    `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ صــورة حــيــة ┇🏮*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*┋ 📌 طـريـقـة الاسـتـخـدام┋*

*┋ ⬡ اعـمـل Reply عـلـى صـورة┋*
*┋ ⬡ اكـتـب [ .حـيـة ]┋*

*┋ 🎬 بـعـدهـا اعـمـل Reply عـلـى الـفـيـديـو┋*
*┋ ⬡ اكـتـب [ .حـيـة ] مـرة أخـرى┋*

*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                );
            }

            // ========================================================
            // 🖼️ تحميل الصورة فورًا
            // ========================================================

            const imageBuffer =
                await downloadMedia(
                    quoted.imageMessage,
                    "image"
                );

            if (!imageBuffer.length) {
                throw new Error(
                    "فشل تحميل الصورة"
                );
            }

            // ========================================================
            // 💾 حفظ الـBuffer وليس imageMessage الخام
            // ========================================================

            pendingLiveImages.set(
                userKey,
                {
                    imageBuffer,

                    imageMimetype:
                        quoted.imageMessage.mimetype ||
                        "image/jpeg",

                    createdAt:
                        Date.now()
                }
            );

            // ========================================================
            // 🎬 طلب الفيديو
            // ========================================================

            return reply(
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ صــورة حــيــة ┇🏮*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*┋ 🖼️ تـم اسـتـلام الـصـورة ┋✅*

*┋ 🎬 الآن قـم بـالـرد عـلـى الـفـيـديـو واكـتـب :┋*
*┋ ⬡ [ .حـيـة ]┋*

*┋ ⏳ فـي انـتـظـار الـفـيـديـو...┋*

*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );

        } catch (error) {

            console.error(
                "صورة حية Error:",
                error
            );

            pendingLiveImages.delete(
                userKey
            );

            return reply(
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *❌┇ صـورة حــيــة ┇❌*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ❌ حـدث خـطـأ أثـنـاء تـجـهـيـز الـمـلـفـات┋*

*┋ 🔧 الـخـطـأ :*
*┋ ${error.message}*

*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }
    }
};