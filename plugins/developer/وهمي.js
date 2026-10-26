// plugins/وهمي.js
// ════════════════════════════════════════════════════════════════════
//  ⚡ SOLO BOT — Fake Message Editor (.وهمي)
//  تعديل أي رسالة بنص مختلف — بدون أي رسائل خطأ
// ════════════════════════════════════════════════════════════════════

import { delay } from '@whiskeysockets/baileys';

// ════════════════════════════════════════════════════════════════════
//  🎨 الزخرفة الرسمية
// ════════════════════════════════════════════════════════════════════
const SOLO_HEADER = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*`;
const SOLO_FOOTER = `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

// ════════════════════════════════════════════════════════════════════
//  💧 Watermark
// ════════════════════════════════════════════════════════════════════
const _0xW = [10, 62, 32, 119862, 119900, 119898, 119898, 119886, 119899, 119889, 32, 119887, 119910, 32, 119873, 119900, 119906, 114, 32, 128164];
const WATERMARK = String.fromCodePoint(..._0xW);

// ════════════════════════════════════════════════════════════════════
//  🎯 الدالة الرئيسية
// ════════════════════════════════════════════════════════════════════
async function fakeMessageHandler(m, { sock, text }) {
    // ─── بدون رد → رسالة المساعدة ───
    if (!m.quoted) {
        return m.reply(
            `${SOLO_HEADER}\n\n` +
            `*🏮┇ انـتـحـال عـضـو ┇🏮*\n\n` +
            `*───━━━⊱  📋  ⊰━━━───*\n\n` +
            `*🔹 الـطـريـقـة:*\n` +
            `*┋ 1. اعـمـل ريـبـلاي عـلـى أي رسـالـة*\n` +
            `*┋ 2. اكـتـب .وهمي <الـنـص الـجـديـد>*\n` +
            `*┋ 3. سـيـظـهـࢪ كـأن الـعـضـو هـو مـن اࢪسـلـهـا*\n\n` +
            `*───━━━⊱  💡  ⊰━━━───*\n\n` +
            `*┋ مـثـال:*\n` +
            `*┋ (رد على رسالة) .وهمي سولو عمي\n\n` +
            `${SOLO_HEADER}\n` +
            `${SOLO_FOOTER}`
        );
    }

    // ─── بدون نص → رسالة المساعدة ───
    if (!text) {
        return m.reply(
            `${SOLO_HEADER}\n\n` +
            `*🏮┇ انـتـحـال عـضـو ┇🏮*\n\n` +
            `*───━━━⊱  📝  ⊰━━━───*\n\n` +
            `*┋ اكـتـب الـنـص الـجـديـد بـعـد الأمـر\n\n` +
            `*───━━━⊱  💡  ⊰━━━───*\n\n` +
            `*┋ مـثـال:*\n` +
            `*┋ .وهمي سولو عمي\n` +
            `*┋ .وهمي انا رقاصة\n\n` +
            `${SOLO_HEADER}\n` +
            `${SOLO_FOOTER}`
        );
    }

    const stanzaId = m.quoted.id;

    try {
        // ─── 1. إرسال رسالة مؤقتة ───
        const tempId = await sock.relayMessage(m.chat, {
            extendedTextMessage: {
                text: '',
                contextInfo: { isGroupStatus: true }
            }
        }, {});

        // ─── 2. تعديل الرسالة (بروتوكول 14) ───
        const tempId2 = await sock.relayMessage(m.chat, {
            protocolMessage: {
                key: {
                    jid: m.chat,
                    fromMe: true,
                    id: tempId
                },
                type: 14,
                editedMessage: {
                    extendedTextMessage: {
                        text: text,
                        contextInfo: { isGroupStatus: false }
                    }
                }
            }
        }, { messageId: stanzaId });

        // ─── 3. انتظار قصير ───
        await delay(100);

        // ─── 4. حذف الرسائل المؤقتة ───
        await Promise.allSettled([
            sock.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    id: tempId,
                    fromMe: true
                }
            }),
            sock.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    id: tempId2,
                    fromMe: true
                }
            })
        ]);

        // ─── 5. ريأكت نجاح ───
        await m.react('✅');

    } catch (e) {
        // ═══════════════════════════════════════════════════════
        //  🚫 بدون أي رسالة خطأ — صمت تام
        // ═══════════════════════════════════════════════════════
        console.error('[FAKEMSG SILENT ERROR]', e?.message || e);
    }
}

// ════════════════════════════════════════════════════════════════════
//  🔌 SOLO WRAPPER
// ════════════════════════════════════════════════════════════════════
export default {
    name       : 'وهمي',
    aliases    : ['fake', 'فيك', 'spoof'],
    description: 'تعديل أي رسالة بنص مختلف — بدون إرسال رسالة جديدة',
    category   : 'أدوات',
    cooldown   : 2000,
    developer  : true,

    async run({ sock, message, args, reply, react, command }) {
        try {
            // ─── تحويل message للشكل المطلوب ───
            const m = message;
            m.chat   = message.key.remoteJid;
            m.sender = message.key.participant || message.key.remoteJid;

            m.reply = (content) =>
                reply(typeof content === 'string' ? content : content.text || '');

            // ─── محاكاة m.quoted ───
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const ctx = message.message.extendedTextMessage.contextInfo;
                const quotedMsg = ctx.quotedMessage;

                m.quoted = {
                    message   : quotedMsg,
                    text      : quotedMsg?.conversation ||
                                quotedMsg?.extendedTextMessage?.text ||
                                quotedMsg?.imageMessage?.caption ||
                                quotedMsg?.videoMessage?.caption || '',
                    msg       : quotedMsg?.extendedTextMessage || quotedMsg,
                    mtype     : Object.keys(quotedMsg)[0],
                    sender    : ctx.participant,
                    id        : ctx.stanzaId,
                    key       : {
                        id        : ctx.stanzaId,
                        remoteJid : m.chat,
                        participant: ctx.participant
                    }
                };
            } else {
                m.quoted = null;
            }

            // ─── استخراج النص ───
            const text = args.join(' ').trim();

            // ─── استدعاء الدالة ───
            return await fakeMessageHandler(m, { sock, text });

        } catch (err) {
            // ═══════════════════════════════════════════════════════
            //  🚫 بدون أي رسالة خطأ — صمت تام
            // ═══════════════════════════════════════════════════════
            console.error('[FAKE WRAPPER SILENT]', err?.message || err);
        }
    }
};