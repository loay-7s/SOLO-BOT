// plugins/لملصق.js
// ⚔️ SOLO STICKER — SINGLE + ALBUM MODE ⚔️

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import crypto from 'crypto';
import https from 'https';
import JSZip from 'jszip';
import webpmux from 'node-webpmux';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

// ═══════════════════════════════════════════════════════
// 🎖️ الهوية الموحدة
// ═══════════════════════════════════════════════════════
const SOLO_PUBLISHER = `╔══════════════════╗
║ 𓆩🍷𓆪『𝑺𝑶𝑳𝑶★𝑩𝑶𝑻』𓆩🍷𓆪  ║
╠══════════════════╣
║ 𝑩𝑶𝑹𝑵 𝑭𝑹𝑶𝑴 𝑪𝑶𝑫𝑬 ║
║ 𝑩𝑼𝑰𝑳𝑻 𝑭𝑶𝑹 𝑳𝑬𝑮𝑬𝑵𝑫𝑺 ║
╠══════════════════╣
   ⚝ 𝑼𝑵𝑲𝑵𝑶𝑾𝑵 ⚝   ║
╚══════════════════╝`;

const SOLO_PACK_NAME = `𝑺𝑶𝑳𝑶 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 🏮`;
const SOLO_PACK_DESC = `🏮 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮`;

// ═══════════════════════════════════════════════════════
// 🎬 FFmpeg Setup
// ═══════════════════════════════════════════════════════
function setupFfmpeg() {
    const paths = [
        '/data/data/com.termux/files/usr/bin/ffmpeg',
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        'ffmpeg'
    ];
    for (const p of paths) {
        try {
            if (p === 'ffmpeg' || require('fs').existsSync(p)) {
                ffmpeg.setFfmpegPath(p);
                return;
            }
        } catch {}
    }
}
setupFfmpeg();

// ═══════════════════════════════════════════════════════
// 📦 ALBUM CACHE
// ═══════════════════════════════════════════════════════
const store = (globalThis.__soloAlbumStore ||= {
    albumCache: new Map(),
    msgToAlbum: new Map(),
    recentByChat: new Map(),
    stats: { media: 0, parents: 0 },
    timer: null,
});
const { albumCache, msgToAlbum, recentByChat } = store;

const ALBUM_TTL = 30 * 60 * 1000;
const RECENT_LIMIT = 200;
const CLUSTER_GAP_MS = 15000;

function unwrap(m) {
    let msg = m?.message;
    for (let i = 0; i < 4 && msg; i++) {
        const inner =
            msg.ephemeralMessage?.message ||
            msg.viewOnceMessage?.message ||
            msg.viewOnceMessageV2?.message ||
            msg.documentWithCaptionMessage?.message ||
            msg.editedMessage?.message;
        if (!inner) break;
        msg = inner;
    }
    return msg || null;
}

function extractAlbumId(m) {
    const inner = unwrap(m);
    const ctxs = [
        m?.message?.messageContextInfo,
        inner?.messageContextInfo,
        m?.messageContextInfo,
        m?.msg?.messageContextInfo,
    ];
    for (const c of ctxs) {
        const id = c?.messageAssociation?.parentMessageKey?.id;
        if (id) return id;
    }
    if (inner?.albumMessage && m?.key?.id) return m.key.id;

    const legacy = [
        m?.message?.messageContextInfo?.albumId,
        inner?.imageMessage?.contextInfo?.albumId,
        inner?.imageMessage?.albumId,
        inner?.videoMessage?.contextInfo?.albumId,
        inner?.videoMessage?.albumId,
        inner?.albumMessage?.albumId,
    ];
    for (const val of legacy) {
        if (val && typeof val === 'string' && val.length > 3) return val;
    }
    return null;
}

function extractExpected(m) {
    const inner = unwrap(m);
    return (
        inner?.albumMessage?.expectedImageCount ||
        m?.message?.messageContextInfo?.albumMessageExpectedImageCount ||
        0
    );
}

function isImage(m) {
    const inner = unwrap(m);
    return !!inner?.imageMessage;
}

function isVideo(m) {
    const inner = unwrap(m);
    return !!inner?.videoMessage;
}

function isParent(m) {
    const inner = unwrap(m);
    return !!inner?.albumMessage;
}

function hasMedia(m) {
    return isImage(m) || isVideo(m) || isParent(m);
}

