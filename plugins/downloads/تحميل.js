// plugins/تحميل.js
// ⚔️ SOLO UNIVERSAL DOWNLOADER V5.0 ⚔️

import axios from 'axios';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { fileTypeFromBuffer } from 'file-type';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execPromise = promisify(exec);
const API_BASE = 'https://engez.a7a.online/api/v1';
const API_MULTI = `${API_BASE}/download/all`;
const YT_SEARCH = `${API_BASE}/search/youtube`;
const YT_DOWNLOAD = `${API_BASE}/download/youtubev2`;
const SELECT_SEPARATOR = '|';
const CACHE_TTL_MS = 3 * 60 * 1000;
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";
const mediaCache = new Map();

function getQuotedText(message) {
    try {
        const contextInfo =
            message.message?.extendedTextMessage?.contextInfo ||
            message.message?.imageMessage?.contextInfo ||
            message.message?.videoMessage?.contextInfo ||
            message.message?.documentMessage?.contextInfo;

        const quoted = contextInfo?.quotedMessage;
        if (!quoted) return '';

        return (
            quoted.conversation ||
            quoted.extendedTextMessage?.text ||
            quoted.imageMessage?.caption ||
            quoted.videoMessage?.caption ||
            quoted.documentMessage?.caption ||
            quoted.documentWithCaptionMessage?.message?.documentMessage?.caption ||
            quoted.buttonsResponseMessage?.selectedDisplayText ||
            quoted.listResponseMessage?.title ||
            ''
        ).trim();
    } catch {
        return '';
    }
}

function extractUrl(text) {
    if (!text) return null;

    const match = text.match(/https?:\/\/[^\s<>"']+/i);

    return match
        ? match[0].replace(/[)\]}>.,!?]+$/, '')
        : null;
}

function detectSource(url) {
    const u = url.toLowerCase();

    if (u.includes('mediafire.com')) return 'mediafire';
    if (u.includes('drive.google.com') || u.includes('docs.google.com')) return 'gdrive';
    if (u.includes('mega.nz')) return 'mega';
    if (u.includes('tiktok.com') || u.includes('vt.tiktok.com')) return 'tiktok';
    if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
    if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'facebook';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
    if (u.includes('pinterest.com') || u.includes('pin.it')) return 'pinterest';
    if (u.includes('snapchat.com')) return 'snapchat';
    if (u.includes('likee.video')) return 'likee';
    if (u.includes('threads.net')) return 'threads';

    return 'unknown';
}

async function downloadMediaFire(url) {
    try {
        const response = await axios.get(
            `${API_BASE}/download/mediafire?${new URLSearchParams({ url })}`,
            {
                timeout: 60000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            }
        );

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل التحميل');
        }

        return response.data.data;
    } catch (error) {
        throw new Error(
            error?.response?.data?.error ||
            error.message ||
            'فشل الاتصال'
        );
    }
}

async function downloadFromSource(source, url) {
    try {
        const response = await axios.get(
            `${API_BASE}/download/multi?${new URLSearchParams({ source, url })}`,
            {
                timeout: 120000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            }
        );

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل التحميل');
        }

        return response.data.response;
    } catch (error) {
        throw new Error(
            error?.response?.data?.error ||
            error.message ||
            'فشل الاتصال'
        );
    }
}

async function fetchMediaData(url) {
    const cached = mediaCache.get(url);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached;
    }

    if (cached) mediaCache.delete(url);

    const { data } = await axios.get(
        `${API_MULTI}?url=${encodeURIComponent(url)}`,
        {
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }
    );

    if (!data?.success) {
        throw new Error(
            data?.error ||
            'لم يتم العثور على نتائج'
        );
    }

    const medias = data?.response?.medias;

    if (!Array.isArray(medias) || !medias.length) {
        throw new Error(
            'لا توجد ميديا متاحة لهذا الرابط'
        );
    }

    const result = {
        title: data.response.title || 'بدون عنوان',
        source: data.response.source || 'غير معروف',
        medias,
        timestamp: Date.now()
    };

    mediaCache.set(url, result);

    return result;
}

