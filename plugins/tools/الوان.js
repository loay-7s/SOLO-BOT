// plugins/الوان.js
// 🌈 SOLO RTX TEXT — بالعربي بدون رموز 🌈
import { randomUUID, randomBytes } from 'node:crypto';

const FOOTER = `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

// ═══════════════════════════════════════════════
// 🎨 الألوان المدعومة
// ═══════════════════════════════════════════════
const COLORS = {
    'احمر': 'linear-gradient(90deg, #ff0000, #ff3a3a, #ff0000)',
    'أحمر': 'linear-gradient(90deg, #ff0000, #ff3a3a, #ff0000)',
    'ازرق': 'linear-gradient(90deg, #0066ff, #00aaff, #0066ff)',
    'أزرق': 'linear-gradient(90deg, #0066ff, #00aaff, #0066ff)',
    'اخضر': 'linear-gradient(90deg, #00aa00, #00ff00, #00aa00)',
    'أخضر': 'linear-gradient(90deg, #00aa00, #00ff00, #00aa00)',
    'اصفر': 'linear-gradient(90deg, #ffaa00, #ffff00, #ffaa00)',
    'أصفر': 'linear-gradient(90deg, #ffaa00, #ffff00, #ffaa00)',
    'برتقالي': 'linear-gradient(90deg, #ff6600, #ffaa00, #ff6600)',
    'بنفسجي': 'linear-gradient(90deg, #8b00ff, #d400ff, #8b00ff)',
    'موف': 'linear-gradient(90deg, #8b00ff, #d400ff, #8b00ff)',
    'بينك': 'linear-gradient(90deg, #ff0088, #ff66cc, #ff0088)',
    'زهري': 'linear-gradient(90deg, #ff0088, #ff66cc, #ff0088)',
    'وردي': 'linear-gradient(90deg, #ff0088, #ff66cc, #ff0088)',
    'تركواز': 'linear-gradient(90deg, #00cccc, #00ffff, #00cccc)',
    'سماوي': 'linear-gradient(90deg, #0099ff, #66ccff, #0099ff)',
    'بني': 'linear-gradient(90deg, #8b4513, #b8691e, #8b4513)',
    'رمادي': 'linear-gradient(90deg, #666666, #aaaaaa, #666666)',
    'اسود': 'linear-gradient(90deg, #000000, #333333, #000000)',
    'قوس': 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000)',
    'ملون': 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000)',
    'رينبو': 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000)'
};

// ═══════════════════════════════════════════════
// 🆕 قائمة الكلمات المفتاحية (الألوان + مخفي)
// ═══════════════════════════════════════════════
const KEYWORDS = [
    'ملون', 'مخفي', 'قوس', 'رينبو',
    'احمر', 'أحمر', 'ازرق', 'أزرق',
    'اخضر', 'أخضر', 'اصفر', 'أصفر',
    'برتقالي', 'بنفسجي', 'موف',
    'بينك', 'زهري', 'وردي',
    'تركواز', 'سماوي', 'بني',
    'رمادي', 'اسود'
];

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function buildSpoiler(content) {
    return `<label class="rtx-sp" style="--rtx-sp:rgba(127, 127, 127, 0.498);--rtx-sp-on:rgba(127, 127, 127, 0.174)"><input type="checkbox" class="rtx-sp-i"><span class="rtx-sp-bg" style="padding:0 .25em 0 .25em;border-radius:.25em"><span class="rtx-sp-in">${content}</span></span></label>`;
}

// ═══════════════════════════════════════════════
// 🆕 تحويل النص بالطريقة الجديدة
// "احمر تست اخضر هلا مخفي هلو"
// ═══════════════════════════════════════════════
function parseRtx(text) {
    // تقسيم النص لـ كلمات
    const tokens = String(text).split(/\s+/);
    
    const result = [];
    let currentMode = null; // 'color:NAME' أو 'spoiler'
    let currentColor = null;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const lowerToken = token.toLowerCase();

        // 🔍 لو التوكن كلمة مفتاحية
        if (KEYWORDS.includes(lowerToken)) {
            if (lowerToken === 'مخفي') {
                currentMode = 'spoiler';
                currentColor = null;
            } else {
                currentMode = 'color';
                currentColor = COLORS[lowerToken] || COLORS['قوس'];
            }
            continue; // الكلمة المفتاحية نفسها مش بتتطبع
        }

        // 🎨 الكلمة العادية
        if (currentMode === 'spoiler') {
            // مخفي
            result.push(buildSpoiler(escapeHtml(token)));
        } else if (currentMode === 'color' && currentColor) {
            // ملون
            result.push(`<span class="rtx-grad rtx-anim" style="background-image:${currentColor}">${escapeHtml(token)}</span>`);
        } else {
            // بدون لون → عادي
            result.push(escapeHtml(token));
        }
    }

    return wrapHtml(result.join(' '));
}

function wrapHtml(out) {
    return `
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;width:auto;height:auto;min-height:0;overflow:hidden;background:transparent}
.rtx-root{color:#000}
@media (prefers-color-scheme:dark){.rtx-root{color:#fff}}
</style>
<style>
.rtx-grad{background-attachment:fixed;background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;display:inline-block;will-change:background-position;}
.rtx-anim{animation:rtxFlow 2s linear infinite;}
@keyframes rtxFlow{from{background-position:200% 0;}to{background-position:0% 0;}}
</style>
<style>
.rtx-sp{cursor:pointer;-webkit-tap-highlight-color:transparent;}
.rtx-sp-i{position:absolute;opacity:0;width:0;height:0;margin:0;pointer-events:none;}
.rtx-sp-bg{background-color:var(--rtx-sp);border-radius:.25em;padding:0 .25em;-webkit-box-decoration-break:clone;box-decoration-break:clone;transition:background-color .15s;}
.rtx-sp-in{opacity:0;transition:opacity .15s;}
.rtx-sp-i:checked+.rtx-sp-bg{background-color:var(--rtx-sp-on);}
.rtx-sp-i:checked+.rtx-sp-bg>.rtx-sp-in{opacity:1;}
</style>
<span class="rtx-root" style="font-weight:700">${out}</span>`;
}

// ═══════════════════════════════════════════════
// ⚔️ الأمـر
// ═══════════════════════════════════════════════
export default {
    name: "الوان",
    aliases: ["txtcolor", "rtx", "الوان", "زخرفة"],
    category: "tools",
    desc: "ألوان متحركة + سبويلر بالعربي",
    usage: ".الوان احمر نصك اخضر نصك مخفي نصك",

    async run({ sock, message, text, reply, react, command }) {
        const chatId = message.key.remoteJid;

        try {
            const input = text?.trim();

            if (!input) {
                await react("🌈");

                return reply(`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ 🌈 الـكـتـابـة الـمـلـونـة ┇🏮*

*⎔┄┄─── ⊱╎⌯ ✨ ⌯╎⊰ ───┄┄⎔*

*┋ الـطـࢪيـقـة :*

*⬡ اكتب اللون وبعده الكلمة*
*⬡ والكلمة اللي بعد اللون تـتـلـون*

*⎔┄┄─── ⊱╎⌯ 🎨 ⌯╎⊰ ───┄┄⎔*

*┋ الألوان المـتـاحـة :*

*⬡ احمر ← باللون الأحمر* 🔴
*⬡ ازرق ← باللون الأزرق* 🔵
*⬡ اخضر ← باللون الأخضر* 🟢
*⬡ اصفر ← باللون الأصفر* 🟡
*⬡ برتقالي ← باللون البرتقالي* 🟠
*⬡ بنفسجي ← باللون البنفسجي* 🟣
*⬡ بينك ← باللون الوردي* 💗
*⬡ تركواز ← باللون التركواز* 💎
*⬡ بني ← باللون البني* 🟤
*⬡ رمادي ← باللون الرمادي* ⚫
*⬡ قوس ← بألوان قوس قزح* 🌈
*⬡ مخفي ← يجعل الكلمة مخفية* 🔒

*⎔┄┄─── ⊱╎⌯ 📝 ⌯╎⊰ ───┄┄⎔*

*📌 أمـثـلـة :*

*⬡ .${command} احمر تست اخضر هلا مخفي هلو*
*⬡ .${command} ازرق مرحبا اصفر صباح الخير*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

${FOOTER}`);
            }

            // ═══════════════════════════════════════════════
            // 🎨 بناء الرسالة
            // ═══════════════════════════════════════════════
            const htmlPayload = parseRtx(input);
            const responseId = randomUUID();
            const messageSecret = randomBytes(32).toString('base64');
            const stanzaId = randomBytes(16).toString('hex').toUpperCase();

            const unifiedData = Buffer.from(JSON.stringify({
                response_id: responseId,
                sections: [{
                    view_model: {
                        primitive: {
                            __typename: "GenAIaeacdsnwHtmlPrimitive",
                            payload: htmlPayload,
                            trusted_sources: []
                        },
                        __typename: "GenAISingleLayoutViewModel"
                    }
                }]
            })).toString('base64');

            const msgContent = {
                messageContextInfo: {
                    messageSecret: messageSecret,
                    threadId: [{
                        threadType: 1,
                        threadKey: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: message.sender
                        }
                    }]
                },
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            submessages: [
                                { messageType: 2, messageText: "" },
                                { messageType: 15 }
                            ],
                            unifiedResponse: { data: unifiedData },
                            contextInfo: {
                                stanzaId: stanzaId,
                                participant: message.sender,
                                quotedMessage: {
                                    extendedTextMessage: {
                                        text: input,
                                        previewType: 0,
                                        inviteLinkGroupTypeV2: 0
                                    }
                                },
                                forwardingScore: 1,
                                isForwarded: true,
                                expiration: 0,
                                forwardedAiBotMessageInfo: {
                                    botName: "SOLO",
                                    botJid: "0@bot",
                                    creatorName: "SOLO"
                                },
                                forwardOrigin: 4,
                                quotedType: 0,
                                botMessageSharingInfo: {
                                    botEntryPointOrigin: 1,
                                    forwardScore: 1
                                },
                                afterReadDuration: 0
                            }
                        }
                    }
                }
            };

            const finalMsg = chatId.endsWith('@g.us') ? {
                senderKeyDistributionMessage: {
                    groupId: chatId,
                    axolotlSenderKeyDistributionMessage: "Mwism8PgBBArGiAVhCznlyuZCbzEi2CgBBTfpdt12qH4efrVc3kt6HrVUyIhBdjzj54YNSQ63CX17IUK9pb+KS/cYULFpNQiR0R3xAY5"
                },
                ...msgContent
            } : msgContent;

            const newParentId = await sock.relayMessage(chatId, finalMsg, {});

            await sock.relayMessage(chatId, {
                botForwardedMessage: {
                    message: {
                        protocolMessage: {
                            key: {
                                remoteJid: chatId,
                                fromMe: true,
                                id: newParentId
                            },
                            type: 14,
                            editedMessage: msgContent
                        }
                    }
                }
            }, {});

            await react("✅");

        } catch (error) {
            console.error("❌ SOLO RTX ERROR:", error?.message || error);
            await react("❌");
            return reply(`*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ ❌ فــشــل الأمــࢪ ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ${error?.message || 'حاول مرة تانية'}*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

${FOOTER}`);
        }
    }
};