function cacheMedia(m) {
    try {
        const chat = m?.key?.remoteJid;
        const msgId = m?.key?.id;
        if (!chat || !msgId) return;
        if (!hasMedia(m)) return;

        store.stats.media++;

        const sender = m?.key?.participant || chat;
        const albumId = extractAlbumId(m);
        const expected = extractExpected(m);

        if (isParent(m)) store.stats.parents++;

        if (isImage(m) || isVideo(m)) {
            let list = recentByChat.get(chat);
            if (!list) recentByChat.set(chat, (list = []));
            if (!list.some(x => x.id === msgId)) {
                list.push({ msg: m, id: msgId, sender, ts: Date.now(), albumId });
                const cutoff = Date.now() - ALBUM_TTL;
                while (list.length > RECENT_LIMIT || (list.length && list[0].ts < cutoff)) list.shift();
            }
        }

        if (!albumId) return;

        let entry = albumCache.get(albumId);
        if (!entry) {
            entry = { images: [], expectedCount: 0, createdAt: Date.now(), lastUpdate: Date.now(), sender, chat };
            albumCache.set(albumId, entry);
        }
        if (expected > entry.expectedCount) entry.expectedCount = expected;
        entry.lastUpdate = Date.now();

        if ((isImage(m) || isVideo(m)) && !entry.images.some(x => x.key?.id === msgId)) {
            entry.images.push(m);
            msgToAlbum.set(msgId, albumId);
        }
    } catch (e) {
        console.error('[CACHE]', e.message);
    }
}

if (store.timer) clearInterval(store.timer);
store.timer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of albumCache.entries()) {
        if (now - entry.createdAt > ALBUM_TTL) {
            for (const img of entry.images) {
                if (img.key?.id) msgToAlbum.delete(img.key.id);
            }
            albumCache.delete(id);
        }
    }
    for (const [chat, list] of recentByChat.entries()) {
        while (list.length && now - list[0].ts > ALBUM_TTL) list.shift();
        if (!list.length) recentByChat.delete(chat);
    }
}, 5 * 60 * 1000);
store.timer.unref?.();

function attachListener(conn) {
    try {
        if (!conn?.ev?.on) return;
        if (conn.__soloAlbumAttached) return;
        conn.__soloAlbumAttached = true;
        conn.ev.on('messages.upsert', ({ messages }) => {
            for (const m of messages || []) cacheMedia(m);
        });
    } catch (e) {
        console.error('[ATTACH]', e.message);
    }
}

function resolveAlbum(quotedMsgId, quotedContent) {
    const mapped = msgToAlbum.get(quotedMsgId);
    if (mapped && albumCache.has(mapped)) return mapped;
    if (albumCache.has(quotedMsgId)) return quotedMsgId;
    const r = extractAlbumId({ message: quotedContent });
    if (r && albumCache.has(r)) return r;
    return null;
}

function clusterByTime(chat, quotedMsgId) {
    const all = recentByChat.get(chat) || [];
    const target = all.find(x => x.id === quotedMsgId);
    if (!target) return null;
    const list = all.filter(x => x.sender === target.sender).sort((a, b) => a.ts - b.ts);
    const idx = list.findIndex(x => x.id === quotedMsgId);
    if (idx === -1) return null;
    let lo = idx;
    let hi = idx;
    while (lo > 0 && list[lo].ts - list[lo - 1].ts <= CLUSTER_GAP_MS) lo--;
    while (hi < list.length - 1 && list[hi + 1].ts - list[hi].ts <= CLUSTER_GAP_MS) hi++;
    return list.slice(lo, hi + 1).map(x => x.msg);
}

async function waitForAlbum(albumId) {
    let entry = albumCache.get(albumId);
    const t0 = Date.now();
    while (entry && entry.expectedCount > entry.images.length && Date.now() - t0 < 4000) {
        await new Promise(r => setTimeout(r, 500));
        entry = albumCache.get(albumId);
    }
    return entry;
}

// ═══════════════════════════════════════════════════════
// 🎬 Helpers
// ═══════════════════════════════════════════════════════
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest();
const toB64Url = (buf) =>
    Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

function getDynamicFPS(duration) {
    if (duration <= 4) return 18;
    if (duration <= 8) return 15;
    if (duration <= 12) return 10;
    return 8;
}

async function getSharp() {
    const m = await import('sharp').catch(() => null);
    if (!m?.default) throw new Error('Install sharp: npm i sharp');
    return m.default;
}

async function imageToWebp(buf) {
    const sharp = await getSharp();
    return await sharp(buf).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
}

async function makeTrayWebp(buf) {
    const sharp = await getSharp();
    return await sharp(buf).resize(252, 252, { fit: 'cover' }).webp().toBuffer();
}

