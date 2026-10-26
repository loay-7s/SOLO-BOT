export default {
    name: "متابعة",
    aliases: ["فولو", "متابعه"],
    category: "sub",
    developer: true,
    description: "جعل جميع البوتات الفرعية تتابع قناة SOLO",

    async run({ m, bot, reply }) {
        try {
            const sub = global.subBots;

            if (!sub) {
                return reply(
                    "❌ نـظـام الـبـوتـات الـفـرعـيـة غـيـر مـتـاح حـالـيـاً"
                );
            }

            const channelUrl =
                "https://whatsapp.com/channel/0029VbCEhNX7DAWrudaFBs41";

            const urlParts =
                channelUrl.trim().split("/");

            const channelInvite =
                urlParts[urlParts.length - 1];

            if (!channelInvite) {
                return reply(
                    "❌ لـم يـتـم تـحـديـد رابـط الـقـنـاة"
                );
            }

            let channelJid;

            try {
                const metadata =
                    await bot.sock.newsletterMetadata(
                        "invite",
                        channelInvite
                    );

                channelJid = metadata?.id;

                if (!channelJid) {
                    throw new Error(
                        "Channel ID not found"
                    );
                }
            } catch (error) {
                console.error(
                    "❌ Channel metadata error:",
                    error?.message || error
                );

                return reply(
                    `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                    `*❌ مـش قـادر أوصـل لـقـنـاة SOLO*\n` +
                    `*───━━━⊱  ⚠️  ⊰━━━───*\n` +
                    `*${error?.message || "Unknown error"}*\n\n` +
                    `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
                );
            }

            const bots = sub
                .list()
                .filter(
                    item =>
                        item?.connected &&
                        item?.phone &&
                        item.id !== bot.id
                );

            if (!bots.length) {
                return reply(
                    `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                    `*❌ مـافـيـش بـوتـات فـرعـيـة مـتـصـلـة حـالـيـاً*\n` +
                    `*───━━━⊱  ⚠️  ⊰━━━───*\n` +
                    `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
                );
            }

            let loadingMessage = null;

            try {
                loadingMessage =
                    await bot.sock.sendMessage(
                        m.key.remoteJid,
                        {
                            text:
                                `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                                `*📢 جـاري مـتـابـعـة قـنـاة SOLO...*\n` +
                                `*───━━━⊱  ⏳  ⊰━━━───*\n\n` +
                                `*🤖 الـبـوتـات الـفـرعـيـة:* ${bots.length}\n\n` +
                                `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
                        },
                        {
                            quoted: m
                        }
                    );
            } catch {}

            const followed = [];
            const failed = [];

            for (const item of bots) {
                try {
                    const subBot =
                        sub.get(item.id);

                    if (
                        !subBot?.sock ||
                        !subBot.connected
                    ) {
                        failed.push(item.id);
                        continue;
                    }

                    await subBot.sock.newsletterFollow(
                        channelJid
                    );

                    followed.push(item.id);

                    await new Promise(
                        resolve =>
                            setTimeout(resolve, 500)
                    );
                } catch (error) {
                    failed.push(item.id);

                    console.error(
                        `❌ [SOLO BOT ${item.id}] Follow error:`,
                        error?.message || error
                    );
                }
            }

            const resultText =
                `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                `*📢 مـتـابـعـة قـنـاة SOLO*\n` +
                `*───━━━⊱  📊  ⊰━━━───*\n\n` +
                `*🤖 إجـمـالـي الـبـوتـات:* ${bots.length}\n` +
                `*✅ تـمـت الـمـتـابـعـة:* ${followed.length}\n` +
                `*❌ فـشـل:* ${failed.length}\n\n` +
                `*🔗 الـقـنـاة:*\n` +
                `${channelUrl}\n\n` +
                `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

            if (loadingMessage?.key) {
                try {
                    await bot.sock.sendMessage(
                        m.key.remoteJid,
                        {
                            text: resultText,
                            edit: loadingMessage.key
                        }
                    );
                    return;
                } catch {}
            }

            return reply(resultText);
        } catch (error) {
            console.error(
                "❌ متابعة:",
                error?.message || error
            );

            return reply(
                `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n` +
                `*❌ حـدث خـطـأ أثـنـاء مـتـابـعـة الـقـنـاة*\n` +
                `*───━━━⊱  ⚠️  ⊰━━━───*\n` +
                `*${error?.message || error}*\n\n` +
                `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`
            );
        }
    }
};