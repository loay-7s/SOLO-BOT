// plugins/ايمو.js
// ⚔️ SOLO EMU VIDEO COMMAND ⚔️

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    name: "ايمو",
    aliases: ["emu", "EMU"],
    category: "خاص",
    description: "فيديو مشاهدة مرة واحدة خاص بـ إيمو 💌",

    async run({ sock, message, reply, react, userJid }) {
        const chatId = message.key.remoteJid;

        // ✅ اللستة البيضاء (LID بس)
        const allowedLIDs = [
            "240707533041851@lid",
            "194953347133606@lid"
        ];

        // ✅ التحقق من أن المستخدم من الـ LID المسموحين
        const isAllowed = allowedLIDs.some(lid => userJid === lid || userJid.endsWith(lid));

        if (!isAllowed) {
            await react("🚫");
            return reply(`*❌هـذا الأمـࢪ خـاص بـ ايـمـو فـقـط.*`);
        }

        try {
            // ✅ ريأكت 💌
            await react("💌");

            // ✅ مسار الفيديو
            const videoPath = path.join(process.cwd(), 'media', 'emu.mp4');

            // ✅ التحقق من وجود الفيديو
            if (!fs.existsSync(videoPath)) {
                return reply(`*❌ فـيـديـو "emu.mp4" غـيـر مـوجـود فـي مـجـلد media*`);
            }

            // ✅ قراءة الفيديو
            const videoBuffer = fs.readFileSync(videoPath);

            // ✅ كابشن الفيديو
            const caption = `𝑶𝒏𝒍𝒚 𝑭𝒐𝒓 𝑬𝒎𝒖 💌`;

            // ✅ إرسال الفيديو (مشاهدة مرة واحدة)
            await sock.sendMessage(chatId, {
                video: videoBuffer,
                caption: caption,
                mimetype: 'video/mp4',
                viewOnce: false,
                fileName: 'emu.mp4'
            }, { quoted: message });

        } catch (error) {
            console.error("❌ Emu Error:", error);
            await react("❌");
            await reply(`*❌ فـشـل إرسـال الـفـيـديـو*\n📌 ${error.message || 'خطأ غير معروف'}`);
        }
    }
};