async function makeBlankTrayWebp() {
    const sharp = await getSharp();
    return await sharp({ create: { width: 252, height: 252, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).webp().toBuffer();
}

async function makeThumbnailJpeg(buf) {
    const sharp = await getSharp();
    return await sharp(buf).resize(252, 252, { fit: 'cover' }).jpeg().toBuffer();
}

// ═══════════════════════════════════════════════════════
// 🎬 Video → Animated WebP
// ═══════════════════════════════════════════════════════
async function videoToWebp(buffer, duration = 5) {
    const tmpIn = join(tmpdir(), `${Date.now()}_${Math.random()}.mp4`);
    await fs.writeFile(tmpIn, buffer);

    let fps = getDynamicFPS(duration);
    let quality = 70;

    const compress = async (fps, quality) => {
        const tmpOut = join(tmpdir(), `${Date.now()}_${Math.random()}.webp`);
        await new Promise((res, rej) => {
            ffmpeg(tmpIn)
                .addOutputOptions([
                    "-vcodec", "libwebp",
                    "-vf", `crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=${fps}`,
                    "-preset", "picture",
                    "-lossless", "0",
                    "-q:v", `${quality}`,
                    "-compression_level", "6",
                    "-loop", "0",
                    "-an",
                    "-vsync", "0",
                    "-threads", "2"
                ])
                .toFormat("webp")
                .save(tmpOut)
                .on("end", res)
                .on("error", rej);
        });
        const buf = await fs.readFile(tmpOut);
        await fs.unlink(tmpOut).catch(() => {});
        return buf;
    };

    let out = await compress(fps, quality);

    while (out.length > 950000 && fps > 6) {
        fps = Math.max(6, fps - 2);
        quality = Math.max(25, quality - 10);
        out = await compress(fps, quality);
    }

    await fs.unlink(tmpIn).catch(() => {});
    return out;
}

// ═══════════════════════════════════════════════════════
// 🎨 EXIF
// ═══════════════════════════════════════════════════════
async function addExifToSticker(buffer, packname, author) {
    const img = new webpmux.Image();
    await img.load(buffer);

    const exif = {
        "sticker-pack-id": `solo-pack-${Date.now()}`,
        "sticker-pack-name": packname || SOLO_PACK_NAME,
        "sticker-pack-publisher": author || SOLO_PUBLISHER,
        "emojis": ["✨"]
    };

    const exifHeader = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(exif), "utf-8");
    const exifFinal = Buffer.concat([exifHeader, jsonBuffer]);
    exifFinal.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exifFinal;
    return await img.save(null);
}

// ═══════════════════════════════════════════════════════
// 📥 Download
// ═══════════════════════════════════════════════════════
async function downloadMedia(conn, m) {
    const inner = unwrap(m);
    const imgMsg = inner?.imageMessage;
    const vidMsg = inner?.videoMessage;
    const type = imgMsg ? 'image' : vidMsg ? 'video' : null;
    const content = imgMsg || vidMsg;
    if (!type || !content) return null;

    try {
        if (typeof conn.downloadMediaMessage === 'function') {
            const buf = await conn.downloadMediaMessage(m).catch(() => null);
            if (buf?.length) return { buffer: buf, type };
        }

        const stream = await downloadContentFromMessage(content, type);
        const chunks = [];
        for await (const c of stream) chunks.push(c);
        return { buffer: Buffer.concat(chunks), type };
    } catch (e) {
        console.error('[DOWNLOAD]', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════
// ☁️ Upload
// ═══════════════════════════════════════════════════════
async function uploadToServer(conn, buffer, { hkdf, mediaPath, mediaKey = crypto.randomBytes(32) }) {
    const expanded = Buffer.from(crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(32), Buffer.from(hkdf), 112));
    const iv = expanded.subarray(0, 16);
    const cipherKey = expanded.subarray(16, 48);
    const macKey = expanded.subarray(48, 80);
    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const mac = crypto.createHmac('sha256', macKey).update(iv).update(encrypted).digest().subarray(0, 10);
    const encBuffer = Buffer.concat([encrypted, mac]);
    const fileSha256 = sha256(buffer);
    const fileEncSha256 = sha256(encBuffer);

    const iq = await conn.query({
        tag: 'iq',
        attrs: { id: conn.generateMessageTag?.() ?? Date.now().toString(), to: 's.whatsapp.net', type: 'set', xmlns: 'w:m' },
        content: [{ tag: 'media_conn', attrs: {} }],
    });
    const mediaConn = iq.content?.find(v => v.tag === 'media_conn');
    if (!mediaConn) throw new Error('media_conn not found');
    const auth = mediaConn.attrs?.auth;
    if (!auth) throw new Error('auth missing');
    const hosts = (mediaConn.content || []).filter(v => v.tag === 'host').map(v => v.attrs?.hostname).filter(Boolean);
    if (!hosts.length) throw new Error('hosts missing');

    const token = encodeURIComponent(toB64Url(fileEncSha256));
    let lastError;
    for (const host of hosts) {
        try {
            const json = await new Promise((resolve, reject) => {
                const url = new URL(`https://${host}${mediaPath}/${token}?auth=${encodeURIComponent(auth)}&token=${token}`);
                const req = https.request({
                    hostname: url.hostname, port: 443, path: url.pathname + url.search, method: 'POST',
                    headers: {
                        Origin: 'https://web.whatsapp.com', Referer: 'https://web.whatsapp.com/',
                        'Content-Type': 'application/octet-stream', 'Content-Length': encBuffer.length,
                    },
                }, (res) => {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => {
                        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`HTTP ${res.statusCode}`));
                        try { resolve(JSON.parse(body)); } catch { reject(new Error('Bad JSON')); }
                    });
                });
                req.on('error', reject);
                req.write(encBuffer);
                req.end();
            });
            const directPath = json.direct_path ?? json.directPath ?? json.url ?? json.path;
            if (!directPath) throw new Error('directPath missing');
            return { mediaKey, fileLength: buffer.length, fileSha256, fileEncSha256, directPath, ...json };
        } catch (e) { lastError = e; }
    }
    throw lastError ?? new Error('All hosts failed');
}

