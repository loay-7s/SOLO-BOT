// plugins/فيديو-ذكاء.js
// ⚔️ SOLO AI VIDEO GENERATOR ⚔️

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const API_BASE = 'https://engez.a7a.online/api/v1';

// ✅ توليد فيديو بالذكاء الاصطناعي (مع صوت دايماً)
async function generateVideo(prompt) {
    try {
        const params = new URLSearchParams();
        params.append('prompt', prompt);
        params.append('aiSound', 'true'); // ✅ صوت دايماً

        const response = await axios.get(`${API_BASE}/ai/video-gen?${params.toString()}`, {
            timeout: 300000
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل توليد الفيديو');
        }

        return response.data.response;
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

// ✅ تحميل الفيديو
async function downloadVideo(url, filename) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 300000
        });
        const buffer = Buffer.from(response.data);
        const filePath = path.join(process.cwd(), filename);
        await fs.writeFile(filePath, buffer);
        return filePath;
    } catch (error) {
        throw new Error(`فشل تحميل الفيديو: ${error.message}`);
    }
}

export default {
    name: "فيديو_ذكاء",
    aliases: ["ai-video", "فيديو-ai", "فيديو-ذكاء"],
    description: "توليد فيديو بالذكاء الاصطناعي",
    category: "ai",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const prompt = args.join(" ").trim();

        // ═══════════════════════════════════════════════
        // ❌ مفيش وصف
        // ═══════════════════════════════════════════════
        if (!prompt) {
            await react("🎬");
            return reply(`*⎔┄┄─── ⊱╎⌯ 🎬 ⌯╎⊰───┄┄⎔*

*┋فـيـديـو بالـذكـاء الاصـطـنـاعـي┋*

*⎔┄┄─── ⊱╎⌯ 🎥 ⌯╎⊰ ───┄┄⎔*

*┋ 📝 اكتب وصف الفيديو*

*⎔┄┄─── ⊱╎⌯ 📌 ⌯╎⊰ ───┄┄⎔*

*📌 أمـثـلـة:*

*⬡ .فيديو_ذكاء قط يرقص*
*⬡ .فيديو_ذكاء رجل يركض في الغابة*
*⬡ .فيديو_ذكاء طائر يطير فوق البحر*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*⚠️ قـد يـسـتـغـرق بـعـض الـوقـت*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("⏳");

        try {
            // ═══════════════════════════════════════════════
            // 📝 رسالة بدء التوليد
            // ═══════════════════════════════════════════════
            const statusMsg = await reply(`*⎔┄┄─ ⊱╎⌯ 🎬 ⌯╎⊰─┄┄⎔*

*┋ جـاري تـولـيـد الـفـيـديـو ┋*

*⎔┄┄─── ⊱╎⌯ 📝 ⌯╎⊰ ───┄┄⎔*

*┋ الـوصـف : ⦓ ${prompt} ⦔*

*⎔┄┄─── ⊱╎⌯ ⏳ ⌯╎⊰ ───┄┄⎔*

*┋ قـد يـسـتـغـرق بـعـض الـوقـت...*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);

            // ═══════════════════════════════════════════════
            // 🎬 توليد الفيديو
            // ═══════════════════════════════════════════════
            const result = await generateVideo(prompt);

            if (!result?.url) {
                throw new Error('لم يتم العثور على رابط الفيديو');
            }

            // ═══════════════════════════════════════════════
            // 📥 تحديث الرسالة
            // ═══════════════════════════════════════════════
            await sock.sendMessage(chatId, {
                text: `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*

*┋ جـاري تـحـمـيـل الـفـيـديـو ┋*

*⎔┄┄─── ⊱╎⌯ 📝 ⌯╎⊰ ───┄┄⎔*

*┋ الـوصـف : ⦓ ${prompt} ⦔*

*⎔┄┄─── ⊱╎⌯ ⏳ ⌯╎⊰ ───┄┄⎔*

*┋ جـاري الـتـحـمـيـل...*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,
                edit: statusMsg.key
            }).catch(() => {});

            // ═══════════════════════════════════════════════
            // 💾 تحميل الفيديو
            // ═══════════════════════════════════════════════
            const filename = `ai_video_${Date.now()}.mp4`;
            const filePath = await downloadVideo(result.url, filename);

            const buffer = await fs.readFile(filePath);

            // ═══════════════════════════════════════════════
            // 📤 إرسال الفيديو
            // ═══════════════════════════════════════════════
            await sock.sendMessage(chatId, {
                video: buffer,
                mimetype: 'video/mp4',
                fileName: `SOLO_AI_Video_${Date.now()}.mp4`,
                caption: `*⎔┄┄─ ⊱╎⌯ 🎬 ⌯╎⊰─┄┄⎔*

*┋ تـم تـولـيـد الـفـيـديـو ┋*

*⎔┄┄── ⊱╎⌯ 📝 ⌯╎⊰ ──┄┄⎔*

*┋ الـوصـف : ⦓ ${prompt} ⦔*

*⎔┄┄─ ⊱╎⌯ 🔊 ⌯╎⊰ ─┄┄⎔*

*┋ الـصـوت : ✅ مـفـعـل*

*⎔┄┄── ⊱╎⌯ ✨ ⌯╎⊰ ──┄┄⎔*

*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            }, { quoted: message });

            // ✅ مسح الملف المؤقت
            await fs.unlink(filePath).catch(() => {});

            await react("✅");

        } catch (error) {
            console.error("❌ AI Video Error:", error);

            await react("❌");

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*

*┋ فـشـل تـولـيـد الـفـيـديـو ┋*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ السـبـب : ⦓ ${error.message || 'حاول مرة أخرى'} ⦔*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};