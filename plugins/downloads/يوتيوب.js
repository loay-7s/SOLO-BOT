// plugins/يوتيوب.js
// ⚔️ SOLO YOUTUBE VIDEO DOWNLOADER ⚔️

import youtubedl from "youtube-dl-exec";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const SOLO_CHANNEL_ID = "0029VbCEhNX7DAWrudaFBs41";

const VIDEO_QUALITY = "240p";

const FFMPEG_LOCATION =
    "/data/data/com.termux/files/usr/bin";

// ✅ دالة البحث
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

    const info = await youtubedl(
        `https://www.youtube.com/watch?v=${video.id}`,
        {
            dumpSingleJson: true,
            skipDownload: true,
            noWarnings: true,
            noCheckCertificates: true,
            noPlaylist: true
        }
    );

    return info;
}

// ✅ استخراج ID من الرابط
function extractVideoId(input) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([^"&?\/\s]{11})/,
        /(?:v=)([^"&?\/\s]{11})/
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);

        if (match) {
            return match[1];
        }
    }

    return null;
}

// ✅ تحميل الفيديو + الصوت بدون إعادة ترميز
// FFmpeg هنا يستخدم للدمج فقط وليس للضغط أو التحويل
async function downloadVideo(videoId) {
    const outputBase = join(
        tmpdir(),
        `solo_yt_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );

    const outputTemplate = `${outputBase}.%(ext)s`;

    try {
        const info = await youtubedl(
            `https://www.youtube.com/watch?v=${videoId}`,
            {
                dumpSingleJson: true,
                skipDownload: true,
                noWarnings: true,
                noCheckCertificates: true,
                noPlaylist: true
            }
        );

        const formats = info?.formats || [];

        // أفضل فيديو MP4 لا يتجاوز 240p
        const videoFormats = formats
            .filter(format => {
                const ext = String(format?.ext || "").toLowerCase();

                return (
                    ext === "mp4" &&
                    format?.vcodec &&
                    format.vcodec !== "none" &&
                    Number(format?.height || 0) > 0 &&
                    Number(format.height) <= 240
                );
            })
            .sort((a, b) => {
                const heightA = Number(a?.height || 0);
                const heightB = Number(b?.height || 0);

                if (heightA !== heightB) {
                    return heightB - heightA;
                }

                return Number(b?.tbr || 0) - Number(a?.tbr || 0);
            });

        // أفضل صوت M4A/AAC حتى يكون الدمج داخل MP4 مباشر
        const audioFormats = formats
            .filter(format => {
                const ext = String(format?.ext || "").toLowerCase();

                return (
                    format?.acodec &&
                    format.acodec !== "none" &&
                    (!format?.vcodec || format.vcodec === "none") &&
                    (
                        ext === "m4a" ||
                        String(format?.acodec || "")
                            .toLowerCase()
                            .includes("mp4a")
                    )
                );
            })
            .sort((a, b) => {
                return Number(b?.abr || b?.tbr || 0) -
                    Number(a?.abr || a?.tbr || 0);
            });

        let selectedVideo = videoFormats[0];
        let selectedAudio = audioFormats[0];

        // لو مفيش فيديو MP4 بالضبط ≤240p
        // نبحث عن أقرب فيديو MP4 متاح
        if (!selectedVideo) {
            const fallbackVideoFormats = formats
                .filter(format => {
                    const ext = String(format?.ext || "").toLowerCase();

                    return (
                        ext === "mp4" &&
                        format?.vcodec &&
                        format.vcodec !== "none" &&
                        Number(format?.height || 0) > 0
                    );
                })
                .sort((a, b) => {
                    const distanceA =
                        Math.abs(Number(a?.height || 0) - 240);

                    const distanceB =
                        Math.abs(Number(b?.height || 0) - 240);

                    if (distanceA !== distanceB) {
                        return distanceA - distanceB;
                    }

                    return Number(b?.tbr || 0) -
                        Number(a?.tbr || 0);
                });

            selectedVideo = fallbackVideoFormats[0];
        }

        // لو مفيش M4A، نجيب أفضل Audio متاح
        if (!selectedAudio) {
            const fallbackAudioFormats = formats
                .filter(format => {
                    return (
                        format?.acodec &&
                        format.acodec !== "none" &&
                        (!format?.vcodec ||
                            format.vcodec === "none")
                    );
                })
                .sort((a, b) => {
                    return Number(b?.abr || b?.tbr || 0) -
                        Number(a?.abr || a?.tbr || 0);
                });

            selectedAudio = fallbackAudioFormats[0];
        }

        if (!selectedVideo?.format_id) {
            throw new Error(
                "لم يتم العثور على مسار فيديو مناسب"
            );
        }

        if (!selectedAudio?.format_id) {
            throw new Error(
                "لم يتم العثور على مسار صوت مناسب"
            );
        }

        console.log(
            `🎥 Video: ${selectedVideo.format_id} | ${selectedVideo.height}p | ${selectedVideo.ext}`
        );

        console.log(
            `🔊 Audio: ${selectedAudio.format_id} | ${selectedAudio.acodec} | ${selectedAudio.ext}`
        );

        // تحميل الفيديو والصوت ثم دمجهما
        // yt-dlp يستخدم FFmpeg هنا للـ MUX فقط
        // بدون إعادة ترميز للفيديو أو الصوت
        await youtubedl(
            `https://www.youtube.com/watch?v=${videoId}`,
            {
                format:
                    `${selectedVideo.format_id}+${selectedAudio.format_id}`,

                output: outputTemplate,

                mergeOutputFormat: "mp4",

                ffmpegLocation: FFMPEG_LOCATION,

                noWarnings: true,
                noCheckCertificates: true,
                noPlaylist: true
            },
            {
                timeout: 180000
            }
        );

        const outputPath = `${outputBase}.mp4`;

        const videoBuffer = await readFile(outputPath);

        if (!videoBuffer || !videoBuffer.length) {
            throw new Error(
                "تم إنشاء ملف فيديو فارغ"
            );
        }

        return {
            buffer: videoBuffer,

            quality:
                selectedVideo?.height
                    ? `${selectedVideo.height}p`
                    : VIDEO_QUALITY
        };

    } finally {
        // ملف MP4 النهائي
        await unlink(`${outputBase}.mp4`).catch(() => {});

        // في حالة فشل الدمج قد تظل الملفات المؤقتة موجودة
        await unlink(`${outputBase}.mp4.part`).catch(() => {});
        await unlink(`${outputBase}.webm`).catch(() => {});
        await unlink(`${outputBase}.m4a`).catch(() => {});
        await unlink(`${outputBase}.mp4.part-Frag0`).catch(() => {});
    }
}