// ═══════════════════════════════════════════════════════
// 📦 Send Sticker Pack — ✅ مع EXIF لكل ملصق
// ═══════════════════════════════════════════════════════
async function sendStickerPack(conn, chat, quoted, pack) {
    const zip = new JSZip();
    const metas = [];

    for (const item of pack) {
        // ✅ إضافة EXIF لكل ملصق قبل الإضافة للحزمة
        const stickerWithExif = await addExifToSticker(
            item.buffer,
            SOLO_PACK_NAME,
            SOLO_PUBLISHER
        );

        const fileName = `${toB64Url(sha256(stickerWithExif))}.${item.ext}`;
        zip.file(fileName, stickerWithExif);

        metas.push({
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

    const packUpload = await uploadToServer(conn, archive, {
        hkdf: 'WhatsApp Sticker Pack Keys',
        mediaPath: '/mms/sticker-pack',
    });

    const thumbnailBuffer = await makeThumbnailJpeg(trayBuffer);
    const thumbUpload = await uploadToServer(conn, thumbnailBuffer, {
        hkdf: 'WhatsApp Sticker Pack Thumbnail Keys',
        mediaPath: '/mms/thumbnail-sticker-pack',
        mediaKey: packUpload.mediaKey,
    });

    await conn.relayMessage(chat, {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        stickerPackMessage: {
            stickerPackId: 'SOLO_' + crypto.randomBytes(8).toString('hex'),
            name: SOLO_PACK_NAME,
            publisher: SOLO_PUBLISHER,
            packDescription: SOLO_PACK_DESC,
            stickers: metas,
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
    }, { quoted });
}

// ═══════════════════════════════════════════════════════
// 📤 Send Single Sticker
// ═══════════════════════════════════════════════════════
async function sendSingleSticker(conn, chat, quoted, buffer, isAnimated) {
    const finalSticker = await addExifToSticker(buffer, SOLO_PACK_NAME, SOLO_PUBLISHER);
    await conn.sendMessage(chat, {
        sticker: finalSticker,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: false,
            forwardedNewsletterMessageInfo: {
                newsletterJid: SOLO_CHANNEL_ID,
                serverMessageId: 1,
                newsletterName: '𝑺𝑶𝑳𝑶'
            }
        }
    }, { quoted });
}

// ═══════════════════════════════════════════════════════
// ⚔️ COMMAND
// ═══════════════════════════════════════════════════════
const MIN_STICKERS = 2;
const MAX_STICKERS = 60;

export default {
    name: "لملصق",
    aliases: ["استيكر", "ملصق","ستيكر", "s"],
    category: "تحويل",
    description: "تحويل صورة/فيديو لملصق أو ألبوم كامل لحزمة",

    async run({ sock, message, reply, react }) {
        const jid = message.key.remoteJid;

        // اربط الـ listener
        attachListener(sock);

        // ─── استخراج quoted ───
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo;
        const quotedMsgId = ctxInfo?.stanzaId;
        const quotedParticipant = ctxInfo?.participant;
        const quotedContent = ctxInfo?.quotedMessage;

        // ─── 1️⃣ حاول تجميع ألبوم ───
        let albumImages = [];
        let foundVia = 'none';

        if (quotedMsgId) {
            const albumId = resolveAlbum(quotedMsgId, quotedContent);
            if (albumId) {
                const entry = await waitForAlbum(albumId);
                albumImages = entry?.images || [];
                foundVia = 'album';
            }

            if (albumImages.length < MIN_STICKERS) {
                const cluster = clusterByTime(jid, quotedMsgId);
                if (cluster && cluster.length > albumImages.length) {
                    albumImages = cluster;
                    foundVia = 'cluster';
                }
            }
        }

        // ─── 2️⃣ لو ألبوم → حزمة ───
        if (albumImages.length >= MIN_STICKERS) {
            await react("📦");
            await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*📦 جـاري تـحـويـل الألـبـوم*
*───━━━⊱  🎬  ⊰━━━───*

*┋ عـدد الـمـلـفـات : ⦓ ${Math.min(albumImages.length, MAX_STICKERS)} ⦔*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);

            try {
                let items = albumImages.slice(0, MAX_STICKERS);
                const pack = [];

                for (let i = 0; i < items.length; i++) {
                    const m = items[i];
                    try {
                        const result = await downloadMedia(sock, m);
                        if (!result) continue;

                        let webpBuffer;
                        let isAnimated = false;

                        if (result.type === 'video') {
                            const duration = unwrap(m)?.videoMessage?.seconds || 5;
                            if (duration > 15) continue;
                            webpBuffer = await videoToWebp(result.buffer, duration);
                            isAnimated = true;
                        } else {
                            webpBuffer = await imageToWebp(result.buffer);
                            isAnimated = false;
                        }

                        pack.push({
                            buffer: webpBuffer,
                            ext: 'webp',
                            mimetype: 'image/webp',
                            isAnimated,
                            isLottie: false,
                        });
                    } catch (e) {
                        console.error(`[${i + 1}]`, e.message);
                    }
                }

                if (pack.length < MIN_STICKERS) {
                    await react("❌");
                    return reply(`*❌ صـور صـالـحـة قـلـيـلـة (${pack.length}/${MIN_STICKERS})*`);
                }

                await sendStickerPack(sock, jid, message, pack);
                await react("✅");

            } catch (err) {
                console.error("❌ PACK ERROR:", err);
                await react("❌");
                await reply(`*❌ فـشـل إنـشـاء الـحـزمة*\n📌 ${err.message || 'خطأ غير معروف'}`);
            }
            return;
        }

        // ─── 3️⃣ لو ملف واحد → ملصق عادي ───
        const inner = unwrap({ message: quotedContent }) || unwrap(message);
        const videoMsg = inner?.videoMessage || message.message?.videoMessage;
        const imageMsg = inner?.imageMessage || message.message?.imageMessage;
        const gifMsg = inner?.gifMessage || message.message?.gifMessage;

        const mime = imageMsg || videoMsg || gifMsg;

        if (!mime) {
            return await reply(`*⚠️ قـم بـالـرد عـلـى صـورة أو فـيـديـو أو ألـبـوم لـتـحـويـلـه!*`);
        }

        const isVideo = !!videoMsg || !!gifMsg;

        if (videoMsg) {
            const duration = videoMsg.seconds;
            const size = videoMsg.fileLength;
            if (duration > 15) return await reply(`*❌ الـمـدة تـتـجـاوز الـحـد الأقـصـى (أكـثـر مـن 15 ثـانـيـة)*`);
            if (size > 2.0 * 1024 * 1024) return await reply(`*❌ حـجـم الـفـيـديـو كـبـيـر (اكـبـر مـن 2MB)*`);
        }

        await react("🍷");

        try {
            const stream = await downloadContentFromMessage(mime, isVideo ? "video" : "image");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let webpBuffer;
            if (isVideo) {
                const duration = videoMsg?.seconds || 5;
                webpBuffer = await videoToWebp(buffer, duration);
            } else {
                webpBuffer = await imageToWebp(buffer);
            }

            await sendSingleSticker(sock, jid, message, webpBuffer, isVideo);
            await react("✅");

        } catch (error) {
            console.error("❌ Sticker Error:", error);
            await react("❌");
            await reply(`*❌ حـدث خـطأ فـي نـظـام الـمـعـالـجـة!*`);
        }
    }
};