// plugins/جودة.js
// ⚔️ SOLO IMAGE ENHANCER ⚔️

import axios from 'axios';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const uploadToUguu = async (buffer, ext) => {
    const form = new FormData();
    form.append('files[]', buffer, `file.${ext}`);

    try {
        const response = await fetch('https://uguu.se/upload.php', {
            method: 'POST',
            body: form
        });
        const result = await response.json();

        if (!result.files || result.files.length === 0) {
            throw new Error('فشل في رفع الملف إلى Uguu.se');
        }

        return result.files[0].url;
    } catch (error) {
        throw new Error(`فشل في رفع الملف: ${error.message}`);
    }
};

const enhanceImageWithAPI = async (imageUrl, action = 'both', method = 3, size = 'high') => {
    try {
        const params = {
            imageUrl: imageUrl
        };

        if (action === 'both') {
            params.action = 'both';
            params.method = method || 3;
            params.size = size || 'high';
        } else if (action === 'ihancer') {
            params.action = 'ihancer';
            params.method = method || 2;
            params.size = size || 'high';
        } else if (action === 'jpghd') {
            params.action = 'jpghd';
        } else {
            throw new Error('نوع التحسين غير معروف');
        }

        const response = await axios.get(
            `https://engez.a7a.online/api/v1/tools/image-enhance`,
            {
                params: params,
                timeout: 120000,
                responseType: 'arraybuffer'
            }
        );

        const contentType = response.headers['content-type'] || '';

        if (contentType.includes('image')) {
            return {
                success: true,
                imageBuffer: Buffer.from(response.data),
                isBuffer: true,
                action: action
            };
        } else {
            const text = Buffer.from(response.data).toString('utf-8');
            const data = JSON.parse(text);

            if (data?.success && data?.response?.url) {
                return {
                    success: true,
                    enhancedUrl: data.response.url,
                    size: data.response.size || 'غير معروف',
                    method: method || 'غير محدد',
                    action: action,
                    sizeLabel: size || 'غير محدد',
                    isBuffer: false
                };
            } else {
                throw new Error(JSON.stringify(data || 'فشل في تحسين الصورة'));
            }
        }
    } catch (error) {
        if (error.response) {
            throw new Error(`API Error ${error.response.status}: ${error.message}`);
        }
        throw new Error(`فشل في تحسين الصورة: ${error.message}`);
    }
};

