// plugins/ايديت.js
// ⚔️ SOLO EDIT — TIKTOK ONLY + 3 VIDEOS + COMPRESSION ⚔️

import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// ═══════════════════════════════════════════════
// 🎬 تـحـديـد مـسـار ffmpeg تلقائياً
// ═══════════════════════════════════════════════
function setupFfmpeg() {
    const paths = [
        '/data/data/com.termux/files/usr/bin/ffmpeg',
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        'ffmpeg'
    ];

    for (const p of paths) {
        try {
            if (p === 'ffmpeg' || fs.existsSync(p)) {
                ffmpeg.setFfmpegPath(p);
                console.log(`✅ FFmpeg found: ${p}`);
                return;
            }
        } catch {}
    }

    console.log('⚠️ FFmpeg not found');
}

setupFfmpeg();

const API_BASE = 'https://engez.a7a.online/api/v1';
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

// ═══════════════════════════════════════════════
// 🎬 إعـدادات الـضـغـط
// ═══════════════════════════════════════════════
const COMPRESS_THRESHOLD = 30 * 1024 * 1024; // 30MB
const TARGET_SIZE = 20 * 1024 * 1024;        // 20MB

const TT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://www.tiktok.com/',
    'Accept': '*/*',
    'Accept-Encoding': 'identity;q=1, *;q=0',
    'Range': 'bytes=0-'
};

// ═══════════════════════════════════════════════
// 🛠️ أدوات عامة
// ═══════════════════════════════════════════════
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

function formatSize(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

// ═══════════════════════════════════════════════
// 📥 تحميل Buffer
// ═══════════════════════════════════════════════
async function downloadBuffer(url, options = {}) {
    if (!isValidUrl(url)) {
        throw new Error('رابط التحميل غير صالح');
    }

    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: options.timeout || 120000,
        maxRedirects: 5,
        headers: options.headers || {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    const buffer = Buffer.from(response.data);

    if (!buffer || buffer.length < 1024) {
        throw new Error('الملف الراجع فارغ أو تالف');
    }

    return buffer;
}

// ═══════════════════════════════════════════════
// 🎬 ضـغـط الـفـيـديـو
// ═══════════════════════════════════════════════
async function compressVideo(inputBuffer) {
    const tempDir = os.tmpdir();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const inputPath = path.join(tempDir, `solo_input_${id}.mp4`);
    const outputPath = path.join(tempDir, `solo_output_${id}.mp4`);

    try {
        await fs.promises.writeFile(inputPath, inputBuffer);

        const duration = await new Promise((resolve) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) {
                    console.log("⚠️ تعذر قراءة المدة:", err.message);
                    resolve(30);
                    return;
                }
                const d = Number(metadata?.format?.duration);
                resolve(Number.isFinite(d) && d > 0 ? d : 30);
            });
        });

        const targetSize = TARGET_SIZE;
        const audioBitrate = 96 * 1000;

        const targetVideoBitrate = Math.max(
            800000,
            Math.floor(((targetSize * 8) / duration) - audioBitrate)
        );

        console.log("🎬 بدء ضغط الفيديو...");
        console.log("📦 الحجم الأصلي:", formatSize(inputBuffer.length), "MB");
        console.log("⏱️ المدة:", duration.toFixed(2), "ثانية");
        console.log("🎯 Bitrate:", Math.floor(targetVideoBitrate / 1000), "kbps");

        await new Promise((resolve) => {
            ffmpeg(inputPath)
                .outputOptions([
                    "-acodec", "aac",
                    "-b:a", "96k",
                    "-vcodec", "libx264",
                    "-b:v", `${Math.floor(targetVideoBitrate / 1000)}k`,
                    "-preset", "veryfast",
                    "-movflags", "+faststart",
                    "-pix_fmt", "yuv420p",
                    "-vf", "scale=w=min(iw\\,1280):h=-2"
                ])
                .output(outputPath)
                .on("start", command => {
                    console.log("FFmpeg command started");
                })
                .on("progress", progress => {
                    if (progress.percent) {
                        process.stdout.write(
                            `\r🎬 ضغط الفيديو: ${progress.percent.toFixed(1)}%`
                        );
                    }
                })
                .on("error", err => {
                    console.log("\n⚠️ FFmpeg error:", err.message);
                    resolve();
                })
                .on("end", () => {
                    console.log("\n✅ FFmpeg انتهى.");
                    resolve();
                })
                .run();
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        let outputExists = false;
        let outputSize = 0;

        try {
            const stat = await fs.promises.stat(outputPath);
            outputExists = stat.isFile();
            outputSize = stat.size;
        } catch {
            outputExists = false;
        }

        if (!outputExists || outputSize < 1024) {
            throw new Error("FFmpeg فشل - لم يتم إنشاء ملف صالح.");
        }

        console.log("📦 حجم الناتج:", formatSize(outputSize), "MB");

        if (outputSize < inputBuffer.length) {
            const compressedBuffer = await fs.promises.readFile(outputPath);
            console.log(
                "✅ تم الضغط:",
                formatSize(inputBuffer.length),
                "→",
                formatSize(compressedBuffer.length)
            );
            return compressedBuffer;
        }

        console.log("⚠️ الناتج ليس أصغر من الأصلي.");
        return inputBuffer;

    } finally {
        try { await fs.promises.unlink(inputPath); } catch {}
        try { await fs.promises.unlink(outputPath); } catch {}
    }
}

