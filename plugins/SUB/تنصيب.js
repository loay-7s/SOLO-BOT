// plugins/SUB/تنصيب.js
// ⚔️ SOLO SUB BOT — INSTALL WITH CUSTOM PAIR CODE ⚔️

import {
    generateWAMessageFromContent
} from '@whiskeysockets/baileys';

// ═══════════════════════════════════════════════════════════
// 🎯 الكود الموحد المطلوب
// ═══════════════════════════════════════════════════════════
const CUSTOM_PAIR_CODE = 'SOLOXBOT';

export default {
    name: "تنصيب",
    aliases: ["نصبني", "sub"],
    description: "تنصيب بوت فرعي جديد",
    category: "sub",
    cooldown: 60000,

    async run({ m, sock, reply, react }) {
        const sub = global.subBots;

        if (!sub) {
            return reply(
                `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                `*❌ نـظـام الـبـوتـات الـفـرعـيـة غـيـر مـتـاح*\n\n` +
                `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }

        const number = await getPhoneNumber(m, sock);

        if (!number) {
            return reply(
                `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                `*❌ لـم أسـتـطـع الـحـصـول عـلـى رقـم الـهـاتـف*\n\n` +
                `*📱 أرسـل رقـم الـهـاتـف بعـد الامـر*\n` +
                `*📝 مـثـال:*\n*.فرعي اضف 201XXXXXXXXX*\n\n` +
                `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }

        if (!/^\d+$/.test(number)) {
            return reply(
                `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                `*❌ رقـم الـهـاتـف غـيـر صـالـح*\n\n` +
                `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }

        if (sub.hasPhone(number)) {
            return reply(
                `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                `*❌ هـذا الـرقـم لـديـه بـوت فـرعـي بـالـفـعـل*\n\n` +
                `*📱 الـرقـم: ⦓ ${number} ⦔*\n\n` +
                `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }

        if (sub.list().length >= 10) {
            return reply(
                `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                `*❌ تـم الـوصـول لـلـحـد الأقـصـى*\n\n` +
                `*📊 الـحـد الأقـصـى: ⦓ 10 بـوتـات ⦔*\n\n` +
                `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );
        }

        let timeout = null;

        const state = {
            id: null,
            pairSent: false,
            resolved: false,
            pendingPair: null,
        };

        let handlers = null;

        const cleanup = () => {
            if (!handlers) return;
            sub.off('pair', handlers.pair);
            sub.off('ready', handlers.ready);
            sub.off('error', handlers.error);
        };

        try {
            await react("⏳");

            await reply(
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ──┄┄⎔*\n` +
                `*『𝑺𝑼𝑩 𝑩𝑶𝑻 𝑺𝒀𝑺𝑻𝑬𝑴』*\n\n` +
                `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                `*⏳ جـاري تـنـصـيـب الـبـوت الـفـرعـي...*\n\n` +
                `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*`
            );

            handlers = {
                pair: async (id, code) => {
                    if (state.pairSent || state.resolved) return;

                    if (!state.id) {
                        state.pendingPair = { id, code };
                        return;
                    }

                    if (String(id) !== String(state.id)) return;

                    state.pairSent = true;

                    try {
                        await react("🔐");
                        await sendCodeWithCopy(
                            m.key.remoteJid,
                            code,
                            number,
                            m,
                            sock
                        );
                    } catch (error) {
                        state.pairSent = false;
                        console.error('❌ Pairing error:', error?.message);
                    }
                },

                ready: async (id) => {
                    if (String(id) !== String(state.id) || state.resolved) return;

                    state.resolved = true;

                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }

                    cleanup();

                    try {
                        await react("✅");
                        const addedBot = sub.get(state.id);
                        const mode = addedBot?.config?.MODE || sub?.config?.MODE || 'Public';

                        await reply(
                            `*╭───⊷ 𝐒 𝐎 𝐋 𝐎 ⊷───╮*\n` +
                            `*│*  ✅ تـم الـربـط بـنـجـاح\n` +
                            `*│*\n` +
                            `*│* 🤖 الـبـوت: *SOLO-XBOT ${state.id}*\n` +
                            `*│* 📱 الـرقـم: *${number}*\n` +
                            `*│* 🌐 الـحـالـة: *${mode}*\n` +
                            `*│*\n` +
                            `*│* الـبـوت جـاهـز لـلاسـتـخـدام الآن.\n` +
                            `*╰───⊷ 🏮 ⊷───╯*`
                        );
                    } catch {}
                },

                error: async (id, error) => {
                    if (String(id) !== String(state.id) || state.resolved) return;

                    state.resolved = true;

                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }

                    cleanup();

                    try {
                        await reply(
                            `*❌ فـشـل اقـتـران الـبـوت الـفـرعـي*\n\n` +
                            `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                            `*⚠️ الـخـطـأ: ⦓ ${error?.message || 'غـيـر مـعـروف'} ⦔*\n\n` +
                            `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                        );
                    } catch {}
                },
            };

            sub.on('pair', handlers.pair);
            sub.on('ready', handlers.ready);
            sub.on('error', handlers.error);

            // ═══════════════════════════════════════════════════════
            // 🎯 تمرير الكود المخصص عبر global
            // ═══════════════════════════════════════════════════════
            global.__CUSTOM_PAIR_CODE__ = CUSTOM_PAIR_CODE;

            try {
                state.id = await sub.add(number);
            } finally {
                setTimeout(() => {
                    delete global.__CUSTOM_PAIR_CODE__;
                }, 10000);
            }

            if (
                state.pendingPair &&
                String(state.pendingPair.id) === String(state.id) &&
                !state.pairSent
            ) {
                state.pairSent = true;
                await react("🔐");
                await sendCodeWithCopy(
                    m.key.remoteJid,
                    state.pendingPair.code,
                    number,
                    m,
                    sock
                );
            }

            timeout = setTimeout(async () => {
                if (state.resolved) return;

                state.resolved = true;
                cleanup();

                try {
                    await reply(
                        state.pairSent
                            ? `*⏰ تـم إرسـال الـكـود ولـكـن لـم يـتـم الـتـأكـيـد*\n\n` +
                              `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                              `*تـأكـد مـن إدخـال الـكـود فـي واتـسـاب*\n\n` +
                              `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                            : `*⏰ لـم يـتـمـكـن الـبـوت مـن إرسـال الـكـود خـلال 120 ثـانـيـة*\n\n` +
                              `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                              `*الـرجـاء الـمـحـاولـة مـرة أخـرى*\n\n` +
                              `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                    );
                } catch {}
            }, 120000);

        } catch (error) {
            console.error('❌ Sub Bot Install Error:', error);

            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            cleanup();

            try {
                await reply(
                    `*❌ حـدث خـطـأ أثـنـاء الـتـنـصـيـب*\n\n` +
                    `*⚠️ ⦓ ${error?.message || 'خـطـأ غـيـر مـعـروف'} ⦔*\n\n` +
                    `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
                );
            } catch {}
        }
    }
};

// ═══════════════════════════════════════════════════════════
// 🎨 رسالة الكود + زر النسخ
// ═══════════════════════════════════════════════════════════

async function sendCodeWithCopy(jid, code, number, quoted, sock) {
    if (!sock) throw new Error('Socket غير متصل');
    if (!jid) throw new Error('معرف المحادثة غير موجود');
    if (!code) throw new Error('الكود غير موجود');

    try {
        const interactiveMessage = {
            body: {
                text:
                    `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ─┄┄⎔*\n` +
                    `*『𝑺𝑼𝑩 𝑩𝑶𝑻 𝑷𝑨𝑰𝑹𝑰𝑵𝑮』*\n` +
                    `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +

                    `*📱 الـرقـم: ⦓ ${number} ⦔*\n\n` +

                    `*📌 خـطـوات الـربـط:*\n\n` +
                    `*1️⃣ افتح واتساب على الهاتف*\n` +
                    `*2️⃣ الإعدادات ← الأجهزة المرتبطة*\n` +
                    `*3️⃣ اضغط ربط جهاز*\n` +
                    `*4️⃣ اختر الربط برقم الهاتف*\n` +
                    `*5️⃣ انسخ الكود من الأسفل 👇🏻*\n\n` +

                    `*⏰ الكود يـنـتـهـي بـعـد 60 ثـانـيـة*\n\n` +

                    `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ─┄┄⎔*\n` +
                    `> 『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』`
            },
            footer: {
                text: '𝐒 𝐎 𝐋 𝐎'
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'COPY CODE 📋',
                            copy_code: String(code)
                        })
                    }
                ]
            }
        };

        const waMessage = generateWAMessageFromContent(
            jid,
            {
                interactiveMessage
            },
            {
                userJid: sock.user?.id,
                quoted
            }
        );

        await sock.relayMessage(
            jid,
            waMessage.message,
            {
                messageId: waMessage.key.id,

                additionalNodes: [
                    {
                        tag: "biz",
                        attrs: {},

                        content: [
                            {
                                tag: "interactive",

                                attrs: {
                                    type: "native_flow",
                                    v: "1"
                                },

                                content: [
                                    {
                                        tag: "native_flow",

                                        attrs: {
                                            v: "9",
                                            name: "mixed"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        );
    } catch (error) {
        console.error('❌ Copy button error:', error?.message);

        await sock.sendMessage(jid, {
            text:
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ──┄┄⎔*\n` +
                `*『𝑺𝑼𝑩 𝑩𝑶𝑻 𝑷𝑨𝑰𝑹𝑰𝑵𝑮』*\n` +
                `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*📱 الـرقـم: ⦓ ${number} ⦔*\n\n` +
                `*╭───⊷ 🔐 الـكـود ⊷───╮*\n` +
                `*│*\n` +
                `*│* ⦓ *${code}* ⦔\n` +
                `*│*\n` +
                `*╰──────────────╯*\n\n` +
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ──┄┄⎔*\n` +
                `> 『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』`
        }, { quoted });
    }
}

// ═══════════════════════════════════════════════════════════
// 🛠️ Helpers
// ═══════════════════════════════════════════════════════════

async function getPhoneNumber(message, sock) {
    const key = message?.key || {};

    const candidates = [
        key.participantAlt,
        key.remoteJidAlt,
        key.participant,
        key.remoteJid
    ].filter(Boolean);

    for (const jid of candidates) {
        if (jid.endsWith('@s.whatsapp.net')) {
            return normalizePhoneNumber(jid.split('@')[0]);
        }
    }

    const lid = candidates.find(jid => jid.endsWith('@lid'));

    if (lid && sock?.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const pn = await sock.signalRepository.lidMapping.getPNForLID(lid);

            if (pn && pn.endsWith('@s.whatsapp.net')) {
                return normalizePhoneNumber(pn.split('@')[0]);
            }
        } catch (error) {
            console.error('❌ LID → PN Error:', error?.message || error);
        }
    }

    return null;
}

function normalizePhoneNumber(number) {
    let clean = String(number || '').replace(/[^\d]/g, '');

    if (clean.startsWith('20') && clean.length === 13 && clean.endsWith('0')) {
        clean = clean.slice(0, -1);
    }

    return clean;
}