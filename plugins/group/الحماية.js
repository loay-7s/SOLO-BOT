// plugins/الحماية.js
// ⚔️ SOLO PROTECTION — ADMIN + DEV ⚔️

import fs from 'fs';
import path from 'path';

const PROTECTION_FILE = path.join(process.cwd(), 'data', 'protection_status.json');

// ═══════════════════════════════════════════════════════════
// 📁 INIT
// ═══════════════════════════════════════════════════════════

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(PROTECTION_FILE)) {
    fs.writeFileSync(PROTECTION_FILE, JSON.stringify({}, null, 2));
}

// ═══════════════════════════════════════════════════════════
// 🛡️ HELPERS
// ═══════════════════════════════════════════════════════════

function getProtectionStatus(chatId) {
    try {
        const data = JSON.parse(fs.readFileSync(PROTECTION_FILE, 'utf8'));
        return data[chatId] || false;
    } catch {
        return false;
    }
}

function setProtectionStatus(chatId, status) {
    try {
        const data = JSON.parse(fs.readFileSync(PROTECTION_FILE, 'utf8'));
        data[chatId] = status;
        fs.writeFileSync(PROTECTION_FILE, JSON.stringify(data, null, 2));

        if (!global.protectionStatus) global.protectionStatus = {};
        global.protectionStatus[chatId] = status;
        return true;
    } catch {
        return false;
    }
}

function loadProtectionStatus() {
    try {
        const data = JSON.parse(fs.readFileSync(PROTECTION_FILE, 'utf8'));
        if (!global.protectionStatus) global.protectionStatus = {};
        for (const [chatId, status] of Object.entries(data)) {
            global.protectionStatus[chatId] = status;
        }
        console.log('🛡️ تم تحميل حالة الحماية من الملف');
    } catch {
        console.log('⚠️ لا توجد حالة حماية محفوظة');
    }
}

loadProtectionStatus();

// ═══════════════════════════════════════════════════════════
// ⚔️ أمر الحماية
// ═══════════════════════════════════════════════════════════

export default {
    name: "الحماية",
    aliases: ["الحمايه", "protection"],
    description: "نظام حماية المجموعة (للمشرفين والمطورين)",
    category: "admin",
    group: true,

    async run({ sock, message, isGroup, userJid, text, reply, react, isDeveloper }) {
        const chatId = message.key.remoteJid;

        // ═══════════════════════════════════════════════
        // ❌ مش جروب
        // ═══════════════════════════════════════════════

        if (!isGroup) {
            return reply("*❌ هـذا الأمـر يـعـمـل فـي الـمـجـمـوعـات فـقـط*");
        }

        // ═══════════════════════════════════════════════
        // ✅ التحقق من الصلاحيات (مشرف أو مطور)
        // ═══════════════════════════════════════════════

        try {
            const metadata = await sock.groupMetadata(chatId);
            const sender = metadata.participants.find(p => p.id === userJid);
            const isAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';

            if (!isAdmin && !isDeveloper) {
                return reply("*❌ هـذا الأمـر لـلـمـشـرفـيـن فـقـط.*");
            }
        } catch (error) {
            console.error("❌ خطأ في جلب معلومات المجموعة:", error);
            return reply("*❌ خـلـيـنـي مـشـࢪف الأول يـا عـبـيـط.*");
        }

        // ═══════════════════════════════════════════════
        // 🛡️ جلب الحالة
        // ═══════════════════════════════════════════════

        if (!global.protectionStatus) global.protectionStatus = {};

        const currentStatus = getProtectionStatus(chatId);
        global.protectionStatus[chatId] = currentStatus;

        const body = (text || "").toLowerCase().trim();
        const action = body.split(/\s+/)[0];

        // ═══════════════════════════════════════════════
        // 1️⃣ فتح الحماية
        // ═══════════════════════════════════════════════

        if (action === "فتح") {
            if (global.protectionStatus[chatId] === true) {
                await react("⚠️");
                return sock.sendMessage(chatId, {
                    text: `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🛡️ نـظـام الـحـمـايـة*
*───━━━⊱  ⚠️  ⊰━━━───*

*✅ الـحـمـايـة مـفـعـلـة بـالـفـعـل*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
                }, { quoted: message });
            }

            setProtectionStatus(chatId, true);
            await react("🛡️");

            return sock.sendMessage(chatId, {
                text: `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🛡️ تـم تـفـعـيـل الـحـمـايـة*
*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـسـتـخـدم:* ⦓ *@${userJid.split('@')[0]}* ⦔

*🔒 الـنـظـام الآن يـحـمـي الـمـجـمـوعـة*

*⚠️ سـيـتـم حـذف أي رسـالـة مـخـالـفـة*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`,
                mentions: [userJid]
            }, { quoted: message });
        }

        // ═══════════════════════════════════════════════
        // 2️⃣ غلق الحماية
        // ═══════════════════════════════════════════════

        if (action === "غلق" || action === "قفل") {
            if (global.protectionStatus[chatId] === false || global.protectionStatus[chatId] === undefined) {
                await react("⚠️");
                return sock.sendMessage(chatId, {
                    text: `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🛡️ نـظـام الـحـمـايـة*
*───━━━⊱  ⚠️  ⊰━━━───*

*❌ الـحـمـايـة مـعـطـلـة بـالـفـعـل*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
                }, { quoted: message });
            }

            setProtectionStatus(chatId, false);
            await react("🔓");

            return sock.sendMessage(chatId, {
                text: `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🔓 تـم إيـقـاف الـحـمـايـة*
*───━━━⊱  ⚠️  ⊰━━━───*

*👤 الـمـسـتـخـدم:* ⦓ *@${userJid.split('@')[0]}* ⦔

*🔓 الـنـظـام الآن مـعـطـل*

*📝 سـيـتـم تـرك الـرسـائـل بـدون تـدخـل*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`,
                mentions: [userJid]
            }, { quoted: message });
        }

        // ═══════════════════════════════════════════════
        // 3️⃣ عرض الاستمارة
        // ═══════════════════════════════════════════════

        await react("🛡️");

        const shieldImg = './media/shield.jpg';
        const status = global.protectionStatus[chatId] ? "مُـفـعـل ✅" : "مُـعـطـل ❌";

        const initialText = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🛡️ نـظـام الـحـمـايـة*
*───━━━⊱  📋  ⊰━━━───*

*👤 الـمـسـتـخـدم:* ⦓ *@${userJid.split('@')[0]}* ⦔

*⚠️ الـحـالـة الـحـالـيـة:* ⦓ *${status}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 الأوامـر الـمـتـوفـرة:*

*✅* *.الحماية فتح* - *لـتـفـعـيـل الـحـمـايـة*

*❌* *.الحماية غلق* - *لـتـعـطـيـل الـحـمـايـة*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

        try {
            if (fs.existsSync(shieldImg)) {
                await sock.sendMessage(chatId, {
                    image: fs.readFileSync(shieldImg),
                    caption: initialText,
                    mentions: [userJid]
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: initialText,
                    mentions: [userJid]
                }, { quoted: message });
            }
        } catch (e) {
            await sock.sendMessage(chatId, {
                text: initialText,
                mentions: [userJid]
            }, { quoted: message });
        }
    }
};