export default {
    name: "يوتيوب",

    aliases: [
        "yt",
        "video",
        "فيديو"
    ],

    category: "تحميل",

    async run({
        sock,
        m,
        userJid,
        args
    }) {
        const chatId = m.key.remoteJid;

        if (!args || args.length === 0) {
            await sock.sendMessage(chatId, {
                text:
`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 🎥 تـحـمـيـل فـيـديـو*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 اࢪسـل اسـم الـفـيـديـو او الـرابـط*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.يوتيوب شـرح الـبـرمـجـة* (بحث)

📌 *.يوتيوب https://youtu.be/xxxxx* (رابط)

📌 *.يوتيوب https://youtube.com/shorts/xxxxx* (شورتس)

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            });

            return;
        }

        const input = args.join(" ").trim();

        const isUrl =
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(input);

        await sock.sendMessage(chatId, {
            react: {
                text: "🎥",
                key: m.key
            }
        });

        try {
            let videoId = null;

            let videoTitle = "";
            let videoAuthor = "";
            let videoDuration = "غير معروف";
            let videoViews = 0;

            if (isUrl) {
                videoId = extractVideoId(input);

                if (!videoId) {
                    throw new Error("فشل استخراج ID الفيديو");
                }

            } else {
                const video = await searchFirstVideo(input);

                if (!video || !video.id) {
                    throw new Error("نتيجة البحث غير صالحة");
                }

                videoId = video.id;
            }

            const info = await youtubedl(
                `https://www.youtube.com/watch?v=${videoId}`,
                {
                    dumpSingleJson: true,
                    skipDownload: true,
                    noWarnings: true,
                    noCheckCertificates: true,
                    noPlaylist: true
                }
            );

            videoTitle =
                info?.title ||
                "فيديو يوتيوب";

            videoAuthor =
                info?.uploader ||
                info?.channel ||
                info?.uploader_id ||
                "Unknown";

            videoDuration =
                info?.duration_string ||
                (
                    info?.duration != null
                        ? formatDuration(info.duration)
                        : "غير معروف"
                );

            videoViews =
                Number(info?.view_count || 0);

            await sock.sendMessage(chatId, {
                text:
                    `*⏳ جـاري تـحـمـيـل الـفـيـديـو ...*`
            });

            const videoData =
                await downloadVideo(videoId);

            const videoBuffer =
                videoData.buffer;

            const videoQuality =
                videoData.quality || "240p";

            if (
                !videoBuffer ||
                !Buffer.isBuffer(videoBuffer) ||
                !videoBuffer.length
            ) {
                throw new Error(
                    "لم يتم الحصول على ملف فيديو صالح"
                );
            }

            const fileSizeMB =
                (
                    videoBuffer.length /
                    (1024 * 1024)
                ).toFixed(2);

            if (parseFloat(fileSizeMB) > 50) {
                await sock.sendMessage(chatId, {
                    text:
                        `*❌ حـجـم الـفـيـديـو كـبـيـر جـداً (${fileSizeMB}MB)*\n` +
                        `📌 الـحـد الأقـصـى 50MB`
                });

                return;
            }

            await sock.sendMessage(
                chatId,
                {
                    video: videoBuffer,

                    mimetype: "video/mp4",

                    fileName:
                        `${sanitizeFileName(videoTitle)}.mp4`,

                    caption:
`*⎔┄┄─ ⊱╎⌯ 🎥 ⌯╎⊰─┄┄⎔*

*┋ ${videoTitle}*

*┋ ${videoAuthor}*

*┋ الـجـودة : ${videoQuality}*

*┋ الـحـجـم : ${fileSizeMB} MB*

*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*

*⎔┄┄─ ⊱╎⌯ 🎥 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,

                    contextInfo: {
                        forwardingScore: 999,

                        isForwarded: false,

                        forwardedNewsletterMessageInfo: {
                            newsletterJid:
                                SOLO_CHANNEL_ID,

                            serverMessageId: 1,

                            newsletterName:
                                "𝑺𝑶𝑳𝑶"
                        }
                    }
                },
                {
                    quoted: m
                }
            );

            await sock.sendMessage(chatId, {
                react: {
                    text: "✅",
                    key: m.key
                }
            });

        } catch (error) {
            console.error(
                "❌ YouTube Error:",
                error?.message || error
            );

            await sock.sendMessage(chatId, {
                text:
`*❌ حـدث خـطـأ فـي تـحـمـيـل الـفـيـديـو*

📌 ${
                    error?.message ||
                    "حـاول مـرة اخـرى"
                }`
            });

            await sock.sendMessage(chatId, {
                react: {
                    text: "❌",
                    key: m.key
                }
            });
        }
    }
};

function formatDuration(seconds) {
    const total = Number(seconds) || 0;

    const hours =
        Math.floor(total / 3600);

    const minutes =
        Math.floor((total % 3600) / 60);

    const secs =
        Math.floor(total % 60);

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
    return String(name || "video")
        .replace(
            /[<>:"/\\|?*\u0000-\u001F]/g,
            "_"
        )
        .slice(0, 120)
        .trim() || "video";
}