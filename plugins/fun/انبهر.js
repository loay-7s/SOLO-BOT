// plugins/انبهر.js
// 🔥 SOLO ADMIRATION COMMAND 🔥

export default {
    name: "انبهر",
    aliases: ["انبهار", "امدح", "هلهل"],
    category: "خاص",
    description: "إرسال ردود احتفالية متتالية على رسالة 🔥",

    async run({ sock, message, reply, react }) {

        try {
            // التأكد أن الأمر معمول Reply على رسالة
            const contextInfo =
                message.message?.extendedTextMessage?.contextInfo;

            if (!contextInfo?.stanzaId) {
                await react("❌");

                return reply(
                    "*❌ يـجـب اسـتـخـدام الأمـر بـالـرد عـلـى رسـالـة.*"
                );
            }

            await react("🔥");

            const chatId = message.key.remoteJid;

            // الرسالة الأصلية التي تم الرد عليها
            const quotedMessage = {
                key: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant
                },
                message: contextInfo.quotedMessage
            };

            // 🔥 رسائل الانبهار
            const admirationMessages = [
                "*اووووووف🔥*",
                "*ديييييييييم💥*",
                "*اويلييييييي🙂‍↕️🙂‍↔️*",
                "*جمداااااااااان😔🖐🏻*",
                "*سوبر ماااااان🫦🫵🏻*"
            ];

            // ⏳ الانتظار
            const wait = (ms) =>
                new Promise(resolve => setTimeout(resolve, ms));

            // إرسال الرسائل الخمس على نفس الرسالة الأصلية
            for (let i = 0; i < admirationMessages.length; i++) {

                await sock.sendMessage(
                    chatId,
                    {
                        text: admirationMessages[i]
                    },
                    {
                        quoted: quotedMessage
                    }
                );

                // مهلة ¾ ثانية بين كل رسالة
                if (i < admirationMessages.length - 1) {
                    await wait(850);
                }
            }

        } catch (error) {

            console.error("❌ Admiration Error:", error);

            try {
                await react("❌");
            } catch {}

            return reply(
                `*❌ حـدث خـطـأ أثـنـاء تـنـفـيـذ الأمـر*\n📌 ${error.message}`
            );
        }
    }
};