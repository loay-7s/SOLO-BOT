// plugins/تست.js

import {
    generateWAMessageFromContent
} from "@whiskeysockets/baileys";

const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

const SOLO_CHANNEL_URL =
    "https://whatsapp.com/channel/0029VbCEhNX7DAWrudaFBs41";

export default {
    name: "تست",
    aliases: ["test", "بوت"],
    category: "عام",

    async run({ sock, message, reply, userJid, handler }) {
        const jid = message.key.remoteJid;

        // ✅ وقت التشغيل
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

        // ✅ عدد الأوامر
        let cmdCount = 0;

        try {
            if (handler && handler.commands) {
                cmdCount = handler.commands.size || 0;
            }
        } catch (e) {}

        const speed =
            Math.floor(Math.random() * 5) + 1;

        // ✅ جلب اسم المستخدم من واتساب
        let userName = "Unknown";

        try {
            const contact =
                await sock.onWhatsApp(userJid);

            if (
                contact &&
                contact[0]?.notify
            ) {
                userName =
                    contact[0].notify;
            } else {
                const pushName =
                    message.pushName ||
                    message.notifyName;

                if (pushName) {
                    userName = pushName;
                } else {
                    userName =
                        userJid.split("@")[0] ||
                        "Unknown";
                }
            }
        } catch (e) {
            const pushName =
                message.pushName ||
                message.notifyName;

            if (pushName) {
                userName = pushName;
            } else {
                userName =
                    userJid.split("@")[0] ||
                    "Unknown";
            }
        }

        // ✅ النص الرئيسي — بدون أي تغيير
        const text =
`*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

   *🏮┇ 𝑺  𝑶  𝑳  𝑶    𝑩  𝑶  𝑻 ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚡ ⌯╎⊰ ───┄┄⎔*

*┋ 𝑺𝑻𝑨𝑻𝑼𝑺 : 🟢 𝑶𝑵𝑳𝑰𝑵𝑬*
*┋ 𝑼𝑺𝑬𝑹 : ⦓ ${userName} ⦔*
*┋ 𝑼𝑷𝑻𝑰𝑴𝑬 : ⦓ ${uptimeStr} ⦔*
*┋ 𝑺𝑷𝑬𝑬𝑫 : ⦓ ${speed} ms ⦔*
*┋ 𝑪𝑶𝑴𝑴𝑨𝑵𝑫𝑺 : ⦓ 𝟐𝟓𝟎 ⦔*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

        // ✅ الأزرار
        const buttons = [
            {
                name: "single_select",

                buttonParamsJson: JSON.stringify({
                    title: "📜 قـائـمـة الأوامـࢪ",

                    sections: [
                        {
                            title: "𝑺 𝑶 𝑳 𝑶 ⊰ 🏮 ⊱ 𝑩 𝑶 𝑻",

                            rows: [
                                {
                                    title: "📜 قـائـمـة الأوامـࢪ",
                                    description: "عـࢪض قـائـمـة أوامـࢪ سـولـو 🍷",
                                    id: ".الاوامر"
                                }
                            ]
                        }
                    ]
                })
            },

            {
                name: "cta_url",

                buttonParamsJson: JSON.stringify({
                    display_text: "📢 قـنـاة سـولـو",
                    url: SOLO_CHANNEL_URL
                })
            },

            {
                name: "quick_reply",

                buttonParamsJson: JSON.stringify({
                    display_text: "👑 الـمـطـوࢪ",
                    id: ".المطور"
                })
            }
        ];

        // ✅ الرسالة التفاعلية
        const interactiveMessage = {
            body: {
                text
            },

            footer: {
                text: "𝑺𝑶𝑳𝑶"
            },

            contextInfo: {
                mentionedJid: userJid
                    ? [userJid]
                    : [],

                forwardingScore: 4,
                isForwarded: false,

                forwardedNewsletterMessageInfo: {
                    newsletterJid:
                        SOLO_CHANNEL_ID,

                    serverMessageId: 1,

                    newsletterName:
                        "𝑺𝑶𝑳𝑶"
                }
            },

            nativeFlowMessage: {
                buttons
            }
        };

        // ✅ إنشاء الرسالة
        const waMessage =
            generateWAMessageFromContent(
                jid,
                {
                    interactiveMessage
                },
                {
                    userJid: sock.user?.id,
                    quoted: message
                }
            );

        // ✅ إرسال Native Flow
        await sock.relayMessage(
            jid,
            waMessage.message,
            {
                messageId:
                    waMessage.key.id,

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

        // ✅ تفاعل
        await sock.sendMessage(
            jid,
            {
                react: {
                    text: "🍷",
                    key: message.key
                }
            }
        );
    }
};