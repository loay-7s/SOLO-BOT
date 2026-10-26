// plugins/كوبي.js

import fs from "fs-extra";
import path from "path";

const backupDir = path.join(
    process.cwd(),
    "data",
    "group_backups"
);

fs.ensureDirSync(backupDir);

const wait = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

function safeBackupName(name) {
    if (!name) return null;

    const cleaned = String(name)
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\.+$/g, "");

    if (!cleaned) return null;

    return cleaned.slice(0, 80);
}

function getBackupPath(name) {
    const safeName = safeBackupName(name);

    if (!safeName) return null;

    return path.join(
        backupDir,
        `${safeName}.json`
    );
}

function isAdmin(participant) {
    return (
        participant?.admin === "admin" ||
        participant?.admin === "superadmin"
    );
}

function getSubCommand(args) {
    return String(args?.[0] || "")
        .trim()
        .toLowerCase();
}

function buildHelp() {
    return `
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 📦 〕─╮*
*│ 𝐆𝐑𝐎𝐔𝐏 𝐁𝐀𝐂𝐊𝐔𝐏*
*╰──────────────╯*

*┋ 📋 نـسـخ الـمـجـمـوعـة*
*┋ .كوبي نسخ <الاسم>*

*┋ 📥 تـطـبـيـق نـسـخـة*
*┋ .كوبي لصق <الاسم>*

*┋ 📂 عـرض الـنـسـخ*
*┋ .كوبي عرض*

*┋ 🔎 تـفـاصـيـل نـسـخـة*
*┋ .كوبي عرض <الاسم>*

*┋ 🗑️ حـذف نـسـخـة*
*┋ .كوبي حذف <الاسم>*

*⎔┄┄── ⊱╎⌯ ⚡ ⌯╎⊰─┄┄⎔*

*┋ ⚠️ الأمر متاح للمشرفين والمطور فقط.*

*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim();
}

function buildSavedMessage(backupName, data) {
    return `
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 📦 تـم حـفـظ الـنـسـخـة 〕─╮*
*│*
*│ 🔖 الاسم : ${data.name}*
*│ 📁 النسخة : ${backupName}*
*│*
*╰──────────────╯*

*╭─〔 📝 الـوصـف 〕─╮*
*│*
*│ ${data.desc || "لا يوجد وصف."}*
*│*
*╰──────────────╯*

*┋ 👤 بواسطة : ${data.copiedBy || "غير معروف"}*
*┋ 📅 ${new Date(data.timestamp).toLocaleString("ar-EG")}*

*⎔┄┄── ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim();
}

