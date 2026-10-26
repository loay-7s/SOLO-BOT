export default {
    name: "بث",
    aliases: ["اذاعة", "broadcast", "بث_رسمي"],
    description: "بث رسالة لمجموعة محددة",
    developer: true,

    async run({ sock, m, reply, text, args, command, handler }) {
        const chatId = m.key.remoteJid;

        if (!text || args.length < 2) {
            return reply(`
*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
     *⌬ نـظـام الـبـث عـن بـعـد ⌬*
*───━━━⊱  📡  ⊰━━━───*

*⌠📜⌡ طريقة الاستخدام:*
*┌────────────────*
*│ .بث + ايدي المجموعة + الرسالة*
*└────────────────*

*⌠💡⌡ مثال:*
*┌────────────────*
*│ .بث 123456789@g.us مرحباً*
*└────────────────*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`);
        }

        try {
            let groupId = args[0];

            if (!groupId.includes("@g.us")) {
                groupId = `${groupId}@g.us`;
            }

            const message = args.slice(1).join(" ");

            await sock.sendMessage(
                chatId,
                {
                    react: {
                        text: "📡",
                        key: m.key
                    }
                }
            );

            // التحقق من وجود المجموعة
            await sock.groupMetadata(groupId);

            const isOfficial =
                command === "بث_رسمي" ||
                command === "broadcast_official";

            /*
             * تنفيذ الأوامر بنفس آلية اذاعة:
             * الأمر ينفذ داخل المجموعة المحددة،
             * لكن صاحب الأمر الأصلي يظل هو الـ participant.
             */
            if (
                message.trim().startsWith(".") &&
                ![".بث", ".اذاعة", ".اذاعه", ".نشر"].includes(
                    message.trim().split(/\s+/)[0].toLowerCase()
                )
            ) {
                const sentMessage =
                    await sock.sendMessage(
                        groupId,
                        {
                            text: message
                        }
                    );

                const originalSender =
                    m?.key?.participant ||
                    m?.key?.remoteJid;

                const syntheticMessage = {
                    key: {
                        remoteJid: groupId,
                        id:
                            sentMessage?.key?.id ||
                            `SOLO_BROADCAST_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                        fromMe: false,
                        participant: originalSender
                    },

                    message: {
                        extendedTextMessage: {
                            text: message,
                            contextInfo: {
                                stanzaId:
                                    sentMessage?.key?.id,
                                participant:
                                    originalSender
                            }
                        }
                    },

                    messageTimestamp:
                        Math.floor(
                            Date.now() / 1000
                        ),

                    pushName: m?.pushName || "SOLO",
                    broadcast: false,
                    status: 1
                };

                await handler.handleMessage(
                    syntheticMessage
                );

                return;
            }

            if (isOfficial) {
                // بث رسمي مع استمارة
                await sock.sendMessage(groupId, {
                    text: `
*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
     *⌬ بـث رسـمـي مـن الـمـطـور ⌬*
*───━━━⊱  📢  ⊰━━━───*

*⌠📨⌡ الـرسـالـة:*
*┌────────────────*
*│ ${message}*
*└────────────────*

*👤 الـمـرسـل : ⦓ @${chatId.split("@")[0]} ⦔*
*📅 الـتـاريـخ : ⦓ ${new Date().toLocaleDateString("ar-EG")} ⦔*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`,
                    mentions: [chatId]
                });

            } else {
                // بث عادي: الرسالة حرفياً بدون إضافات
                await sock.sendMessage(groupId, {
                    text: message
                });
            }

        } catch (error) {
            console.error(
                "Broadcast Error:",
                error?.stack ||
                error?.message ||
                error
            );

            await reply(
                `*❌ فشل البث:* المجموعة غير موجودة أو البوت خارجها`
            );
        }
    }
};