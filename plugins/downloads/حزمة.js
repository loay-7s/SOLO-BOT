// plugins/حزمة.js
// ⚔️ SOLO STICKER PACK SYSTEM ⚔️

import axios from 'axios';
import crypto from 'crypto';
import https from 'https';
import JSZip from 'jszip';
import translate from 'translate-google-api';
import * as cheerio from 'cheerio';

const API_BASE = 'https://engez.a7a.online/api/v1';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

function toB64Url(buffer) {
    return Buffer.from(buffer)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function isWebP(buffer) {
    return buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP';
}

function isAnimatedWebP(buffer) {
    if (!isWebP(buffer)) return false;

    let offset = 12;

    while (offset < buffer.length - 8) {
        const chunk = buffer.toString('ascii', offset, offset + 4);
        const size = buffer.readUInt32LE(offset + 4);

        if (chunk === 'VP8X' && (buffer[offset + 8] & 0x02)) return true;
        if (chunk === 'ANIM' || chunk === 'ANMF') return true;

        offset += 8 + size + (size % 2);
    }

    return false;
}

// ✅ دالة إضافة EXIF للملصق
async function addExifToSticker(buffer, packname, author) {
    const { default: webp } = await import('node-webpmux');
    const img = new webp.Image();
    const exif = {
        "sticker-pack-id": `solo-pack-${Date.now()}`,
        "sticker-pack-name": packname || "𝑺𝑶𝑳𝑶 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 🏮",
        "sticker-pack-publisher": author || `╔══════════════════╗
║ 𓆩🍷𓆪『𝑺𝑶𝑳𝑶★𝑩𝑶𝑻』𓆩🍷𓆪  ║
╠══════════════════╣
║ 𝑩𝑶𝑹𝑵 𝑭𝑹𝑶𝑴 𝑪𝑶𝑫𝑬 ║
║ 𝑩𝑼𝑰𝑳𝑻 𝑭𝑶𝑹 𝑳𝑬𝑮𝑬𝑵𝑫𝑺 ║
╠══════════════════╣
   ⚝ 𝑼𝑵𝑲𝑵𝑶𝑾𝑵 ⚝   ║
╚══════════════════╝`,
        "emojis": ["✨"]
    };

    await img.load(buffer);

    const exifHeader = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(exif), "utf-8");
    const exifFinal = Buffer.concat([exifHeader, jsonBuffer]);
    exifFinal.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exifFinal;
    return await img.save(null);
}

