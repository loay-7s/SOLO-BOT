import fs from "fs";
import path from "path";

const HEADER = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*`;
const DIVIDER = `*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*`;
const FOOTER = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

export default {
    name: "باتش",
    description: "استعراض وقراءة ملفات البوت من plugins وdata وملفات النظام.",
    category: "أدوات",
    usage: ".باتش [رقم|اسم الملف]",
    developer: true,

    async run({ reply, args }) {
        try {
            const ROOT = process.cwd();
            const PLUGINS = path.join(ROOT, "plugins");
            const DATA = path.join(ROOT, "data");

            const SYSTEM_FILES = [
                "handler.js",
                "index.js",
                "main.js",
                "message.js",
                "messages.js",
                "console.js",
                "config.js"
            ];

            const files = [];

            // ============================================================
            // 📦 إضافة الملفات
            // ============================================================

            const addFiles = (dir, extensions, type) => {
                if (!fs.existsSync(dir)) return;

                const list = fs.readdirSync(dir, {
                    withFileTypes: true
                });

                for (const item of list) {
                    if (!item.isFile()) continue;

                    const ext = path.extname(item.name).toLowerCase();

                    if (!extensions.includes(ext)) continue;

                    files.push({
                        name: item.name,
                        type,
                        path: path.join(dir, item.name)
                    });
                }
            };

            // 🔌 ملفات الأوامر
            addFiles(
                PLUGINS,
                [".js"],
                "أمر"
            );

            // 💾 ملفات البيانات
            addFiles(
                DATA,
                [".json"],
                "بيانات"
            );

            // ⚙️ ملفات النظام
            for (const name of SYSTEM_FILES) {
                const filePath = path.join(ROOT, name);

                if (fs.existsSync(filePath)) {
                    files.push({
                        name,
                        type: "نظام",
                        path: filePath
                    });
                }
            }

            // ============================================================
            // 🔢 ترتيب ثابت
            // ============================================================

            files.sort((a, b) => {
                const typeOrder = {
                    "أمر": 1,
                    "بيانات": 2,
                    "نظام": 3
                };

                if (typeOrder[a.type] !== typeOrder[b.type]) {
                    return typeOrder[a.type] - typeOrder[b.type];
                }

                return a.name.localeCompare(
                    b.name,
                    "ar",
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                );
            });

            // ============================================================
            // 📭 لا توجد ملفات
            // ============================================================

            if (!files.length) {
                return reply(
                    `${HEADER}

*📦 مـديـر الـبـاتـش*

${DIVIDER}

*📭 لا تـوجـد مـلـفـات مـتـاحـة لـلـعـرض*

${FOOTER}`
                );
            }

            // ============================================================
            // 📋 عرض القائمة
            // ============================================================

            if (!args[0]) {
                let list = `${HEADER}

*📦 قـائـمـة مـلـفـات الـبـوت*

${DIVIDER}

