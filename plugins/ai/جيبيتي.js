// plugins/جيبيتي.js
// ⚔️ SOLO AI GPT-5.5 ⚔️

import axios from 'axios';

const API = 'https://engez.a7a.online/api/v1/ai/gpt';
const TIMEOUT = 120000;

async function askAI(question) {
    const { data } = await axios.get(API, {
        params: { q: question },
        timeout: TIMEOUT
    });

    if (!data?.success || !data?.response?.success) {
        throw new Error(data?.error || data?.response?.error || 'فشل الحصول على الرد');
    }

    return data.response;
}

export default {
    name: "جيبيتي",
    aliases: ["gpt", "chatgpt", "سؤال", "ai"],
    description: "الذكاء الاصطناعي GPT-5.5 للإجابة على أسئلتك",
    category: "tools",
    developer: false,
    group: false,
    private: false,

    async run({ message, sock, reply, react, args }) {
        const text = args.join(" ");

        if (!text) {
            await react("🤖");
            return reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 🤖 GPT-5.5 الـذكاء الاصطناعي*
*╰─━━━━━━━━━━━━━━━━━━─╯*

*📝 اسأل أي سؤال واحصل على إجابة فورية*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.جيبيتي ما هي عاصمة مصر؟*
📌 *.جيبيتي اشرح لي الذكاء الاصطناعي*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("🎯");

        try {
            // ✅ جاري التفكير
            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري الـتـفـكـيـر...*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            // ✅ استدعاء الـ API
            const res = await askAI(text);
            let answer = res?.result?.message || res?.raw || 'لا يوجد رد.';

            // ✅ تنظيف النص
            answer = answer.replace(/```/g, '').replace(/\*\*/g, '');

            await react("✅");

            // ✅ قص النص لو طويل
            let finalText = answer.trim();
            if (finalText.length > 10000) {
                finalText = finalText.substring(0, 10000) + '\n\n... (تم اقتطاع النص لطول كبير)';
            }

            const finalMsg = `*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ 🎯 إجـابـة GPT-5.5 🎯*
*╰─━━━━━━━━━━━━━━━━━━─╯*

${finalText}

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await reply(finalMsg);

        } catch (error) {
            console.error("❌ GPT Error:", error.message);
            await react("❌");

            const errorMsg = error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'حدث خطأ غير معروف';

            await reply(`*╭─━━━━━━━━━━━━━━━━━━─╮*
*│ ❌ خـطـأ فـي الاتصال ❌*
*╰─━━━━━━━━━━━━━━━━━━━╯*

⚠️ *${errorMsg}*
📝 *حاول مرة أخرى بعد قليل*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};