import axios from "axios";
import FormData from "form-data";
import { fileTypeFromBuffer } from "file-type";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

const API_BASE = "https://engez.a7a.online/api/v1";

async function uploadToUguu(buffer, ext) {
    const form = new FormData();

    form.append("files[]", buffer, {
        filename: `file.${ext}`,
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`
    });

    try {
        const response = await axios.post(
            "https://uguu.se/upload.php",
            form,
            {
                headers: { ...form.getHeaders() },
                timeout: 30000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const url = response.data?.files?.[0]?.url;
        if (!url) throw new Error("فشل في رفع الصورة");
        return url;
    } catch (error) {
        throw new Error(`فشل رفع الصورة: ${error.message}`);
    }
}

async function searchPinterestLens(imageUrl) {
    try {
        const params = new URLSearchParams();
        params.append("imageUrl", imageUrl);

        const response = await axios.get(
            `${API_BASE}/tools/pinlens?${params.toString()}`,
            { timeout: 60000 }
        );

        if (!response.data?.success) {
            throw new Error(response.data?.error || "فشل البحث في Pinterest Lens");
        }

        return response.data.results || [];
    } catch (error) {
        throw new Error(error.message || "فشل الاتصال بخدمة Pinterest Lens");
    }
}

function getQuotedMessage(m) {
    if (m?.quoted?.message) return m.quoted;

    const contextInfo =
        m?.message?.extendedTextMessage?.contextInfo ||
        m?.message?.imageMessage?.contextInfo ||
        m?.message?.videoMessage?.contextInfo ||
        m?.message?.documentMessage?.contextInfo ||
        m?.message?.stickerMessage?.contextInfo;

    if (!contextInfo?.quotedMessage) return null;

    return {
        key: {
            remoteJid: m.key.remoteJid,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant
        },
        message: contextInfo.quotedMessage
    };
}

function unwrapMessage(message) {
    if (!message) return null;

    if (message.ephemeralMessage) return unwrapMessage(message.ephemeralMessage.message);
    if (message.viewOnceMessage) return unwrapMessage(message.viewOnceMessage.message);
    if (message.viewOnceMessageV2) return unwrapMessage(message.viewOnceMessageV2.message);
    if (message.viewOnceMessageV2Extension) return unwrapMessage(message.viewOnceMessageV2Extension.message);

    return message;
}

function getImageMessage(quoted) {
    const message = unwrapMessage(quoted?.message);
    if (message?.imageMessage) return message.imageMessage;
    return null;
}

async function downloadImage(quoted) {
    const imageMessage = getImageMessage(quoted);
    if (!imageMessage) throw new Error("الرسالة المقتبس منها ليست صورة");

    const stream = await downloadContentFromMessage(imageMessage, "image");
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

async function downloadImageFromUrl(url) {
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error("[عدسة] Download error:", error?.message || error);
        return null;
    }
}

export default {
    name: "عدسة",
    aliases: ["عدسه", "العدسة", "العدسه"],
    category: "media",
    description: "البحث عن الصور المشابهة باستخدام Pinterest Lens",

    async run({ sock, m, reply }) {
        const chatId = m.key.remoteJid;

        try {
            const quoted = getQuotedMessage(m);
            const imageMessage = getImageMessage(quoted);

            if (!quoted || !imageMessage) {
                return reply(`*⎔┄┄─── ⊱╎⌯ 🔍 ⌯╎⊰───┄┄⎔*

                   *┋  الـعـدسـة ┋*

*⎔┄┄─── ⊱╎⌯ 📸 ⌯╎⊰ ───┄┄⎔*

*┋ ❌ يـࢪجـى عـمـل Reply*
*┋ عـلـى صـورة لـلـبـحـث عـن صـوࢪ مـشـابـهـة لـهـا.*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*📌 مـثـال:*

*┋ اعـمـل Reply عـلـى صـورة*
*┋ و اكـتـب: .عـدسـة*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            await sock.sendMessage(chatId, {
                react: { text: "⏳", key: m.key }
            });

            const buffer = await downloadImage(quoted);

            if (!buffer || buffer.length === 0) {
                throw new Error("فشل تحميل الصورة");
            }

            await sock.sendMessage(chatId, {
                react: { text: "📤", key: m.key }
            });

            const fileInfo = await fileTypeFromBuffer(buffer);
            const ext = fileInfo?.ext || "jpg";

            const imageUrl = await uploadToUguu(buffer, ext);

            if (!imageUrl) throw new Error("فشل رفع الصورة");

            await sock.sendMessage(chatId, {
                react: { text: "🔍", key: m.key }
            });

            const results = await searchPinterestLens(imageUrl);

            if (!results || results.length === 0) {
                await sock.sendMessage(chatId, {
                    react: { text: "❌", key: m.key }
                });

                return reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*

*┋ لـم يـتـم الـعـثـوࢪ عـلـى نـتـائـج*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // ═══════════════════════════════════════════════
            // ✅ رسالة "تم العثور وجاري الإرسال" (زي ما هي)
            // ═══════════════════════════════════════════════
            await sock.sendMessage(chatId, {
                text: `*⎔┄┄─── ⊱╎⌯ 🔍 ⌯╎⊰───┄┄⎔*

                  *┋ الـعـدسـة ┋*

*⎔┄┄─── ⊱╎⌯ 📸 ⌯╎⊰ ───┄┄⎔*

*┋ تـم الـعـثـوࢪ عـلـى :*

*┋ ⦓ ${Math.min(results.length, 10)} صـوࢪة مـشـابـهـة ⦔*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*👇 جـاري إرسـال الـصـوࢪ...*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            }, { quoted: m });

            // ═══════════════════════════════════════════════
            // ✅ إرسال 10 صور بدون كابشن
            // ═══════════════════════════════════════════════
            const displayResults = results.slice(0, 10);
            let sentCount = 0;

            for (let i = 0; i < displayResults.length; i++) {
                const item = displayResults[i];
                const image = item?.image;

                if (!image) continue;

                try {
                    const imageBuffer = await downloadImageFromUrl(image);
                    if (!imageBuffer) continue;

                    // ✅ صورة بدون كابشن
                    await sock.sendMessage(chatId, {
                        image: imageBuffer
                    }, { quoted: m });

                    sentCount++;

                    await new Promise(resolve => setTimeout(resolve, 600));

                } catch (error) {
                    console.error(`[عدسة] Image ${i + 1} error:`, error?.message || error);
                }
            }

            // ═══════════════════════════════════════════════
            // ✅ رسالة النهاية بس
            // ═══════════════════════════════════════════════
            if (sentCount > 0) {
                await sock.sendMessage(chatId, {
                    text: `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                });

                await sock.sendMessage(chatId, {
                    react: { text: "✅", key: m.key }
                });
            } else {
                await sock.sendMessage(chatId, {
                    react: { text: "❌", key: m.key }
                });

                await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*

*┋ فـشـل إرسـال الـصـوࢪ*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

        } catch (error) {
            console.error("[عدسة] Error:", error?.message || error);

            await sock.sendMessage(chatId, {
                react: { text: "❌", key: m.key }
            });

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*

*┋ حـدث خـطـأ ┋*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ${error?.message || "حـاول مـجـدداً"}*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};