async function imageToWebp(buffer) {
    const sharpMod = await import('sharp').catch(() => null);
    if (!sharpMod?.default) throw new Error('Install sharp first: npm i sharp');

    return await sharpMod.default(buffer)
        .resize(512, 512, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();
}

async function makeTrayWebp(buffer) {
    const sharpMod = await import('sharp').catch(() => null);
    if (!sharpMod?.default) throw new Error('Install sharp first: npm i sharp');

    return await sharpMod.default(buffer)
        .resize(252, 252, { fit: 'cover' })
        .webp()
        .toBuffer();
}

async function makeBlankTrayWebp() {
    const sharpMod = await import('sharp').catch(() => null);
    if (!sharpMod?.default) throw new Error('Install sharp first: npm i sharp');

    return await sharpMod.default({
        create: {
            width: 252,
            height: 252,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    }).webp().toBuffer();
}

async function makeThumbnailJpeg(buffer) {
    const sharpMod = await import('sharp').catch(() => null);
    if (!sharpMod?.default) throw new Error('Install sharp first: npm i sharp');

    return await sharpMod.default(buffer)
        .resize(252, 252, { fit: 'cover' })
        .jpeg()
        .toBuffer();
}

async function uploadToServer(conn, buffer, { hkdf, mediaPath, mediaKey = crypto.randomBytes(32) }) {
    const expanded = Buffer.from(
        crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(32), Buffer.from(hkdf), 112),
    );

    const iv = expanded.subarray(0, 16);
    const cipherKey = expanded.subarray(16, 48);
    const macKey = expanded.subarray(48, 80);

    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    const mac = crypto
        .createHmac('sha256', macKey)
        .update(iv)
        .update(encrypted)
        .digest()
        .subarray(0, 10);

    const encBuffer = Buffer.concat([encrypted, mac]);

    const fileSha256 = sha256(buffer);
    const fileEncSha256 = sha256(encBuffer);

    const iq = await conn.query({
        tag: 'iq',
        attrs: {
            id: conn.generateMessageTag?.() ?? Date.now().toString(),
            to: 's.whatsapp.net',
            type: 'set',
            xmlns: 'w:m',
        },
        content: [{ tag: 'media_conn', attrs: {} }],
    });

    const mediaConn = iq.content?.find(v => v.tag === 'media_conn');
    if (!mediaConn) throw new Error('media_conn not found');

    const auth = mediaConn.attrs?.auth;
    if (!auth) throw new Error('media auth not found');

    const hosts = (mediaConn.content || [])
        .filter(v => v.tag === 'host')
        .map(v => v.attrs?.hostname)
        .filter(Boolean);

    if (!hosts.length) throw new Error('upload hosts not found');

    const token = encodeURIComponent(
        fileEncSha256.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    );

    let lastError;

    for (const host of hosts) {
        try {
            const json = await new Promise((resolve, reject) => {
                const url = new URL(
                    `https://${host}${mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`
                );

                const req = https.request(
                    {
                        hostname: url.hostname,
                        port: 443,
                        path: url.pathname + url.search,
                        method: 'POST',
                        headers: {
                            Origin: 'https://web.whatsapp.com',
                            Referer: 'https://web.whatsapp.com/',
                            'Content-Type': 'application/octet-stream',
                            'Content-Length': encBuffer.length,
                        },
                    },
                    (res) => {
                        let body = '';
                        res.on('data', c => body += c);
                        res.on('end', () => {
                            if (res.statusCode < 200 || res.statusCode >= 300) {
                                return reject(new Error(`Upload failed ${res.statusCode}: ${body}`));
                            }
                            try {
                                resolve(JSON.parse(body));
                            } catch {
                                reject(new Error(`Invalid JSON response: ${body}`));
                            }
                        });
                    }
                );

                req.on('error', reject);
                req.write(encBuffer);
                req.end();
            });

            const directPath = json.direct_path ?? json.directPath ?? json.url ?? json.path;
            if (!directPath) throw new Error('directPath not found');

            return {
                mediaKey,
                fileLength: buffer.length,
                fileSha256,
                fileEncSha256,
                directPath,
                ...json,
            };
        } catch (e) {
            lastError = e;
        }
    }

    throw lastError ?? new Error('All upload hosts failed');
}

async function sendCustomStickerPack(sock, m, pack, meta = {}) {
    const chatId = m.key.remoteJid;
    const zip = new JSZip();
    const stickersMetadata = [];

    for (const item of pack) {
        const fileName = `${toB64Url(sha256(item.buffer))}.${item.ext}`;
        zip.file(fileName, item.buffer);

        stickersMetadata.push({
            fileName,
            isAnimated: item.isAnimated,
            emojis: ['✨'],
            accessibilityLabel: '',
            isLottie: item.isLottie,
            mimetype: item.mimetype,
        });
    }

    const trayIconFileName = 'tray_icon.webp';
    const traySource = pack.find(v => !v.isLottie)?.buffer;
    const trayBuffer = traySource ? await makeTrayWebp(traySource) : await makeBlankTrayWebp();

    zip.file(trayIconFileName, trayBuffer);

    const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });

    const packUpload = await uploadToServer(sock, archive, {
        hkdf: 'WhatsApp Sticker Pack Keys',
        mediaPath: '/mms/sticker-pack',
    });

    const thumbnailBuffer = await makeThumbnailJpeg(trayBuffer);

    const thumbUpload = await uploadToServer(sock, thumbnailBuffer, {
        hkdf: 'WhatsApp Sticker Pack Thumbnail Keys',
        mediaPath: '/mms/thumbnail-sticker-pack',
        mediaKey: packUpload.mediaKey,
    });

    await sock.relayMessage(
        chatId,
        {
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32),
            },
            stickerPackMessage: {
                stickerPackId: 'SOLO_' + crypto.randomBytes(8).toString('hex'),
                name: `𝑺𝑶𝑳𝑶 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 🏮`,
                publisher: `╔══════════════════╗
║ 𓆩🍷𓆪『𝑺𝑶𝑳𝑶★𝑩𝑶𝑻』𓆩🍷𓆪  ║
╠══════════════════╣
║ 𝑩𝑶𝑹𝑵 𝑭𝑹𝑶𝑴 𝑪𝑶𝑫𝑬 ║
║ 𝑩𝑼𝑰𝑳𝑻 𝑭𝑶𝑹 𝑳𝑬𝑮𝑬𝑵𝑫𝑺 ║
╠══════════════════╣
   ⚝ 𝑼𝑵𝑲𝑵𝑶𝑾𝑵 ⚝   ║
╚══════════════════╝`,
                packDescription: `𝑺𝑶𝑳𝑶%𝑷𝑨𝑪𝑲`,
                stickers: stickersMetadata,
                fileLength: packUpload.fileLength,
                fileSha256: packUpload.fileSha256,
                fileEncSha256: packUpload.fileEncSha256,
                mediaKey: packUpload.mediaKey,
                directPath: packUpload.directPath,
                mediaKeyTimestamp: Math.floor(Date.now() / 1000),
                stickerPackSize: packUpload.fileLength,
                stickerPackOrigin: 2,
                trayIconFileName,
                thumbnailDirectPath: thumbUpload.directPath,
                thumbnailSha256: thumbUpload.fileSha256,
                thumbnailEncSha256: thumbUpload.fileEncSha256,
                thumbnailHeight: 252,
                thumbnailWidth: 252,
                imageDataHash: thumbUpload.fileSha256.toString('base64'),
            },
        },
        { quoted: m }
    );
}

