import fs from 'fs/promises';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'config.js');

// ============================================================
// 📖 قراءة الكونفج
// ============================================================

async function readConfig() {
    try {
        const { config } = await import(
            `file://${configPath}?v=${Date.now()}`
        );

        return config;

    } catch (error) {
        console.error('خطأ في قراءة ملف الكونفج:', error);
        return null;
    }
}

// ============================================================
// 💾 كتابة الكونفج
// ============================================================

async function writeConfig(newConfig) {
    try {

        const fileContent = await fs.readFile(
            configPath,
            'utf8'
        );

        const newDevelopersArrayString =
            JSON.stringify(
                newConfig.DEVELOPERS,
                null,
                4
            );

        const updatedContent =
            fileContent.replace(
                /DEVELOPERS\s*:\s*\[[^\]]*\]/,
                `DEVELOPERS: ${newDevelopersArrayString}`
            );

        await fs.writeFile(
            configPath,
            updatedContent,
            'utf8'
        );

        return true;

    } catch (error) {

        console.error(
            'خطأ في كتابة ملف الكونفج:',
            error
        );

        return false;
    }
}

// ============================================================
// 👑 أمر المطورين
// ============================================================

export default {

    name: "مطور",

    aliases: ["developer"],

    description:
        "إدارة قائمة مطوري البوت (إضافة، حذف، عرض).",

    category: "developer",

    // 👑 الهاندلر هو المسؤول عن التحقق من المطور
    developer: true,

    group: true,

    async run({
        m,
        args,
        reply,
        sock
    }) {

        const subCommand =
            args[0]?.toLowerCase();

        // ========================================================
        // 📖 المساعدة
        // ========================================================

        if (!subCommand) {

            const helpMessage = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*👑 إدارة الـمـطـوريـن*

*───━━━⊱  📋  ⊰━━━───*

*📌 الأوامـر الـمـتـوفـرة:*

*🔹 .مطور عرض*
*└─ لـعـرض قـائـمـة الـمـطـوريـن*

*🔹 .مطور اضف*
*└─ لـإضـافـة مـطـور جـديـد*

*🔹 .مطور حذف*
*└─ لـحـذف مـطـور*

*⚠️ الـمـاسـتـر خـط أحـمـر*
*└─ لا يـمـكـن حـذف الـمـاسـتـر*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

            return reply(
                helpMessage.trim()
            );
        }

        // ========================================================
        // 🎯 بيانات الـ Reply والـ Mention
        // ========================================================

        const contextInfo =
            m.message?.extendedTextMessage?.contextInfo;

        const quotedSender =
            contextInfo?.participant;

        const mentionedJid =
            contextInfo?.mentionedJid || [];

        // ========================================================
        // 🔍 الحصول على بيانات المستخدم الحقيقية
        // ========================================================

        const getRealIdsFromMetadata =
            async (targetId) => {

                try {

                    const metadata =
                        await sock.groupMetadata(
                            m.key.remoteJid
                        );

                    const participant =
                        metadata.participants.find(
                            p => p.id === targetId
                        );

                    if (!participant) {
                        return null;
                    }

                    const realJid =
                        participant.phoneNumber;

                    const realLid =
                        participant.id.endsWith('@lid')
                            ? participant.id
                            : null;

                    if (!realJid) {

                        const cleanNum =
                            targetId
                                .split('@')[0]
                                .split(':')[0];

                        return {
                            jid:
                                `${cleanNum}@s.whatsapp.net`,
                            lid: realLid
                        };
                    }

                    return {
                        jid: realJid,
                        lid: realLid
                    };

                } catch (error) {

                    console.error(
                        "فشل في الحصول على بيانات المجموعة:",
                        error
                    );

                    return null;
                }
            };

        // ========================================================
        // 🔀 الأوامر
        // ========================================================

        switch (subCommand) {

            // ====================================================
            // 📋 عرض
            // ====================================================

            case "عرض": {

                const config =
                    await readConfig();

                if (!config) {
                    return reply(
                        '*❌ حـدث خـطأ أثـنـاء قـراءة الإعـدادات*'
                    );
                }

                let masterNumber = '';

                if (Array.isArray(config.MASTER)) {

                    masterNumber =
                        config.MASTER[0]
                            .split('@')[0];

                } else {

                    masterNumber =
                        config.MASTER
                            .split('@')[0];
                }

                let formattedMaster =
                    masterNumber;

                if (masterNumber.startsWith('20')) {

                    formattedMaster =
                        `+20 ${masterNumber.slice(2, 4)} ${masterNumber.slice(4)}`;

                } else {

                    formattedMaster =
                        `+${masterNumber}`;
                }

                let devList =
                    `*👑 الـمـاسـتـر:*\n*└─ ${formattedMaster}*\n\n`;

                const developers =
                    config.DEVELOPERS
                        .filter(
                            jid =>
                                jid.endsWith(
                                    '@s.whatsapp.net'
                                )
                        )
                        .map(
                            jid =>
                                jid.split('@')[0]
                        );

                if (developers.length === 0) {

                    devList +=
                        '*📭 لا يـوجـد مـطـوريـن فـي الـقـائـمـة*';

                } else {

                    devList +=
                        '*👥 الـمـطـوريـن:*\n';

                    developers.forEach(
                        (dev, index) => {

                            let formattedNumber =
                                dev;

                            if (
                                dev.startsWith('20')
                            ) {

                                formattedNumber =
                                    `+20 ${dev.slice(2, 4)} ${dev.slice(4)}`;

                            } else {

                                formattedNumber =
                                    `+${dev}`;
                            }

                            devList +=
                                `*└─ ${index + 1}.* ${formattedNumber}\n`;
                        }
                    );
                }

                const response = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*👑 قـائـمـة الـمـطـوريـن*

*───━━━⊱  📋  ⊰━━━───*

${devList}

*📊 عـدد الـمـطوࢪيـن:* ⦓ *${developers.length + 1}* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

                return reply(
                    response.trim()
                );
            }

            // ====================================================
            // ➕ إضافة مطور
            // ====================================================

            case "اضف": {

                const targetId =
                    quotedSender ||
                    (
                        mentionedJid.length > 0
                            ? mentionedJid[0]
                            : null
                    );

                if (!targetId) {

                    return reply(
                        '*⚠️ يـجـب عـلـيـك الـرد عـلى رسـالـة شـخـص أو عـمـل مـنـشـن لـه*'
                    );
                }

                const userInfo =
                    await getRealIdsFromMetadata(
                        targetId
                    );

                if (!userInfo) {

                    return reply(
                        '*❌ لـم أتـمـكـن مـن الـعـثـور عـلى مـعـلـومـات هـذا الـمـسـتـخـدم فـي الـمـجـمـوعـة*'
                    );
                }

                const config =
                    await readConfig();

                if (!config) {

                    return reply(
                        '*❌ حـدث خـطأ أثـنـاء قـراءة الإعـدادات*'
                    );
                }

                const {
                    jid,
                    lid
                } = userInfo;

                const idsToAdd =
                    [jid, lid].filter(Boolean);

                // =================================================
                // 👑 منع إضافة الماستر
                // =================================================

                if (
                    idsToAdd.some(
                        id => config.MASTER?.includes
                            ? config.MASTER.includes(id)
                            : config.MASTER === id
                    )
                ) {

                    return reply(
                        '*👑 عـمـك مـطـوࢪ غـصـب عـنـك.*'
                    );
                }

                // =================================================
                // 🔍 منع التكرار
                // =================================================

                if (
                    idsToAdd.some(
                        id =>
                            config.DEVELOPERS.includes(id)
                    )
                ) {

                    return reply(
                        '*✅ هـذا الـمـسـتـخـدم مـطـور بـالـفـعـل*'
                    );
                }

                // =================================================
                // ➕ إضافة المطور
                // =================================================

                config.DEVELOPERS.push(
                    ...idsToAdd
                );

                const success =
                    await writeConfig(config);

                if (!success) {

                    return reply(
                        '*❌ فـشـلـت عـمـلـيـة تـحـديـث مـلـف الإعـدادات*'
                    );
                }

                const successMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*✅ تـم إضـافـة مـطـور جـديـد*

*───━━━⊱  👑  ⊰━━━───*

*👤 الـمـطـوࢪ الـجـديـد:* ⦓ *@${jid.split('@')[0]}* ⦔

*📊 إجـمـالـي الـمـطـوريـن:* ⦓ *${config.DEVELOPERS.length + 1}* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

                return reply(
                    successMsg,
                    {
                        mentions: [targetId]
                    }
                );
            }

            // ====================================================
            // 🗑️ حذف مطور
            // ====================================================

            case "حذف": {

                const config =
                    await readConfig();

                if (!config) {

                    return reply(
                        '*❌ حـدث خـطأ أثـنـاء قـراءة الإعـدادات*'
                    );
                }

                let targetId;

                const developers =
                    config.DEVELOPERS.filter(
                        j =>
                            j.endsWith(
                                '@s.whatsapp.net'
                            )
                    );

                const textArg =
                    args[1];

                // =================================================
                // 🎯 تحديد الهدف
                // =================================================

                if (
                    quotedSender ||
                    mentionedJid.length > 0
                ) {

                    targetId =
                        quotedSender ||
                        mentionedJid[0];

                } else if (
                    textArg &&
                    !isNaN(textArg)
                ) {

                    const index =
                        parseInt(
                            textArg,
                            10
                        ) - 1;

                    if (
                        index < 0 ||
                        index >= developers.length
                    ) {

                        return reply(
                            '*❌ الـرقـم الـذي أدخـلـتـه غـيـر صـالـح*'
                        );
                    }

                    targetId =
                        developers[index];

                } else {

                    return reply(
                        '*⚠️ لـلـحـذف، قـم بـالـرد، أو عـمـل مـنـشـن، أو اكـتـب رقـم الـمـطـور مـن الـقـائـمـة*'
                    );
                }

                if (!targetId) {

                    return reply(
                        '*❌ لـم أتـمـكـن مـن تـحـديـد الـمـسـتـخـدم*'
                    );
                }

                // =================================================
                // 👑 الماستر خط أحمر
                // =================================================

                let isTargetMaster = false;

                if (Array.isArray(config.MASTER)) {

                    isTargetMaster =
                        config.MASTER.some(
                            master =>
                                master === targetId
                        );

                } else {

                    isTargetMaster =
                        config.MASTER === targetId;
                }

                // =================================================
                // 🚫 ممنوع حذف الماستر
                // =================================================

                if (isTargetMaster) {

                    return reply(
                        '*👑 لا يـمـكـن حـذف الـمـاسـتـࢪ لأنـه عـمـي و عـمـك.*'
                    );
                }

                // =================================================
                // 🔍 الحصول على الـ JID الحقيقي
                // =================================================

                const userInfo =
                    await getRealIdsFromMetadata(
                        targetId
                    );

                if (!userInfo) {

                    return reply(
                        '*❌ لـم أتـمـكـن مـن الـعـثـور عـلى مـعـلـومـات هـذا الـمـسـتـخـدم فـي الـمـجـمـوعـة*'
                    );
                }

                const {
                    jid: jidToDelete,
                    lid: lidToDelete
                } = userInfo;

                const idsToDelete =
                    [
                        jidToDelete,
                        lidToDelete
                    ].filter(Boolean);

                // =================================================
                // 🔍 التأكد أن الشخص مطور
                // =================================================

                if (
                    !idsToDelete.some(
                        id =>
                            config.DEVELOPERS.includes(id)
                    )
                ) {

                    return reply(
                        '*ℹ️ هـذا الـمـسـتـخـدم لـيـس مـطـوراً أصـلاً*'
                    );
                }

                // =================================================
                // 🗑️ حذف المطور
                // =================================================

                config.DEVELOPERS =
                    config.DEVELOPERS.filter(
                        dev =>
                            !idsToDelete.includes(dev)
                    );

                const success =
                    await writeConfig(config);

                if (!success) {

                    return reply(
                        '*❌ فـشـلـت عـمـلـيـة تـحـديـث مـلـف الإعـدادات*'
                    );
                }

                const deleteMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🗑️ تـم حـذف مـطـور*

*───━━━⊱  ❌  ⊰━━━───*

*👤 الـمـطـوࢪ الـمـحـذوف:* ⦓ *@${jidToDelete.split('@')[0]}* ⦔

*📊 إجـمـالـي الـمـطـوريـن:* ⦓ *${config.DEVELOPERS.length + 1}* ⦔

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

                return reply(
                    deleteMsg,
                    {
                        mentions: [targetId]
                    }
                );
            }

            // ====================================================
            // ❌ غير معروف
            // ====================================================

            default: {

                return reply(
                    `*❌ الأمـر الـفـرعـي "${subCommand}" غـيـر مـعـروف*\n\n*📝 اكـتـب* *.مطور* *لـعـرض قـائـمـة الـمـسـاعـدة*`
                );
            }
        }
    }
};