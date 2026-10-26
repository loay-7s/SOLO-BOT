import fs from "fs";

export default {
    name: "ريستارت",
    aliases: ["restart", "ريست", "رستارت"],
    description: "إعادة تشغيل البوت بالكامل",
    category: "developer",
    developer: true,

    async run({ bot, sock, m, isGroup, userJid, reply, react }) {
        const chatId = m.key.remoteJid;

        if (!isGroup) {
            return reply("*❌ هـذا الأمـر يـعـمـل فـي الـمـجـمـوعـات فـقـط*");
        }

        try {
            await react("📴");

            const restartMessage = `*𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 𝑰𝑺 𝑹𝑬𝑺𝑻𝑨𝑹𝑻𝑰𝑵𝑮 🔃*`;

            await sock.sendMessage(
                chatId,
                {
                    video: fs.readFileSync("./media/restart.mp4"),  // 👈 غير الامتداد
                    gifPlayback: true,
                    caption: restartMessage,
                    mentions: [userJid]
                },
                { quoted: m }
            );

            setTimeout(async () => {
                try {
                    await bot.restart();
                } catch (error) {
                    console.error("❌ Restart Error:", error);
                }
            }, 1000);

        } catch (error) {
            console.error("❌ Restart Plugin Error:", error);

            try {
                await reply("*❌ حـدث خـطـأ أثـنـاء تـجـهـيـز إعـادة تـشـغـيـل الـبـوت.*");
            } catch {}
        }
    }
};