export default {
    name: "جودة",
    aliases: ["جوده", "enhance", "تحسين", "sd", "hd", "fhd", "4k"],
    description: "تحسين جودة الصورة بالذكاء الاصطناعي",
    category: "tools",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        
        // ✅ استخراج الأمر بشكل صحيح من args
        const command = args[0] || 'fhd'; // افتراضي fhd لو مفيش أمر
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // ✅ التحقق من وجود صورة (في الرد)
        let mediaMessage = null;
        let isImage = false;

        if (quoted?.imageMessage) {
            mediaMessage = quoted.imageMessage;
            isImage = true;
        } else if (message.message?.imageMessage) {
            mediaMessage = message.message.imageMessage;
            isImage = true;
        }

        if (!isImage) {
            await react("🖼️");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 🖼️ تـحـسـيـن جـودة الـصـورة*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 رد على صورة واستخدم الأمر*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.جودة hd* - جودة متوسطة (عشوائي)
📌 *.جودة fhd* - جودة عالية (عشوائي)
📌 *.جودة 4k* - جودة فائقة

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("⏳");

        // ✅ تحديد الإعدادات حسب الأمر (من args)
        let action, method, size, label;

        // ✅ التحقق من الأمر بشكل دقيق
        const cmd = command.toLowerCase();

        if (cmd === 'sd') {
            action = 'ihancer';
            method = Math.floor(Math.random() * 4) + 1;
            size = 'low';
            label = `SD${method}`;
        } else if (cmd.match(/^sd[1-4]$/)) {
            action = 'ihancer';
            method = parseInt(cmd.replace('sd', ''));
            size = 'low';
            label = `SD${method}`;
        } else if (cmd === 'hd') {
            action = 'ihancer';
            method = Math.floor(Math.random() * 4) + 1;
            size = 'medium';
            label = `HD${method}`;
        } else if (cmd.match(/^hd[1-4]$/)) {
            action = 'ihancer';
            method = parseInt(cmd.replace('hd', ''));
            size = 'medium';
            label = `HD${method}`;
        } else if (cmd === 'fhd') {
            action = 'ihancer';
            method = Math.floor(Math.random() * 4) + 1;
            size = 'high';
            label = `FHD${method}`;
        } else if (cmd.match(/^fhd[1-4]$/)) {
            action = 'ihancer';
            method = parseInt(cmd.replace('fhd', ''));
            size = 'high';
            label = `FHD${method}`;
        } else if (cmd === '4k') {
            action = 'jpghd';
            method = null;
            size = null;
            label = '4k';
        } else {
            // ✅ القيمة الافتراضية
            action = 'ihancer';
            method = Math.floor(Math.random() * 4) + 1;
            size = 'high';
            label = `FHD${method}`;
        }

        const qualityConfig = { action, method, size, label };

        try {
            // ✅ تحميل الصورة
            let mediaBuffer = null;
            try {
                const stream = await downloadContentFromMessage(mediaMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                mediaBuffer = buffer;
            } catch (downloadError) {
                console.error('❌ فشل تحميل الصورة:', downloadError);
                await react("❌");
                return reply(`*❌ فـشـل تـحـمـيـل الـصـورة*\n📌 حاول مرة أخرى`);
            }

            if (!mediaBuffer || mediaBuffer.length === 0) {
                await react("❌");
                return reply(`*❌ فـشـل تـحـمـيـل الـصـورة*`);
            }

            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري رفـع الـصـورة إلـى الـخـادم...*
*┋ الـجـودة : ${qualityConfig.label}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            // ✅ رفع الصورة
            const { ext } = await fileTypeFromBuffer(mediaBuffer);
            const imageUrl = await uploadToUguu(mediaBuffer, ext || 'jpg');

            if (!imageUrl) {
                throw new Error('فشل رفع الصورة');
            }

            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري تـحـسـيـن الـصـورة...*
*┋ الـجـودة : ${qualityConfig.label}*
*┋ قـد يـسـتـغـرق 20-60 ثـانـيـة*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            // ✅ تحسين الصورة
            const result = await enhanceImageWithAPI(
                imageUrl,
                qualityConfig.action,
                qualityConfig.method,
                qualityConfig.size
            );

            await react("✅");

            // ✅ إرسال النتيجة
            if (result.isBuffer) {
                await sock.sendMessage(chatId, {
                    image: result.imageBuffer,
                    caption: `*⎔┄┄─ ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
*┋ تـم تـحـسـيـن الـصـورة بـنـجـاح*

*┋ الـجـودة : ${qualityConfig.label}*
*┋ الـطـريـقـة : ${qualityConfig.method || 'تلقائي'}*
*┋ الـحـجـم : ${qualityConfig.size || 'غير محدد'}*

*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    image: { url: result.enhancedUrl },
                    caption: `*⎔┄┄─ ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
*┋ تـم تـحـسـيـن الـصـورة بـنـجـاح*

*┋ الـجـودة : ${qualityConfig.label}*
*┋ حـجـم الـمـلـف : ${(result.size / 1024 / 1024).toFixed(2)} MB*

*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                }, { quoted: message });
            }

        } catch (error) {
            console.error("❌ Enhance Error:", error);
            await react("❌");

            let errorMsg = error.message || 'حدث خطأ غير معروف';
            if (errorMsg.length > 4000) {
                errorMsg = errorMsg.slice(0, 4000) + '\n\n... (تم اختصار الرسالة)';
            }

            await reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ ❌ فـشـل تـحـسـيـن الـصـورة*
*╰─━━━━━━━━━━━━━━━━━─╯*

*🔧 الـخـطـأ : ${errorMsg}*

*💡 اقـتـراحـات:*
• تـأكـد مـن جـودة الـصـورة
• جـرب صـورة أصـغـر حـجـماً
• انـتـظـر دقـيـقـة وحـاول مـجـدداً

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};