// plugins/عاكس.js
// ⚔️ SOLO FLIRT SYSTEM — NO REPEAT ⚔️

import fs from 'fs-extra';
import path from 'path';

// ═══════════════════════════════════════════════════════════
// 💾 ذاكرة آخر المعاكسات (عشان ما تتكررش)
// ═══════════════════════════════════════════════════════════
const HISTORY_FILE = path.join(process.cwd(), 'data', 'flirt_history.json');
const MAX_HISTORY = 5; // نمنع آخر 5 من التكرار

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return fs.readJsonSync(HISTORY_FILE) || {};
        }
    } catch {}
    return {};
}

function saveHistory(data) {
    try {
        fs.ensureDirSync(path.dirname(HISTORY_FILE));
        fs.writeJsonSync(HISTORY_FILE, data, { spaces: 2 });
        return true;
    } catch { return false; }
}

export default {
    name: "عاكس",
    aliases: ["دلع"],
    description: "معاكسات للبنات مصرية مضحكة 😉",
    category: "fun",
    developer: false,
    group: true,
    private: true,

    async run({ bot, message, args, reply, react, userJid, isGroup }) {
        // ═══════════════════════════════════════════════════════
        // 🎯 تحديد الشخص المستهدف
        // ═══════════════════════════════════════════════════════
        let targetJid = null;

        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetJid = message.message.extendedTextMessage.contextInfo.participant ||
                       message.message.extendedTextMessage.contextInfo.quotedMessage?.key?.participant;
        }
        else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        else if (args[0]) {
            let arg = args[0].replace('@', '').trim();
            if (arg.length > 5) {
                targetJid = arg.includes('@') ? arg : `${arg}@s.whatsapp.net`;
            }
        }

        if (!targetJid) {
            await react("🦦");
            return reply("*❌ مـنـشـن الـبـنـت أو ࢪد على ࢪسـالـتـهـا.*");
        }

        const targetName = targetJid.split('@')[0];

        await react("😉");

        // ═══════════════════════════════════════════════════════
        // 💬 المعاكسات
        // ═══════════════════════════════════════════════════════
        const pranks = [
            `@${targetName} *هي مامتك نحلة عشان تجيب العسل ده؟ 😉*`,
            `@${targetName} *الفرق بينك و بين القمر ان القمر للكل انما انتِ ليا لوحدي 😍🎀*`,
            `@${targetName} *صاروخ و اللي يشوف سحر عيونك يدوخ 😵‍💫🎀*`,
            `@${targetName} *یا مدوبني في حمض قلبك و مأكسدني في هواك، قلي انت فين دلوقتي وانا أجي اتفاعل معاك 🫦*`,
            `@${targetName} *اكيد باباكي حلواني!*`,
            `@${targetName} *جبار و مشعلل قلبي نار 🔥*`,
            `@${targetName} *تعرفي ان انا اجمد من وكالة ناسا؟ هما طلعوا القمر لكن انا بكلمه 🌚*`,
            `@${targetName} *مش هتدفعي الإيجار بقى ولا ايه؟ انتِ ساكنة قلبي بقالك كتير 💖*`,
            `@${targetName} *طب واحدة واحدة عشان انتِ اجمل واحدة 🫣*`,
            `@${targetName} *براحة يا غزال جمالك عمل في الارض زلزال 🙈❤️‍🔥*`,
            `@${targetName} *لو الجمال جريمة كنتي هتبقي سجن مؤبد 😍*`,
            `@${targetName} *قالوا ان بلبن فتح فرع جديد بس متوقعتش الاقيه قدامي 😋🫵🏻*`
        ];

        // ═══════════════════════════════════════════════════════
        // 🎲 اختيار عشوائي بدون تكرار حديث
        // ═══════════════════════════════════════════════════════

        const history = loadHistory();
        const recent = history.recent || [];

        // ─── فلترة المعاكسات اللي ما اتقالتش مؤخراً ───
        let available = pranks.filter((_, index) => !recent.includes(index));

        // ─── لو كلهم اتقالوا → نصفّر الـ history ───
        if (available.length === 0) {
            available = [...pranks];
            history.recent = [];
        }

        // ─── نختار عشوائياً من المتاح ───
        const availableIndices = available.map((_, i) => {
            // نرجع index الأصلي
            return pranks.indexOf(available[i]);
        });

        const randomIndex = availableIndices[
            Math.floor(Math.random() * availableIndices.length)
        ];

        const randomPrank = pranks[randomIndex];

        // ─── نسجل في الـ history ───
        history.recent = history.recent || [];
        history.recent.push(randomIndex);

        // ─── نخلي الـ history بحد أقصى MAX_HISTORY ───
        while (history.recent.length > MAX_HISTORY) {
            history.recent.shift();
        }

        saveHistory(history);

        // ═══════════════════════════════════════════════════════
        // 📤 إرسال
        // ═══════════════════════════════════════════════════════
        await bot.sendMessage(message.key.remoteJid, {
            text: randomPrank,
            mentions: [targetJid]
        }, { quoted: message });
    }
};