`;

                let lastType = "";

                files.forEach((file, index) => {
                    if (lastType !== file.type) {
                        const title =
                            file.type === "أمر"
                                ? "🔌 الـبـلـجـنـات"
                                : file.type === "بيانات"
                                    ? "💾 مـلـفـات الـبـيـانـات"
                                    : "⚙️ مـلـفـات الـنـظـام";

                        list += `*${title}*\n\n`;
                        lastType = file.type;
                    }

                    const icon =
                        file.type === "أمر"
                            ? "🔌"
                            : file.type === "بيانات"
                                ? "💾"
                                : "⚙️";

                    list += `*${index + 1}.* ${icon} \`${file.name}\`\n`;
                });

                list += `
${DIVIDER}

*📖 لـعـرض مـحـتـوى مـلـف:*

*🔢 بـالـرقـم:*
\`.باتش 15\`

*📝 بـالاسـم:*
\`.باتش مطور.js\`

*🔎 بـجـزء مـن الاسـم:*
\`.باتش مطور\`

${FOOTER}`;

                return reply(list);
            }

            // ============================================================
            // 🔍 تحديد الملف
            // ============================================================

            const input = args.join(" ").trim();
            const number = parseInt(input, 10);

            let selectedFile = null;

            // 🔢 البحث بالرقم
            if (
                !isNaN(number) &&
                String(number) === input
            ) {
                const index = number - 1;

                if (index < 0 || index >= files.length) {
                    return reply(
                        `*❌ الـرقـم ${number} غـيـر مـوجـود*

*📌 إجـمـالـي الـمـلـفـات:* ${files.length}

*💡 اكـتـب:*
\`.باتش\`
لـعـرض الـقـائـمـة`
                    );
                }

                selectedFile = files[index];
            }

            // 📝 البحث بالاسم
            if (!selectedFile) {
                const search = input.toLowerCase();

                // تطابق كامل
                selectedFile = files.find(
                    file =>
                        file.name.toLowerCase() === search
                );

                // تطابق جزئي
                if (!selectedFile) {
                    const matches = files.filter(
                        file =>
                            file.name
                                .toLowerCase()
                                .includes(search)
                    );

                    if (!matches.length) {
                        return reply(
                            `*❌ مـلـقـيـتـش مـلـف بـالاسـم:*

\`${input}\`

*💡 اكـتـب:*
\`.باتش\`
لـعـرض جـمـيـع الـمـلـفـات`
                        );
                    }

                    if (matches.length > 1) {
                        let result = `${HEADER}

*🔎 نـتـائـج الـبـحـث*

${DIVIDER}

*وجـدت ${matches.length} مـلـفـات:*

`;

                        matches.forEach((file, index) => {
                            const icon =
                                file.type === "أمر"
                                    ? "🔌"
                                    : file.type === "بيانات"
                                        ? "💾"
                                        : "⚙️";

                            const originalIndex =
                                files.indexOf(file) + 1;

                            result +=
                                `*${index + 1}.* ${icon} \`${file.name}\`\n` +
                                `   └─ *رقـمـه فـي الـقـائـمـة:* ${originalIndex}\n`;
                        });

                        result += `
${DIVIDER}

*💡 استخدم رقم الملف أو الاسم الكامل.*`;

                        return reply(result);
                    }

                    selectedFile = matches[0];
                }
            }

            // ============================================================
            // 📄 التأكد من وجود الملف
            // ============================================================

            if (!fs.existsSync(selectedFile.path)) {
                return reply(
                    `*❌ الـمـلـف غـيـر مـوجـود فـعـلـيـاً:* \`${selectedFile.name}\``
                );
            }

            const stat = fs.statSync(selectedFile.path);

            if (!stat.isFile()) {
                return reply(
                    `*❌ الـعـنـصـر لـيـس مـلـفـاً*`
                );
            }

            // ============================================================
            // 📖 قراءة المحتوى
            // ============================================================

            let content = fs.readFileSync(
                selectedFile.path,
                "utf8"
            );

            // ============================================================
            // 🧹 الحفاظ على محتوى الملف
            // ============================================================

            content = content.replace(/\r\n/g, "\n");

            // ============================================================
            // ✂️ تحديد الحد الأقصى
            // ============================================================

            const MAX_LENGTH = 120000;

            if (content.length > MAX_LENGTH) {
                content = content.substring(
                    0,
                    MAX_LENGTH
                );
            }

            // ============================================================
            // 📤 إرسال محتوى الملف فقط
            // ============================================================

            const language =
                selectedFile.name.endsWith(".js")
                    ? "javascript"
                    : "json";

            return reply(
                "```" +
                language +
                "\n" +
                content +
                "\n```"
            );

        } catch (err) {
            console.error(
                "باتش command error:",
                err
            );

            return reply(
                `*❌ حـدث خـطـأ أثـنـاء تـنـفـيـذ أمـر بـاتـش*

⚠️ \`${err.message}\``
            );
        }
    }
};