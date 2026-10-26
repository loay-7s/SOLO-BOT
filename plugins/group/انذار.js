import fs from 'fs-extra';
import { configHelper } from '../../config.js';

export default {
    name: "انذار",
    aliases: ["تحذير", "warn"],
    description: "نظام إنذارات متكامل (يدوي + حذف)",
    category: "admin",
    group: true,

    async run({ bot, message, args, isGroup, userJid, reply, react }) {
        const jid = message.key.remoteJid;

        // ═══════════════════════════════════════════════════
        // 1️⃣ التحقق من المجموعة
        // ═══════════════════════════════════════════════════
        if (!isGroup) {
            return reply("❌ *هـذا الأمـر يـعـمـل فـي الـمـجـمـوعـات فـقـط*");
        }

        // ═══════════════════════════════════════════════════
        // 2️⃣ التحقق من الصلاحيات (مشرف أو مطور)
        // ═══════════════════════════════════════════════════
        let senderIsAdmin = false;
        let metadata = null;

        try {
            metadata = await bot.sock.groupMetadata(jid);
            const senderParticipant = metadata.participants.find(p => p.id === userJid);
            senderIsAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
        } catch (error) {
            console.error("❌ خطأ في جلب معلومات المجموعة:", error);
            return reply("*❌ فـشـل الـتـحـقـق مـن الـصـلاحـيـات*");
        }

        const senderIsDev = configHelper?.isDeveloper
            ? configHelper.isDeveloper(userJid)
            : false;

        if (!senderIsAdmin && !senderIsDev) {
            await react("🚫");
            return reply("*❌ هـذا الأمـࢪ لـلـمـشـࢪفـيـن والـمـطـوࢪيـن فـقـط.*");
        }

        // ═══════════════════════════════════════════════════
        // 3️⃣ استخراج نوع الأمر
        // ═══════════════════════════════════════════════════
        const subCommand = args[0]?.toLowerCase();

        // ═══════════════════════════════════════════════════
        // 4️⃣ لو مفيش args أو الأمر غلط → عرض القائمة
        // ═══════════════════════════════════════════════════
        const VALID_ACTIONS = ['حذف'];

        if (!subCommand || !VALID_ACTIONS.includes(subCommand)) {
            const prefix = configHelper.getPrefix();

            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*⚠️ نـظـام الإنـذارات*
*───━━━⊱  📋  ⊰━━━───*

*📌 أوامـر الإنـذار:*

*🔹* \`${prefix}انذار @منشن\` - *إنذار يدوي*
*🔹* \`${prefix}انذار (بالرد)\` - *إنذار يدوي*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 أوامـر الـحـذف:*

*🔹* \`${prefix}انذار حذف 1 @منشن\` - *حذف إنذار يدوي*
*🔹* \`${prefix}انذار حذف 2 @منشن\` - *حذف 2 يدوي*
*🔹* \`${prefix}انذار حذف 3 @منشن\` - *حذف 3 يدوي*
*🔹* \`${prefix}انذار حذف التلقائي @منشن\` - *حذف إنذارات الحماية و الروابط*
*🔹* \`${prefix}انذار حذف الكل @منشن\` - *حذف كل الإنذارات*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`);
        }

        // ═══════════════════════════════════════════════════
        // 5️⃣ استخراج الهدف (منشن أو رد)
        // ═══════════════════════════════════════════════════
        const quoted = message.message?.extendedTextMessage?.contextInfo;
        let targetJid = quoted?.participant || quoted?.mentionedJid?.[0];

        if (!targetJid) {
            await react("⚠️");
            return reply("👤 *مـنـشـن الـعـضـو أو رد عـلـى رسـالـتـه*");
        }

        // ═══════════════════════════════════════════════════
        // 6️⃣ منع استهداف البوت
        // ═══════════════════════════════════════════════════
        const botJid = bot.sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (targetJid === botJid) {
            return reply("❌ *لا يـمـكـن اسـتـهـداف الـبـوت*");
        }

        // ═══════════════════════════════════════════════════
        // 7️⃣ التحقق من وجود المنشن
        // ═══════════════════════════════════════════════════
        try {
            const participants = metadata.participants.map(p => p.id);
            if (!participants.includes(targetJid)) {
                await react("⚠️");
                return reply("❌ *هـذا الـعـضـو لـيـس فـي الـمـجـمـوعـة*");
            }
        } catch {
            return reply("❌ *فـشـل الـتـحـقـق مـن وجـود الـعـضـو*");
        }

        // ═══════════════════════════════════════════════════
        // 8️⃣ الملفات
        // ═══════════════════════════════════════════════════
        const warnsPath = './data/warns.json';
        const shieldPath = './data/shield.json';

        let warnsDB = fs.readJsonSync(warnsPath, { throws: false }) || {};
        let shieldDB = fs.existsSync(shieldPath) ? fs.readJsonSync(shieldPath, { throws: false }) || {} : {};

        const warnKey = `${jid}_${targetJid}`;

        // ═══════════════════════════════════════════════════
        // 9️⃣ تنظيف الإنذارات المنتهية
        // ═══════════════════════════════════════════════════
        await cleanExpiredWarns(warnsDB);

        // ═══════════════════════════════════════════════════
        // 🔟 استخراج نوع الحذف
        // ═══════════════════════════════════════════════════
        const deleteArg = args[1]?.toLowerCase();

        // ============================================================
        // 🗑️ فرع الحذف
        // ============================================================
        if (subCommand === 'حذف') {

            // ---------- حالة: .انذار حذف التلقائي ----------
            if (deleteArg === 'التلقائي' || deleteArg === 'تلقائي') {
                const shieldUser = shieldDB[targetJid];

                if (!shieldUser || !shieldUser.warnings || shieldUser.warnings === 0) {
                    await react("⚠️");
                    return reply(`*❌ هـذا الـعـضـو لـيـس لـديـه إنـذارات تـلـقـائـيـة*`);
                }

                const oldCount = shieldUser.warnings;

                delete shieldDB[targetJid];
                fs.writeJsonSync(shieldPath, shieldDB, { spaces: 2 });

                await react("🧹");

                return bot.sendMessage(jid, {
                    text: `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🧹 حـذف الإنـذارات الـتـلـقـائـيـة*
*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـشـࢪف:* ⦓ *@${userJid.split('@')[0]}* ⦔
*👥 الـعـضـو:* ⦓ *@${targetJid.split('@')[0]}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🗑️ تـم حـذف:* ⦓ *${oldCount} إنـذار تـلـقـائـي* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`,
                    mentions: [userJid, targetJid]
                }, { quoted: message });
            }

            // ---------- حالة: .انذار حذف الكل ----------
            if (deleteArg === 'الكل' || deleteArg === 'كل') {
                const manualData = warnsDB[warnKey];
                const manualCount = manualData?.reasons?.length || 0;

                const shieldUser = shieldDB[targetJid];
                const shieldCount = shieldUser?.warnings || 0;

                if (manualCount === 0 && shieldCount === 0) {
                    await react("⚠️");
                    return reply(`*❌ هـذا الـعـضـو لـيـس لـديـه أي إنـذارات*`);
                }

                // حذف يدوي
                if (manualData) {
                    delete warnsDB[warnKey];
                    fs.writeJsonSync(warnsPath, warnsDB, { spaces: 2 });
                }

                // حذف تلقائي
                if (shieldUser) {
                    delete shieldDB[targetJid];
                    fs.writeJsonSync(shieldPath, shieldDB, { spaces: 2 });
                }

                await react("🧹");

                return bot.sendMessage(jid, {
                    text: `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🧹 حـذف جـمـيـع الإنـذارات*
*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـشـࢪف:* ⦓ *@${userJid.split('@')[0]}* ⦔
*👥 الـعـضـو:* ⦓ *@${targetJid.split('@')[0]}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🗑️ تـم حـذف:*
*├─ ✋ يـدوي:* ${manualCount}
*└─ 🛡️ تـلـقـائـي:* ${shieldCount}

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`,
                    mentions: [userJid, targetJid]
                }, { quoted: message });
            }

            // ---------- حالة: .انذار حذف [رقم] ----------
            const numToDelete = parseInt(deleteArg);

            if (isNaN(numToDelete) || numToDelete < 1 || numToDelete > 3) {
                await react("⚠️");
                return reply(`*❌ عـدد غـيـر صـالـح. اخـتـر 1 أو 2 أو 3*`);
            }

            const manualData = warnsDB[warnKey];

            if (!manualData || !manualData.reasons || manualData.reasons.length === 0) {
                await react("⚠️");
                return reply(`*❌ هـذا الـعـضـو لـيـس لـديـه إنـذارات يـدويـة*`);
            }

            const beforeCount = manualData.reasons.length;

            // رتب الإنذارات من الأحدث للأقدم ثم احذف العدد المطلوب من الأحدث
            manualData.reasons.sort((a, b) => b.date - a.date);
            manualData.reasons = manualData.reasons.slice(numToDelete);
            manualData.count = manualData.reasons.length;

            const afterCount = manualData.reasons.length;
            const deletedCount = beforeCount - afterCount;

            if (manualData.reasons.length === 0) {
                delete warnsDB[warnKey];
            }

            fs.writeJsonSync(warnsPath, warnsDB, { spaces: 2 });

            await react("🧹");

            return bot.sendMessage(jid, {
                text: `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🧹 حـذف إنـذارات يـدويـة*
*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـشـࢪف:* ⦓ *@${userJid.split('@')[0]}* ⦔
*👥 الـعـضـو:* ⦓ *@${targetJid.split('@')[0]}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*🗑️ تـم حـذف:* ⦓ *${deletedCount}* ⦔
*🔢 الـمـتـبـقـي:* ⦓ *${afterCount}* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`,
                mentions: [userJid, targetJid]
            }, { quoted: message });
        }

        // ============================================================
        // ⚠️ فرع الإنذار اليدوي (لما مفيش "حذف")
        // ============================================================

        // سبب ثابت
        const reason = "مخالفة القوانين";

        // تنظيف بيانات مشوهة
        for (const key in warnsDB) {
            if (warnsDB[key]?.reason || warnsDB[key]?.date || warnsDB[key]?.expiresAt) {
                delete warnsDB[key].reason;
                delete warnsDB[key].date;
                delete warnsDB[key].expiresAt;
            }
        }

        // حساب تاريخ الانتهاء (3 أيام)
        const expiryDate = Date.now() + (3 * 24 * 60 * 60 * 1000);

        if (!warnsDB[warnKey]) {
            warnsDB[warnKey] = {
                count: 1,
                reasons: [{
                    reason: reason,
                    date: Date.now(),
                    by: userJid,
                    expiresAt: expiryDate
                }]
            };
        } else {
            warnsDB[warnKey].count += 1;
            warnsDB[warnKey].reasons.push({
                reason: reason,
                date: Date.now(),
                by: userJid,
                expiresAt: expiryDate
            });
        }

        const warnCount = warnsDB[warnKey].count;

        fs.writeJsonSync(warnsPath, warnsDB, { spaces: 2 });

        await react("⚠️");

        const expiryDateObj = new Date(expiryDate);
        const expiryFormatted = `${expiryDateObj.getDate()}/${expiryDateObj.getMonth() + 1}/${expiryDateObj.getFullYear()}`;

        const warnMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*⚠️ إنـذار إداري*

*───━━━⊱  📋  ⊰━━━───*

*👤 الـمـشـرف:* ⦓ *@${userJid.split('@')[0]}* ⦔

*👥 الـعـضـو:* ⦓ *@${targetJid.split('@')[0]}* ⦔

*🔢 عـدد الإنـذارات:* ⦓ *${warnCount} / 3* ⦔

*📝 الـسـبـب:* ⦓ *مخالفة القوانين ⚠️* ⦔

*⏳ يـنـتـهـي:* ⦓ *${expiryFormatted}* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*`;

        if (warnCount >= 3) {
            const kickMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🚨 قـرار طـرد*

*───━━━⊱  ⚠️  ⊰━━━───*

*👤 الـمـشـرف:* ⦓ *@${userJid.split('@')[0]}* ⦔

*👥 الـعـضـو:* ⦓ *@${targetJid.split('@')[0]}* ⦔

*🔢 عـدد الإنـذارات:* ⦓ *3 / 3* ⦔

*📝 سـبـب الطـرد:* ⦓ *وصول الحد الأقصى للإنذارات (مخالفة القوانين)* ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*⏳ جـارٍ طـرد الـعـضـو...*`;

            await bot.sendMessage(jid, {
                text: kickMsg,
                mentions: [userJid, targetJid]
            }, { quoted: message });

            setTimeout(async () => {
                try {
                    await bot.sock.groupParticipantsUpdate(jid, [targetJid], "remove");

                    delete warnsDB[warnKey];
                    fs.writeJsonSync(warnsPath, warnsDB, { spaces: 2 });

                } catch (error) {
                    await reply("❌ *فـشـل طـرد الـعـضـو (تـأكـد أن الـبـوت مـشـرف)*");
                }
            }, 1000);

        } else {
            await bot.sendMessage(jid, {
                text: warnMsg,
                mentions: [userJid, targetJid]
            }, { quoted: message });
        }
    }
};

// ✅ دالة تنظيف الإنذارات المنتهية
async function cleanExpiredWarns(warnsDB) {
    const now = Date.now();
    let changed = false;

    for (const key in warnsDB) {
        if (warnsDB[key]?.reasons) {
            const originalLength = warnsDB[key].reasons.length;

            warnsDB[key].reasons = warnsDB[key].reasons.filter(w => w.expiresAt > now);
            warnsDB[key].count = warnsDB[key].reasons.length;

            if (originalLength !== warnsDB[key].reasons.length) {
                changed = true;
            }

            if (warnsDB[key].reasons.length === 0) {
                delete warnsDB[key];
                changed = true;
            }
        }
    }

    if (changed) {
        fs.writeJsonSync('./data/warns.json', warnsDB, { spaces: 2 });
    }
}