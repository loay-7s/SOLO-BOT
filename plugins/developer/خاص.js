// plugins/خاص.js
// ⚔️ SOLO PV PROTECTION SYSTEM ⚔️

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PV_FILE = path.join(process.cwd(), 'data', 'pv_warnings.json');
const PV_IMAGE = path.join(process.cwd(), 'media', 'pv.jpg');

// ✅ التأكد من وجود المجلد والملف
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(PV_FILE)) {
    fs.writeFileSync(PV_FILE, JSON.stringify({ status: false, warnings: {} }, null, 2));
}

// ✅ دالة جلب البيانات
function getPVData() {
    try {
        return JSON.parse(fs.readFileSync(PV_FILE, 'utf8'));
    } catch {
        return { status: false, warnings: {} };
    }
}

// ✅ دالة حفظ البيانات
function savePVData(data) {
    fs.writeFileSync(PV_FILE, JSON.stringify(data, null, 2));
}

export default {
    name: "خاص",
    aliases: ["pv", "برايفت"],
    description: "تفعيل أو تعطيل منع الأوامر في الخاص (للمطورين فقط)",
    category: "admin",
    developer: true,

    async run({ sock, message, args, reply, react, userJid, handler, bot }) {
        const chatId = message.key.remoteJid;
        const subCommand = args[0]?.toLowerCase();

        // ✅ التحقق من أن المستخدم مطور
        const isDev = handler?.isDeveloper ? handler.isDeveloper(userJid) : false;
        
        if (!isDev) {
            await react("🚫");
            return reply(`*❌ هـذا الأمـر لـلـمـطـوريـن فـقـط*`);
        }

        const data = getPVData();

        // ✅ عرض الحالة
        if (!subCommand || (subCommand !== 'فتح' && subCommand !== 'قفل' && subCommand !== 'مسح' && subCommand !== 'مسح_الكل')) {
            const status = data.status ? '🟢 مـفـتـوح' : '🔴 مـقـفـول';
            const warningsCount = Object.keys(data.warnings).length;
            
            return reply(`*⎔┄┄─ ⊱╎⌯ 🔒 ⌯╎⊰─┄┄⎔*
*┋ نـظـام حـمـايـة الـخـاص*

*┋ الـحـالـة : ${status}*
*┋ عـدد الـمـحـظـوريـن : ${warningsCount}*

*┋ الـوضع : يـحـظـر الأوامـر فـقـط*

*⎔┄┄─ ⊱╎⌯ 📋 ⌯╎⊰─┄┄⎔*

📌 *.خاص فتح* - لـتـفـعـيـل الـمـنـع
📌 *.خاص قفل* - لـتـعـطـيـل الـمـنـع
📌 *.خاص مسح* - لـمـسـح الـتـحـذيـرات

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }

        // ═══════════════════════════════════════════════════════════
        // 🔓 فتح الحماية
        // ═══════════════════════════════════════════════════════════
        if (subCommand === 'فتح') {
            if (data.status === true) {
                await react("⚠️");
                return reply(`*✅ نـظـام حـمـايـة الـخـاص مـفـعـل بـالـفـعـل*`);
            }
            
            data.status = true;
            savePVData(data);
            await react("✅");
            return reply(`*⎔┄┄─ ⊱╎⌯ 🔓 ⌯╎⊰─┄┄⎔*
*┋ تـم تـفـعـيـل نـظـام حـمـايـة الـخـاص*

*┋ أي شـخـص يـسـتـخـدم أمـراً فـي الـخـاص سـيـتـم تـحـذيـره*

*┋ بـعـد 4 تـحـذيـرات سـيـتـم حـظـره*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }

        // ═══════════════════════════════════════════════════════════
        // 🔒 قفل الحماية
        // ═══════════════════════════════════════════════════════════
        if (subCommand === 'قفل') {
            if (data.status === false) {
                await react("⚠️");
                return reply(`*✅ نـظـام حـمـايـة الـخـاص مـعـطـل بـالـفـعـل*`);
            }
            
            data.status = false;
            data.warnings = {};
            savePVData(data);
            await react("✅");
            return reply(`*⎔┄┄─ ⊱╎⌯ 🔒 ⌯╎⊰─┄┄⎔*
*┋ تـم تـعـطـيـل نـظـام حـمـايـة الـخـاص*

*┋ تـم مـسـح جـمـيـع الـتـحـذيـرات*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }

        // ═══════════════════════════════════════════════════════════
        // 🧹 مسح التحذيرات
        // ═══════════════════════════════════════════════════════════
        if (subCommand === 'مسح' || subCommand === 'مسح_الكل') {
            const count = Object.keys(data.warnings).length;
            data.warnings = {};
            savePVData(data);
            await react("🧹");
            return reply(`*⎔┄┄─ ⊱╎⌯ 🧹 ⌯╎⊰─┄┄⎔*
*┋ تـم مـسـح جـمـيـع الـتـحـذيـرات*

*┋ عـدد الـمـحـذوف : ${count}*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};