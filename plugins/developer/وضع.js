import fs from 'fs/promises';
import path from 'path';

// المسار الكامل لملف الكونفج
const configPath = path.resolve(process.cwd(), 'config.js');

// دالة لقراءة وكتابة الكونفج
async function updateConfigMode(newMode) {
    try {
        const fileContent = await fs.readFile(configPath, 'utf8');

        // تحديث قيمة MODE مع دعم جميع الأوضاع
        const updatedContent = fileContent.replace(
            /MODE\s*:\s*['"](public|private|admins)['"]/,
            `MODE: "${newMode}"`
        );

        if (updatedContent === fileContent) {
            console.log("لم يتم العثور على سطر MODE");
            return false;
        }

        await fs.writeFile(configPath, updatedContent, 'utf8');
        return true;
    } catch (error) {
        console.error('❌ خطأ في تحديث ملف الكونفج:', error);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 🎯 تجميع الكلمات المفتاحية لكل وضع
// ═══════════════════════════════════════════════════════════
const PRIVATE_WORDS = [
    "المطور",
    "المطورين",
    "ألمطور",
    "الماستر",
    "ألماستر",
    "on",
    "private",
  "pv"
];

const ADMINS_WORDS = [
    "ادمنز",
    "الادمنز",
    "أدمنز",
    "الأدمنز",
    "الادمن",
    "الأدمن",
    "ألأدمن",
    "مشرفين",
    "المشرفين",
    "admins",
    "admin",
  "ad"
];

const PUBLIC_WORDS = [
    "العام",
    "ألعام",
    "الجميع",
    "ألجميع",
    "الكل",
    "ألكل",
    "الاعضاء",
    "ألاعضاء",
    "ألأعضاء",
    "الأعضاء",
    "off",
    "public",
  "pb"
  
];

// تطبيع الكلمة العربية (توحيد الهمزات والألف)
function normalizeWord(word) {
    return String(word || "")
        .trim()
        .toLowerCase()
        .replace(/[أإآا]/g, "ا")   // توحيد الألف
        .replace(/ة/g, "ه")          // توحيد التاء المربوطة
        .replace(/ى/g, "ي");          // توحيد الياء
}

// البحث عن الوضع المطلوب
function resolveMode(input) {
    const normalized = normalizeWord(input);

    if (PRIVATE_WORDS.some(w => normalizeWord(w) === normalized)) {
        return "private";
    }

    if (ADMINS_WORDS.some(w => normalizeWord(w) === normalized)) {
        return "admins";
    }

    if (PUBLIC_WORDS.some(w => normalizeWord(w) === normalized)) {
        return "public";
    }

    return null;
}

export default {
    name: "وضع",
    description: "تغيير وضع البوت (عام/مطورين/أدمنز) وحفظه بشكل دائم.",
    aliases: ["mode", "مود","الوضع"],
    category: "developer",
    developer: true,

    async run({ bot, m, args, reply }) {
        const previousMode = bot.config.MODE;

        const currentMode =
            previousMode === 'private'
                ? '*🔒 الـمـطـوريـن فـقـط*'
                : previousMode === 'admins'
                    ? '*👑 الـمـطـوريـن + أدمنـز الـجـروب*'
                    : '*🌍 الـوضـع الـعـام*';

        // ═══════════════════════════════════════════════════════
        // 📋 عرض الوضع الحالي لو مفيش args
        // ═══════════════════════════════════════════════════════
        if (args.length === 0) {
            const helpMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*⚙️ الـوضـع الـحـالـي*
*───━━━⊱  📊  ⊰━━━───*

*📋 الـوضـع:* ⦓ ${currentMode} ⦔

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📝 الأوامـر الـمـتـوفـرة:*

*🔹* \`${bot.config.PREFIX}وضع المطورين\` - *لـتـفـعـيـل وضـع الـمـطـوريـن فـقـط*

*🔹* \`${bot.config.PREFIX}وضع الادمنز\` - *لـلـسـمـاح لـلـمـطـوريـن وأدمنـز الـجـروب بـاسـتـخـدام الـبـوت*

*🔹* \`${bot.config.PREFIX}وضع العام\` - *لـتـفـعـيـل الـوضـع الـعـام لـلـجـمـيـع*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

            return reply(helpMsg);
        }

        // ═══════════════════════════════════════════════════════
        // 🎯 تحديد الوضع المطلوب
        // ═══════════════════════════════════════════════════════
        const resolvedMode = resolveMode(args[0]);

        let newModeValue = null;
        let successMsg = '';

        // ==================== PRIVATE ====================
        if (resolvedMode === 'private') {
            if (bot.config.MODE === 'private') {
                return reply('*✅ وضـع الـمـطـوريـن مـفـعـل بـالـفـعـل*');
            }

            newModeValue = 'private';

            successMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🔒 تـم تـفـعـيـل وضـع الـمـطـوريـن*
*───━━━⊱  ✅  ⊰━━━───*

*📋 الـوضـع الـجـديـد:* ⦓ *مـطـوريـن فـقـط* ⦔

*✅ الـبـوت الآن يـسـتـجـيـب لـلـمـطـوريـن فـقـط*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;
        }

        // ==================== ADMINS ====================
        else if (resolvedMode === 'admins') {
            if (bot.config.MODE === 'admins') {
                return reply('*✅ وضـع الأدمنـز مـفـعـل بـالـفـعـل*');
            }

            newModeValue = 'admins';

            successMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*👑 تـم تـفـعـيـل وضـع الأدمنـز*
*───━━━⊱  ✅  ⊰━━━───*

*📋 الـوضـع الـجـديـد:* ⦓ *مـطـوريـن + أدمنـز الـجـروب* ⦔

*✅ الـبـوت الآن يـسـتـجـيـب لـلـمـطـوريـن وأدمنـز الـجـروب فـقـط*

*ℹ️ أدمنـز الـجـروب لا يـحـصـلـون عـلـى صـلاحـيـات الـمـطـور*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;
        }

        // ==================== PUBLIC ====================
        else if (resolvedMode === 'public') {
            if (bot.config.MODE === 'public') {
                return reply('*✅ الـوضـع الـعـام مـفـعـل بـالـفـعـل*');
            }

            newModeValue = 'public';

            successMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*🌍 تـم تـفـعـيـل الـوضـع الـعـام*
*───━━━⊱  ✅  ⊰━━━───*

*📋 الـوضـع الـجـديـد:* ⦓ *الـوضـع الـعـام* ⦔

*✅ الـبـوت الآن يـسـتـجـيـب لـلـجـمـيـع*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;
        }

        // ==================== WRONG USAGE ====================
        else {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*❌ اسـتـخـدام خـاطـئ*
*───━━━⊱  ⚠️  ⊰━━━───*

*📝 الـطـريـقـة الـصـحـيـحـة:*

*•* \`${bot.config.PREFIX}وضع المطورين\` - *وضـع الـمـطـوريـن*

*•* \`${bot.config.PREFIX}وضع الادمنز\` - *وضـع الأدمنـز*

*•* \`${bot.config.PREFIX}وضع العام\` - *الـوضـع الـعـام*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`);
        }

        // تحديث الكونفج في الذاكرة
        bot.config.MODE = newModeValue;

        // تحديث الملف الفعلي
        const success = await updateConfigMode(newModeValue);

        if (success) {
            await reply(successMsg);
        } else {
            // التراجع للوضع السابق الحقيقي
            bot.config.MODE = previousMode;

            await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ فـشـل تـحـديـث الـمـلـف*

*───━━━⊱  ⚠️  ⊰━━━───*

*📋 لـم يـتـم حـفـظ الـتـغـيـيـر*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`);
        }
    }
};