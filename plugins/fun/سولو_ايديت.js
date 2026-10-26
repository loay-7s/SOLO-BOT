// plugins/سولو_ايديت.js
// ⚔️ SOLO EDIT — PTV VIDEO SENDER ⚔️

import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════
// 📁 مسارات الفيديوهات
// ═══════════════════════════════════════════════════════════

const VIDEOS = {
    '1': 'media/video3.mp4',   // سولو_ايديت 1
    '2': 'media/video2.mp4',   // سولو_ايديت 2
};

export default {
    name: "سولو_ايديت",
    aliases: ["solo_edit", "سولو_ايديت"],
    description: "يرسل فيديو محدد كرسالة دائرية (PTVM)",
    category: "fun",

    async run({ reply, message, sock, react, args }) {
        // ═══════════════════════════════════════════════════════
        // 🎯 استخراج الرقم من الأمر
        // ═══════════════════════════════════════════════════════

        const choice = String(args?.[0] || '').trim();

        // ─── لو مفيش رقم → عرض القائمة ───
        if (!choice) {
            await react("🎬");

            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🎬 سـولـو ايـديـت*

*───━━━⊱  📋  ⊰━━━───*

*📌 اخـتـر رقـم الـفـيـديـو:*

*┋ 🎥 .سولو_ايديت 1*
*┋ 🎥 .سولو_ايديت 2*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📝 مـثـال:*
\`.سولو_ايديت 1\`

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ─── تحديد الفيديو ───
        const videoPath = VIDEOS[choice];

        if (!videoPath) {
            await react("❌");

            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ رقـم غـيـر صـالـح*

*───━━━⊱  ⚠️  ⊰━━━───*

*📌 الأرقـام الـمـتـاحـة:*
*┋ 🎥 1*
*┋ 🎥 2*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ═══════════════════════════════════════════════════════
        // 🎥 إرسال الفيديو
        // ═══════════════════════════════════════════════════════

        await react("🎥");

        const absolutePath = path.join(process.cwd(), videoPath);

        // ─── التحقق من وجود الملف ───
        if (!fs.existsSync(absolutePath)) {
            console.error(`[سولو_ايديت] الملف غير موجود: ${videoPath}`);
            await react("❌");
            return reply(`*❌ الـمـلـف غـيـر مـوجـود حـالـيـاً (${choice})`);
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
                { quoted: message }
            );

            await react("✅");

        } catch (error) {
            console.error("❌ سولو_ايديت Error:", error);
            await react("❌");
            await reply(`*❌ حـدث خـطـأ أثـنـاء إرسـال الـفـيـديـو*`);
        }
    }
};