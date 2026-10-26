// plugins/ديب_سيك.js
// ⚔️ SOLO DEEPSEEK AI ⚔️

import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const API_BASE = 'https://engez.a7a.online/api/v1/ai/deepseek';

// ✅ رفع الملف إلى Uguu
async function uploadToUguu(buffer, ext) {
    const form = new FormData();
    form.append('files[]', buffer, `file.${ext}`);

    try {
        const response = await axios.post('https://uguu.se/upload.php', form, {
            headers: { ...form.getHeaders() },
            timeout: 30000
        });

        if (!response.data?.files?.[0]?.url) {
            throw new Error('فشل في رفع الملف إلى Uguu.se');
        }

        return response.data.files[0].url;
    } catch (error) {
        throw new Error(`فشل رفع الملف: ${error.message}`);
    }
}

// ✅ استدعاء DeepSeek API
async function callDeepSeekAPI({ query, search = false, thinking = false, fileUrl = null }) {
    try {
        const params = new URLSearchParams();
        params.append('q', query);
        if (search) params.append('search', 'true');
        if (thinking) params.append('thinking', 'true');
        if (fileUrl) params.append('fileUrl', fileUrl);

        const response = await axios.get(`${API_BASE}?${params.toString()}`, {
            timeout: 120000
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل الاتصال بـ API');
        }

        return response.data.response;
    } catch (error) {
        if (error.response) {
            throw new Error(`خطأ من السيرفر: ${error.response.status}`);
        }
        throw new Error(error.message || 'فشل الاتصال بـ DeepSeek API');
    }
}

// ✅ بناء الرد
function buildReply(reply, thinkText) {
    let out = '';
    if (thinkText) {
        const quoted = thinkText
            .split('\n')
            .map(line => line.trim() === '' ? '' : `> ${line}`)
            .join('\n');
        out += quoted + '\n\n';
    }
    out += reply;
    return out;
}

export default {
    name: "ديب_سيك",
    aliases: ["deepseek", "ds", "ديب", "deep"],
    description: "الذكاء الاصطناعي DeepSeek للإجابة على أسئلتك (يدعم الصور والملفات)",
    category: "tools",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const text = args.join(" ");
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // ✅ استخراج النص والوسائط
        let prompt = text;
        let hasMedia = false;
        let mediaBuffer = null;
        let mediaType = null;

        // ✅ التحقق من وجود صورة/ملف في الرد
        if (quotedMsg) {
            if (quotedMsg.imageMessage) {
                hasMedia = true;
                mediaType = 'image';
            } else if (quotedMsg.videoMessage) {
                hasMedia = true;
                mediaType = 'video';
            } else if (quotedMsg.documentMessage) {
                hasMedia = true;
                mediaType = 'document';
            } else if (quotedMsg.audioMessage) {
                hasMedia = true;
                mediaType = 'audio';
            }

            // ✅ لو مفيش نص، خد النص من الرد
            if (!prompt) {
                prompt = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
            }
        }

        // ✅ التحقق من وجود صورة في الرسالة نفسها
        if (!hasMedia && message.message?.imageMessage) {
            hasMedia = true;
            mediaType = 'image';
        }

        // ✅ لو مفيش سؤال ولا ميديا
        if (!prompt && !hasMedia) {
            await react("🤖");
            return reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 🤖 DeepSeek الـذكاء الاصطناعي*
*╰─━━━━━━━━━━━━━━━━━━─╯*

*📝 اسأل أي سؤال واحصل على إجابة فورية*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.ديب_سيك ما هي عاصمة مصر؟*
📌 *.ديب_سيك اشرح لي الذكاء الاصطناعي*
📌 رد على صورة بـ *.ديب_سيك اشرح محتوى الصورة*

*⚙️ خـيـارات إضـافـيـة:*
📌 *.ديب_سيك تفكير سؤال* (تفكير عميق)
📌 *.ديب_سيك بحث سؤال* (بحث مع الإجابة)

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ✅ التحقق من الخيارات
        let thinking = false;
        let search = false;
        let cleanQuery = prompt;

        // ✅ استخراج الكلمات المفتاحية
        const words = prompt.split(' ');
        const newArgs = [];
        for (const word of words) {
            if (word === 'تفكير' || word === 'think') {
                thinking = true;
            } else if (word === 'بحث' || word === 'search') {
                search = true;
            } else {
                newArgs.push(word);
            }
        }
        cleanQuery = newArgs.join(' ').trim();

        // ✅ لو مفيش سؤال وخدنا الصورة بس
        if (!cleanQuery && hasMedia) {
            cleanQuery = 'اشرح محتوى هذه الصورة أو الملف';
        }

        await react("🎯");

        try {
            let fileUrl = null;

            // ✅ تحميل الميديا لو موجودة
            if (hasMedia) {
                await react("📎");

                try {
                    let mediaMsg = null;
                    if (quotedMsg) {
                        if (quotedMsg.imageMessage) {
                            mediaMsg = { message: { imageMessage: quotedMsg.imageMessage } };
                        } else if (quotedMsg.videoMessage) {
                            mediaMsg = { message: { videoMessage: quotedMsg.videoMessage } };
                        } else if (quotedMsg.documentMessage) {
                            mediaMsg = { message: { documentMessage: quotedMsg.documentMessage } };
                        } else if (quotedMsg.audioMessage) {
                            mediaMsg = { message: { audioMessage: quotedMsg.audioMessage } };
                        }
                    } else if (message.message?.imageMessage) {
                        mediaMsg = { message: { imageMessage: message.message.imageMessage } };
                    }

                    if (mediaMsg) {
                        // ✅ تحميل الميديا
                        const stream = await downloadMediaMessage(
                            { message: mediaMsg.message },
                            'buffer',
                            { logger: console }
                        );
                        mediaBuffer = stream;

                        if (!mediaBuffer || mediaBuffer.length === 0) {
                            throw new Error('فشل تحميل الميديا');
                        }

                        // ✅ استخراج معلومات الملف
                        const fileInfo = await fileTypeFromBuffer(mediaBuffer);
                        const ext = fileInfo?.ext || 'bin';

                        // ✅ رفع الملف
                        await react("⏫");
                        fileUrl = await uploadToUguu(mediaBuffer, ext);

                        if (!fileUrl) {
                            throw new Error('فشل رفع الملف');
                        }

                        await react("✅");
                    }
                } catch (uploadError) {
                    throw new Error(`فشل رفع الملف: ${uploadError.message}`);
                }
            }

            // ✅ جاري التفكير
            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري الـتـفـكـيـر...*
${thinking ? '*┋ وضـع الـتـفـكـيـر الـعـمـيـق مـفـعـل* 🧠' : ''}
${search ? '*┋ وضـع الـبـحـث مـفـعـل* 🔍' : ''}
${fileUrl ? '*┋ تـم رفـع الـمـلـف* 📎' : ''}
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            // ✅ استدعاء الـ API
            const result = await callDeepSeekAPI({
                query: cleanQuery,
                search,
                thinking,
                fileUrl
            });

            if (!result?.reply) {
                throw new Error('لا يوجد رد من DeepSeek');
            }

            await react("✅");

            // ✅ بناء الرد
            let finalText = buildReply(result.reply, result.thinking);

            // ✅ قص النص لو طويل
            if (finalText.length > 4000) {
                finalText = finalText.substring(0, 4000) + '\n\n... (تم اقتطاع النص لطول كبير)';
            }

            const finalMsg = `*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 🎯 إجـابـة DeepSeek 🎯*
*╰─━━━━━━━━━━━━━━━━━━─╯*

${finalText}

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await reply(finalMsg);

        } catch (error) {
            console.error("❌ DeepSeek Error:", error.message);
            await react("❌");

            await reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ ❌ خـطـأ فـي الاتصال ❌*
*╰─━━━━━━━━━━━━━━━━━━━╯*

⚠️ *${error.message || 'الخادم مشغول حالياً'}*
📝 *حاول مرة أخرى بعد قليل*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};