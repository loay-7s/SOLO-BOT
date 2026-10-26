// plugins/كيوت.js
// 🎀 SOLO CUTE TEASER ⚔️

export default {
    name: "كيوت",
    aliases: ["كياتة", "لطيف"],
    category: "fun",
    group: true,

    async run({ sock, m }) {
        const chatId = m.key.remoteJid;

        // 1. قائمة ريأكتات الكياتة
        const reacts = ["🎀", "🥹", "✨", "🧸", "🌸"];
        const randomReact = reacts[Math.floor(Math.random() * reacts.length)];
        await sock.sendMessage(chatId, { react: { text: randomReact, key: m.key } });

        try {
            // 2. سحب قائمة الاعضاء
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;

            // 3. اختيار ضحية عشوائية
            const randomUser = participants[Math.floor(Math.random() * participants.length)];
            const jid = randomUser.id;
            const name = jid.split('@')[0];

            // 4. بنك جمل الكياتة — بدون @name جوّه النص
            const cuteMessages = [
                `انت هو قمة الكياتة في الجروب ده 🥹🎀✨`,
                `اثبتّ مكانك انت الطف واحد شفته النهاردة 🧸🌸`,
                `يا ناس شوفوا بجد سكر وكيوت بزيادة 🍭✨`,
                `الجروب ده منور بوجود كائن لطيف زيك 💖🎀`,
                `خف كياتة شوية مش مستحملين الرقة دي 🥹✨`,
                `انت عبارة عن قطعة سكر ماشية على الارض 🍬🎀`,
                `انت الكيوت الرسمي للجروب ده 🎀✨`,
                `يا ناس ده كيوت بدرجة غير قانونية 🥹🌸`,
                `انت الطف كائن في الكون كله 🍭🎀`,
                `انت حاجة كيوت خالص خالص 🧸💖`,
                `انت بتفكرني بالحلويات والكيك 🍰🎀`,
                `انت الكيوت اللي كلنا محتاجينه 🥹✨`,
                `انت زي القطة الصغيرة كده 🐱🌸`,
                `انت الكيوت بجد 🧸🥹`,
                `انت الكيوت اللي مفيش زيه في العالم 💖🎀`,
                `انت بتحسسنا بالدفء والرقة 🥹✨`,
                `انت الطف حاجة حصلت في الجروب ده 🧸🎀`,
                `انت زي الفراولة الحلوة كده 🍓✨`,
                `انت الكيوت المثالي لكل الجروبات 🌟💖`,
                `انت كيوت لدرجة تحبس الانفاس 🥹🎀`,
                `انت اللي بتعطينا طاقة حلوة في الجروب ✨🎀`,
                `انت الطف ضحكة في الجروب ده 💖🥹`,
                `انت الكيوت اللي ربنا خلقه مخصوص لنا 🎀💖`
            ];

            const randomText = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];

            // 5. الإرسال — نفس شكل شاذ وزنجي بالضبط
            await sock.sendMessage(chatId, {
                text: `*☜@${name}  ${randomText}*`,
                mentions: [jid]
            }, { quoted: m });

        } catch (e) {
            console.error("Error in Cute Command:", e);
        }
    }
};