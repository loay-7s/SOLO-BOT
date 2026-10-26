import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
    name: "اذاعة",
    aliases: ["اذاعه", "نشر"],
    category: "developer",
    developer: true,
    description: "إذاعة رسالة إلى جروبات البوتات الفرعية مع دعم الإرسال للأدمن فقط",

    async run({ m, reply, args }) {
        try {
            const manager = global.subBots;

            if (!manager) {
                return reply(
                    `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                    `*╭───⊷ ❌ خـطـأ*\n` +
                    `*┋*\n` +
                    `*┋ مـديـر الـبـوتـات الـفـرعـيـة غـيـر مـتـاح حـالـيـاً ┋*\n` +
                    `*┋*\n` +
                    `*╰───⊷*\n\n` +
                    `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
                );
            }

            const rawArgs = Array.isArray(args)
                ? [...args].map(String)
                : String(args || "").trim().split(/\s+/).filter(Boolean);

            let targetBotId = null;
            let adminOnly = false;

            if (
                rawArgs.length &&
                String(rawArgs[0]).toLowerCase() === "ادمن"
            ) {
                adminOnly = true;
                rawArgs.shift();
            }

            if (
                rawArgs.length &&
                /^\d+$/.test(String(rawArgs[0]))
            ) {
                targetBotId = String(rawArgs.shift());
            }

            const contextInfo =
                m?.message?.extendedTextMessage?.contextInfo ||
                m?.message?.imageMessage?.contextInfo ||
                m?.message?.videoMessage?.contextInfo ||
                m?.message?.documentMessage?.contextInfo ||
                m?.message?.audioMessage?.contextInfo ||
                m?.message?.stickerMessage?.contextInfo ||
                m?.message?.viewOnceMessage?.message?.imageMessage?.contextInfo ||
                m?.message?.viewOnceMessageV2?.message?.imageMessage?.contextInfo ||
                m?.message?.viewOnceMessage?.message?.videoMessage?.contextInfo ||
                m?.message?.viewOnceMessageV2?.message?.videoMessage?.contextInfo ||
                m?.message?.viewOnceMessage?.message?.audioMessage?.contextInfo ||
                m?.message?.viewOnceMessageV2?.message?.audioMessage?.contextInfo ||
                m?.message?.viewOnceMessage?.message?.documentMessage?.contextInfo ||
                m?.message?.viewOnceMessageV2?.message?.documentMessage?.contextInfo;

            const quotedMessage = contextInfo?.quotedMessage;

            let preparedMessage = null;
            let commandText = null;

            if (quotedMessage) {
                preparedMessage = await prepareBroadcastMessage(
                    unwrapMessage(quotedMessage)
                );

                if (!preparedMessage) {
                    return reply(
                        `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                        `*╭───⊷ ❌ نـوع الـرسـالـة غـيـر مـدعـوم*\n` +
                        `*┋*\n` +
                        `*┋ الـمـدعـوم : نـص • صـورة • فـيـديـو*\n` +
                        `*┋ صـوت • مـسـتـنـد • سـتـيـكـر*\n` +
                        `*┋*\n` +
                        `*╰───⊷*\n\n` +
                        `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
                    );
                }

                if (preparedMessage.type === "text") {
                    commandText =
                        preparedMessage.text?.trim() || null;
                }
            } else {
                const text =
                    rawArgs.join(" ").trim();

                if (!text) {
                    return reply(
                        `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                        `*╭───⊷ 📢 أوامـر الإذاعـة*\n` +
                        `*┋*\n` +
                        `*┋ ⬡ .اذاعة*\n` +
                        `*┋ ⬡ .اذاعة 1*\n` +
                        `*┋ ⬡ .اذاعة ادمن*\n` +
                        `*┋ ⬡ .اذاعة ادمن 1*\n` +
                        `*┋*\n` +
                        `*┋ ⬡ .اذاعة .تست*\n` +
                        `*┋ ⬡ .اذاعة 1 .تست*\n` +
                        `*┋ ⬡ .اذاعة ادمن .تست*\n` +
                        `*┋ ⬡ .اذاعة ادمن 1 .تست*\n` +
                        `*┋*\n` +
                        `*╰───⊷*\n\n` +
                        `*📌 ادمن = الإرسال للجروبات التي البوت فيها Admin فقط*\n\n` +
                        `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
                    );
                }

                preparedMessage = {
                    type: "text",
                    text
                };

                commandText = text;
            }

            let bots = manager
                .list()
                .filter(
                    bot =>
                        bot?.connected &&
                        bot?.sock
                );

            if (targetBotId !== null) {
                bots = bots.filter(
                    bot =>
                        String(bot.id) === targetBotId
                );

                if (!bots.length) {
                    return reply(
                        `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                        `*╭───⊷ ❌ الـبـوت غـيـر مـتـاح*\n` +
                        `*┋*\n` +
                        `*┋ البوت الفرعي رقم ${targetBotId} غير متصل أو غير موجود ┋*\n` +
                        `*┋*\n` +
                        `*╰───⊷*\n\n` +
                        `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
                    );
                }
            }

            if (!bots.length) {
                return reply(
                    `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                    `*╭───⊷ ❌ لا توجد بوتات*\n` +
                    `*┋*\n` +
                    `*┋ لا يوجد بوت فرعي متصل حاليًا ┋*\n` +
                    `*┋*\n` +
                    `*╰───⊷*\n\n` +
                    `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
                );
            }

            let groups = [];

            for (const bot of bots) {
                try {
                    const chats =
                        await bot.sock.groupFetchAllParticipating();

                    for (const group of Object.values(chats || {})) {
                        if (
                            !group?.id ||
                            !Array.isArray(group?.participants)
                        ) {
                            continue;
                        }

                        const participants =
                            group.participants
                                .filter(Boolean);

                        if (!participants.length) {
                            continue;
                        }

                        let botParticipant = null;

                        if (adminOnly) {
                            const realBot =
                                manager.get(
                                    String(bot.id)
                                );

                            const botPhones =
                                getBotPhoneCandidates(
                                    realBot || bot,
                                    bot.sock
                                );

                            for (
                                const participant
                                of participants
                            ) {
                                if (
                                    await isBotParticipant(
                                        bot.sock,
                                        realBot || bot,
                                        participant,
                                        botPhones
                                    )
                                ) {
                                    botParticipant =
                                        participant;
                                    break;
                                }
                            }

                            const botRole =
                                getAdminRole(
                                    botParticipant
                                );

                            const botIsAdmin =
                                botRole === "admin" ||
                                botRole === "superadmin";

                            if (!botIsAdmin) {
                                continue;
                            }
                        }

                        groups.push({
                            bot,
                            jid: group.id,
                            participants:
                                participants
                                    .map(
                                        participant =>
                                            participant?.id
                                    )
                                    .filter(Boolean)
                        });
                    }
                } catch (error) {
                    console.error(
                        `❌ [${bot.name}] Group fetch error:`,
                        error?.message || error
                    );
                }
            }

            if (!groups.length) {
                return reply(
                    `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                    `*╭───⊷ 📭 لا توجد جروبات مطابقة*\n` +
                    `*┋*\n` +
                    `*┋ لم يتم العثور على جروبات مناسبة لشروط الإذاعة ┋*\n` +
                    (adminOnly
                        ? `*┋ 🔐 الوضع : Admin فقط ┋*\n`
                        : "") +
                    `*┋*\n` +
                    `*╰───⊷*\n\n` +
                    `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
                );
            }

            let sent = 0;
            let failed = 0;
            let totalMentions = 0;
            let executedCommands = 0;
            let failedCommands = 0;

            const originalSender =
                m?.key?.participant ||
                m?.key?.remoteJid;

            for (const group of groups) {
                try {
                    const content =
                        buildGroupMessage(
                            preparedMessage,
                            group.participants
                        );

                    if (!content) {
                        failed++;
                        continue;
                    }

                    const sentMessage =
                        await group.bot.sock.sendMessage(
                            group.jid,
                            content
                        );

                    sent++;
                    totalMentions +=
                        group.participants.length;

                    if (
                        preparedMessage.type === "text" &&
                        isCommandText(commandText)
                    ) {
                        try {
                            const realBot =
                                manager.get(
                                    group.bot.id
                                );

                            if (!realBot) {
                                failedCommands++;
                                continue;
                            }

                            if (
                                !realBot.messagesSystem ||
                                typeof realBot.messagesSystem.handleMessage !== "function"
                            ) {
                                failedCommands++;
                                continue;
                            }

                            const syntheticMessage =
                                createCommandMessage(
                                    sentMessage,
                                    group.jid,
                                    commandText,
                                    originalSender
                                );

                            await realBot.messagesSystem.handleMessage(
                                syntheticMessage
                            );

                            executedCommands++;
                        } catch (commandError) {
                            failedCommands++;

                            console.error(
                                `❌ [${group.bot.name}] Broadcast command error:`,
                                commandError?.stack ||
                                commandError?.message ||
                                commandError
                            );
                        }
                    }

                    await wait(100);
                } catch (error) {
                    failed++;

                    console.error(
                        `❌ [${group.bot.name}] Broadcast error:`,
                        error?.message || error
                    );
                }
            }

            return reply(
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                `*╭━━━━━━━━━━━━━━━━━━━━━━╮*\n` +
                `*┃ 📢 تـقـريـر الإذاعـة ┃*\n` +
                `*╰━━━━━━━━━━━━━━━━━━━━━━╯*\n\n` +
                `*╭───⊷ ⚙️ الـوضـع*\n` +
                `*┋*\n` +
                `*┋ 🤖 البوتات : ${targetBotId !== null ? `البوت ${targetBotId}` : "جميع البوتات"}*\n` +
                `*┋ 🔐 النطاق : ${adminOnly ? "Admin فقط" : "جميع الجروبات"}*\n` +
                `*┋ 👥 الجروبات : ${groups.length}*\n` +
                `*┋ 👤 المنشنات : ${totalMentions}*\n` +
                `*┋*\n` +
                `*╰───⊷*\n\n` +
                `*╭───⊷ 📊 الـنـتـائـج*\n` +
                `*┋*\n` +
                `*┋ ✅ تم الإرسال : ${sent}*\n` +
                `*┋ ❌ فشل الإرسال : ${failed}*\n` +
                `*┋ ⚡ الأوامر المنفذة : ${executedCommands}*\n` +
                `*┋ ⚠️ فشل تنفيذ الأوامر : ${failedCommands}*\n` +
                `*┋*\n` +
                `*╰───⊷*\n\n` +
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n` +
                `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
            );
        } catch (error) {
            console.error(
                "❌ اذاعة:",
                error?.stack ||
                error?.message ||
                error
            );

            return reply(
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n` +
                `*╭───⊷ ❌ خـطـأ فـي الإذاعـة*\n` +
                `*┋*\n` +
                `*┋ ${error?.message || error}*\n` +
                `*┋*\n` +
                `*╰───⊷*\n\n` +
                `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*`
            );
        }
    }
};

function isCommandText(text) {
    if (
        !text ||
        typeof text !== "string"
    ) {
        return false;
    }

    const value =
        text.trim();

    if (!value.startsWith(".")) {
        return false;
    }

    const command =
        value
            .slice(1)
            .trim()
            .split(/\s+/)[0]
            .toLowerCase();

    const broadcastCommands = [
        "اذاعة",
        "اذاعه",
        "نشر"
    ];

    return !broadcastCommands.includes(
        command
    );
}

function createCommandMessage(
    sentMessage,
    groupJid,
    commandText,
    originalSender
) {
    const key =
        sentMessage?.key || {};

    return {
        key: {
            remoteJid: groupJid,
            id:
                key.id ||
                `SOLO_BROADCAST_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            fromMe: false,
            participant: originalSender
        },
        message: {
            extendedTextMessage: {
                text: commandText,
                contextInfo: {
                    stanzaId: key.id,
                    participant: originalSender
                }
            }
        },
        messageTimestamp:
            Math.floor(
                Date.now() / 1000
            ),
        pushName: "SOLO",
        broadcast: false,
        status: 1
    };
}

