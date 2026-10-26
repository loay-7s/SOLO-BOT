// plugins/حقوق.js
// ════════════════════════════════════════════════════════════════════
//  ⚡ SOLO BOT — Rights Editor (Sticker + Full Pack)
//  تعديل حقوق الملصقات + الحزم بالكامل (بكل ملصقاتها)
// ════════════════════════════════════════════════════════════════════

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import webpmux from 'node-webpmux';
import JSZip from 'jszip';
import crypto from 'crypto';
import https from 'node:https';

// ════════════════════════════════════════════════════════════════════
//  🎨 الهوية
// ════════════════════════════════════════════════════════════════════
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

const SOLO_PUBLISHER = `╔══════════════════╗
║ 𓆩🍷𓆪『𝑺𝑶𝑳𝑶★𝑩𝑶𝑻』𓆩🍷𓆪  ║
╠══════════════════╣
║ 𝑩𝑶𝑹𝑵 𝑭𝑹𝑶𝑴 𝑪𝑶𝑫𝑬 ║
║ 𝑩𝑼𝑰𝑳𝑻 𝑭𝑶𝑹 𝑳𝑬𝑮𝑬𝑵𝑫𝑺 ║
╠══════════════════╣
   ⚝ 𝑼𝑵𝑲𝑵𝑶𝑾𝑵 ⚝   ║
╚══════════════════╝`;

const SOLO_PACK_NAME = `𝑺𝑶𝑳𝑶 𝑺𝑻𝑰𝑪𝑲𝑬𝑹𝑺 🏮`;

// ════════════════════════════════════════════════════════════════════
//  🎨 أدوات مساعدة
// ════════════════════════════════════════════════════════════════════
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest();
const toB64Url = (buf) =>
    Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