async function searchYouTube(query) {
    try {
        const response = await axios.get(
            `${YT_SEARCH}?${new URLSearchParams({ q: query })}`,
            {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            }
        );

        if (!response.data?.success) {
            throw new Error(
                response.data?.error ||
                'فشل البحث'
            );
        }

        return response.data.results || [];
    } catch (error) {
        throw new Error(
            error?.response?.data?.error ||
            error.message ||
            'فشل الاتصال'
        );
    }
}

async function downloadYouTubeVideo(url) {
    try {
        const response = await axios.get(
            YT_DOWNLOAD,
            {
                params: {
                    url,
                    type: 'mp4',
                    quality: '240'
                },
                timeout: 120000,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        );

        if (
            !response.data?.success ||
            !response.data.response
        ) {
            throw new Error(
                response.data?.error ||
                'فشل تحميل الفيديو'
            );
        }

        const data = response.data.response;

        const downloadUrl =
            data.download_url ||
            data.downloadUrl ||
            data.url;

        if (!downloadUrl) {
            throw new Error(
                'لم يتم العثور على رابط تحميل الفيديو'
            );
        }

        return {
            title: data.title || 'فيديو يوتيوب',
            author: data.author || 'Unknown',
            duration: data.duration || 'غير معروف',
            downloadUrl,
            thumbnail: data.thumbnail || null,
            quality: '240p'
        };
    } catch (error) {
        throw new Error(
            error?.response?.data?.error ||
            error.message ||
            'فشل تحميل فيديو يوتيوب'
        );
    }
}

function extractYouTubeId(input) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([^"&?\/\s]{11})/i,
        /(?:[?&]v=)([^"&?\/\s]{11})/i
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);

        if (match) {
            return match[1];
        }
    }

    return null;
}

async function downloadTikTok(url, quality = 'auto', extractAudio = false) {
    const response = await axios.get(
        `https://www.tikwm.com/api/?${new URLSearchParams({ url })}`,
        {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        }
    );

    if (response.data.code !== 0) {
        throw new Error(
            'فشل جلب بيانات تيك توك'
        );
    }

    const data = response.data.data;

    if (extractAudio && data.music) {
        const audioResponse = await axios.get(
            data.music,
            {
                responseType: 'arraybuffer',
                timeout: 60000
            }
        );

        return {
            type: 'audio',
            buffer: Buffer.from(audioResponse.data),
            title: data.title || 'بدون عنوان',
            author: data.author?.unique_id || 'Unknown'
        };
    }

    let videoUrl = data.play;

    if (
        quality === '1080' &&
        data.hdplay
    ) {
        videoUrl = data.hdplay;
    }

    const videoResponse = await axios.get(
        videoUrl,
        {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 60000
        }
    );

    return {
        type: 'video',
        buffer: Buffer.from(videoResponse.data),
        title: data.title || 'بدون عنوان',
        author: data.author?.unique_id || 'Unknown',
        quality
    };
}

async function downloadInstagram(url) {
    const response = await axios.get(
        `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(url)}`,
        {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        }
    );

    let medias = [];

    if (Array.isArray(response.data?.result)) {
        medias = response.data.result;
    } else {
        function findMedia(obj) {
            if (!obj) return;

            if (Array.isArray(obj)) {
                for (const item of obj) {
                    findMedia(item);
                }
            } else if (typeof obj === 'object') {
                if (
                    obj.url &&
                    (
                        obj.url.includes('.mp4') ||
                        obj.type === 'video'
                    )
                ) {
                    medias.push({
                        type: 'video',
                        url: obj.url
                    });
                } else if (
                    obj.url &&
                    (
                        obj.url.includes('.jpg') ||
                        obj.url.includes('.jpeg') ||
                        obj.url.includes('.png')
                    )
                ) {
                    medias.push({
                        type: 'image',
                        url: obj.url
                    });
                }

                if (obj.displayUrl) {
                    medias.push({
                        type: 'image',
                        url: obj.displayUrl
                    });
                }

                if (obj.videoUrl) {
                    medias.push({
                        type: 'video',
                        url: obj.videoUrl
                    });
                }

                if (obj.downloadUrl) {
                    medias.push({
                        type: 'video',
                        url: obj.downloadUrl
                    });
                }

                if (
                    obj.audio_url ||
                    obj.audioUrl ||
                    obj.music_url ||
                    obj.musicUrl
                ) {
                    medias.push({
                        type: 'audio',
                        url:
                            obj.audio_url ||
                            obj.audioUrl ||
                            obj.music_url ||
                            obj.musicUrl
                    });
                }

                for (const key in obj) {
                    findMedia(obj[key]);
                }
            }
        }

        findMedia(response.data);
    }

    return medias.filter(
        (v, i, a) =>
            a.findIndex(
                t => t.url === v.url
            ) === i
    );
}

async function downloadFacebook(url) {
    const response = await axios.get(
        `${API_BASE}/download/facebook?${new URLSearchParams({ url })}`,
        {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        }
    );

    if (!response.data?.success) {
        throw new Error(
            response.data?.error ||
            'فشل التحميل'
        );
    }

    return response.data.response;
}

async function downloadBuffer(url) {
    const response = await axios.get(
        url,
        {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxRedirects: 5,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
                Accept: '*/*'
            }
        }
    );

    return Buffer.from(response.data);
}

// ============================================================
// 🎵 تحويل الفيديو إلى MP3 - 64kbps
// ============================================================

async function extractAudioFromVideo(buffer) {
    const tempDir =
        path.join(process.cwd(), 'temp');

    await fs.ensureDir(tempDir);

    const id =
        `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const inputPath =
        path.join(
            tempDir,
            `video_${id}.mp4`
        );

    const outputPath =
        path.join(
            tempDir,
            `audio_${id}.mp3`
        );

    try {
        await fs.writeFile(
            inputPath,
            buffer
        );

        await execPromise(
            `ffmpeg -y -i "${inputPath}" -vn -c:a libmp3lame -b:a 64k -ar 44100 -ac 2 "${outputPath}"`,
            {
                timeout: 180000
            }
        );

        if (
            !await fs.pathExists(outputPath)
        ) {
            throw new Error(
                'فشل تحويل الفيديو إلى MP3'
            );
        }

        const audioBuffer =
            await fs.readFile(outputPath);

        if (
            !audioBuffer ||
            audioBuffer.length < 1024
        ) {
            throw new Error(
                'ملف الصوت الناتج غير صالح'
            );
        }

        return audioBuffer;
    } finally {
        await fs.remove(inputPath)
            .catch(() => {});

        await fs.remove(outputPath)
            .catch(() => {});
    }
}

async function sendAudio(
    sock,
    chatId,
    buffer,
    title,
    author,
    quoted,
    quality = '64kbps'
) {
    const size =
        (buffer.length / (1024 * 1024))
            .toFixed(2);

    if (parseFloat(size) > 20) {
        throw new Error(
            `حجم الصوت كبير جداً (${size}MB) والحد الأقصى 20MB`
        );
    }

    const safeTitle =
        (title || 'audio')
            .replace(
                /[\\/:*?"<>|]/g,
                '_'
            );

    const caption =
        `*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*\n` +
        `*┋ ${title || 'صوت'}*\n` +
        `*┋ ${author || 'Unknown'}*\n` +
        `*┋ ${quality}*\n` +
        `*┋ الـحـجـم : ${size} MB*\n` +
        `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n` +
        `*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*\n` +
        `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

    await sock.sendMessage(
        chatId,
        {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${safeTitle}.mp3`,
            caption,
            ptt: false,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: false,
                forwardedNewsletterMessageInfo: {
                    newsletterJid:
                        SOLO_CHANNEL_ID,
                    serverMessageId: 1,
                    newsletterName: '𝑺𝑶𝑳𝑶'
                }
            }
        },
        {
            quoted
        }
    );
}

async function sendFile(
    sock,
    chatId,
    buffer,
    filename,
    caption,
    quoted
) {
    const fileInfo =
        await fileTypeFromBuffer(buffer);

    let ext =
        fileInfo?.ext || 'bin';

    let mimeType =
        fileInfo?.mime ||
        'application/octet-stream';

    if (!fileInfo && filename) {
        const match =
            filename.match(/\.([^.]+)$/);

        if (match) {
            ext =
                match[1].toLowerCase();
        }

        const mimeMap = {
            pdf: 'application/pdf',
            zip: 'application/zip',
            rar: 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            mp4: 'video/mp4',
            mkv: 'video/x-matroska',
            avi: 'video/x-msvideo',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp'
        };

        mimeType =
            mimeMap[ext] ||
            mimeType;
    }

    const isVideo =
        [
            'mp4',
            'mkv',
            'avi',
            'mov',
            'webm'
        ].includes(ext);

    const isAudio =
        [
            'mp3',
            'wav',
            'flac',
            'm4a',
            'aac',
            'ogg',
            'opus',
            'webm'
        ].includes(ext);

    const isImage =
        [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'webp',
            'bmp'
        ].includes(ext);

    if (isVideo) {
        await sock.sendMessage(
            chatId,
            {
                video: buffer,
                mimetype: mimeType,
                caption
            },
            {
                quoted
            }
        );
    } else if (isAudio) {
        await sock.sendMessage(
            chatId,
            {
                audio: buffer,
                mimetype: mimeType,
                ptt: false,
                caption
            },
            {
                quoted
            }
        );
    } else if (isImage) {
        await sock.sendMessage(
            chatId,
            {
                image: buffer,
                mimetype: mimeType,
                caption
            },
            {
                quoted
            }
        );
    } else {
        await sock.sendMessage(
            chatId,
            {
                document: buffer,
                mimetype: mimeType,
                fileName:
                    filename ||
                    `file.${ext}`,
                caption
            },
            {
                quoted
            }
        );
    }
}

async function sendSingleMedia(
    sock,
    chatId,
    media,
    title,
    quoted
) {
    const buffer =
        await downloadBuffer(
            media.url
        );

    const quality =
        media.quality ||
        'غير معروف';

    const caption =
        `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*\n` +
        `*┋ تـم الـتـحـمـيـل بـنـجـاح* ✅\n` +
        `*┋ الـعـنـوان : ${(title || 'بدون عنوان').substring(0, 50)}*\n` +
        `*┋ الـمـصـدر : ${media.source || 'غير معروف'}*\n` +
        `*┋ الـجـودة : ${quality}*\n` +
        `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n` +
        `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n` +
        `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

    await sendFile(
        sock,
        chatId,
        buffer,
        null,
        caption,
        quoted
    );
}

async function sendQualityList(
    sock,
    chatId,
    quoted,
    url,
    title,
    source,
    medias
) {
    const rows =
        medias.map(
            (media, index) => {
                const isVideo =
                    media.type === 'video';

                const icon =
                    isVideo
                        ? '🎬'
                        : media.type === 'audio'
                            ? '🎵'
                            : '🖼️';

                const typeLabel =
                    isVideo
                        ? 'فيديو'
                        : media.type === 'audio'
                            ? 'صوت'
                            : 'صورة';

                const quality =
                    media.quality ||
                    'غير معروف';

                return {
                    header:
                        `${typeLabel} #${index + 1}`,

                    title:
                        `${icon} ${quality}`,

                    description:
                        `تحميل ${typeLabel} بجودة ${quality}`,

                    id:
                        `.تحميل ${url}${SELECT_SEPARATOR}${index}`
                };
            }
        );

    const contentMsg = {
        contentText:
            `*⎔┄┄─ ⊱╎⌯ 📋 ⌯╎⊰─┄┄⎔*\n` +
            `*┋ اخـتـر الـجـودة أو نـوع الـمـيـديـا:*\n\n` +
            `*┋ الـعـنـوان : ${title.substring(0, 50)}*\n` +
            `*┋ الـمـصـدر : ${source}*\n\n` +
            `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`,

        footerText:
            '📥 اختر من القائمة للتحميل',

        buttons: [{
            buttonId:
                `.قائمة_تحميل`,

            buttonText: {
                displayText:
                    '📋 قـائـمـة الـجـودات'
            },

            type: 1,

            nativeFlowInfo: {
                name:
                    'single_select',

                paramsJson:
                    JSON.stringify({
                        title:
                            '📥 اختر جودة الميديا',

                        sections: [{
                            title:
                                '📥 اختر جودة/نوع الميديا',

                            highlight_label:
                                `📥 ${medias.length} خيار متاح`,

                            rows
                        }]
                    })
            }
        }],

        headerType: 1
    };

    const waMsg =
        generateWAMessageFromContent(
            chatId,
            {
                buttonsMessage:
                    contentMsg
            },
            {
                quoted
            }
        );

    await sock.relayMessage(
        chatId,
        waMsg.message,
        {
            messageId:
                waMsg.key.id
        }
    );
}

export default {
    name: "تحميل",

    aliases: [
        "حمل",
        "dl",
        "download",
        "ميديا",
        "mediafire",
        "درايف",
        "gdrive",
        "ميجا",
        "mega"
    ],

    description:
        "تحميل شامل من جميع المواقع مع تحميل الصوت",

    category: "تحميل",
    developer: false,
    group: false,
    private: false,

    async run({
        sock,
        message,
        args,
        reply,
        react,
        userJid
    }) {
        const chatId =
            message.key.remoteJid;

        const directInput = args?.join(' ').trim() || '';
const quotedText = getQuotedText(message);

const firstArg = String(args?.[0] || '').trim().toLowerCase();
const isAudioRequest = firstArg === 'صوت' || firstArg === 'audio';

const cleanedInput = isAudioRequest
    ? args.slice(1).join(' ').trim()
    : directInput;

const inputSource = cleanedInput || quotedText;
const url = extractUrl(inputSource);

        if (!url) {
            await react("📥");

            return reply(
                `*╭─〔 📥 تـحـمـيـل شـامـل 〕─╮* 
*│*
*│ • .تحميل https://youtube.com/xxxx*
*│ ↳ تحميل الفيديو من الرابط.*
*│*

*│• .تحميل صوت https://youtube.com/xxxx*
*│ ↳ تحميل الصوت فقط .*
*│*

*│ • اعمل ريبلاي على رسالة فيها رابط*
*│ ↳ ثم اكتب .تحميل لتحميل الرابط.*
*│*

*│ • اعمل ريبلاي على رسالة فيها رابط*
*│ ↳ ثم اكتب .تحميل صوت لتحميل الصوت فقط.*
*│*

*│ ⚡ لا تحتاج ان تحدد اسم الموقع،*
*│ البوت يتعرف عليه تلقائياً.*


*│▶️ YouTube + Shorts*
*│🎵 TikTok*
*│📸 Instagram*
*│🟦 Facebook*
*│📁 MediaFire*
*│☁️ Google Drive*
*│🔗 Mega*
*│🐦 X / Twitter*
*│📌 Pinterest*
*│👻 Snapchat*
*│🎬 Likee*
*│🧵 Threads*
*➕ ومـواقـع أخـرى مـدعـومـة*
*╰──────────────────╯*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }

        const source =
            detectSource(url);

        try {
            // ====================================================
            // 🎵 تحميل الصوت
            // ====================================================

            if (isAudioRequest) {
                await react("🎵");

                await reply(
                    `*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ جـاري تـحـمـيـل الـصـوت...*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                // ==================================================
                // 🎵 YouTube
                // يجلب الفيديو أولاً ثم يحوله إلى MP3 64kbps
                // ==================================================

                if (source === 'youtube') {
                    const videoId =
                        extractYouTubeId(url);

                    if (!videoId) {
                        throw new Error(
                            'رابط يوتيوب غير صالح'
                        );
                    }

                    const data =
                        await downloadYouTubeVideo(
                            `https://youtube.com/watch?v=${videoId}`
                        );

                    const videoBuffer =
                        await downloadBuffer(
                            data.downloadUrl
                        );

                    const audioBuffer =
                        await extractAudioFromVideo(
                            videoBuffer
                        );

                    await sendAudio(
                        sock,
                        chatId,
                        audioBuffer,
                        data.title,
                        data.author,
                        message,
                        '64kbps'
                    );

                    await react("✅");
                    return;
                }

                // ==================================================
                // 🎵 TikTok
                // ==================================================

                if (source === 'tiktok') {
                    const result =
                        await downloadTikTok(
                            url,
                            'auto',
                            false
                        );

                    const audioBuffer =
                        await extractAudioFromVideo(
                            result.buffer
                        );

                    await sendAudio(
                        sock,
                        chatId,
                        audioBuffer,
                        result.title,
                        result.author,
                        message,
                        '64kbps'
                    );

                    await react("✅");
                    return;
                }

                // ==================================================
                // 🎵 Instagram
                // ==================================================

                if (source === 'instagram') {
                    const medias =
                        await downloadInstagram(url);

                    const videoMedia =
                        medias.find(
                            x => x.type === 'video'
                        );

                    if (!videoMedia) {
                        throw new Error(
                            'لم يتم العثور على فيديو لتحويله إلى صوت'
                        );
                    }

                    const videoBuffer =
                        await downloadBuffer(
                            videoMedia.url
                        );

                    const audioBuffer =
                        await extractAudioFromVideo(
                            videoBuffer
                        );

                    await sendAudio(
                        sock,
                        chatId,
                        audioBuffer,
                        'Instagram Audio',
                        'Instagram',
                        message,
                        '64kbps'
                    );

                    await react("✅");
                    return;
                }

                // ==================================================
                // 🎵 Facebook
                // ==================================================

                if (source === 'facebook') {
                    const data =
                        await downloadFacebook(url);

                    const videoUrl =
                        data.hd ||
                        data.sd;

                    if (!videoUrl) {
                        throw new Error(
                            'لم يتم العثور على فيديو'
                        );
                    }

                    const videoBuffer =
                        await downloadBuffer(
                            videoUrl
                        );

                    const audioBuffer =
                        await extractAudioFromVideo(
                            videoBuffer
                        );

                    await sendAudio(
                        sock,
                        chatId,
                        audioBuffer,
                        data.title ||
                            'Facebook Audio',
                        'Facebook',
                        message,
                        '64kbps'
                    );

                    await react("✅");
                    return;
                }

                // ==================================================
                // 🎵 باقي المواقع
                // ==================================================

                const result =
                    await fetchMediaData(url);

                const videoMedia =
                    result.medias.find(
                        x => x.type === 'video'
                    );

                if (!videoMedia) {
                    throw new Error(
                        'هذا الرابط لا يحتوي على فيديو يمكن استخراج الصوت منه'
                    );
                }

                const videoBuffer =
                    await downloadBuffer(
                        videoMedia.url
                    );

                const audioBuffer =
                    await extractAudioFromVideo(
                        videoBuffer
                    );

                await sendAudio(
                    sock,
                    chatId,
                    audioBuffer,
                    result.title,
                    result.source,
                    message,
                    '64kbps'
                );

                await react("✅");
                return;
            }

            // ====================================================
            // 🎥 YouTube Video + Shorts - 240p
            // ====================================================

            if (source === 'youtube') {
                await react("🎥");

                await reply(
                    `*⎔┄┄─ ⊱╎⌯ 🎥 ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ جـاري تـحـمـيـل فـيـديـو يـوتـيـوب بـجـودة 240p...*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                const videoId =
                    extractYouTubeId(url);

                if (!videoId) {
                    throw new Error(
                        'رابط يوتيوب غير صالح'
                    );
                }

                const data =
                    await downloadYouTubeVideo(
                        `https://youtube.com/watch?v=${videoId}`
                    );

                const buffer =
                    await downloadBuffer(
                        data.downloadUrl
                    );

                const size =
                    (buffer.length /
                        (1024 * 1024))
                        .toFixed(2);

                if (parseFloat(size) > 50) {
                    throw new Error(
                        `حجم الفيديو كبير جداً (${size}MB) والحد الأقصى 50MB`
                    );
                }

                const caption =
                    `*⎔┄┄─ ⊱╎⌯ 🎥 ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ ${data.title}*\n` +
                    `*┋ ${data.author}*\n` +
                    `*┋ الـجـودة : 240p*\n` +
                    `*┋ الـحـجـم : ${size} MB*\n` +
                    `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🎥 ⌯╎⊰─┄┄⎔*\n` +
                    `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                await sock.sendMessage(
                    chatId,
                    {
                        video: buffer,
                        mimetype:
                            'video/mp4',
                        fileName:
                            `${data.title}.mp4`,
                        caption,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: false,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid:
                                    SOLO_CHANNEL_ID,
                                serverMessageId: 1,
                                newsletterName:
                                    '𝑺𝑶𝑳𝑶'
                            }
                        }
                    },
                    {
                        quoted: message
                    }
                );

                await react("✅");
                return;
            }

            // ====================================================
            // 📁 MediaFire
            // ====================================================

            if (source === 'mediafire') {
                await react("⏳");

                await reply(
                    `*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ جـاري تـحـمـيـل مـن مـيـديـا فـايـر...*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                const result =
                    await downloadMediaFire(url);

                if (!result?.download) {
                    throw new Error(
                        'لم يتم العثور على رابط التحميل'
                    );
                }

                const buffer =
                    await downloadBuffer(
                        result.download
                    );

                const caption =
                    `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ تـم الـتـحـمـيـل مـن مـيـديـا فـايـر* ✅\n` +
                    `*┋ الـمـلـف : ${result.filename || 'ملف'}*\n` +
                    `*┋ الـحـجـم : ${result.size || 'غير معروف'}*\n` +
                    `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n` +
                    `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                await sendFile(
                    sock,
                    chatId,
                    buffer,
                    result.filename,
                    caption,
                    message
                );

                await react("✅");
                return;
            }

            // ====================================================
            // 🎵 TikTok
            // ====================================================

            if (source === 'tiktok') {
                const quality =
                    directInput.includes('1080')
                        ? '1080'
                        : directInput.includes('720')
                            ? '720'
                            : 'auto';

                await react("⏳");

                await reply(
                    `*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ جـاري تـحـمـيـل تـيـك تـوك...*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                const result =
                    await downloadTikTok(
                        url,
                        quality,
                        false
                    );

                const caption =
                    `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ تـم الـتـحـمـيـل مـن تـيـك تـوك* ✅\n` +
                    `*┋ ${result.title}*\n` +
                    `*┋ ${result.author}*\n` +
                    `*┋ الـجـودة : ${result.quality}*\n` +
                    `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`;

                await sock.sendMessage(
                    chatId,
                    {
                        video: result.buffer,
                        mimetype:
                            'video/mp4',
                        caption
                    },
                    {
                        quoted: message
                    }
                );

                await react("✅");
                return;
            }

            // ====================================================
            // 📸 Instagram
            // ====================================================

            if (source === 'instagram') {
                await react("⏳");

                await reply(
                    `*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ جـاري تـحـمـيـل مـن انـسـتـجـرام...*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                const medias =
                    await downloadInstagram(url);

                if (!medias.length) {
                    throw new Error(
                        'لم يتم العثور على ميديا'
                    );
                }

                for (const media of medias) {
                    if (
                        media.type === 'audio'
                    ) {
                        continue;
                    }

                    const buffer =
                        await downloadBuffer(
                            media.url
                        );

                    const caption =
                        `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*\n` +
                        `*┋ تـم الـتـحـمـيـل مـن انـسـتـجـرام* ✅\n` +
                        `*┋ ${media.type === 'video' ? 'فيديو' : 'صورة'}*\n` +
                        `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n` +
                        `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`;

                    if (
                        media.type === 'video'
                    ) {
                        await sock.sendMessage(
                            chatId,
                            {
                                video: buffer,
                                mimetype:
                                    'video/mp4',
                                caption
                            },
                            {
                                quoted: message
                            }
                        );
                    } else {
                        await sock.sendMessage(
                            chatId,
                            {
                                image: buffer,
                                caption
                            },
                            {
                                quoted: message
                            }
                        );
                    }
                }

                await react("✅");
                return;
            }

            // ====================================================
            // 🟦 Facebook
            // ====================================================

            if (source === 'facebook') {
                await react("⏳");

                await reply(
                    `*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ جـاري تـحـمـيـل مـن فـيـسـبـوك...*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                const data =
                    await downloadFacebook(url);

                const videoUrl =
                    data.hd ||
                    data.sd;

                if (!videoUrl) {
                    throw new Error(
                        'لا يوجد رابط فيديو'
                    );
                }

                await sock.sendMessage(
                    chatId,
                    {
                        video: {
                            url: videoUrl
                        },
                        caption:
                            `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*\n` +
                            `*┋ تـم الـتـحـمـيـل مـن فـيـسـبـوك* ✅\n` +
                            `*┋ ${data.title?.substring(0, 60) || 'فيديو فيسبوك'}*\n` +
                            `*┋ الـجـودة : ${data.hd ? 'HD ✅' : 'SD'}*\n` +
                            `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n` +
                            `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                    },
                    {
                        quoted: message
                    }
                );

                await react("✅");
                return;
            }

            // ====================================================
            // ☁️ Google Drive / Mega
            // ====================================================

            if (
                source === 'gdrive' ||
                source === 'mega'
            ) {
                await react("⏳");

                await reply(
                    `*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n` +
                    `*┋ جـاري الـتـحـمـيـل مـن ${source}...*\n` +
                    `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                const result =
                    await downloadFromSource(
                        source,
                        url
                    );

                if (!result?.downloadUrl) {
                    throw new Error(
                        'لم يتم العثور على رابط التحميل'
                    );
                }

                await sock.sendMessage(
                    chatId,
                    {
                        document: {
                            url:
                                result.downloadUrl
                        },
                        mimetype:
                            result.mimeType ||
                            'application/octet-stream',
                        fileName:
                            result.fileName ||
                            `file.${result.ext || 'bin'}`,
                        caption:
                            `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*\n` +
                            `*┋ تـم الـتـحـمـيـل بـنـجـاح* ✅\n` +
                            `*┋ الـمـصـدر : ${result.source || source}*\n` +
                            `*┋ الـمـلـف : ${result.fileName || 'ملف'}*\n` +
                            `*┋ الـحـجـم : ${result.fileSize || 'غير معروف'}*\n` +
                            `*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*`
                    },
                    {
                        quoted: message
                    }
                );

                await react("✅");
                return;
            }

            // ====================================================
            // 🌐 باقي المواقع
            // ====================================================

            await react("⏳");

            await reply(
                `*⎔┄┄─ ⊱╎⌯ 🔍 ⌯╎⊰─┄┄⎔*\n` +
                `*┋ جـاري الـبـحـث عـن الـمـيـديـا...*\n` +
                `*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
            );

            const {
                title,
                source: mediaSource,
                medias
            } = await fetchMediaData(url);

            if (medias.length === 1) {
                await sendSingleMedia(
                    sock,
                    chatId,
                    medias[0],
                    title,
                    message
                );

                await react("✅");
            } else {
                await sendQualityList(
                    sock,
                    chatId,
                    message,
                    url,
                    title,
                    mediaSource,
                    medias
                );

                await react("📋");
            }
        } catch (error) {
            console.error(
                "❌ Download Error:",
                error
            );

            await react("❌");

            await reply(
                `*╭─━━━━━━━━━━━━━━━━━━━─╮*\n` +
                `*│ ❌ فـشـل الـتـحـمـيـل ❌*\n` +
                `*╰─━━━━━━━━━━━━━━━━━━━─╯*\n\n` +
                `⚠️ *${error.message || 'الخادم مشغول حالياً'}*\n\n` +
                `📌 *تأكد من صحة الرابط وحاول مرة أخرى*\n\n` +
                `~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }
    }
};