async function prepareVideo(buffer) {
    if (buffer.length <= COMPRESS_THRESHOLD) {
        return { buffer, compressed: false };
    }

    console.log(`⚙️ الفيديو أكبر من 30MB (${formatSize(buffer.length)} MB)`);

    const compressed = await compressVideo(buffer);

    if (!compressed || !compressed.length) {
        throw new Error('فشل إنشاء الفيديو المضغوط');
    }

    return { buffer: compressed, compressed: true };
}

// ═══════════════════════════════════════════════
// 🔎 TikTok SEARCH
// ═══════════════════════════════════════════════
async function searchTikTok(query) {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('type', 'videos');

    const response = await axios.get(
        `${API_BASE}/search/tiktok?${params.toString()}`,
        {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36'
            }
        }
    );

    if (!response.data?.success) {
        throw new Error(response.data?.error || 'فشل البحث');
    }

    const results = response.data.response?.results || [];

    if (!results.length) {
        throw new Error('لا توجد نتائج');
    }

    return results;
}

// ═══════════════════════════════════════════════
// 🎬 استخراج رابط فيديو TikTok
// ═══════════════════════════════════════════════
async function getTikTokVideo(video) {
    let url =
        video.video?.download_url ||
        video.videoUrl ||
        video.play ||
        video.hdplay ||
        video.wmplay;

    if (url) {
        return {
            url,
            title: video.desc || video.title || 'TikTok Edit',
            author: video.author?.name || video.author?.username || 'Unknown'
        };
    }

    if (video.url) {
        const params = new URLSearchParams();
        params.append('url', video.url);

        const response = await axios.get(
            `${API_BASE}/download/tiktok?${params.toString()}`,
            { timeout: 60000 }
        );

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل تحميل تيك توك');
        }

        const data = response.data.response || response.data;

        url =
            data.video?.download_url ||
            data.videoUrl ||
            data.video?.url;

        if (url) {
            return {
                url,
                title: data.desc || video.desc || 'TikTok Edit',
                author: video.author?.name || video.author?.username || 'Unknown'
            };
        }
    }

    throw new Error('لم يتم العثور على رابط فيديو');
}

// ═══════════════════════════════════════════════
// 🎯 جمع 3 إيديتات مختلفة من TikTok
// ═══════════════════════════════════════════════
async function getThreeEdits(query) {
    const results = await searchTikTok(query);

    const shuffled = shuffle(results);
    const edits = [];
    const usedUrls = new Set();

    for (const video of shuffled) {
        if (edits.length >= 3) break;

        try {
            const edit = await getTikTokVideo(video);

            if (!edit?.url) continue;
            if (usedUrls.has(edit.url)) continue;

            usedUrls.add(edit.url);
            edits.push(edit);

            console.log(`✅ إيديت رقم ${edits.length}: ${edit.title}`);
        } catch (e) {
            console.log('⚠️ فشل فيديو:', e.message);
        }
    }

    if (edits.length === 0) {
        throw new Error('لم يتم العثور على أي إيديت');
    }

    return edits;
}

