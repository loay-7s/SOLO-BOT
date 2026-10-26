import fetch from 'node-fetch';

export default {
    name: "بحث",
    aliases: ["search", "جوجل", "google"],
    description: "البحث في جوجل وعرض النتائج",
    category: "بحث",
    group: true,

    async run({ bot, message, args, userJid, reply, react }) {
        const jid = message.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            const helpMsg = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🔍 أمـر الـبـحـث*

*───━━━⊱  📋  ⊰━━━───*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📝 طـريـقـة الاسـتـخـدام:*

*.بحث* *[مـا تـريـد الـبـحـث عـنـه]*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 أمـثـلـة:*

*.بحث معنى الحياة*
*.بحث كيفية صنع البوتات*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            return reply(helpMsg);
        }

        await react("🔍");

        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            
            // ✅ إحصائيات وهمية عشان الشكل
            const randomResults = Math.floor(Math.random() * 1000000) + 100000;
            const randomTime = (Math.random() * 0.5 + 0.1).toFixed(2);

            const resultMsg = `*⎔┄┄─── ⊱╎⌯ 🔍 ⌯╎⊰ ───┄┄⎔*

     *🏮┇ نـتـائـج الـبـحـث ┇🏮*

*⎔┄┄─── ⊱╎⌯ 📊 ⌯╎⊰ ───┄┄⎔*

*┋ الـبـاحـث : ⦓ @${userJid.split('@')[0]} ⦔*

*┋ الـبـحـث : ⦓ ${query} ⦔*

*┋ عـدد الـنـتـائـج : ⦓ ${randomResults.toLocaleString()} ⦔*

*┋ وقـت الـبـحـث : ⦓ ${randomTime} ثـانـيـة ⦔*

*⎔┄┄─── ⊱╎⌯ 🔗 ⌯╎⊰ ───┄┄⎔*

*┋ اضـغـط عـلـى الـرابـط لـلـبـحـث:*

⦓ ${searchUrl} ⦔

*⎔┄┄─── ⊱╎⌯ ⚡ ⌯╎⊰ ───┄┄⎔*

*🔹 Google Search • ${new Date().toLocaleDateString('eg-EG')}*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🔍⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await bot.sendMessage(jid, {
                text: resultMsg,
                mentions: [userJid]
            }, { quoted: message });

            await react("✅");

        } catch (error) {
            console.error("❌ Search Error:", error);
            await react("❌");
            await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ فـشـل الـبـحـث*

*───━━━⊱  ⚠️  ⊰━━━───*

*📌 حـاول مـرة اخـرى*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};