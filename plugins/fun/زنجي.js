// plugins/زنجي.js
// 🎲 SOLO ZANGY TEASER ⚔️

export default {
    name: "زنجي",
    aliases: ["الزنجي"],
    category: "fun",
    group: true,

    async run({ sock, m }) {
        const chatId = m.key.remoteJid;
await sock.sendMessage(chatId, { react: { text: "👶🏿", key: m.key } });
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];

            if (participants.length === 0) {
                return sock.sendMessage(chatId, {
                    text: "*⚠️ لـم أجـد أعـضـاء فـي الـمـجـمـوعـة*"
                }, { quoted: m });
            }

            const randomUser = participants[Math.floor(Math.random() * participants.length)];
            const jid = randomUser.id;
            const name = jid.split('@')[0];

            // ═══════════════════════════════════════════════════════
            // 💬 الرسائل — بدون * على @name
            // ═══════════════════════════════════════════════════════
            const messages = [
                `انـت هـو اكـبـر زنـجـي 👶🏿`,
                `يـا زنـجـي الـجـروب كـلـه 🍌`,
                `مـحـدش زنـجـي قـدك يـا أسـطـورة 🐒`,
                `الـزنـجـي الأسـود فـي الـجـروب 👑🌚`,
                `مـلـك الـزنـوج بـنـفـسـه 🤴🏿`,
                `اكـبـر زنـجـي فـي الـتـاريـخ 👶🏿`,
                `ده انـت لـو دافـع فـلـوس عـشـان تـكـون زنـجـي مـسـتـحـيـل الـنـتـيـجـة تـطـلـع مـتـقـنـة كده ❕`,
                `مـنـوࢪ يـا زنـجـي الـلـيـل 🎩`,
                `زنـجـي و مـفـتـخـࢪ 🍫`,
                `اهـو الـعـبـد الـقـوي 💪🏿`,
                `اكـبـر زنـجـي فـي الـكـون 🌍`,
                `يـا جـوكـر الـزنـوج يـا فـاجـࢪ 🃏`,
                `زنـجـي الـجـࢪوب يـتـصـل بـكـم 👶🏿`,
                `الـزنـجـي الـمـحـتـرم 👴🏿`,
                `زنـجـي بـس نـيـنـجـا 🥷🏿`,
                `شـخـصـيـة الـزنـجـي الأولـى 🎭`,
                `اكـبـر زنـجـي فـي الـشـرق الأوسـط 🌍`,
                `مـدࢪسـة الـزنـوج الـدولـيـة 😎`,
                `يـا شـيـخ الـزنـوج مـحـتـاجـيـن طـࢪيـقـة نـنـهـي بـيـهـا نـسـلـك 👴🏿`,
                `زنـجـي بـس بـنـحـبـه ❤️`,
                `الـزنـجـي الـهـلـفـوت الـلـي لـو حـد شـافـه يـمـوت 👶🏿`,
                `هـتـفـضـل طـول عـمـࢪك اسـود 👶🏿؟`,
                `زنـجـي الـجـروب الـهـلـفـوت 👶🏿`,
                `يـا نـجـم الـزنـوج الأول 👶🏿`,
                `أسـطـورة الـزنـوج الـدولـي 📜`,
                `الـزنـجـي الـلـي مـحـدش شـايـفـه عـشـان الـدنـيـا ضـلـمـة 👶🏿`,
                `يـا بـطـل الـزنـوج الـحـقـيـقـي 👶🏿`
            ];

            const randomMessage = messages[Math.floor(Math.random() * messages.length)];

            // ═══════════════════════════════════════════════════════
            // 📤 إرسال
            //   الـشـكـل الـمـطـلـوب:
            //   *☜@name  نص الرسالة*
            // ═══════════════════════════════════════════════════════
            await sock.sendMessage(chatId, {
                text: `*☜@${name}  ${randomMessage}*`,
                mentions: [jid]
            }, { quoted: m });

        } catch (error) {
            console.error("❌ زنجي Error:", error);
            await sock.sendMessage(chatId, {
                text: `*❌ فـشـل الأمـر*\n📌 ${error.message}`
            }, { quoted: m });
        }
    }
};