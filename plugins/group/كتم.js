// plugins/كتم.js
// ⚔️ SOLO MUTE SYSTEM — ADMIN + DEV + MASTER ⚔️

import fs from 'fs-extra';
import path from 'path';
import { configHelper } from '../../config.js';

// ═══════════════════════════════════════════════════════════
// 📁 المسارات
// ═══════════════════════════════════════════════════════════

const MUTE_FILE = path.join(process.cwd(), 'data', 'muted.json');

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(MUTE_FILE)) {
    fs.writeFileSync(MUTE_FILE, JSON.stringify({}, null, 2));
}

// ═══════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ═══════════════════════════════════════════════════════════

function getMutedDB() {
    try {
        return fs.readJsonSync(MUTE_FILE, { throws: false }) || {};
    } catch {
        return {};
    }
}

function saveMutedDB(data) {
    try {
        fs.writeJsonSync(MUTE_FILE, data, { spaces: 2 });
        return true;
    } catch {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 👑 تحديد رتبة المستخدم
// ═══════════════════════════════════════════════════════════

function getUserRank(jid, handler = null) {
    if (!jid) return "admin";

    // 👑 ماستر
    if (configHelper?.isMaster && configHelper.isMaster(jid)) {
        return "master";
    }

    // ⚔️ مطور — استخدم handler.isDeveloper (الأدق)
    if (handler && typeof handler.isDeveloper === 'function') {
        if (handler.isDeveloper(jid)) return "developer";
    } 
    // احتياطي
    else if (configHelper?.isDeveloper && configHelper.isDeveloper(jid)) {
        return "developer";
    }

    // 🛡️ مشرف
    return "admin";
}

// ═══════════════════════════════════════════════════════════
// 🔐 هل يحق له إلغاء الكتم؟
// ═══════════════════════════════════════════════════════════

function canUnmute(unmuterRank, mutedByRank) {
    if (unmuterRank === "master") return true;

    if (unmuterRank === "developer") {
        return mutedByRank === "developer" || mutedByRank === "admin";
    }

    if (unmuterRank === "admin") {
        return mutedByRank === "admin";
    }

    return false;
}

// ═══════════════════════════════════════════════════════════
// 🎖️ اسم الرتبة بالعربي
// ═══════════════════════════════════════════════════════════

function rankName(rank) {
    if (rank === "master") return "👑 الـمـاسـتـر";
    if (rank === "developer") return "⚔️ الـمـطـوࢪ";
    return "🛡️ الـمـشـࢪف";
}

// ═══════════════════════════════════════════════════════════
// ⚔️ الأمر
// ═══════════════════════════════════════════════════════════

export default {
    name: "كتم",
    aliases: ["اخرس", "اسكت", "mute"],
    description: "نظام كتم وإلغاء كتم متكامل (مشرفين + مطورين + ماستر)",
    category: "admin",
    group: true,

    async run({ bot, sock, message, args, isGroup, userJid, reply, react, isDeveloper, handler }) {
        const jid = message.key.remoteJid;
        const socket = sock || bot.sock;

        // ═══════════════════════════════════════════════
        // 1️⃣ التحقق من المجموعة
        // ═══════════════════════════════════════════════

        if (!isGroup) {
            return reply("❌ *هـذا الأمـر يـعـمـل فـي الـمـجـمـوعـات فـقـط*");
        }

        // ═══════════════════════════════════════════════
        // 2️⃣ التحقق من الصلاحيات (مشرف أو مطور)
        // ═══════════════════════════════════════════════

        let senderIsAdmin = false;
        let metadata = null;

        try {
            metadata = await socket.groupMetadata(jid);
            const sender = metadata.participants.find(p => p.id === userJid);
            senderIsAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';
        } catch (error) {
            console.error("❌ خطأ في جلب معلومات المجموعة:", error);
            return reply("❌ *خـلـيـنـي مـشـࢪف الأول يـا عـبـيـط.*");
        }

        // ✅ استخدم isDeveloper الجاهز من الـ handler
const senderIsDev = isDeveloper || (
    configHelper?.isDeveloper
        ? configHelper.isDeveloper(userJid)
        : false
);

        if (!senderIsAdmin && !senderIsDev) {
            await react("🚫");
            return reply("❌ *هـذا الأمـر لـلـمـشـࢪفـيـن فـقـط.*");
        }

        // ═══════════════════════════════════════════════
        // 3️⃣ استخراج نوع الأمر — ✅ الإصلاح
        // ═══════════════════════════════════════════════

        const subCommand = args[0]?.toLowerCase();

        const VALID_ACTIONS = [
            "تفعيل", "on",
            "الغاء", "إلغاء", "الغاء_كتم", "off"
        ];

        // ═══════════════════════════════════════════════
        // 4️⃣ عرض القائمة الرئيسية
        // ═══════════════════════════════════════════════

        if (!subCommand || !VALID_ACTIONS.includes(subCommand)) {
            await react("🔇");

            const rank = getUserRank(userJid, handler);
            const db = getMutedDB();
            const chatMutes = Object.values(db).filter(m => m.groupJid === jid);
            const count = chatMutes.length;

            const mainMenu = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🔇 نـظـام الـكـتـم الـمـتـكـامـل*
*───━━━⊱  📋  ⊰━━━───*

*👤 الـمـسـتـخـدم:* ⦓ *@${userJid.split('@')[0]}* ⦔
*🎖️ رتـبـتـك:* ⦓ *${rankName(rank)}* ⦔
*🔢 عـدد الـمـكـتـومـيـن:* ⦓ *${count}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 الأوامـر الـمـتـوفـرة:*

*🔇* \`${configHelper.getPrefix()}كتم تفعيل @منشن\` - *كتم عضو*
*🔊* \`${configHelper.getPrefix()}كتم الغاء @منشن\` - *إلغاء كتم عضو*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*⚠️ قـواعـد الإلـغـاء:*

*👑 الـمـاسـتـر:* يـلـغـي أي كـتـم
*⚔️ الـمـطـوࢪ:* يـلـغـي كـتـم (مـطـوࢪ + مـشـࢪف)
*🛡️ الـمـشـࢪف:* يـلـغـي كـتـم (مـشـࢪف فـقـط)

*❕مـلـحـوظـة: يـجـب أن يـكـون الـبـوت مـشـࢪفـاً فـي الـمـجـمـوعـة لـيـعـمـل الـكـتـم.*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

            try {
                const muteImg = './media/mute.jpg';
                if (fs.existsSync(muteImg)) {
                    return socket.sendMessage(jid, {
                        image: fs.readFileSync(muteImg),
                        caption: mainMenu,
                        mentions: [userJid]
                    }, { quoted: message });
                }
            } catch {}

            return socket.sendMessage(jid, {
                text: mainMenu,
                mentions: [userJid]
            }, { quoted: message });
        }

        // ═══════════════════════════════════════════════
        // 5️⃣ استخراج الهدف (منشن أو رد)
        // ═══════════════════════════════════════════════

        const quoted = message.message?.extendedTextMessage?.contextInfo;
        let targetJid = quoted?.participant || quoted?.mentionedJid?.[0];

        if (!targetJid) {
            await react("⚠️");
            return reply("👤 *مـنـشـن الـعـضـو أو رد عـلـى رسـالـتـه*");
        }

        /// ═══════════════════════════════════════════════
// 6️⃣ منع استهداف البوت
// ═══════════════════════════════════════════════

const botJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
const botLid = socket.user.lid 
    ? socket.user.lid.split(':')[0] + '@lid' 
    : null;

// 🔍 جلب الـ JID الحقيقي للهدف
let realTargetJid = targetJid;

try {
    const participant = metadata.participants.find(p => p.id === targetJid);
    if (participant?.phoneNumber) {
        realTargetJid = participant.phoneNumber;
    }
} catch {}

// 🚫 المقارنة بكل الصيغ الممكنة
const targetBase = targetJid.split(':')[0].split('@')[0];
const realTargetBase = realTargetJid.split(':')[0].split('@')[0];
const botBase = socket.user.id.split(':')[0].split('@')[0];
const botLidBase = socket.user.lid?.split(':')[0].split('@')[0];

if (
    targetJid === botJid ||
    realTargetJid === botJid ||
    (botLid && (targetJid === botLid || realTargetJid === botLid)) ||
    targetBase === botBase ||
    realTargetBase === botBase ||
    (botLidBase && (targetBase === botLidBase || realTargetBase === botLidBase))
) {
    await react("🤖");
    return reply("*🤖 لا يـمـكـنـك كـتـم الـبـوت نـفـسـه يـا عـبـيـط.*");
}

        // ═══════════════════════════════════════════════
        // 7️⃣ جلب رتبة المرسل والهدف
        // ═══════════════════════════════════════════════

        const senderRank = getUserRank(userJid, handler);
const targetRank = getUserRank(targetJid, handler);

        // ═══════════════════════════════════════════════
        // 8️⃣ منع استهداف الماستر (دائماً)
        // ═══════════════════════════════════════════════

        if (targetRank === "master") {
            await react("👑");
            return reply(`*👑 لا يـمـكـنـك كـتـم عـمـك الـمـاسـتـࢪ.*`);
        }

        // ═══════════════════════════════════════════════
        // 9️⃣ حماية المطورين من المشرفين
        // ═══════════════════════════════════════════════

        if (senderRank === "admin" && targetRank === "developer") {
            await react("🚫");
            return reply(`*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*🛡️ حـمـايـة الـمـطـويـن*
*───━━⊱  🚫  ⊰━━─*

*❌ الـمـشـࢪف لا يـمـكـنـه اسـتـهـداف مـطـوࢪ*

*👤 رتـبـة الـهـدف:* ⦓ *${rankName(targetRank)}* ⦔

*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`);
        }

        // ═══════════════════════════════════════════════
        // 🔟 التحقق من وجود العضو في المجموعة
        // ═══════════════════════════════════════════════

        try {
            const participants = metadata.participants.map(p => p.id);
            if (!participants.includes(targetJid)) {
                await react("⚠️");
                return reply("❌ *هـذا الـعـضـو لـيـس فـي الـمـجـمـوعـة*");
            }
        } catch {
            return reply("❌ *فـشـل الـتـحـقـق مـن وجـود الـعـضـو*");
        }

        // ═══════════════════════════════════════════════
        // 1️⃣1️⃣ تنفيذ الأمر — ✅ الإصلاح
        // ═══════════════════════════════════════════════

        const isMuteAction = ["تفعيل", "on"].includes(subCommand);
        const isUnmuteAction = ["الغاء", "إلغاء", "الغاء_كتم", "off"].includes(subCommand);

        const muteKey = `${jid}_${targetJid}`;
        const mutedDB = getMutedDB();

        // ═══════════════════════════════════════════════
        // 🔇 كتم
        // ═══════════════════════════════════════════════

        if (isMuteAction) {
            if (mutedDB[muteKey]) {
                await react("⚠️");
                return reply(`*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*🔇 نـظـام الـكـتـم*
*───━━⊱  ⚠️  ⊰━━─*

*🔒 الـحـالـة:* ⦓ *مـكـتـوم بـالـفـعـل* ⦔

*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`, {
                    mentions: [targetJid]
                });
            }

            mutedDB[muteKey] = {
                groupJid: jid,
                userJid: targetJid,
                mutedBy: userJid,
                mutedByRank: senderRank,
                mutedAt: Date.now()
            };

            if (!saveMutedDB(mutedDB)) {
                await react("❌");
                return reply("❌ *فـشـل حـفـظ الـكـتـم*");
            }

            await react("🔇");

            const muteMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🔇 نـظـام الـكـتـم*
*───━━━⊱  ⚔️  ⊰━━━───*

*👤 الـمـسـتـخـدم:* ⦓ *@${userJid.split('@')[0]}* ⦔
*🎖️ رتـبـتـه:* ⦓ *${rankName(senderRank)}* ⦔

*👥 الـهـدف:* ⦓ *@${targetJid.split('@')[0]}* ⦔
*🎖️ رتـبـة الـهـدف:* ⦓ *${rankName(targetRank)}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🔒 الـحـالـة:* ⦓ *مـكـتـوم* ⦔

*📝 أي رسـالـة يـكـتـبـهـا سـتـمـسـح تـلـقـائـيـاً*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*⚠️ لا يـمـكـن إلـغـاء هـذا الـكـتـم إلا بـواسـطـة:*

*${senderRank === "master"
    ? "👑 الـمـاسـتـر فـقـط"
    : senderRank === "developer"
        ? "👑 الـمـاسـتـر أو ⚔️ مـطـوࢪ"
        : "👑 الـمـاسـتـر أو ⚔️ مـطـوࢪ أو 🛡️ مـشـࢪف"
}*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

            try {
                const muteImg = './media/mute.jpg';
                if (fs.existsSync(muteImg)) {
                    return socket.sendMessage(jid, {
                        image: fs.readFileSync(muteImg),
                        caption: muteMsg,
                        mentions: [userJid, targetJid]
                    }, { quoted: message });
                }
            } catch {}

            return socket.sendMessage(jid, {
                text: muteMsg,
                mentions: [userJid, targetJid]
            }, { quoted: message });
        }

        // ═══════════════════════════════════════════════
        // 🔊 إلغاء الكتم
        // ═══════════════════════════════════════════════

        if (isUnmuteAction) {
            const muteData = mutedDB[muteKey];

            if (!muteData) {
                await react("⚠️");
                return reply(`*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*🔊 نـظـام إلـغـاء الـكـتـم*
*───━━⊱  ⚠️  ⊰━━─*

*🔓 الـحـالـة:* ⦓ *غـيـر مـكـتـوم* ⦔

*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`, {
                    mentions: [targetJid]
                });
            }

            const mutedByRank = muteData.mutedByRank || "admin";

            if (!canUnmute(senderRank, mutedByRank)) {
                await react("🚫");

                return reply(`*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*🚫 لا تـمـلـك الـصـلاحـيـة*
*───━━⊱  ⚠️  ⊰━━─*

*❌ لا يـمـكـنـك إلـغـاء هـذا الـكـتـم*

*🎖️ رتـبـتـك:* ⦓ *${rankName(senderRank)}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🔒 الـكـتـم تـم بـواسـطـة:* ⦓ *${rankName(mutedByRank)}* ⦔

*📌 مـن يـمـكـنـه إلـغـاؤه:*
*${mutedByRank === "master"
    ? "👑 الـمـاسـتـر فـقـط"
    : mutedByRank === "developer"
        ? "👑 الـمـاسـتـر أو ⚔️ مـطـوࢪ"
        : "👑 مـاسـتـر أو ⚔️ مـطـوࢪ أو 🛡️ مـشـࢪف"
}*

*───━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━─*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`, {
                    mentions: [userJid]
                });
            }

            delete mutedDB[muteKey];

            if (!saveMutedDB(mutedDB)) {
                await react("❌");
                return reply("❌ *فـشـل حـفـظ إلـغـاء الـكـتـم*");
            }

            await react("🔊");

            const unmuteMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🔊 إلـغـاء الـكـتـم*
*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـسـتـخـدم:* ⦓ *@${userJid.split('@')[0]}* ⦔
*🎖️ رتـبـتـه:* ⦓ *${rankName(senderRank)}* ⦔

*👥 الـعـضـو:* ⦓ *@${targetJid.split('@')[0]}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🔓 الـحـالـة:* ⦓ *الـكـتـم مـلـغـي* ⦔

*📝 عـاد الـعـضـو لـلـكـتـابـة بـشـكـل طـبـيـعـي*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🔒 الـكـتـم كـان بـواسـطـة:* ⦓ *${rankName(mutedByRank)}* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

            try {
                const unmuteImg = './media/unmute.jpg';
                if (fs.existsSync(unmuteImg)) {
                    return socket.sendMessage(jid, {
                        image: fs.readFileSync(unmuteImg),
                        caption: unmuteMsg,
                        mentions: [userJid, targetJid]
                    }, { quoted: message });
                }
            } catch {}

            return socket.sendMessage(jid, {
                text: unmuteMsg,
                mentions: [userJid, targetJid]
            }, { quoted: message });
        }
    }
};