// ════════════════════════════════════════════════════════════════════
//  🎨 تعديل EXIF للملصق
// ════════════════════════════════════════════════════════════════════
async function editStickerExif(buffer, exifData) {
    const img = new webpmux.Image();
    await img.load(buffer);

    const exifHeader = Buffer.from([
        0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(exifData), "utf-8");
    const exifFinal = Buffer.concat([exifHeader, jsonBuffer]);
    exifFinal.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exifFinal;
    return await img.save(null);
}

// ════════════════════════════════════════════════════════════════════
//  🎯 بناء EXIF حسب النص
// ════════════════════════════════════════════════════════════════════
function buildExifData(text, packname, author) {
    if (!text) {
        return {
            "sticker-pack-id": `solo-verify-${Date.now()}`,
            "sticker-pack-name": SOLO_PACK_NAME,
            "sticker-pack-publisher": SOLO_PUBLISHER,
            "emojis": []
        };
    }

    if (!text.includes('|')) {
        return {
            "sticker-pack-id": `solo-verify-${Date.now()}`,
            "sticker-pack-name": packname,
            "emojis": []
        };
    }

    return {
        "sticker-pack-id": `solo-verify-${Date.now()}`,
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "emojis": []
    };
}

// ════════════════════════════════════════════════════════════════════
//  ☁️ رفع على سيرفر واتساب
// ════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════
//  ⬇️ تنزيل ملف من واتساب
// ════════════════════════════════════════════════════════════════════
async function downloadFromWhatsApp(directPath, mediaKey, fileEncSha256) {
    const url = new URL(`https://mmg.whatsapp.net${directPath}`);

    return new Promise((resolve, reject) => {
        https.get({
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'User-Agent': 'WhatsApp/2.23.20.0',
                'Origin': 'https://web.whatsapp.com',
                'Referer': 'https://web.whatsapp.com/'
            }
        }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', async () => {
                try {
                    const encrypted = Buffer.concat(chunks);
                    if (encrypted.length < 10) throw new Error('Invalid encrypted data');

                    // فك التشفير
                    const expanded = Buffer.from(crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(32), Buffer.from('WhatsApp Sticker Pack Keys'), 112));
                    const iv = expanded.subarray(0, 16);
                    const cipherKey = expanded.subarray(16, 48);

                    const encryptedData = encrypted.slice(0, -10); // إزالة MAC

                    const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
                    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

                    resolve(decrypted);
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// ════════════════════════════════════════════════════════════════════
//  🖼️ صنع thumbnail للحزمة
// ════════════════════════════════════════════════════════════════════
async function makeThumbnail(trayBuffer) {
    try {
        const sharpModule = await import('sharp').catch(() => null);
        if (!sharpModule?.default) return null;
        return await sharpModule.default(trayBuffer).resize(252, 252, { fit: 'cover' }).jpeg().toBuffer();
    } catch {
        return null;
    }
}

// ════════════════════════════════════════════════════════════════════
//  🎯 تعديل حزمة كاملة بكل ملصقاتها
// ════════════════════════════════════════════════════════════════════
async function editFullStickerPack(sock, message, reply, react, text, packMessage) {
    const jid = message.key.remoteJid;

    try {
        const pack = packMessage.stickerPackMessage;
        if (!pack) {
            await react("❌");
            return reply(`*⚠️ الـرسـالـة لـيـسـت حـزمـة مـلـصـقـات*`);
        }

        // ─── استخراج النص ───
        let [packname, author] = text ? text.split('|') : [];
        packname = packname?.trim() || SOLO_PACK_NAME;
        author = author?.trim() || SOLO_PUBLISHER;

        // ─── تنزيل الحزمة الأصلية ───
        await react("📥");

        let zipBuffer;
        try {
            zipBuffer = await downloadFromWhatsApp(
                pack.directPath,
                pack.mediaKey,
                pack.fileEncSha256
            );
        } catch (e) {
            console.error('[DOWNLOAD PACK ERROR]', e);
            await react("❌");
            return reply(`*❌ فـشـل تـنـزيـل الـحـزمـة الأصـلـيـة*\n📌 ${e.message}`);
        }

        // ─── فك ضغط ZIP ───
        await react("📦");
        let zip;
        try {
            zip = await JSZip.loadAsync(zipBuffer);
        } catch (e) {
            console.error('[UNZIP ERROR]', e);
            await react("❌");
            return reply(`*❌ فـشـل فـك ضـغـط الـحـزمـة*\n📌 ${e.message}`);
        }

        // ─── تعديل كل ملصق ───
        const exifData = buildExifData(text, packname, author);
        const newZip = new JSZip();
        const newMetas = [];

        const files = Object.keys(zip.files).filter(f => f.endsWith('.webp') && !f.includes('tray_icon'));

        if (files.length === 0) {
            await react("❌");
            return reply(`*❌ لـم يـتـم الـعـثـور عـلـى مـلـصـقـات فـي الـحـزمـة*`);
        }

        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            try {
                const fileBuffer = await zip.file(fileName).async('nodebuffer');

                // تعديل EXIF
                const newBuffer = await editStickerExif(fileBuffer, exifData);

                // اسم جديد
                const newFileName = `${toB64Url(sha256(newBuffer))}.webp`;
                newZip.file(newFileName, newBuffer);

                // meta
                const originalMeta = pack.stickers?.find(s => s.fileName === fileName);
                newMetas.push({
                    fileName: newFileName,
                    isAnimated: originalMeta?.isAnimated || false,
                    emojis: originalMeta?.emojis || ['✨'],
                    accessibilityLabel: originalMeta?.accessibilityLabel || '',
                    isLottie: originalMeta?.isLottie || false,
                    mimetype: 'image/webp',
                });
            } catch (e) {
                console.error(`[STICKER ${i + 1}]`, e.message);
            }
        }

        if (newMetas.length === 0) {
            await react("❌");
            return reply(`*❌ فـشـل تـعـديـل أي مـلـصـق*`);
        }

        // ─── نسخ tray_icon ───
        const trayFile = Object.keys(zip.files).find(f => f.includes('tray_icon'));
        if (trayFile) {
            const trayBuffer = await zip.file(trayFile).async('nodebuffer');
            newZip.file('tray_icon.webp', trayBuffer);
        }

        // ─── بناء ZIP جديد ───
        await react("🔧");
        const newArchive = await newZip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });

        // ─── رفع ZIP الجديد ───
        const packUpload = await uploadToServer(sock, newArchive, {
            hkdf: 'WhatsApp Sticker Pack Keys',
            mediaPath: '/mms/sticker-pack',
        });

        // ─── رفع thumbnail ───
        let thumbUpload = null;
        if (trayFile) {
            const trayBuffer = await zip.file(trayFile).async('nodebuffer');
            const thumbnailBuffer = await makeThumbnail(trayBuffer);
            if (thumbnailBuffer) {
                thumbUpload = await uploadToServer(sock, thumbnailBuffer, {
                    hkdf: 'WhatsApp Sticker Pack Thumbnail Keys',
                    mediaPath: '/mms/thumbnail-sticker-pack',
                    mediaKey: packUpload.mediaKey,
                });
            }
        }

        // ─── إرسال الحزمة الجديدة ───
        await react("📤");

        const newPack = {
            stickerPackId: 'SOLO_' + crypto.randomBytes(8).toString('hex'),
            name: packname,
            publisher: author,
            packDescription: `🏮 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮`,
            stickers: newMetas,
            fileLength: packUpload.fileLength,
            fileSha256: packUpload.fileSha256,
            fileEncSha256: packUpload.fileEncSha256,
            mediaKey: packUpload.mediaKey,
            directPath: packUpload.directPath,
            mediaKeyTimestamp: Math.floor(Date.now() / 1000),
            stickerPackSize: packUpload.fileLength,
            stickerPackOrigin: 2,
            trayIconFileName: 'tray_icon.webp',
            ...(thumbUpload && {
                thumbnailDirectPath: thumbUpload.directPath,
                thumbnailSha256: thumbUpload.fileSha256,
                thumbnailEncSha256: thumbUpload.fileEncSha256,
                thumbnailHeight: 252,
                thumbnailWidth: 252,
                imageDataHash: thumbUpload.fileSha256.toString('base64'),
            }),
        };

        await sock.relayMessage(jid, {
            messageContextInfo: { messageSecret: crypto.randomBytes(32) },
            stickerPackMessage: newPack,
        }, { quoted: message });

        await react("✅");

    } catch (error) {
        console.error("❌ FULL PACK ERROR:", error);
        await react("❌");
        await reply(`*❌ حـدث خـطأ أثـنـاء تـعـديـل الـحـزمـة*\n📌 ${error.message}`);
    }
}

// ════════════════════════════════════════════════════════════════════
//  🎯 تعديل ملصق واحد
// ════════════════════════════════════════════════════════════════════
async function editSingleSticker(sock, message, reply, react, text, stickerMessage) {
    const jid = message.key.remoteJid;

    try {
        let [packname, author] = text ? text.split('|') : [];
        packname = packname?.trim() || '';
        author = author?.trim() || '';

        // ─── تنزيل الملصق ───
        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // ─── بناء EXIF ───
        const exifData = buildExifData(text, packname, author);

        // ─── تعديل EXIF ───
        const finalSticker = await editStickerExif(buffer, exifData);

        // ─── إرسال ───
        await sock.sendMessage(jid, {
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
        }, { quoted: message });

        await react("✅");

    } catch (error) {
        console.error("❌ RIGHTS ERROR:", error);
        await react("❌");
        await reply(`*❌ حـدث خـطأ، تـأكـد مـن تـثـبـيـت node-webpmux*`);
    }
}

// ════════════════════════════════════════════════════════════════════
//  🔌 SOLO WRAPPER
// ════════════════════════════════════════════════════════════════════
export default {
    name       : "حقوق",
    aliases    : ["wm", "take", "تعديل_حقوق"],
    description: "تعديل حقوق الملصق أو الحزمة بالكامل (مع كل ملصقاتها)",
    category   : "تحويل",
    cooldown   : 3000,

    async run({ sock, message, args, reply, react }) {
        const text = args.join(' ').trim();

        // ─── استخراج الـ quoted ───
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctxInfo?.quotedMessage;

        if (!quotedMsg) {
            return reply(
                `*⚠️ ࢪد عـلـى مـلـصـق أو حـزمـة عـشـان احـط حـقـوقـك عـلـيـه 🍷*\n` +
                `📌 *.حقوق سـولـو عـمـك*\n` +
                `📌 *.حقوق [اسم الحزمة] | [الناشر]*`
            );
        }

        await react("🍷");

        // ─── كشف نوع الـ quoted ───
        const stickerMessage = quotedMsg?.stickerMessage;
        const packMessage = quotedMsg?.stickerPackMessage;

        // ─── 1️⃣ حزمة ملصقات ───
        if (packMessage) {
            return await editFullStickerPack(sock, message, reply, react, text, quotedMsg);
        }

        // ─── 2️⃣ ملصق واحد ───
        if (stickerMessage) {
            return await editSingleSticker(sock, message, reply, react, text, stickerMessage);
        }

        // ─── 3️⃣ لا واحد ولا التاني ───
        await react("❌");
        return reply(`*⚠️ الـرسـالـة الـمـردود عـلـيـهـا لـيـسـت مـلـصـق أو حـزمـة*`);
    }
};