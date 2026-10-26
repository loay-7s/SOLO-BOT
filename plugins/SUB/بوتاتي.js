export default {
    name: "بوتاتي",
    aliases: ["subbots", "mybots"],
    category: "developer",
    developer: true,
    description: "عرض البوتات الفرعية وحالتها",

    async run({ m, reply }) {
        try {
            const manager = global.subBots;

            if (!manager) {
                return reply(
                    `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                    `*❌ مـديـر الـبـوتـات الـفـرعـيـة غـيـر مـتـاح حـالـيـاً*\n` +
                    `*───━━━⊱  ⚠️  ⊰━━━───*\n` +
                    `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
                );
            }

            const bots = manager.list();

            if (!bots.length) {
                return reply(
                    `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                    `*🤖 لا يـوجـد أي بـوت فـرعـي مـثـبـت حـالـيـاً*\n` +
                    `*───━━━⊱  🏮  ⊰━━━───*\n` +
                    `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
                );
            }

            const stats = manager.stats();

            let text =
                `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                `*🤖 بـوتـات سـولـو الـفـرعـيـة*\n` +
                `*───━━━⊱  🏮  ⊰━━━───*\n\n`;

            for (const bot of bots) {
                const status = bot.connected
                    ? '*🟢 مـتـصـل*'
                    : '*🔴 غـيـر مـتـصـل*';

                text +=
                    `*╭───⊷「 ${bot.name} 」*\n` +
                    `*│ 🆔 الـID:* ${bot.id}\n` +
                    `*│ 📱 الـرقـم:* ${bot.phone || 'غير معروف'}\n` +
                    `*│ 📡 الـحـالـة:* ${status}\n` +
                    `*│ 💬 الـرسـائـل:* ${bot.messages || 0}\n` +
                    `*╰───⊷*\n\n`;
            }

            text +=
                `*╭───⊷「 📊 الإحـصـائـيـات 」*\n` +
                `*│ 🤖 الـمـجـمـوع:* ${stats.total}\n` +
                `*│ 🟢 مـتـصـل:* ${stats.connected}\n` +
                `*│ 🔴 غـيـر مـتـصـل:* ${stats.disconnected}\n` +
                `*│ 💬 إجـمـالـي الـرسـائـل:* ${stats.totalMessages}\n` +
                `*╰───⊷*\n\n` +
                `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

            return reply(text);
        } catch (error) {
            console.error("❌ بوتاتي:", error);

            return reply(
                `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                `*❌ حـدث خـطـأ أثـنـاء جـلـب بـيـانـات الـبـوتـات*\n` +
                `*───━━━⊱  ⚠️  ⊰━━━───*\n` +
                `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
            );
        }
    }
};