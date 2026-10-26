import axios from "axios";

const APTOIDE_API =
    "http://ws75.aptoide.com/api/7/apps/search/query=";

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════
// ⏳ إعـدادات الـكـول داون (5 دقائق لكل مستخدم)
// ═══════════════════════════════════════════════
const COOLDOWN_MS = 5 * 60 * 1000;
const cooldowns = new Map();

function checkCooldown(userId) {
    const now = Date.now();
    const lastUse = cooldowns.get(userId);

    if (lastUse && now - lastUse < COOLDOWN_MS) {
        return COOLDOWN_MS - (now - lastUse);
    }

    cooldowns.set(userId, now);
    return 0;
}

function formatRemaining(ms) {
    const total = Math.ceil(ms / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    if (minutes > 0 && seconds > 0) {
        return `${minutes} دقيقة و ${seconds} ثانية`;
    }
    if (minutes > 0) {
        return `${minutes} دقيقة`;
    }
    return `${seconds} ثانية`;
}
// ═══════════════════════════════════════════════

export default {
    name: "تطبيق",

    aliases: [
        "app",
        "apk"
    ],

    category: "downloads",

    description:
        "البحث عن التطبيقات وإرسال ملف APK",

    usage: [
        ".تطبيق Instagram",
        ".تطبيق WhatsApp"
    ],

    async run({
        sock,
        m,
        reply,
        text,
        command,
        userJid
    }) {
        // ═══════════════════════════════════════════════
        // ⏳ فحص الكول داون
        // ═══════════════════════════════════════════════
        const senderId =
            userJid ||
            m.sender ||
            m.key.participant ||
            m.key.remoteJid;

        const remaining = checkCooldown(senderId);

        if (remaining > 0) {
            await sock.sendMessage(
                m.key.remoteJid,
                {
                    react: {
                        text: "⏳",
                        key: m.key
                    }
                }
            );

            return reply(`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ ⏳ وقــت الإنــتــظــار ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ ࢪيـح صـوابـعـك شـويـة 🍷*

*┋ قـبـل مـا تـسـتـخـدم الأمــࢪ تـانـي*

*⎔┄┄─── ⊱╎⌯ ⏱️ ⌯╎⊰ ───┄┄⎔*

*┋ الـوقـت الـمـتـبـقـي :*

*┋ ⦓ ${formatRemaining(remaining)} ⦔*

*⎔┄┄─── ⊱╎⌯ 📌 ⌯╎⊰ ───┄┄⎔*

*📌 الـكـول داون : 5 دقـائـق لـكـل مـسـتـخـدم*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
        // ═══════════════════════════════════════════════

        if (!text?.trim()) {
            return reply(`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ 📱 تــحــمــيــل تــطــبــيــق ┇🏮*

*⎔┄┄─── ⊱╎⌯ 📌 ⌯╎⊰ ───┄┄⎔*

*┋ الاسـتـخـدام :*

*⬡ .${command} Instagram*
*⬡ .${command} WhatsApp*
*⬡ .${command} TikTok*

*⎔┄┄─── ⊱╎⌯ ⏳ ⌯╎⊰ ───┄┄⎔*

*📌 مـلاحـظـة :*

*⬡ الـكـول داون 5 دقـائـق*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        try {
            await sock.sendMessage(
                m.key.remoteJid,
                {
                    react: {
                        text: "📥",
                        key: m.key
                    }
                }
            );

            const query =
                encodeURIComponent(text.trim());

            const apiUrl =
                `${APTOIDE_API}${query}/limit=1`;

            const response =
                await axios.get(apiUrl, {
                    timeout: 20000
                });

            const data = response?.data;

            const list =
                data?.datalist?.list;

            if (
                !Array.isArray(list) ||
                !list.length
            ) {
                return reply(`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ ❌ لــم يــتــم الــعــثــور ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ مـلـقـيـتـش الـتـطـبـيـق يـا صـاحـبـي 🍷*

*┋ تـأكـد مـن اسـم الـتـطـبـيـق*

*┋ وحـاول تـانـي*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            const app = list[0];

            const sizeMB =
                app.size
                    ? (
                        Number(app.size) /
                        (1024 * 1024)
                    ).toFixed(2)
                    : "غير معروف";

            const caption = `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ 📱 𝐒 𝐎 𝐋 𝐎  𝐀 𝐏 𝐊 ┇🏮*

*⎔┄┄─── ⊱╎⌯ 📦 ⌯╎⊰ ───┄┄⎔*

*┋ 📱 الأســم : ⦓ ${app.name || "غير معروف"} ⦔*
*┋ 📦 الـحـزمـة : ⦓ ${app.package || "غير معروف"} ⦔*
*┋ 📅 الـتـحـديـث : ⦓ ${app.updated || "غير معروف"} ⦔*
*┋ 📁 الـحـجـم : ⦓ ${sizeMB} MB ⦔*

*⎔┄┄─── ⊱╎⌯ ⏳ ⌯╎⊰ ───┄┄⎔*

*┋ جــاࢪي إࢪســال مــلــف الـAPK...*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            if (app.icon) {
                await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        image: {
                            url: app.icon
                        },
                        caption
                    },
                    {
                        quoted: m
                    }
                );
            } else {
                await reply(caption);
            }

            await sleep(2000);

            const apkUrl =
                app.file?.path_alt ||
                app.file?.path;

            if (!apkUrl) {
                throw new Error(
                    "APK download URL not found."
                );
            }

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    document: {
                        url: apkUrl
                    },
                    fileName:
                        `${app.name || "application"}.apk`,
                    mimetype:
                        "application/vnd.android.package-archive"
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
                "[SOLO APK]",
                error
            );

            try {
                await sock.sendMessage(
                    m.key.remoteJid,
                    {
                        react: {
                            text: "❌",
                            key: m.key
                        }
                    }
                );
            } catch {}

            return reply(`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ ❌ فــشــل الــتــحــمــيــل ┇🏮*

*⎔┄┄─── ⊱╎⌯ ⚠️ ⌯╎⊰ ───┄┄⎔*

*┋ حـصـل خـطـأ أثـنـاء الـبـحـث*

*┋ أو تـحـمـيـل الـتـطـبـيـق*

*⎔┄┄─── ⊱╎⌯ 🔄 ⌯╎⊰ ───┄┄⎔*

*┋ حـاول مـرة تـانـيـة بـعـد شـويـة*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};