function unwrapMessage(message) {
    if (
        !message ||
        typeof message !== "object"
    ) {
        return null;
    }

    if (
        message.ephemeralMessage?.message
    ) {
        return unwrapMessage(
            message.ephemeralMessage.message
        );
    }

    if (
        message.viewOnceMessage?.message
    ) {
        return unwrapMessage(
            message.viewOnceMessage.message
        );
    }

    if (
        message.viewOnceMessageV2?.message
    ) {
        return unwrapMessage(
            message.viewOnceMessageV2.message
        );
    }

    if (
        message.viewOnceMessageV2Extension?.message
    ) {
        return unwrapMessage(
            message.viewOnceMessageV2Extension.message
        );
    }

    return message;
}

async function prepareBroadcastMessage(
    message
) {
    if (
        !message ||
        typeof message !== "object"
    ) {
        return null;
    }

    if (
        typeof message.conversation ===
        "string"
    ) {
        return {
            type: "text",
            text: message.conversation
        };
    }

    if (message.extendedTextMessage) {
        return {
            type: "text",
            text:
                message.extendedTextMessage.text ||
                ""
        };
    }

    const mediaTypes = [
        ["imageMessage", "image"],
        ["videoMessage", "video"],
        ["audioMessage", "audio"],
        ["documentMessage", "document"],
        ["stickerMessage", "sticker"]
    ];

    for (
        const [
            messageType,
            downloadType
        ] of mediaTypes
    ) {
        const media =
            message[messageType];

        if (!media) {
            continue;
        }

        try {
            const stream =
                await downloadContentFromMessage(
                    media,
                    downloadType
                );

            const chunks = [];

            for await (
                const chunk of stream
            ) {
                chunks.push(chunk);
            }

            const buffer =
                Buffer.concat(chunks);

            if (!buffer.length) {
                return null;
            }

            return {
                type: messageType,
                buffer,
                mimetype:
                    media.mimetype,
                caption:
                    media.caption,
                fileName:
                    media.fileName,
                ptt:
                    media.ptt,
                gifPlayback:
                    media.gifPlayback
            };
        } catch (error) {
            console.error(
                `❌ Media preparation error [${messageType}]:`,
                error?.message || error
            );

            return null;
        }
    }

    return null;
}

