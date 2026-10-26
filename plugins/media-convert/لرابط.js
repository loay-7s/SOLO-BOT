// plugins/لرابط.js
// ⚔️ SOLO FILE UPLOADER - 9 SOURCES ⚔️

import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const API_BASE = 'https://engez.a7a.online/api/v1';

const SOURCES = {
    '1': 'uguu',
    '2': 'quax',
    '3': 'ezgif',
    '4': 'top4top',
    '5': 'postimages',
    '6': 'videy',
    '7': '8upload',
    '8': 'litterbox',
    '9': 'tmpfiles'
};

const SOURCE_NAMES = {
    'uguu': 'Uguu',
    'quax': 'Quax',
    'ezgif': 'Ezgif',
    'top4top': 'Top4Top',
    'postimages': 'PostImages',
    'videy': 'Videy',
    '8upload': '8Upload',
    'litterbox': 'Litterbox',
    'tmpfiles': 'TmpFiles'
};

// ✅ رفع الملف
async function uploadFile(fileBuffer, source = 'uguu') {
    try {
        const form = new FormData();
        const fileInfo = await fileTypeFromBuffer(fileBuffer);
        const ext = fileInfo?.ext || 'bin';

        form.append('files[]', fileBuffer, `file.${ext}`);

        const uploadRes = await axios.post('https://uguu.se/upload.php', form, {
            headers: { ...form.getHeaders() },
            timeout: 30000
        });

        if (!uploadRes.data?.files?.[0]?.url) {
            throw new Error('فشل رفع الملف إلى Uguu');
        }

        const fileUrl = uploadRes.data.files[0].url;

        const params = new URLSearchParams();
        params.append('fileUrl', fileUrl);
        params.append('source', source);

        const response = await axios.get(`${API_BASE}/tools/upload?${params.toString()}`, {
            timeout: 30000
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل الرفع');
        }

        return response.data.response;
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

// ✅ استخراج المعلومات من الرسالة المقتبسة
function getQuotedMessage(m) {
    if (m?.quoted?.message) return m.quoted;

    const contextInfo =
        m?.message?.extendedTextMessage?.contextInfo ||
        m?.message?.imageMessage?.contextInfo ||
        m?.message?.videoMessage?.contextInfo ||
        m?.message?.documentMessage?.contextInfo ||
        m?.message?.audioMessage?.contextInfo ||
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

// ✅ استخراج نوع الملف والمحتوى
function getMediaFromMessage(quoted) {
    if (!quoted?.message) return null;

    const msg = quoted.message;

    // فك الرسائل المخفية
    const unwrap = (message) => {
        if (!message) return null;
        if (message.ephemeralMessage) return unwrap(message.ephemeralMessage.message);
        if (message.viewOnceMessage) return unwrap(message.viewOnceMessage.message);
        if (message.viewOnceMessageV2) return unwrap(message.viewOnceMessageV2.message);
        return message;
    };

    const content = unwrap(msg);

    if (content?.imageMessage) return { type: 'image', media: content.imageMessage };
    if (content?.videoMessage) return { type: 'video', media: content.videoMessage };
    if (content?.documentMessage) return { type: 'document', media: content.documentMessage };
    if (content?.audioMessage) return { type: 'audio', media: content.audioMessage };
    if (content?.stickerMessage) return { type: 'sticker', media: content.stickerMessage };

    return null;
}

// ✅ تحميل المحتوى
async function downloadMedia(quoted) {
    const result = getMediaFromMessage(quoted);
    if (!result) throw new Error('الرسالة المقتبس منها لا تحتوي على ملف');

    const stream = await downloadContentFromMessage(result.media, result.type);
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return {
        buffer: Buffer.concat(chunks),
        type: result.type,
        mime: result.media.mimetype || 'application/octet-stream',
        fileName: result.media.fileName || null
    };
}

export default {
    name: "لرابط",
    aliases: ["رابط","لموقع","للينك"],
    description: "رفع الملفات إلى 9 مصادر",
    category: "tools",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const text = args.join(" ").trim();

        // ═══════════════════════════════════════════════
        // 🔍 التحقق من الرد على رسالة
        // ═══════════════════════════════════════════════
        const quoted = getQuotedMessage(message);
        const mediaInfo = quoted ? getMediaFromMessage(quoted) : null;

        if (!quoted || !mediaInfo) {
            await react("📤");
            return reply(`*⎔┄┄─── ⊱╎⌯ 📤 ⌯╎⊰───┄┄⎔*

           *┋ أمـࢪ رفـع الـمـلـفـات ┋*

*⎔┄┄─── ⊱╎⌯ 📌 ⌯╎⊰ ───┄┄⎔*

*┋ الاسـتـخـدام :*

*⬡ اعـمـل Reply عـلـى صـورة أو فـيـديـو*
*⬡ أو سـتـيـكـࢪ أو GIF*
*⬡ أو مــلـف أو فـويـس*

*⬡ و اكـتـب .لـࢪابـط*

*⎔┄┄─── ⊱╎⌯ 🌐 ⌯╎⊰ ───┄┄⎔*

*┋ الـمـصـادࢪ الـمـتـاحـة :*

*⬡ 1 - Uguu*
*⬡ 2 - Quax*
*⬡ 3 - Ezgif*
*⬡ 4 - Top4Top*
*⬡ 5 - PostImages*
*⬡ 6 - Videy*
*⬡ 7 - 8Upload*
*⬡ 8 - Litterbox*
*⬡ 9 - TmpFiles*

*⎔┄┄─── ⊱╎⌯ 💡 ⌯╎⊰ ───┄┄⎔*

*📌 الـࢪفـع الـتـلـقـائـي :*

*⬡ صـوࢪ ← PostImages*
*⬡ فـيـديـوهـات ← Videy*
*⬡ مـلـفـات أخـࢪى ← Uguu*

*⎔┄┄─── ⊱╎⌯ 📝 ⌯╎⊰ ───┄┄⎔*

*📌 أمـثـلـة :*

*⬡ .لـࢪابـط*
> *(رفـع تـلـقـائـي)*

*⬡ .لـࢪابـط 1*
> *(رفـع لـ Uguu)*

*⬡ .لـࢪابـط 5*
> *(رفـع لـ PostImages)*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("⏳");

        try {
            // ═══════════════════════════════════════════════
            // 📥 تحميل الملف
            // ═══════════════════════════════════════════════
            const { buffer, type, mime, fileName } = await downloadMedia(quoted);

            if (!buffer || buffer.length === 0) {
                throw new Error('فشل تحميل الملف');
            }

            // ═══════════════════════════════════════════════
            // 🎯 تحديد المصدر
            // ═══════════════════════════════════════════════
            let source;
            const selected = text?.trim();

            if (selected && SOURCES[selected]) {
                source = SOURCES[selected];
            } else {
                // رفع تلقائي حسب النوع
                if (mime.startsWith('image/')) {
                    source = 'postimages';
                } else if (mime.startsWith('video/')) {
                    source = 'videy';
                } else {
                    source = 'uguu';
                }
            }

            const sourceName = SOURCE_NAMES[source] || source;

            // ═══════════════════════════════════════════════
            // 📤 رفع الملف
            // ═══════════════════════════════════════════════
            await reply(`*⎔┄┄─── ⊱╎⌯ ⏳ ⌯╎⊰───┄┄⎔*

*┋ جـاري ࢪفـع الـمـلـف ┋*

*⎔┄┄─── ⊱╎⌯ 📂 ⌯╎⊰ ───┄┄⎔*

*┋ الـمـصـدࢪ : ⦓ ${sourceName} ⦔*

*┋ الـنـوع : ⦓ ${type} ⦔*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);

            const result = await uploadFile(buffer, source);

            if (!result?.url) {
                throw new Error('لم يتم العثور على رابط');
            }

            const size = result.size || buffer.length;
            const sizeFormatted = size > 1024 * 1024
                ? `${(size / (1024 * 1024)).toFixed(2)} MB`
                : `${(size / 1024).toFixed(2)} KB`;

            await react("✅");

            await reply(`*⎔┄┄─── ⊱╎⌯ ✅ ⌯╎⊰───┄┄⎔*

        *┋ تـم الـࢪفـع بـنـجـاح ┋*

*⎔┄┄─── ⊱╎⌯ 📦 ⌯╎⊰ ───┄┄⎔*

*┋ الـمـلـف : ⦓ ${result.fileName || fileName || 'ملف'} ⦔*
*┋ الـنـوع : ⦓ ${result.mimeType || mime} ⦔*
*┋ الـحـجـم : ⦓ ${sizeFormatted} ⦔*
*┋ الـمـصـدࢪ : ⦓ ${sourceName} ⦔*

*⎔┄┄─── ⊱╎⌯ 🔗 ⌯╎⊰ ───┄┄⎔*

*┋ الـࢪابـط :*

> *${result.url}*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);

        } catch (error) {
            console.error("❌ Upload Error:", error);
            await react("❌");

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*

*┋ فـشـل ࢪفـع الـمـلـف*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ${error.message || 'حاول مرة أخرى'}*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};