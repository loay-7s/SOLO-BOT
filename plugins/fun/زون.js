const DROP_ZONE_URL =
    "https://koderguru.github.io/dropzone-game/";

export default {
    name: "زون",

    aliases: [
        "zone",
        "dropzone",
        "دروبزون"
    ],

    category: "games",

    description: "لعبة Drop Zone - Zombie Survival",

    usage: [
        ".زون"
    ],

    async run({ sock, m }) {
        const chatId = m.key.remoteJid;

        const text = `╭〔 🧟 𝐒𝐎𝐋𝐎 𝐃𝐑𝐎𝐏 𝐙𝐎𝐍𝐄 〕╮
┃
┃ 🔥 *ZOMBIE SURVIVAL*
┃
┃ 🧟 موجات من الزومبي
┃ 🔫 قاتل واصمد لأطول وقت
┃ 🏆 ارفع الـScore
┃ 🌍 العب Single Player
┃ 👥 أو جرّب الـMultiplayer

┣━━━━━━━━━━━━━━━━━┫
┃
┃ 👇 اضغط الرابط وابدأ اللعب
┃ 
> *🎮 ${DROP_ZONE_URL}*
┃
╰━━━━〔 𝐒𝐎𝐋𝐎 〕━━━╯`;

        await sock.sendMessage(
            chatId,
            {
                text
            },
            {
                quoted: m
            }
        );
    }
};