function buildGroupMessage(
    message,
    participants
) {
    const mentionedJid = [
        ...new Set(
            (participants || [])
                .filter(Boolean)
        )
    ];

    const contextInfo = {
        mentionedJid
    };

    if (
        message.type === "text"
    ) {
        return {
            text: message.text,
            contextInfo
        };
    }

    if (
        message.type ===
        "imageMessage"
    ) {
        return {
            image: message.buffer,
            mimetype:
                message.mimetype ||
                "image/jpeg",
            caption:
                message.caption ||
                undefined,
            contextInfo
        };
    }

    if (
        message.type ===
        "videoMessage"
    ) {
        return {
            video: message.buffer,
            mimetype:
                message.mimetype ||
                "video/mp4",
            caption:
                message.caption ||
                undefined,
            gifPlayback:
                Boolean(
                    message.gifPlayback
                ),
            contextInfo
        };
    }

    if (
        message.type ===
        "audioMessage"
    ) {
        return {
            audio: message.buffer,
            mimetype:
                message.mimetype ||
                "audio/ogg; codecs=opus",
            ptt:
                Boolean(message.ptt),
            contextInfo
        };
    }

    if (
        message.type ===
        "documentMessage"
    ) {
        return {
            document: message.buffer,
            mimetype:
                message.mimetype ||
                "application/octet-stream",
            fileName:
                message.fileName ||
                "document",
            caption:
                message.caption ||
                undefined,
            contextInfo
        };
    }

    if (
        message.type ===
        "stickerMessage"
    ) {
        return {
            sticker:
                message.buffer,
            contextInfo
        };
    }

    return null;
}