function buildDetailsMessage(backupName, data) {
    return `
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 🔎 تـفـاصـيـل الـنـسـخـة 〕─╮*
*│*
*│ 📁 الاسم : ${backupName}*
*│ 🔖 اسم المجموعة : ${data.name || "غير محفوظ"}*
*│*
*╰──────────────╯*

*╭─〔 📝 الـوصـف 〕─╮*
*│*
*│ ${data.desc || "لا يوجد وصف."}*
*│*
*╰──────────────╯*

*┋ 👤 تم النسخ بواسطة : ${data.copiedBy || "غير معروف"}*
*┋ 📅 التاريخ : ${new Date(data.timestamp).toLocaleString("ar-EG")}*

*⎔┄┄── ⊱╎⌯ 📦 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim();
}

export default {
    name: "كوبي",
    aliases: ["copy"],
    description: "إدارة نسخ المجموعات.",
    category: "group",
    group: true,

    async run({
        message,
        args,
        reply,
        sock,
        isDeveloper
    }) {
        const chatId =
            message?.key?.remoteJid;

        const subCommand =
            getSubCommand(args);

        const rawBackupName =
            args?.slice(1).join(" ").trim();

        if (!subCommand) {
            return reply(buildHelp());
        }

        // ============================================
        // 🔐 التحقق من الصلاحيات
        // ============================================

        let metadata;

        try {
            metadata =
                await sock.groupMetadata(chatId);
        } catch (error) {
            return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ لـم أسـتـطـع الـوصـول لـبـيـانـات الـمـجـمـوعـة.*

*⎔┄┄── ⊱╎⌯ ⚠️ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
        }

        const senderId =
            message?.key?.participant;

        const sender =
            metadata.participants?.find(
                p => p.id === senderId
            );

        const userIsAdmin =
            isAdmin(sender);

        if (!userIsAdmin && !isDeveloper) {
            return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 🔒 صـلاحـيـات 〕─╮*
*│*
*│ ❌ هذا الأمر للمشرفين*
*│    والمطور فقط.*
*│*
*╰──────────────╯*

*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
        }

        // ============================================
        // 📦 التحقق من اسم النسخة
        // ============================================

        const requiresBackupName = [
            "نسخ",
            "لصق",
            "حذف"
        ];

        if (
            requiresBackupName.includes(subCommand) &&
            !rawBackupName
        ) {
            return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ⚠️ يـرجـى تـحـديـد اسـم الـنـسـخـة.*

*┋ 📌 مثال :*
*┋ .كوبي ${subCommand} سولو*

*⎔┄┄── ⊱╎⌯ 💡 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
        }

        const backupName =
            safeBackupName(rawBackupName);

        if (
            requiresBackupName.includes(subCommand) &&
            !backupName
        ) {
            return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ اسـم الـنـسـخـة غـيـر صـالـح.*

*⎔┄┄── ⊱╎⌯ ⚠️ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
        }

        const backupPath =
            backupName
                ? getBackupPath(backupName)
                : null;

        // ============================================
        // 📦 الأوامر الفرعية
        // ============================================

        switch (subCommand) {

            // ========================================
            // 📋 نسخ
            // ========================================

            case "نسخ": {
                await reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ 📦 جـاري حـفـظ نـسـخـة الـمـجـمـوعـة...*
*┋ 📁 الاسم : ${backupName}*

*⎔┄┄── ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());

                try {
                    const currentMetadata =
                        await sock.groupMetadata(
                            chatId
                        );

                    const backupData = {
                        name:
                            currentMetadata.subject ||
                            "بدون اسم",

                        desc:
                            currentMetadata.desc?.toString() ||
                            "",

                        copiedBy:
                            message.pushName ||
                            senderId ||
                            "غير معروف",

                        timestamp:
                            new Date().toISOString()
                    };

                    fs.writeJsonSync(
                        backupPath,
                        backupData,
                        {
                            spaces: 2
                        }
                    );

                    return reply(
                        buildSavedMessage(
                            backupName,
                            backupData
                        )
                    );

                } catch (error) {
                    console.error(
                        "[COPY] Save Error:",
                        error
                    );

                    return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ فـشـل حـفـظ الـنـسـخـة.*

*┋ ${error?.message || "خطأ غير معروف"}*

*⎔┄┄── ⊱╎⌯ ⚠️ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
                }
            }

            // ========================================
            // 📥 لصق
            // ========================================

            case "لصق": {
                if (
                    !fs.existsSync(backupPath)
                ) {
                    return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ لـم يـتـم الـعـثـور عـلـى الـنـسـخـة.*

*┋ 📁 الاسم : ${backupName}*

*⎔┄┄── ⊱╎⌯ 📂 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
                }

                let backupData;

                try {
                    backupData =
                        fs.readJsonSync(
                            backupPath
                        );
                } catch (error) {
                    return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ ملف النسخة تالف أو غير صالح.*

*┋ 📁 ${backupName}*

*⎔┄┄── ⊱╎⌯ ⚠️ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
                }

                await reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ 📥 جـاري تـطـبـيـق الـنـسـخـة...*
*┋ 📁 ${backupName}*

*⎔┄┄── ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());

                // -------------------------------
                // 🔖 تغيير الاسم
                // -------------------------------

                try {
                    if (
                        backupData.name
                    ) {
                        await sock.groupUpdateSubject(
                            chatId,
                            backupData.name
                        );

                        await reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ 🔖 تـم تـغـيـيـر اسـم الـمـجـمـوعـة.*

*┋ ${backupData.name}*

*⎔┄┄── ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
`.trim());
                    }
                } catch (error) {
                    console.error(
                        "[COPY] Subject Error:",
                        error
                    );

                    if (
                        String(error?.message)
                            .includes("not-admin")
                    ) {
                        await reply(
                            "*┋ ❌ يجب أن يكون البوت مشرفًا لتغيير اسم المجموعة.*"
                        );
                    } else {
                        await reply(
                            `*┋ ❌ فشل تغيير الاسم : ${error?.message || "خطأ غير معروف"}*`
                        );
                    }
                }

                await wait(1000);

                // -------------------------------
                // 📝 تغيير الوصف
                // -------------------------------

                try {
                    if (
                        backupData.desc
                    ) {
                        await sock.groupUpdateDescription(
                            chatId,
                            backupData.desc
                        );

                        await reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ 📝 تـم تـغـيـيـر وصـف الـمـجـمـوعـة.*

*⎔┄┄── ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
`.trim());
                    }
                } catch (error) {
                    console.error(
                        "[COPY] Description Error:",
                        error
                    );

                    if (
                        String(error?.message)
                            .includes("not-admin")
                    ) {
                        await reply(
                            "*┋ ❌ يجب أن يكون البوت مشرفًا لتغيير وصف المجموعة.*"
                        );
                    } else {
                        await reply(
                            `*┋ ❌ فشل تغيير الوصف : ${error?.message || "خطأ غير معروف"}*`
                        );
                    }
                }

                return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 📦 اكـتـمـال الـلـصـق 〕─╮*
*│*
*│ 📁 النسخة : ${backupName}*
*│ 🔖 الاسم : ${backupData.name || "—"}*
*│ 📝 الوصف : ${backupData.desc ? "تم تطبيقه" : "لا يوجد"}*
*│*
*╰──────────────╯*

*⎔┄┄── ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
            }

            // ========================================
            // 📂 عرض
            // ========================================

            case "عرض": {

                // -------------------------------
                // 🔎 عرض نسخة معينة
                // -------------------------------

                if (backupName) {
                    if (
                        !fs.existsSync(
                            backupPath
                        )
                    ) {
                        return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ النسخة غير موجودة.*

*┋ 📁 ${backupName}*

*⎔┄┄── ⊱╎⌯ 📂 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
                    }

                    try {
                        const backupData =
                            fs.readJsonSync(
                                backupPath
                            );

                        return reply(
                            buildDetailsMessage(
                                backupName,
                                backupData
                            )
                        );

                    } catch (error) {
                        return reply(
                            `*┋ ❌ تعذر قراءة النسخة : ${error?.message || "خطأ غير معروف"}*`
                        );
                    }
                }

                // -------------------------------
                // 📂 عرض كل النسخ
                // -------------------------------

                const files =
                    fs.readdirSync(
                        backupDir
                    )
                    .filter(
                        file =>
                            file.endsWith(".json")
                    )
                    .sort();

                if (
                    files.length === 0
                ) {
                    return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 📂 الـنـسـخ الـمـحـفـوظـة 〕─╮*
*│*
*│ لا توجد أي نسخ محفوظة حاليًا.*
*│*
*╰──────────────╯*

*┋ 📌 للحفظ :*
*┋ .كوبي نسخ <الاسم>*

*⎔┄┄── ⊱╎⌯ 📦 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
                }

                let listMessage = `
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 📂 الـنـسـخ الـمـحـفـوظـة 〕─╮*
*│*
`;

                files.forEach(
                    (file, index) => {
                        const name =
                            file.replace(
                                ".json",
                                ""
                            );

                        listMessage +=
                            `*│ ${String(index + 1).padStart(2, "0")} ┊ 📁 ${name}*\n`;
                    }
                );

                listMessage += `
*│*
*╰──────────────╯*

*┋ 📦 العدد : ${files.length} نسخة*

*┋ 🔎 لعرض التفاصيل :*
*┋ .كوبي عرض <اسم_النسخة>*

*┋ 📥 للتطبيق :*
*┋ .كوبي لصق <اسم_النسخة>*

*⎔┄┄── ⊱╎⌯ 📚 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`;

                return reply(
                    listMessage.trim()
                );
            }

            // ========================================
            // 🗑️ حذف
            // ========================================

            case "حذف": {

                if (
                    !fs.existsSync(
                        backupPath
                    )
                ) {
                    return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ النسخة غير موجودة.*

*┋ 📁 ${backupName}*

*⎔┄┄── ⊱╎⌯ 📂 ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
                }

                try {
                    fs.removeSync(
                        backupPath
                    );

                    return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*╭─〔 🗑️ تـم حـذف الـنـسـخـة 〕─╮*
*│*
*│ 📁 ${backupName}*
*│*
*╰──────────────╯*

*⎔┄┄── ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());

                } catch (error) {
                    console.error(
                        "[COPY] Delete Error:",
                        error
                    );

                    return reply(
                        `*┋ ❌ فشل حذف النسخة : ${error?.message || "خطأ غير معروف"}*`
                    );
                }
            }

            // ========================================
            // ❌ أمر غير معروف
            // ========================================

            default:
                return reply(`
*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*┋ ❌ الأمـر الـفـرعـي غـيـر مـعـروف.*

*┋ 📌 استخدم :*
*┋ .كوبي*

*⎔┄┄── ⊱╎⌯ ❓ ⌯╎⊰─┄┄⎔*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~
`.trim());
        }
    }
};