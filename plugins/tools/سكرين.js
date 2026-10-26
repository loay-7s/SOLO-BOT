import axios from "axios";

function extractUrl(text) {
    if (!text) return null;

    const match = String(text).match(
        /https?:\/\/[^\s<>"']+/i
    );

    return match ? match[0].replace(/[.,!?)]$/, "") : null;
}

function getQuotedText(m) {
    const contextInfo =
        m?.message?.extendedTextMessage?.contextInfo ||
        m?.message?.imageMessage?.contextInfo ||
        m?.message?.videoMessage?.contextInfo ||
        m?.message?.documentMessage?.contextInfo ||
        m?.message?.viewOnceMessage?.message?.extendedTextMessage?.contextInfo ||
        m?.message?.viewOnceMessageV2?.message?.extendedTextMessage?.contextInfo;

    const quoted =
        contextInfo?.quotedMessage;

    if (!quoted) return "";

    if (quoted.conversation) {
        return quoted.conversation;
    }

    if (quoted.extendedTextMessage?.text) {
        return quoted.extendedTextMessage.text;
    }

    if (quoted.imageMessage?.caption) {
        return quoted.imageMessage.caption;
    }

    if (quoted.videoMessage?.caption) {
        return quoted.videoMessage.caption;
    }

    if (quoted.documentMessage?.caption) {
        return quoted.documentMessage.caption;
    }

    return "";
}

export default {
    name: "سكرين",
    aliases: ["اسكرين", "ss", "screenshot","سكرين_شوت"],
    category: "tools",
    description: "تصوير صفحة ويب وإرسالها كصورة",

    async run({ m, reply, text, sock }) {
        let url = extractUrl(text);

        if (!url) {
            const quotedText =
                getQuotedText(m);

            url = extractUrl(quotedText);
        }

        if (!url) {
            return reply(
                "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n" +
                "*╭───⊷ 📸 تـصـويـر مـوقـع*\n" +
                "*┋*\n" +
                "*┋ ⚠️ اكتب رابط الموقع بعد الأمر.*\n" +
                "*┋ أو اعمل Reply على رسالة فيها رابط واكتب .سكرين*\n" +
                "*┋*\n" +
                "*┋ 📌 مثال : .سكرين https://google.com*\n" +
                "*┋*\n" +
                "*╰───⊷*\n\n" +
                "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~"
            );
        }

        if (!/^https?:\/\/\S+$/i.test(url)) {
            return reply(
                "*❌ الـرابـط غـيـر صـحـيـح.*\n\n" +
                "*📌 استخدم رابط يبدأ بـ http:// أو https://*"
            );
        }

        try {
            await sock.sendMessage(
                m.key.remoteJid,
                {
                    react: {
                        text: "⏳",
                        key: m.key
                    }
                }
            );

            const screenshotUrl =
                `https://image.thum.io/get/fullpage/${url}`;

            const response =
                await axios.get(
                    screenshotUrl,
                    {
                        responseType: "arraybuffer",
                        timeout: 60000,
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0"
                        }
                    }
                );

            const image =
                Buffer.from(
                    response.data
                );

            if (!image.length) {
                throw new Error(
                    "Empty screenshot response"
                );
            }

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    image,
                    caption:
                        "*⎔┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄⎔*\n\n" +
                        "*╭───⊷ 📸 تـم الـتـصـويـر*\n" +
                        "*┋*\n" +
                        "*┋ ✅ تـم تـصـويـر الـمـوقـع بـنـجـاح.*\n" +
                        "*┋*\n" +
                        `*┋ 🌐 الـرابـط : ${url}*\n` +
                        "*┋*\n" +
                        "*╰───⊷*\n\n" +
                        "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~"
                },
                {
                    quoted: m
                }
            );

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    react: {
                        text: "✅",
                        key: m.key
                    }
                }
            );

        } catch (error) {
            console.error(
                "❌ Screenshot Error:",
                error?.response?.status ||
                error?.message ||
                error
            );

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    react: {
                        text: "❌",
                        key: m.key
                    }
                }
            );

            return reply(
                "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n" +
                "*╭───⊷ ❌ خـطـأ*\n" +
                "*┋*\n" +
                "*┋ حـدث خـطـأ أثـنـاء تـصـويـر الـمـوقـع.*\n" +
                "*┋*\n" +
                "*┋ تـأكـد مـن أن الـرابـط صـحـيـح ويـمـكـن الـوصـول إلـيـه.*\n" +
                "*┋*\n" +
                "*╰───⊷*\n\n" +
                "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~"
            );
        }
    }
};