// plugins/نص.js
// ⚔️ SOLO OCR - استخراج النص من الصور ⚔️

import fs from 'fs';
import path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { createWorker } from 'tesseract.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, '../temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

export default {
    name: "نص",
    aliases: ["ocr", "استخراج_نص", "لنص"],
    description: "استخراج النص من الصورة (OCR)",
    category: "tools",
    group: true,

    async run({ sock, m, reply, react, userJid }) {
        const chatId = m.key.remoteJid;

        // ✅ استخراج الصورة (من الرد أو من الرسالة نفسها)
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo;
        let imageBuffer = null;

        try {
            if (quotedMsg?.quotedMessage?.imageMessage) {
                const stream = await downloadMediaMessage(
                    { message: quotedMsg.quotedMessage },
                    'buffer',
                    { logger: console }
                );
                imageBuffer = stream;
            } else if (m.message?.imageMessage) {
                const stream = await downloadMediaMessage(
                    m,
                    'buffer',
                    { logger: console }
                );
                imageBuffer = stream;
            } else {
                await react("🖼️");
                return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 📝 اسـتـخـراج الـنـص مـن الـصـورة*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📌 ارسـل صـورة واكـتـب .لنص*
*📌 او رد على صـورة بـ .لنص*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            if (!imageBuffer) {
                await react("❌");
                return reply(`*❌ فـشـل تـحـمـيـل الـصـورة*`);
            }

            await react("🔍");
            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري اسـتـخـراج الـنـص مـن الـصـورة...*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            // ✅ حفظ الصورة مؤقتاً
            const timestamp = Date.now();
            const imagePath = path.join(tempDir, `image_${timestamp}.jpg`);
            fs.writeFileSync(imagePath, imageBuffer);

            // ✅ استخراج النص باستخدام Tesseract
            const worker = await createWorker('ara+eng');
            const { data: { text } } = await worker.recognize(imagePath);
            await worker.terminate();

            // ✅ تنظيف الملف المؤقت (بطريقة آمنة)
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (cleanupError) {
                console.log('⚠️ فشل حذف الملف المؤقت:', cleanupError.message);
            }

            // ✅ التحقق من وجود نص
            if (!text || text.trim() === '') {
                await react("😕");
                return reply(`*⎔┄┄─ ⊱╎⌯ 😕 ⌯╎⊰─┄┄⎔*
*┋ لـم يـتـم الـعـثـور عـلـى نـص فـي الـصـورة*
*┋ تـأكـد مـن وضـوح الـكـتـابـة*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
            }

            await react("✅");

            // ✅ قص النص لو طويل
            let finalText = text.trim();
            if (finalText.length > 4000) {
                finalText = finalText.substring(0, 4000) + '\n\n... (تم اقتطاع النص لطول كبير)';
            }

            // ✅ عرض النص المستخرج بزخرفة SOLO
            const resultMsg = `*⎔┄┄─ ⊱╎⌯ 📝 ⌯╎⊰─┄┄⎔*
*┋ الـنـص الـمـسـتـخـرج*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

${finalText}

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await reply(resultMsg);

        } catch (error) {
            console.error("❌ OCR Error:", error);
            await react("❌");
            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل اسـتـخـراج الـنـص*
*┋ السـبب: ${error.message || 'خطأ غير معروف'}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};