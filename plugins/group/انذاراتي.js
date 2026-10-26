import fs from 'fs-extra';

export default {
    name: "انذاراتي",
    aliases: ["تحذيراتي", "mywarns"],
    description: "عرض إنذاراتك (اليدوية + التلقائية)",
    category: "general",
    group: true,

    async run({ bot, message, isGroup, userJid, reply }) {
        const jid = message.key.remoteJid;

        if (!isGroup) {
            return reply("❌ *هـذا الأمـر يـعـمـل فـي الـمـجـمـوعـات فـقـط*");
        }

        // ═══════════════════════════════════════════════════
        // 1️⃣ قراءة الإنذارات اليدوية (warns.json)
        // ═══════════════════════════════════════════════════
        const warnsPath = './data/warns.json';
        let warnsDB = fs.readJsonSync(warnsPath, { throws: false }) || {};

        // تنظيف الإنذارات المنتهية
        let changed = false;
        for (const key in warnsDB) {
            if (warnsDB[key]?.reasons) {
                const originalLength = warnsDB[key].reasons.length;
                warnsDB[key].reasons = warnsDB[key].reasons.filter(w => w.expiresAt > Date.now());
                warnsDB[key].count = warnsDB[key].reasons.length;

                if (originalLength !== warnsDB[key].reasons.length) changed = true;
                if (warnsDB[key].reasons.length === 0) {
                    delete warnsDB[key];
                    changed = true;
                }
            }
        }
        if (changed) fs.writeJsonSync(warnsPath, warnsDB, { spaces: 2 });

        // ═══════════════════════════════════════════════════
        // 2️⃣ قراءة الإنذارات التلقائية (shield.json)
        // ═══════════════════════════════════════════════════
        const shieldPath = './data/shield.json';
        let shieldDB = fs.existsSync(shieldPath) ? fs.readJsonSync(shieldPath, { throws: false }) || {} : {};

        const shieldUser = shieldDB[userJid];
        const shieldCount = shieldUser?.warnings || 0;
        const shieldLastWarn = shieldUser?.lastWarn || null;

        // ═══════════════════════════════════════════════════
        // 3️⃣ الإنذارات اليدوية للعضو
        // ═══════════════════════════════════════════════════
        const warnKey = `${jid}_${userJid}`;
        const manualWarns = warnsDB[warnKey];

        const manualCount = manualWarns?.reasons?.length || 0;

        // ═══════════════════════════════════════════════════
        // لو مفيش أي إنذارات
        // ═══════════════════════════════════════════════════
        if (manualCount === 0 && shieldCount === 0) {
            return reply("✅ *لـيـس لـديـك أي إنـذارات*");
        }

        // ═══════════════════════════════════════════════════
        // 4️⃣ تجهيز قائمة الإنذارات اليدوية
        // ═══════════════════════════════════════════════════
        let reasonsList = '';

        if (manualCount > 0) {
            const sortedReasons = [...manualWarns.reasons].sort((a, b) => b.date - a.date);

            sortedReasons.forEach((w, i) => {
                const date = new Date(w.date).toLocaleDateString('en-GB');
                const expiryDate = new Date(w.expiresAt).toLocaleDateString('en-GB');

                reasonsList += `\n*${i + 1}. ${w.reason}*\n\n`;
                reasonsList += `   *└─ 📅 مـن:* ${date}\n\n`;
                reasonsList += `   *└─ ⏳ يـنـتـهـي:* ${expiryDate}\n\n`;

                if (w.by) {
                    const byNumber = w.by.split('@')[0];
                    reasonsList += `   *└─ 👤 بـواسـطـة:* @${byNumber}\n\n`;
                }
            });
        }

        // ═══════════════════════════════════════════════════
        // 5️⃣ تجهيز إنذارات الشيلد
        // ═══════════════════════════════════════════════════
        let shieldSection = '';

        if (shieldCount > 0) {
            const lastWarnDate = shieldLastWarn
                ? new Date(shieldLastWarn).toLocaleDateString('en-GB')
                : '—';

            shieldSection = `\n*🛡️ إنـذارات الـحـمـايـة (تـلـقـائـي):*\n\n`;
            shieldSection += `*└─ 🔢 الـعـدد:* ${shieldCount} / 4\n\n`;
            shieldSection += `*└─ 📅 آخـر إنـذار:* ${lastWarnDate}\n\n`;
            shieldSection += `*└─ ⚠️ الـسـبـب:* سـب / كـلام بـذئ / روابـط\n\n`;
        }

        // ═══════════════════════════════════════════════════
        // 6️⃣ حساب إجمالي الإنذارات
        // ═══════════════════════════════════════════════════
        const totalCount = manualCount + shieldCount;

        // ═══════════════════════════════════════════════════
        // 7️⃣ تحديد أقرب تاريخ انتهاء
        // ═══════════════════════════════════════════════════
        let expirySection = '';

        if (manualCount > 0) {
            const soonest = manualWarns.reasons.reduce((min, w) => w.expiresAt < min.expiresAt ? w : min);
            const nextExpiryArabic = new Date(soonest.expiresAt).toLocaleDateString('ar-EG');
            const nextExpiryDays = Math.ceil((soonest.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

            expirySection = `*⏳ أقـرب انـتـهـاء (يـدوي):* ⦓ *${nextExpiryArabic}* ⦔ *(بـعـد ${nextExpiryDays} أيـام)*`;
        }

        // ═══════════════════════════════════════════════════
        // 8️⃣ بناء الرسالة النهائية
        // ═══════════════════════════════════════════════════
        const mentions = [userJid];

        if (manualCount > 0) {
            manualWarns.reasons.forEach(w => {
                if (w.by) mentions.push(w.by);
            });
        }

        const msg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*📋 إنـذاراتـك*

*───━━━⊱  ⚠️  ⊰━━━───*

*👤 الـعـضـو:* ⦓ *@${userJid.split('@')[0]}* ⦔


*🔢 الإجـمـالـي:* ⦓ *${totalCount}* ⦔

*├─ ✋ يـدوي:* ${manualCount}
*└─ 🛡️ تـلـقـائـي:* ${shieldCount}

${manualCount > 0 ? `\n*📝 الإنـذارات الـيـدويـة :*\n${reasonsList}` : ''}
${shieldSection}
*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

${expirySection}

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

        await bot.sendMessage(jid, {
            text: msg,
            mentions: mentions
        }, { quoted: message });
    }
};