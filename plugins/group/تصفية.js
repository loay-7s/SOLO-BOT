export default {
    name: "تصفية",
    aliases: ["تطهير", "طرد_الكل", "مسح_الكل"],
    description: "يطرد جميع أعضاء المجموعة بعد تأكيد المشرف",
    category: "admin",
    group: true,
    admin: true,
    botAdmin: true,

    async run({ bot, message, isGroup, userJid, reply, react, isDeveloper }) {
        const jid = message.key.remoteJid;

        if (!isGroup) {
            return reply("*❌ هـذا الأمـر يـعـمـل فـي الـمـجـمـوعـات فـقـط*");
        }

        // =========================================================
        // 🔐 التحقق من أن المستخدم مشرف
        // =========================================================
        try {
            const groupMetadata = await bot.sock.groupMetadata(jid);

            const senderParticipant = groupMetadata.participants.find(
                p => p.id === userJid
            );

            if (!senderParticipant?.admin) {
                return reply("*❌ هـذا الأمـر لـلـمـشـرفـيـن فـقـط*");
            }

        } catch (error) {
            console.error("❌ خطأ في جلب معلومات المجموعة:", error);

            return reply(
                "*❌ مـقـدرتـش أتـحـقـق مـن صـلاحـيـاتـك*"
            );
        }

        // =========================================================
        // 🧹 نظام التأكيد
        // =========================================================

        // تخزين التأكيدات بشكل عالمي
        if (!global.tasfiyaConfirmations) {
            global.tasfiyaConfirmations = new Map();
        }

        const confirmationKey = `${jid}:${userJid}`;

        // =========================================================
        // استخراج النص
        // =========================================================

        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            "";

        const cleanText = text.trim().toLowerCase();

        // =========================================================
        // ❕ لو كتب المشرف: تصفية
        // =========================================================

        if (cleanText === ".تصفية" || cleanText === "تصفية") {

            // إنشاء طلب تأكيد جديد
            const confirmation = {
                userJid,
                chatId: jid,
                createdAt: Date.now()
            };

            global.tasfiyaConfirmations.set(
                confirmationKey,
                confirmation
            );

            // حذف التأكيد بعد 30 ثانية
            setTimeout(() => {
                const current =
                    global.tasfiyaConfirmations.get(confirmationKey);

                if (
                    current &&
                    current.createdAt === confirmation.createdAt
                ) {
                    global.tasfiyaConfirmations.delete(confirmationKey);
                }
            }, 30000);

            await react("❕");

            const warningMsg = `
*╭─━━━  ⚠️ 𝐖𝐀𝐑𝐍𝐈𝐍𝐆 ━━━─╮*

*│ 🧹 الأمـر : ⦓ تـصـفـيـة ⦔*

*│ ⚠️ هـذا الأمـر سـيـقـوم بـطـرد*
*│ جـمـيـع أعـضـاء الـمـجـمـوعـة.*

*│ 🚫 سـيـتـم اسـتـثـنـاء :*
*│ • الـمـطـورين*
*│ • الـبـوت نـفـسـه*

*│ ⚠️ حـتـى الـمـشـرفـون الآخـرون*
*│ سـيـتـم طـردهـم.*

*╰─━━━━━━━━━━━━━━━━━━─╯*

*❕ إذا كـنـت مـتـأكـداً مـن قـرارك،*
*اكتب :*

*⦓ .تصفية نعم ⦔*

*⏳ الـتـأكـيـد صـالـح لـمـدة 30 ثـانـيـة فـقـط.*

~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*
`.trim();

            return reply(warningMsg);
        }

        // =========================================================
        // ✅ لو كتب: تصفية نعم
        // =========================================================

        if (
            cleanText === ".تصفية نعم" ||
            cleanText === "تصفية نعم"
        ) {

            const confirmation =
                global.tasfiyaConfirmations.get(confirmationKey);

            // لا يوجد طلب تأكيد
            if (!confirmation) {
                return reply(
                    "*❌ مـفـيـش عـمـلـيـة تـصـفـيـة مـعـلـقـة.*\n\n" +
                    "*اكتب .تصفية الأول لإظهار التحذير.*"
                );
            }

            // حذف التأكيد فور استخدامه
            global.tasfiyaConfirmations.delete(confirmationKey);

            // =====================================================
            // 🔍 جلب بيانات المجموعة
            // =====================================================

            let groupMetadata;

            try {
                groupMetadata = await bot.sock.groupMetadata(jid);
            } catch (error) {
                console.error(
                    "❌ خطأ في جلب بيانات المجموعة:",
                    error
                );

                return reply(
                    "*❌ فـشـل الـحـصـول عـلـى بـيـانـات الـمـجـمـوعـة*"
                );
            }

            const participants =
                groupMetadata.participants || [];

            // =====================================================
            // 🤖 تحديد البوت
            // =====================================================

            const botId =
                bot.sock.user?.id || "";

            const botNumber =
                botId
                    .split(":")[0]
                    .split("@")[0];

            // =====================================================
            // 👑 تحديد المطورين
            // =====================================================

            const developers =
                bot.config?.DEVELOPERS || [];

            const developerNumbers =
                developers.map(dev =>
                    String(dev)
                        .split(":")[0]
                        .split("@")[0]
                );

            // =====================================================
            // 🧹 تحديد الأعضاء المستهدفين
            // =====================================================

            const victims = participants
                .filter(participant => {

                    const participantNumber =
                        participant.id
                            .split(":")[0]
                            .split("@")[0];

                    // 🤖 استثناء البوت
                    if (
                        participantNumber === botNumber
                    ) {
                        return false;
                    }

                    // 👑 استثناء المطورين
                    if (
                        developerNumbers.includes(
                            participantNumber
                        )
                    ) {
                        return false;
                    }

                    // 🚫 كل شخص آخر يتم طرده
                    return true;
                })
                .map(participant => participant.id);

            // =====================================================
            // 📭 لا يوجد أعضاء
            // =====================================================

            if (victims.length === 0) {
                await react("📭");

                return reply(
                    "*📭 لا يـوجـد أعـضـاء لـطـردهـم.*"
                );
            }

            // =====================================================
            // 🧹 بدء التصفية
            // =====================================================

            await react("🧹");

            const startMsg = `
*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🧹 نـظـام الـتـصـفـيـة*

*───━━━⊱  ⚠️  ⊰━━━───*

*👤 الـمـشـرف:* ⦓ *@${userJid.split("@")[0]}* ⦔

*👥 الأعـضـاء الـمـسـتـهـدفـيـن:* ⦓ *${victims.length}* ⦔

*🚫 الـمـسـتـثـنـون:* 
*│ 👑 الـمـطـورون*
*│ 🤖 الـبـوت*

*⏳ جـاري تـنـفـيـذ الـتـصـفـيـة...*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim();

            await reply(startMsg);

            // =====================================================
            // ⚔️ تنفيذ الطرد
            // =====================================================

            let kicked = 0;
            let failed = 0;

            // كل دفعة تحتوي على 50 عضو
            for (let i = 0; i < victims.length; i += 50) {

                const batch =
                    victims.slice(i, i + 50);

                try {

                    await bot.sock.groupParticipantsUpdate(
                        jid,
                        batch,
                        "remove"
                    );

                    kicked += batch.length;

                } catch (error) {

                    failed += batch.length;

                    console.error(
                        `❌ فشل طرد دفعة (${batch.length}):`,
                        error.message
                    );
                }

                // انتظار نصف ثانية بين كل دفعة
                if (i + 50 < victims.length) {
                    await new Promise(
                        resolve => setTimeout(resolve, 500)
                    );
                }
            }

            // =====================================================
            // ✅ النتيجة
            // =====================================================

            const resultMsg = `
*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🧹 تـمـت الـتـصـفـيـة*

*───━━━⊱  ✅  ⊰━━━───*

*👤 الـمـشـرف:* ⦓ *@${userJid.split("@")[0]}* ⦔

*✅ تـم طـرد:* ⦓ *${kicked}* ⦔ عـضـو

*❌ فـشـل طـرد:* ⦓ *${failed}* ⦔

*👑 الـمـطـورون:* مـحـمـيـون

*🤖 الـبـوت:* مـحـمـي

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*💠 تـم تـنـفـيـذ الـقـرار.*

*───━━━⊱  𝐒 𝐎  𝐋 𝐎  ⊰━━━───*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim();

            await bot.sendMessage(
                jid,
                {
                    text: resultMsg,
                    mentions: [userJid]
                },
                {
                    quoted: message
                }
            );

            await react("✅");

            return;
        }

        // =====================================================
        // أي صيغة أخرى ليست خاصة بالأمر
        // =====================================================

        return;
    }
};