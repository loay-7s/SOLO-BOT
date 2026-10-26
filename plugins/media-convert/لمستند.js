// plugins/لمستند.js
// ⚔️ SOLO PDF — INSTANT ALBUM + SINGLE ⚔️

import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execPromise = (await import('util')).promisify((await import('child_process')).exec);

// ═══════════════════════════════════════════════════════
// 📦 ALBUM CACHE
// ═══════════════════════════════════════════════════════
const store = (globalThis.__soloPdfStore ||= {
    albumCache: new Map(),
    msgToAlbum: new Map(),
    recentByChat: new Map(),
    timer: null,
});

const { albumCache, msgToAlbum, recentByChat } = store;
const ALBUM_TTL = 30 * 60 * 1000;
const RECENT_LIMIT = 300;
const CLUSTER_GAP_MS = 15000;
const MAX_IMAGES = 100;

// ═══════════════════════════════════════════════════════
// 🛠️ HELPERS
// ═══════════════════════════════════════════════════════

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

        const img = isImage(m);
        const vid = isVideo(m);
        const parent = isParent(m);

        const sender = m?.key?.participant || chat;
        const albumId = extractAlbumId(m);
        const expected = extractExpected(m);

        if (img || vid) {
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

        if ((img || vid) && !entry.images.some(x => x.key?.id === msgId)) {
            entry.images.push(m);
            msgToAlbum.set(msgId, albumId);
        }
    } catch (e) {
        console.error('[PDF-CACHE]', e.message);
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
        if (conn.__soloPdfAttached) return;
        conn.__soloPdfAttached = true;
        conn.ev.on('messages.upsert', ({ messages }) => {
            for (const m of messages || []) cacheMedia(m);
        });
    } catch (e) {
        console.error('[PDF-ATTACH]', e.message);
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
// 📥 Download — صور فقط (الفيديو يُتخطى)
// ═══════════════════════════════════════════════════════
async function downloadImage(conn, m) {
    const imgMsg = unwrap(m)?.imageMessage;
    if (!imgMsg) return null;
    try {
        if (typeof conn.downloadMediaMessage === 'function') {
            const buf = await conn.downloadMediaMessage(m).catch(() => null);
            if (buf?.length) return buf;
        }
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        const chunks = [];
        for await (const c of stream) chunks.push(c);
        return Buffer.concat(chunks);
    } catch (e) {
        console.error('[PDF-DOWNLOAD]', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════
// 📄 Build PDF
// ═══════════════════════════════════════════════════════
async function buildPdf(buffers) {
    const tempDir = tmpdir();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const outputPath = join(tempDir, `solo_${id}.pdf`);
    const inputPaths = [];

    for (let i = 0; i < buffers.length; i++) {
        const inputPath = join(tempDir, `solo_img_${id}_${i}.jpg`);
        await fs.writeFile(inputPath, buffers[i]);
        inputPaths.push(inputPath);
    }

    const inputFiles = inputPaths.map(p => `"${p}"`).join(' ');
    await execPromise(`magick ${inputFiles} "${outputPath}"`);

    await fs.access(outputPath);
    const pdfBuffer = await fs.readFile(outputPath);

    for (const p of inputPaths) await fs.unlink(p).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});

    return pdfBuffer;
}

// ═══════════════════════════════════════════════════════
// ⚔️ COMMAND
// ═══════════════════════════════════════════════════════
export default {
    name: "لمستند",
    aliases: ["topdf", "pdf"],
    description: "تحويل صورة أو ألبوم إلى PDF فوراً",
    category: "تحويل",

    async run({ sock, message, reply, react }) {
        const chatId = message.key.remoteJid;

        try {
            // اربط الـ listener
            attachListener(sock);

            // ─── استخراج quoted ───
            const ctxInfo = message.message?.extendedTextMessage?.contextInfo;
            const quotedMsgId = ctxInfo?.stanzaId;
            const quotedParticipant = ctxInfo?.participant;
            const quotedContent = ctxInfo?.quotedMessage;

            if (!ctxInfo || !quotedMsgId) {
                await react("📄");
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*📄 تـحـويـل لـ PDF*
*───━━━⊱  📋  ⊰━━━───*

*┋ رد على صورة لتحويلها لـ PDF فوراً*

*┋ رد على ألبوم لتحويله بالكامل*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 الـحـد الأقـصـى : 100 صـورة*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            await react("📄");

            // ─── 1️⃣ حاول تجميع ألبوم ───
            let images = [];
            let foundVia = 'none';

            const albumId = resolveAlbum(quotedMsgId, quotedContent);
            if (albumId) {
                const entry = await waitForAlbum(albumId);
                images = entry?.images || [];
                foundVia = 'album';
            }

            if (images.length < 2) {
                const cluster = clusterByTime(chatId, quotedMsgId);
                if (cluster && cluster.length > images.length) {
                    images = cluster;
                    foundVia = 'cluster';
                }
            }

            // ─── 2️⃣ لو مفيش ألبوم → صورة واحدة من الـ quoted ───
            if (!images.length && quotedContent) {
                const qi = unwrap({ message: quotedContent })?.imageMessage;
                if (qi) {
                    images = [{
                        key: { id: quotedMsgId, remoteJid: chatId, participant: quotedParticipant },
                        message: { imageMessage: qi },
                    }];
                    foundVia = 'quotedSingle';
                }
            }

            if (!images.length) {
                await react("❌");
                return reply(`*❌ لـم أجـد أي صـورة*\n📌 الـرجـاء الـرد عـلـى صـورة أو ألـبـوم`);
            }

            // ─── 3️⃣ التحقق من الحد الأقصى ───
            if (images.length > MAX_IMAGES) {
                await react("⚠️");
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*⚠️ الـحـد الأقـصـى لـلـصـور*
*───━━━⊱  🚫  ⊰━━━───*

*┋ عـدد الـصـور : ⦓ ${images.length} ⦔*

*┋ الـحـد الأقـصـى : ⦓ ${MAX_IMAGES} ⦔*

*📌 قـسّـم الألـبـوم لـعـدة أجـزاء*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // ─── 4️⃣ تحميل الصور (الفيديو يُتخطى تلقائياً) ───
            const buffers = [];
            for (let i = 0; i < images.length; i++) {
                try {
                    const buf = await downloadImage(sock, images[i]);
                    if (buf?.length) buffers.push(buf);
                } catch (e) {
                    console.error(`[${i + 1}]`, e.message);
                }
            }

            if (!buffers.length) {
                await react("❌");
                return reply(`*❌ فـشـل تـنـزيـل الـصـور*`);
            }

            // ─── 5️⃣ توليد PDF ───
            await react("⏳");

            const pdfBuffer = await buildPdf(buffers);
            const fileName = `SOLO_PDF`;

            const caption = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*📄 تـم إنـشـاء الـمـلـف*
*───━━━⊱  ✅  ⊰━━━───*

*┋ عـدد الـصـفـحـات : ⦓ ${buffers.length} ⦔*

*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await sock.sendMessage(chatId, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `${fileName}.pdf`,
                caption,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: false,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363407767420565@newsletter",
                        serverMessageId: 1,
                        newsletterName: '𝑺𝑶𝑳𝑶'
                    }
                }
            }, { quoted: message });

            await react("✅");

        } catch (err) {
            console.error("❌ PDF Error:", err);
            await react("❌");
            await reply(`*❌ فـشـل تـحـويـل الـصـور إلـى PDF*\n📌 حـاول مـرة اخـرى`);
        }
    }
};