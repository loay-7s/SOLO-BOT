// plugins/فيسبوك.js
// ⚔️ SOLO FACEBOOK DOWNLOADER ⚔️

import axios from 'axios';
import { generateWAMessageFromContent, proto, prepareWAMessageMedia } from '@whiskeysockets/baileys';

const API_BASE = 'https://engez.a7a.online/api/v1';

// ✅ دالة البحث في فيسبوك
async function searchFacebook(query) {
    try {
        const params = new URLSearchParams({ q: query });
        const response = await axios.get(`${API_BASE}/search/facebook?${params.toString()}`, {
            timeout: 30000
        });
        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل البحث');
        }
        return response.data.results || [];
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

// ✅ دالة تحميل من فيسبوك
async function downloadFacebook(url) {
    try {
        const params = new URLSearchParams({ url });
        const response = await axios.get(`${API_BASE}/download/facebook?${params.toString()}`, {
            timeout: 60000
        });
        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل التحميل');
        }
        return response.data.response;
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

// ✅ دالة تنسيق الأرقام
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ✅ دالة إنشاء فيديو للكاروسيل
async function createVideo(url, sock) {
    try {
        const _media_ = await prepareWAMessageMedia({
            video: { url: url }
        }, {
            upload: sock.waUploadToServer
        });
        return _media_.videoMessage;
    } catch (e) {
        console.error('❌ فشل تحميل فيديو:', e.message);
        return null;
    }
}

// ✅ دالة إنشاء صورة للكاروسيل (احتياطي)
const DEFAULT_IMAGE = 'https://i.postimg.cc/w1Ln04gV/upload-1775306108949.jpg';

async function createImage(url, sock) {
    try {
        const _media_ = await prepareWAMessageMedia({
            image: { url: url || DEFAULT_IMAGE }
        }, {
            upload: sock.waUploadToServer
        });
        return _media_.imageMessage;
    } catch (e) {
        const _media_ = await prepareWAMessageMedia({
            image: { url: DEFAULT_IMAGE }
        }, {
            upload: sock.waUploadToServer
        });
        return _media_.imageMessage;
    }
}

export default {
    name: "فيسبوك",
    aliases: ["facebook", "fb", "فيس"],
    description: "تحميل فيديوهات من فيسبوك (يدعم البحث والروابط)",
    category: "تحميل",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        let text = args.join(" ");

        // ✅ جلب الرابط من الرد
        if (!text && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage;
            text = quoted.conversation || quoted.extendedTextMessage?.text || "";
        }

        if (!text) {
            await react("📘");
            return reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 📘 تـحـمـيـل مـن فـيـسـبـوك 📘*
*╰─━━━━━━━━━━━━━━━━━━─╯*

*📝 أرسل رابط الفيديو أو كلمة للبحث*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.فيسبوك https://fb.watch/xxxxx* (تحميل)
📌 *.فيسبوك anime edit* (بحث)
📌 رد على الرابط واكتب *.فيسبوك*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("⏳");

        try {
            const isUrl = text.includes('facebook.com') || text.includes('fb.watch') || text.includes('fb.com');

            if (isUrl) {
                // ===== معالجة الرابط =====
                await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري تـحـمـيـل الـفـيـديـو...*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

                const data = await downloadFacebook(text);

                if (!data) {
                    throw new Error('لم يتم العثور على فيديو');
                }

                // ✅ اختيار أفضل جودة
                const videoUrl = data.hd || data.sd;
                if (videoUrl) {
                    const caption = `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*
*┋ تـم الـتـحـمـيـل مـن فـيـسـبـوك*
*┋ ${data.title?.substring(0, 60) || 'فيديو فيسبوك'}*
*┋ الـجـودة: ${data.hd ? 'HD ✅' : 'SD'}*
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                    await sock.sendMessage(chatId, {
                        video: { url: videoUrl },
                        caption: caption
                    }, { quoted: message });

                    await react("✅");
                } else {
                    throw new Error('لا يوجد رابط فيديو');
                }

            } else {
                // ===== معالجة البحث =====
                await reply(`*⎔┄┄─ ⊱╎⌯ 🔍 ⌯╎⊰─┄┄⎔*
*┋ جـاري الـبـحـث عـن: ${text}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

                const results = await searchFacebook(text);

                if (results.length === 0) {
                    throw new Error('لا توجد نتائج');
                }

                // ✅ أخذ أول 3 نتائج فقط
                const topResults = results.slice(0, 3);

                // ✅ بناء كاروسيل الفيديوهات
                let cards = [];
                let count = 1;

                for (const video of topResults) {
                    try {
                        const downloadData = await downloadFacebook(video.reelUrl);
                        const videoUrl = downloadData?.hd || downloadData?.sd;

                        if (!videoUrl) continue;

                        const videoMessage = await createVideo(videoUrl, sock);
                        if (!videoMessage) continue;

                        const card = {
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text:
                                    `🎬 *فيديو ${count++}*\n` +
                                    `👤 ${video.creator || 'مجهول'}\n` +
                                    `👁️ ${formatNumber(video.views)} مشاهدة\n` +
                                    `🔗 ${video.reelUrl}`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                text: '🎬 فيسبوك داونلودر'
                            }),
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title: `🎬 فيديو ${count - 1}`,
                                hasMediaAttachment: true,
                                videoMessage: videoMessage
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: [
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📺 فتح على فيسبوك",
                                            url: video.reelUrl
                                        })
                                    }
                                ]
                            })
                        };
                        cards.push(card);
                    } catch (e) {
                        console.error('❌ خطأ في بناء كارد الفيديو:', e.message);
                    }
                }

                if (cards.length === 0) {
                    throw new Error('فشل في تحميل الفيديوهات');
                }

                // ✅ إرسال الكاروسيل
                const finalMessage = generateWAMessageFromContent(chatId, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: {
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: `🔍 *نتائج البحث عن:* ${text}\n📊 *عدد النتائج:* ${results.length}\n📥 عرض أول ${cards.length} فيديو`
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: '🎬 فيسبوك داونلودر'
                                }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false
                                }),
                                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards
                                })
                            }
                        }
                    }
                }, {});

                await sock.relayMessage(chatId, finalMessage.message, { messageId: finalMessage.key.id });
                await react("✅");
            }

        } catch (error) {
            console.error("❌ Facebook Error:", error.message);
            await react("❌");

            await reply(`*╭─━━━━━━━━━━━━━━━━━━━─╮*
*│ ❌ فـشـل الـتـحـمـيـل ❌*
*╰─━━━━━━━━━━━━━━━━━━━─╯*

⚠️ *${error.message || 'الخادم مشغول حالياً'}*
📝 *تأكد من الرابط وحاول مرة أخرى*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};