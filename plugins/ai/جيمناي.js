// plugins/جيمناي.js
// ⚔️ SOLO GEMINI AI ⚔️

import axios from 'axios';

const API_BASE = 'https://engez.a7a.online/api/v1';

// ✅ تخزين الجلسات مؤقتاً
const sessions = new Map();

async function chatWithGemini(query, sessionId = null) {
    try {
        const params = new URLSearchParams();
        params.append('q', query);
        if (sessionId) params.append('sessionId', sessionId);

        const response = await axios.get(`${API_BASE}/ai/gemini?${params.toString()}`, {
            timeout: 60000
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل الاتصال');
        }

        return response.data.response;
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

export default {
    name: "جيمناي",
    aliases: ["gemini", "ai", "جيميناي"],
    description: "الذكاء الاصطناعي جيمناي مع حفظ السياق",
    category: "tools",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const text = args.join(" ");

        // ✅ التحقق من أمر المسح
        if (args.includes('مسح') || args.includes('clear')) {
            const userId = message.key.participant || message.key.remoteJid;
            if (sessions.has(userId)) {
                sessions.delete(userId);
                await react("🧹");
                return reply(`*⎔┄┄─ ⊱╎⌯ 🧹 ⌯╎⊰─┄┄⎔*
*┋ تـم مـسـح سـيـاق الـمـحـادثـة*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
            } else {
                await react("ℹ️");
                return reply(`*⎔┄┄─ ⊱╎⌯ ℹ️ ⌯╎⊰─┄┄⎔*
*┋ لا تـوجـد جـلـسـة نـشـطـة*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
            }
        }

        if (!text) {
            await react("🤖");
            return reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 🤖 جـيـمـنـاي الـذكاء الاصطناعي*
*╰─━━━━━━━━━━━━━━━━━━─╯*

*📝 اسأل أي سؤال واحصل على إجابة فورية*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.جيمناي ما هي عاصمة مصر؟*
📌 *.جيمناي اشرح لي الذكاء الاصطناعي*

*💡 يـحـافـظ عـلـى الـسـيـاق فـي الـمـحـادثـة*
*💡 اسـتـخـدم .جيمناي مسح لمسح السياق*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("🎯");

        try {
            const userId = message.key.participant || message.key.remoteJid;
            let sessionId = sessions.get(userId) || null;

            // ✅ جاري التفكير
            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري الـتـفـكـيـر...*
${sessionId ? '*┋ يـحـافـظ عـلـى سـيـاق الـمـحـادثـة* 🔄' : ''}
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            const result = await chatWithGemini(text, sessionId);

            if (result?.reply) {
                // ✅ حفظ الجلسة
                if (result.sessionId) {
                    sessions.set(userId, result.sessionId);
                }

                await react("✅");

                // ✅ قص النص لو طويل
                let finalText = result.reply;
                if (finalText.length > 4000) {
                    finalText = finalText.substring(0, 4000) + '\n\n... (تم اقتطاع النص لطول كبير)';
                }

                const finalMsg = `*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 🎯 إجـابـة جـيـمـنـاي 🎯*
*╰─━━━━━━━━━━━━━━━━━━─╯*

${finalText}

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                await reply(finalMsg);

            } else {
                throw new Error('لم يتم العثور على رد');
            }

        } catch (error) {
            console.error("❌ Gemini Error:", error.message);
            await react("❌");

            await reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ ❌ خـطـأ فـي الاتصال ❌*
*╰─━━━━━━━━━━━━━━━━━━━╯*

⚠️ *${error.message || 'الخادم مشغول حالياً'}*
📝 *حاول مرة أخرى بعد قليل*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};