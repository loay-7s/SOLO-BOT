// plugins/سبوتيفاي.js
// ⚔️ SOLO SPOTIFY DOWNLOADER ⚔️

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API = 'https://engez.a7a.online/api/v1/download/spotify';
const TIMEOUT = 120000;

async function downloadSpotify(url) {
    const { data } = await axios.get(API, {
        params: { url },
        timeout: TIMEOUT
    });

    if (!data?.success || !data?.response?.downloadUrl) {
        throw new Error(data?.error || data?.response?.error || 'فشل تحميل الأغنية');
    }

    return data.response;
}

// ✅ دالة ضغط الصوت (اللي كانت ناقصة)
async function compressAudio(inputBuffer) {
    const tempDir = path.join(process.cwd(), 'temp');
    fs.ensureDirSync(tempDir);
    
    const inputPath = path.join(tempDir, `spotify_${Date.now()}_input.mp3`);
    const outputPath = path.join(tempDir, `spotify_${Date.now()}_output.mp3`);
    
    try {
        fs.writeFileSync(inputPath, inputBuffer);
        
        await execPromise(
            `ffmpeg -i "${inputPath}" -b:a 64k -ar 44100 -ac 2 -codec:a libmp3lame -q:a 9 "${outputPath}" -y`
        );
        
        if (!fs.existsSync(outputPath)) {
            throw new Error('فشل إنشاء الملف المضغوط');
        }
        
        const compressedBuffer = fs.readFileSync(outputPath);
        
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        
        return compressedBuffer;
    } catch (error) {
        console.error('❌ فشل ضغط الصوت:', error.message);
        try {
            fs.unlinkSync(inputPath).catch(() => {});
            fs.unlinkSync(outputPath).catch(() => {});
        } catch (e) {}
        return inputBuffer;
    }
}

export default {
    name: "سبواتيفاي",
    aliases: ["spotify", "سبوتي", "تحميل اغنية", "sp", "سبوتيفاي"],
    description: "تحميل الأغاني من سبوتيفاي (مع ضغط تلقائي)",
    category: "تحميل",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const text = args.join(" ").trim();

        if (!text) {
            await react("🎵");
            return reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 🎵 تـحـمـيـل مـن سـبـوتـيـفـاي*
*╰─━━━━━━━━━━━━━━━━━━─╯*

*📝 أرسل رابط الأغنية من سبوتيفاي*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.سبواتيفاي https://open.spotify.com/track/xxx*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ✅ التحقق من الرابط
        if (!text.includes('open.spotify.com') && !text.includes('spotify.com')) {
            await react("❌");
            return reply(`*❌ رابـط سـبـوتـيـفـاي غـيـر صـالـح*\n📌 تأكد من الرابط وحاول مرة أخرى`);
        }

        await react("⏳");
        await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري تـحـمـيـل الأغـنـيـة...*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

        try {
            const res = await downloadSpotify(text);

            // ✅ تحميل الملف الصوتي
            const audioResponse = await axios.get(res.downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            let audioBuffer = Buffer.from(audioResponse.data);
            const originalSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);

            // ✅ ضغط لو أكبر من 5 ميجا
            let wasCompressed = false;
            if (audioBuffer.length > 5 * 1024 * 1024) {
                await react("🗜️");
                audioBuffer = await compressAudio(audioBuffer);
                wasCompressed = true;
            }

            const finalSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);

            await react("✅");

            // ✅ كابشن النتيجة
            let caption = `*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*
*┋ تـم الـتـحـمـيـل مـن سـبـوتـيـفـاي*
*┋ الـعـنـوان : ${res.title || 'بدون عنوان'}*
*┋ الـفـنـان : ${res.author || 'غير معروف'}*
*┋ الألـبـوم : ${res.album || 'غير معروف'}*
*┋ الـمـدة : ${res.duration || 'غير معروف'}*`;

            if (wasCompressed) {
                caption += `\n*┋ الـحـجـم : ${originalSizeMB}MB → ${finalSizeMB}MB* ✅`;
            } else {
                caption += `\n*┋ الـحـجـم : ${finalSizeMB}MB*`;
            }

            caption += `\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            // ✅ إرسال الصوت المضغوط
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${res.title || 'song'} - ${res.author || 'artist'}.mp3`,
                caption: caption
            }, { quoted: message });

        } catch (error) {
            console.error("❌ Spotify Error:", error);
            await react("❌");

            const errorMsg = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'حدث خطأ';

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل تـحـمـيـل الأغـنـيـة*
*┋ السـبب: ${errorMsg}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};