// ═══════════════════════════════════════════════
// ⚔️ SOLO EDIT COMMAND
// ═══════════════════════════════════════════════
export default {
    name: "ايديت",
    aliases: ["ادت","تصميم" ,"إيدت","ايدت","إيديت", "اديت"],
    description: "إرسال 3 فيديوهات إيديت من TikTok",
    category: "تحميل",

    async run({ sock, message, reply, react, args }) {
        const jid = message.key.remoteJid;

        try {
            // ============================================
            // ❌ لازم كلمة بحث
            // ============================================
            if (!args || args.length === 0) {
                await react("☄️");

                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
                   *☄️ ايـديـت*
*───━━━⊱  🎬  ⊰━━━───*

*📌 لازم تكتب اسم الشخصية أو الأنمي أو الموضوع بعد الأمر*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🎬 أمـثـلـة:*

*├─ .ايديت سولو ليفلنج*
*├─ .ايديت ناروتو*
*├─ .ايديت جوجوتسو كايسن*
*└─ .ايديت محمد صلاح*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*💡 هيرجعلك 3 إيديتات من TikTok* 🎵

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰☄️⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // ============================================
            // 🔎 كلمة البحث
            // ============================================
            const query = args.join(' ').trim();

            if (!query) {
                await react("❌");
                return reply(`*❌ يـجـب كـتـابـة كـلـمـة بـحـث*\n📌 مثال: *.ايديت سولو ليفلنج*`);
            }

            const searchQuery = `${query} Edit`;

            await react("☄️");

            // ============================================
            // 🔍 رسالة البحث
            // ============================================
            await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
                 *🔍 الـبـحـث*
*───━━━⊱  ⏳  ⊰━━━───*

*┋ جـاري الـبـحـث عـن الإيـديـتـات...*

*┋ 🔎 الـبـحـث : ⦓ ${searchQuery} ⦔*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);

            // ============================================
            // 🎬 جلب 3 إيديتات
            // ============================================
            let edits;

            try {
                edits = await getThreeEdits(searchQuery);
            } catch (error) {
                await react("❌");
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*❌ لـم أجـد أي فـيـديـو*
*───━━━⊱  🚫  ⊰━━━───*

*📌 الـبـحـث:* ⦓ ${query} ⦔

*📌 جـرب كـلـمـة بـحـث أخـرى*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // ============================================
            // ⏳ جاري التحميل
            // ============================================
            await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
                 *⏳ جـاري الـتـحـمـيـل*
*───━━━⊱  🎬  ⊰━━━───*

*┋ تـم الـعـثـور عـلـى ${edits.length} إيـديـت*

*┋ جـاري تـحـمـيـل الإيـديـتـات...*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);

            // ============================================
            // 🎨 SOLO CAPTION
            // ============================================
            const caption = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*┋ 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻*
*───━━━⊱  🏮  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰☄️⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            // ============================================
            // 📤 إرسال الفيديوهات
            // ============================================
            let sent = 0;

            for (const edit of edits) {
                try {
                    const rawBuffer = await downloadBuffer(edit.url, {
                        timeout: 120000,
                        headers: TT_HEADERS
                    });

                    const rawSizeMB = formatSize(rawBuffer.length);

                    console.log(`📥 إيديت: ${edit.title} (${rawSizeMB} MB)`);

                    let videoBuffer = rawBuffer;
                    let wasCompressed = false;

                    if (rawBuffer.length > COMPRESS_THRESHOLD) {
                        await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*⚙️ جـاري ضـغـط الإيـديـت*
*───━━━⊱  🎬  ⊰━━━───*

*┋ الـحـجـم الأصـلـي : ${rawSizeMB} MB*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);

                        const prepared = await prepareVideo(rawBuffer);
                        videoBuffer = prepared.buffer;
                        wasCompressed = prepared.compressed;
                    }

                    const fileSizeMB = formatSize(videoBuffer.length);

                    await sock.sendMessage(
                        jid,
                        {
                            video: videoBuffer,
                            mimetype: 'video/mp4',
                            caption,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: false,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: SOLO_CHANNEL_ID,
                                    serverMessageId: 1,
                                    newsletterName: '𝑺𝑶𝑳𝑶'
                                }
                            }
                        },
                        { quoted: message }
                    );

                    console.log(`✅ تم إرسال الإيديت ${sent + 1}: ${fileSizeMB} MB${wasCompressed ? ' (مضغوط)' : ''}`);

                    sent++;

                    if (sent < edits.length) {
                        await sleep(1500);
                    }

                } catch (videoError) {
                    console.error(`❌ خطأ في إرسال الإيديت:`, videoError.message);
                }
            }

            // ============================================
            // ❌ فشل إرسال كل الفيديوهات
            // ============================================
            if (sent === 0) {
                await react("❌");
                return reply(`*❌ فـشـل تـحـمـيـل الإيـديـتـات*\n\n📌 جـرب بـحـث آخـر`);
            }

            // ============================================
            // ✅ نجاح
            // ============================================
            await react("✅");

        } catch (error) {
            console.error("❌ SOLO EDIT ERROR:", error);
            await react("❌");

            let errorMsg = `*❌ فـشـل جـلـب الإيـديـتـات*`;

            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMsg = `*❌ الـ API مـشـغـول*\n\n📌 حـاول بـعـد شـويـة`;
            } else if (error.response?.status === 429) {
                errorMsg = `*❌ كـثـرة الـطـلـبـات*\n\n📌 اسـتـنا شـويـة`;
            } else {
                errorMsg = `*❌ فـشـل جـلـب الإيـديـتـات*\n\n📌 ${error.message || 'حـاول مـرة اخـرى'}`;
            }

            await reply(errorMsg);
        }
    }
};