function getNumber(jid) {
    if (!jid) return null;

    const value =
        String(jid).trim();

    if (value.includes("@")) {
        return value
            .split("@")[0]
            .replace(/\D/g, "");
    }

    return value.replace(
        /\D/g,
        ""
    );
}

function normalizeJid(jid) {
    if (!jid) return null;

    return String(jid)
        .trim()
        .toLowerCase();
}

function isLidJid(jid) {
    return (
        typeof jid === "string" &&
        jid
            .toLowerCase()
            .endsWith("@lid")
    );
}

function isPnJid(jid) {
    return (
        typeof jid === "string" &&
        jid
            .toLowerCase()
            .endsWith(
                "@s.whatsapp.net"
            )
    );
}

function getAdminRole(
    participant
) {
    if (!participant) {
        return null;
    }

    if (
        participant.admin ===
            "superadmin" ||
        participant.isSuperAdmin === true
    ) {
        return "superadmin";
    }

    if (
        participant.admin ===
            "admin" ||
        participant.isAdmin === true
    ) {
        return "admin";
    }

    return null;
}

async function lidToPn(
    sock,
    jid
) {
    const normalized =
        normalizeJid(jid);

    if (!normalized) {
        return null;
    }

    if (isPnJid(normalized)) {
        return normalized;
    }

    if (!isLidJid(normalized)) {
        return normalized;
    }

    try {
        const mapping =
            sock?.signalRepository
                ?.lidMapping;

        if (
            mapping?.getPNForLID
        ) {
            const pn =
                await mapping.getPNForLID(
                    normalized
                );

            if (pn) {
                const result =
                    normalizeJid(pn);

                if (
                    isPnJid(result)
                ) {
                    return result;
                }

                if (
                    /^\d+$/.test(
                        result
                    )
                ) {
                    return `${result}@s.whatsapp.net`;
                }
            }
        }
    } catch {}

    return null;
}

