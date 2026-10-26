// plugins/اغنية.js
// ⚔️ SOLO MUSIC DOWNLOADER WITH THUMBNAIL ⚔️

import youtubedl from "youtube-dl-exec";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const SOLO_CHANNEL_ID = "120363407767420565@newsletter";
const AUDIO_QUALITY = "128";

async function searchFirstVideo(query) {
    const result = await youtubedl(`ytsearch1:${query}`, {
        dumpSingleJson: true,
        skipDownload: true,
        noWarnings: true,
        noCheckCertificates: true,
        flatPlaylist: true
    });

    const video = result?.entries?.find(
        item => item?.id && (item?.ie_key === "Youtube" || item?.url)
    );

    if (!video) {
        throw new Error("لم يتم العثور على أي فيديو");
    }

    // الحصول على البيانات الكاملة للفيديو
    const info = await youtubedl(
        `https://www.youtube.com/watch?v=${video.id}`,
        {
            dumpSingleJson: true,
            skipDownload: true,
            noWarnings: true,
            noCheckCertificates: true
        }
    );

    return info;
}

// 👇 استخراج رابط صورة الفيديو
function getThumbnailUrl(videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

async function downloadAndConvert(videoId) {
    const outputPath = join(
        tmpdir(),
        `solo_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`
    );

    try {
        await youtubedl(
            `https://www.youtube.com/watch?v=${videoId}`,
            {
                extractAudio: true,
                audioFormat: "mp3",
                audioQuality: `${AUDIO_QUALITY}K`,
                output: outputPath,
                noWarnings: true,
                noCheckCertificates: true,
                noPlaylist: true,
                ffmpegLocation: "/data/data/com.termux/files/usr/bin"
            },
            {
                timeout: 180000
            }
        );

        const audioBuffer = await readFile(outputPath);

        if (!audioBuffer || !audioBuffer.length) {
            throw new Error("تم إنشاء ملف صوت فارغ");
        }

        return audioBuffer;

    } finally {
        await unlink(outputPath).catch(() => {});
    }
}

export default {
    name: "اغنية",
    aliases: ["اغنيه", "song", "شغل", "music", "أغنيه", "أغنية", "سمعني", "غنيوة"],
    category: "تحميل",

    async run({ sock, m, userJid, args }) {
        const chatId = m.key.remoteJid;

        if (!args || args.length === 0) {
            await sock.sendMessage(chatId, {
                text:
`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🎵┇ تـحـمـيـل أغـنـيـة ┇🎵*

*⎔┄┄─── ⊱╎⌯ 🎵 ⌯╎⊰ ───┄┄⎔*

*┋ 📝 اكـتـب اسـم الأغـنـيـة┋*

*┋ ⬡ [ .اغـنـيـة تـمـلـي مـعـاك ]*
*┋ ⬡ [ .اغـنـيـة shape of you ]*

*┋ ⚙️ الـجـودة : 240kbps┋*

*⎔┄┄─── ⊱╎⌯ 🎵 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            });
            return;
        }

        const songName = args.join(" ").trim();

        await sock.sendMessage(chatId, {
            react: { text: "🎵", key: m.key }
        });

        try {
            await sock.sendMessage(chatId, {
                text:
`*⎔┄┄── ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*

*🔍 جـاري الـبـحـث عـن الأغـنـيـة...*

*⎔┄┄── ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*`
            });

            const video = await searchFirstVideo(songName);

            if (!video || !video.id) {
                throw new Error("نتيجة البحث غير صالحة");
            }

            const videoId = video.id;
            const videoTitle = video.title || "بدون عنوان";
            const videoAuthor =
                video.uploader ||
                video.channel ||
                video.uploader_id ||
                "Unknown";

            const videoDuration = video.duration_string || (
                video.duration != null
                    ? formatDuration(video.duration)
                    : "غير معروف"
            );

            const videoViews = Number(video.view_count || 0);
            const thumbnailUrl = getThumbnailUrl(videoId);

            // 👇 إرسال الصورة + المعلومات (بدل الرسالة النصية العادية)
            await sock.sendMessage(chatId, {
                image: { url: thumbnailUrl },
                caption:
`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ تـم الـعـثـور عـلـى الأغـنـيـة ┋* 🎶

*⎔┄┄─── ⊱╎⌯ 🎵 ⌯╎⊰ ───┄┄⎔*

*┋ الـعـنـوان : ⦓ ${videoTitle} ⦔*

*┋ الـقـنـاة : ⦓ ${videoAuthor} ⦔*

*┋ الـمـدة : ⦓ ${videoDuration} ⦔*

*┋ الـمـشـاهـدات : ⦓ ${videoViews.toLocaleString()} ⦔*

*⎔┄┄─── ⊱╎⌯ 🎵 ⌯╎⊰ ───┄┄⎔*

*┋ جـاري تـحـمـيـل الأغـنـيـة...* ⏳

*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*`,
                mentions: userJid ? [userJid] : []
            }, { quoted: m });

            const audioBuffer = await downloadAndConvert(videoId);

            if (!audioBuffer || !Buffer.isBuffer(audioBuffer) || !audioBuffer.length) {
                throw new Error("لم يتم الحصول على ملف MP3 صالح");
            }

            const sizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);

            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                fileName: `${sanitizeFileName(videoTitle)}.mp3`,
                ptt: false,
                caption:
`*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*

*┋ ${videoTitle}*

*┋ ${videoAuthor}*

*┋ الـحـجـم : ${sizeMB}MB*

*┋ 240kbps*

*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*

*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: false,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: SOLO_CHANNEL_ID,
                        serverMessageId: 1,
                        newsletterName: "𝑺𝑶𝑳𝑶"
                    }
                }
            }, { quoted: m });

            await sock.sendMessage(chatId, {
                react: { text: "✅", key: m.key }
            });

        } catch (error) {
            console.error("❌ Music Error:", error?.message || error);

            await sock.sendMessage(chatId, {
                text:
`*⎔┄┄─── ⊱╎⌯ ❌ ⌯╎⊰ ───┄┄⎔*

*┋ حـدث خـطـأ فـي تـحـمـيـل الأغـنـيـة ┋*

*┋ 📌 ${error?.message || "حـاول مـرة اخـرى"} ┋*

*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            });

            await sock.sendMessage(chatId, {
                react: { text: "❌", key: m.key }
            });
        }
    }
};

function formatDuration(seconds) {
    const total = Number(seconds) || 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = Math.floor(total % 60);

    if (hours > 0) {
        return [
            hours,
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");
    }

    return [
        String(minutes).padStart(2, "0"),
        String(secs).padStart(2, "0")
    ].join(":");
}

function sanitizeFileName(name) {
    return String(name || "song")
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
        .slice(0, 120)
        .trim() || "song";
}