// ═══════════════════════════════════════════════════════════
// ✅ SCRAPING — استخراج الصور من Pinterest
// ═══════════════════════════════════════════════════════════

function extractImagesFromHtml(html) {
    const images = new Set();
    const $ = cheerio.load(html);

    // 1️⃣ صور og:image
    $('meta[property="og:image"]').each((_, el) => {
        const src = $(el).attr('content');
        if (src && src.includes('pinimg.com')) {
            images.add(src.replace(/\/\d+x\//, '/originals/'));
        }
    });

    // 2️⃣ صور من img tags
    $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.includes('pinimg.com') && !src.includes('avatar')) {
            images.add(src.replace(/\/\d+x\//, '/originals/'));
        }
    });

    // 3️⃣ صور من script JSON
    const scriptRegex = /https?:\\?\/\\?\/[^"'\s<>]*pinimg\.com[^"'\s<>]*\.(?:jpg|jpeg|png|webp)/gi;
    const scriptMatches = html.match(scriptRegex) || [];
    for (const match of scriptMatches) {
        const clean = match
            .replace(/\\u002F/g, '/')
            .replace(/\\\//g, '/')
            .replace(/\/\d+x\//, '/originals/');
        images.add(clean);
    }

    return [...images];
}

async function scrapePinterest(query, limit = 30) {
    const allImages = new Set();
    const seen = new Set();

    try {
        for (let page = 0; page < 3 && allImages.size < limit * 2; page++) {
            try {
                const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}&rs=typed&page=${page}`;

                const { data } = await axios.get(searchUrl, {
                    headers: {
                        'user-agent': UA,
                        'accept': 'text/html,application/xhtml+xml',
                        'accept-language': 'en-US,en;q=0.9',
                    },
                    timeout: 20000,
                    maxRedirects: 5
                });

                const pageImages = extractImagesFromHtml(data);
                for (const img of pageImages) {
                    if (!seen.has(img)) {
                        seen.add(img);
                        allImages.add(img);
                    }
                }

                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                console.log(`[scrape page ${page}]`, e.message);
            }
        }

        return [...allImages].slice(0, limit);
    } catch (e) {
        console.error('[Scrape Error]', e.message);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// ✅ دالة البحث النهائية — API → Scraping Fallback
// ═══════════════════════════════════════════════════════════
async function searchPins(query) {
    try {
        const isArabic = /[\u0600-\u06FF]/.test(query);
        let searchQuery = query;

        if (isArabic) {
            try {
                const translated = await translate(query, { to: 'en' });
                searchQuery = Array.isArray(translated) ? translated[0] : translated;
                console.log(`🌍 تمت الترجمة: "${query}" → "${searchQuery}"`);
            } catch (e) {
                console.log('⚠️ فشل الترجمة، سيتم البحث بالنص الأصلي');
                searchQuery = query;
            }
        }

        const finalQuery = `${searchQuery} icon`;
        console.log(`🔍 البحث النهائي: ${finalQuery}`);

        // ═══════════════════════════════════════════
        // 1️⃣ محاولة API
        // ═══════════════════════════════════════════
        try {
            const params = new URLSearchParams({ q: finalQuery });
            const response = await axios.get(`${API_BASE}/search/pinimg?${params.toString()}`, {
                timeout: 30000,
                headers: {
                    'User-Agent': UA
                }
            });
            if (response.data?.success && response.data.results?.length) {
                return response.data.results;
            }
        } catch (apiErr) {
            console.log('⚠️ API فشل، سيتم استخدام Scraping:', apiErr.message);
        }

        // ═══════════════════════════════════════════
        // 2️⃣ Scraping Fallback
        // ═══════════════════════════════════════════
        const scrapedUrls = await scrapePinterest(finalQuery, 30);

        if (scrapedUrls.length > 0) {
            return scrapedUrls.map((url, idx) => ({
                id: `scraped_${idx}`,
                image: url,
                title: query,
            }));
        }

        throw new Error('لم يتم العثور على نتائج');

    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

export default {
    name: "حزمة",
    aliases: ["حزمه", "pack", "باك", "بك"],
    description: "إنشاء حزمة ملصقات من Pinterest (30 ملصق)",
    category: "تحميل",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            await react("📦");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 📦 حـزمـة مـلـصـقـات*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 ارسـل اسـم الـشـخـصـيـة أو الـفـيـلـم*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.حزمة لوفي* (يترجم تلقائياً)
📌 *.حزمة ناروتو*
📌 *.باك غوجو*

*🔄 تـم إضـافـة "icon" تـلـقـائـياً لـلـبـحـث*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("📦");
        await reply(`*⎔┄┄─ ⊱╎⌯ 🔍 ⌯╎⊰─┄┄⎔*
*┋ جـاري الـبـحـث عـن: ${query}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

        try {
            const results = await searchPins(query);

            if (!results.length) {
                await react("❌");
                return reply(`*❌ لـم أجـد نـتـائـج لـ: ${query}*`);
            }

            const urls = [...new Set(
                results
                    .map(v => v.image)
                    .filter(Boolean)
            )];

            if (urls.length < 5) {
                await react("❌");
                return reply(`*❌ الـنـتـائـج قـلـيـلـة جـداً، جـرب كـلـمـة بـحـث أخـرى*`);
            }

            const chosen = urls
                .sort(() => Math.random() - 0.5)
                .slice(0, 30);

            const pack = [];

            for (const url of chosen) {
                try {
                    const imgRes = await axios.get(url, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: {
                            'User-Agent': UA
                        }
                    });

                    let buffer = Buffer.from(imgRes.data);

                    if (isWebP(buffer)) {
                        if (buffer.length > 0) {
                            const stickerWithExif = await addExifToSticker(
                                buffer,
                                "𝑺𝑶𝑳𝑶 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 🏮",
                                `╔══════════════════╗
║ 𓆩🍷𓆪『𝑺𝑶𝑳𝑶★𝑩𝑶𝑻』𓆩🍷𓆪  ║
╠══════════════════╣
║ 𝑩𝑶𝑹𝑵 𝑭𝑹𝑶𝑴 𝑪𝑶𝑫𝑬 ║
║ 𝑩𝑼𝑰𝑳𝑻 𝑭𝑶𝑹 𝑳𝑬𝑮𝑬𝑵𝑫𝑺 ║
╠══════════════════╣
   ⚝ 𝑼𝑵𝑲𝑵𝑶𝑾𝑵 ⚝   ║
╚══════════════════╝`
                            );
                            pack.push({
                                buffer: stickerWithExif,
                                ext: 'webp',
                                mimetype: 'image/webp',
                                isAnimated: isAnimatedWebP(buffer),
                                isLottie: false,
                            });
                        }
                    } else {
                        buffer = await imageToWebp(buffer);
                        const stickerWithExif = await addExifToSticker(
                            buffer,
                            "𝑺𝑶𝑳𝑶 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 🏮",
                            `╔══════════════════╗
║ 𓆩🍷𓆪『𝑺𝑶𝑳𝑶★𝑩𝑶𝑻』𓆩🍷𓆪  ║
╠══════════════════╣
║ 𝑩𝑶𝑹𝑵 𝑭𝑹𝑶𝑴 𝑪𝑶𝑫𝑬 ║
║ 𝑩𝑼𝑰𝑳𝑻 𝑭𝑶𝑹 𝑳𝑬𝑮𝑬𝑵𝑫𝑺 ║
╠══════════════════╣
   ⚝ 𝑼𝑵𝑲𝑵𝑶𝑾𝑵 ⚝   ║
╚══════════════════╝`
                        );
                        pack.push({
                            buffer: stickerWithExif,
                            ext: 'webp',
                            mimetype: 'image/webp',
                            isAnimated: false,
                            isLottie: false,
                        });
                    }
                } catch (e) {
                    console.error('Image download/convert failed:', e?.message || e);
                }
            }

            if (pack.length < 5) {
                await react("❌");
                return reply(`*❌ مـا قـدرت أجـمـع صـور كـفـايـة لـلـحـزمـة*`);
            }

            await react("🔄");
            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري تـجـهـيـز ${pack.length} مـلـصـق...*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            await sendCustomStickerPack(sock, message, pack, {
                name: `𝑺𝑶𝑳𝑶 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 🏮`,
                publisher: `╔══════════════════╗
║ 𓆩🍷𓆪『𝑺𝑶𝑳𝑶★𝑩𝑶𝑻』𓆩🍷𓆪  ║
╠══════════════════╣
║ 𝑩𝑶𝑹𝑵 𝑭𝑹𝑶𝑴 𝑪𝑶𝑫𝑬 ║
║ 𝑩𝑼𝑰𝑳𝑻 𝑭𝑶𝑹 𝑳𝑬𝑮𝑬𝑵𝑫𝑺 ║
╠══════════════════╣
   ⚝ 𝑼𝑵𝑲𝑵𝑶𝑾𝑵 ⚝   ║
╚══════════════════╝`,
                description: `🏮 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮`
            });

            await react("✅");

        } catch (error) {
            console.error("❌ Sticker Pack Error:", error);
            await react("❌");
            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل إنـشـاء الـحـزمـة*
*┋ السـبب: ${error.message || 'خطأ غير معروف'}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};