function getBotPhoneCandidates(
    subBot,
    sock
) {
    const candidates =
        new Set();

    const values = [
        subBot?.phone,
        sock?.user?.id,
        sock?.authState?.creds?.me?.id
    ];

    for (
        const value of values
    ) {
        if (!value) continue;

        const number =
            getNumber(value);

        if (number) {
            candidates.add(number);
        }
    }

    return candidates;
}

async function participantPhoneNumber(
    sock,
    participant
) {
    if (!participant) {
        return null;
    }

    const values = [
        participant.phoneNumber,
        participant.pn
    ];

    for (
        const value of values
    ) {
        if (!value) continue;

        const number =
            getNumber(value);

        if (number) {
            return number;
        }
    }

    const pn =
        await lidToPn(
            sock,
            participant.id
        );

    if (pn) {
        const number =
            getNumber(pn);

        if (number) {
            return number;
        }
    }

    return null;
}

async function isBotParticipant(
    sock,
    subBot,
    participant,
    botPhones
) {
    if (!participant) {
        return false;
    }

    const participantPhone =
        await participantPhoneNumber(
            sock,
            participant
        );

    if (
        participantPhone &&
        botPhones.has(
            participantPhone
        )
    ) {
        return true;
    }

    const participantId =
        normalizeJid(
            participant.id
        );

    if (
        participantId &&
        isPnJid(
            participantId
        )
    ) {
        const participantNumber =
            getNumber(
                participantId
            );

        if (
            participantNumber &&
            botPhones.has(
                participantNumber
            )
        ) {
            return true;
        }
    }

    const botIds = [
        sock?.user?.id,
        sock?.authState?.creds?.me?.id,
        sock?.authState?.creds?.me?.lid
    ]
        .filter(Boolean)
        .map(normalizeJid);

    if (
        participantId &&
        botIds.includes(
            participantId
        )
    ) {
        return true;
    }

    const participantLid =
        normalizeJid(
            participant.lid
        );

    if (
        participantLid &&
        botIds.includes(
            participantLid
        )
    ) {
        return true;
    }

    return false;
}

function wait(ms) {
    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}