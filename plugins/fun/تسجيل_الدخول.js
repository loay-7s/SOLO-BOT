// ملف: plugins/ارسل_الفيديو.js

import fs from 'fs';
import path from 'path';

export default {
    name: "تسجيل_الدخول",
    description: "يرسل فيديو محدد كرسالة دائرية (PTVM).",
    category: "fun",

    async run({ reply, message, sock, react }) {
        const filePath = 'media/video.mp4';
        const absolutePath = path.join(process.cwd(), filePath);

        // رياكت على الأمر
        await react("🎥");

        if (!fs.existsSync(absolutePath)) {
            console.error(`[ارسل_الفيديو] خطأ: الملف المحدد ${filePath} غير موجود!`);
            return reply("❌ عذرًا، الملف المطلوب غير موجود حاليًا.");
        }

        try {
            const fileBuffer = fs.readFileSync(absolutePath);

            await sock.sendMessage(
                message.key.remoteJid,
                {
                    video: fileBuffer,
                    mimetype: 'video/mp4',
                    ptv: true
                },
                {
                    quoted: message
                }
            );

        } catch (error) {
            console.error("Error sending the specific PTV message:", error);
            await reply("❌ حدث خطأ أثناء إرسال الفيديو.");
        }
    }
};