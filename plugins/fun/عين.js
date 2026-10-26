import axios from "axios";
import fs from "fs-extra";

import {
    generateWAMessageFromContent,
    prepareWAMessageMedia
} from "@whiskeysockets/baileys";

const SOLO_CHANNEL_ID =
    "120363407767420565@newsletter";

const SOLO_CHANNEL_NAME =
    "『𝑺𝑶𝑳𝑶⊰🏮⊱𝑩𝑶𝑻』";

const BANK_PATH =
    "./data/bank.json";

const EYE_DATA_URL =
    "https://raw.githubusercontent.com/fjfilhfjjg-boop/Pomni-AI/refs/heads/main/%D8%B9%D9%8A%D9%86.md";

const games = new Map();
const listeners = new WeakMap();
const imageCache = new Map();

/* =========================================================
   100 شخصية
   62 Famous
   24 Medium
   14 Low
========================================================= */

const NAMES = [

    // =========================
    // 62 FAMOUS
    // =========================

    "يوتا",
    "مليودس",
    "ساسكي",
    "سونغ",
    "كرولو",
    "ايتشيغو",
    "باين",
    "ايزن",
    "ايساغي",
    "غوجو",
    "ناغي",
    "سوكونا",
    "ساي",
    "رين",
    "تشيغري",
    "شيدو",
    "كايزر",
    "مايكي",
    "دراكن",
    "غوكو",
    "فيجيتا",
    "ناروتو",
    "لوفي",
    "زورو",
    "إيرين",
    "ليفاي",
    "ميكاسا",
    "لايت",
    "إل",
    "تانجيرو",
    "نيزوكو",
    "زينيتسو",
    "كيلوا",
    "غون",
    "هيسوكا",
    "سايتاما",
    "جينوس",
    "إدوارد إلريك",
    "ألوكارد",
    "ريمورو",
    "روديوس",
    "يوجي",
    "كاكاشي",
    "إيتاتشي",
    "مادارا",
    "جيرايا",
    "ميناتو",
    "هاشيراما",
    "غارا",
    "ديدارا",
    "ساسوري",
    "أوروتشيمارو",
    "روك لي",
    "شيكامارو",
    "ساكورا",
    "هيناتا",
    "موزان",
    "رينغوكو",
    "غيّو",
    "شينوبو",
    "تينغن",
    "توجي",

    // =========================
    // 24 MEDIUM
    // =========================

    "دينجي",
    "باور",
    "ماكيما",
    "ثورفين",
    "يوهان",
    "لولوش",
    "سوبارو",
    "كازوما",
    "كيريتو",
    "غاتس",
    "شينرا",
    "سينكو",
    "ميتسوري",
    "أوباناي",
    "توكيتو",
    "غيومي",
    "أكازا",
    "دوما",
    "كوكوشيبو",
    "ميغومي",
    "نوبارا",
    "نانامي",
    "تودو",
    "ماهيتو",

    // =========================
    // 14 LOW
    // =========================

    "ماش",
    "أستا",
    "يونو",
    "غابيمارو",
    "دازاي",
    "غينتوكي",
    "كينجاكو",
    "تشوسو",
    "أوراهارا",
    "بياكويا",
    "روكيا",
    "كينباتشي",
    "غريمجو",
    "أولكيورا"
];

/* =========================================================
   أسماء العرض داخل الأزرار
========================================================= */

const BUTTON_NAMES = {

    "يوتا": "يـوتـا",
    "مليودس": "مـليـودس",
    "ساسكي": "سـاسـكـي",
    "سونغ": "سـونـغ",
    "كرولو": "كـࢪولـو",
    "ايتشيغو": "ايـتـشـيـغـو",
    "باين": "بـايـن",
    "ايزن": "ايـزن",
    "ايساغي": "ايـسـاغـي",
    "غوجو": "غـوجـو",
    "ناغي": "نـاغـي",
    "سوكونا": "سـوكـونـا",
    "ساي": "سـاي",
    "رين": "ࢪيـن",
    "تشيغري": "تـشـيـغـࢪي",
    "شيدو": "شـيـدو",
    "كايزر": "كـايـزࢪ",
    "مايكي": "مـايـكـي",
    "دراكن": "دࢪاكـن",
    "غوكو": "غـوكـو",
    "فيجيتا": "فـيـجـيـتـا",
    "ناروتو": "نـاࢪوتـو",
    "لوفي": "لـوفـي",
    "زورو": "زُوࢪو",
    "إيرين": "ايـࢪيـن",
    "ليفاي": "لـيـفـاي",
    "ميكاسا": "مـيـكـاسـا",
    "لايت": "لـايـت",
    "إل": "إل",
    "تانجيرو": "تـانـجـيـࢪو",
    "نيزوكو": "نـيـزوكـو",
    "زينيتسو": "زيـنـيـتـسـو",
    "كيلوا": "كـيـلـوا",
    "غون": "غـون",
    "هيسوكا": "هـيـسـوكـا",
    "سايتاما": "سـايـتـامـا",
    "جينوس": "جـيـنـوس",
    "إدوارد إلريك": "إدوارد إلـࢪيـك",
    "ألوكارد": "ألـوكـاࢪد",
    "ريمورو": "ࢪيـمـوࢪو",
    "روديوس": "ࢪوديـوس",
    "يوجي": "يـوجـي",

    "كاكاشي": "كـاكـاشـي",
    "إيتاتشي": "إيـتـاتـشـي",
    "مادارا": "مـاداࢪا",
    "جيرايا": "جـيـࢪايـا",
    "ميناتو": "مـيـنـاتـو",
    "هاشيراما": "هـاشـيـࢪامـا",
    "غارا": "غـاࢪا",
    "ديدارا": "ديـداࢪا",
    "ساسوري": "سـاسـوࢪي",
    "أوروتشيمارو": "أوࢪوتـشـيـمـاࢪو",
    "روك لي": "ࢪوك لـي",
    "شيكامارو": "شـيـكـامـاࢪو",
    "ساكورا": "سـاكـوࢪا",
    "هيناتا": "هـيـنـاتـا",
    "موزان": "مـوزان",
    "رينغوكو": "ࢪيـنـغـوكـو",
    "غيّو": "غـيـو",
    "شينوبو": "شـيـنـوبـو",
    "تينغن": "تـيـنـغـن",
    "توجي": "تـوجـي",

    "دينجي": "ديـنـجـي",
    "باور": "بـاوࢪ",
    "ماكيما": "مـاكـيـمـا",
    "ثورفين": "ثـوࢪفـيـن",
    "يوهان": "يـوهـان",
    "لولوش": "لـولـوش",
    "سوبارو": "سـوبـاࢪو",
    "كازوما": "كـازومـا",
    "كيريتو": "كـيـࢪيـتـو",
    "غاتس": "غـاتـس",
    "شينرا": "شـيـنـࢪا",
    "سينكو": "سـيـنـكـو",
    "ميتسوري": "مـيـتـسـوࢪي",
    "أوباناي": "أوبـانـاي",
    "توكيتو": "تـوكـيـتـو",
    "غيومي": "غـيـومـي",
    "أكازا": "أكـازا",
    "دوما": "دومـا",
    "كوكوشيبو": "كـوكـوشـيـبـو",
    "ميغومي": "مـيـغـومـي",
    "نوبارا": "نـوبـاࢪا",
    "نانامي": "نـانـامـي",
    "تودو": "تـودو",
    "ماهيتو": "مـاهـيـتـو",

    "ماش": "مـاش",
    "أستا": "أسـتـا",
    "يونو": "يـونـو",
    "غابيمارو": "غـابـيـمـاࢪو",
    "دازاي": "دازاي",
    "غينتوكي": "غـيـنـتـوكـي",
    "كينجاكو": "كـيـنـجـاكـو",
    "تشوسو": "تـشـوسـو",
    "أوراهارا": "أوࢪاهـاࢪا",
    "بياكويا": "بـيـاكـويـا",
    "روكيا": "ࢪوكـيـا",
    "كينباتشي": "كـيـنـبـاتـشـي",
    "غريمجو": "غـࢪيـمـجـو",
    "أولكيورا": "أولـكـيـوࢪا"
};

function getButtonName(name) {
    return BUTTON_NAMES[name] || name;
}

/* =========================================================
   Normalize
========================================================= */

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/ـ/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/\s+/g, " ");
}

/* =========================================================
   Message helpers
========================================================= */

function getSender(m) {
    return (
        m?.key?.participant ||
        m?.participant ||
        m?.key?.remoteJid ||
        ""
    );
}

function getChatId(m) {
    return m?.key?.remoteJid;
}

function getMessageText(m) {
    const msg =
        m?.message || {};

    if (msg.conversation) {
        return msg.conversation;
    }

    if (
        msg.extendedTextMessage?.text
    ) {
        return (
            msg.extendedTextMessage.text
        );
    }

    if (
        msg.imageMessage?.caption
    ) {
        return (
            msg.imageMessage.caption
        );
    }

    if (
        msg.videoMessage?.caption
    ) {
        return (
            msg.videoMessage.caption
        );
    }

    if (
        msg.documentMessage?.caption
    ) {
        return (
            msg.documentMessage.caption
        );
    }

    if (
        msg.templateButtonReplyMessage
            ?.selectedId
    ) {
        return (
            msg.templateButtonReplyMessage
                .selectedId
        );
    }

    const flow =
        msg.interactiveResponseMessage
            ?.nativeFlowResponseMessage;

    if (flow?.paramsJson) {
        try {
            const params =
                JSON.parse(
                    flow.paramsJson
                );

            return (
                params.id ||
                params.selectedId ||
                params.button_id ||
                ""
            );
        } catch {}
    }

    if (
        msg.buttonsResponseMessage
            ?.selectedButtonId
    ) {
        return (
            msg.buttonsResponseMessage
                .selectedButtonId
        );
    }

    if (
        msg.listResponseMessage
            ?.singleSelectReply
            ?.selectedRowId
    ) {
        return (
            msg.listResponseMessage
                .singleSelectReply
                .selectedRowId
        );
    }

    return "";
}

function getQuotedId(m) {
    const msg =
        m?.message || {};

    const context =
        msg.extendedTextMessage
            ?.contextInfo ||
        msg.imageMessage
            ?.contextInfo ||
        msg.videoMessage
            ?.contextInfo ||
        msg.documentMessage
            ?.contextInfo ||
        msg.stickerMessage
            ?.contextInfo ||
        msg.templateButtonReplyMessage
            ?.contextInfo ||
        msg.interactiveResponseMessage
            ?.contextInfo ||
        msg.viewOnceMessage
            ?.message
            ?.extendedTextMessage
            ?.contextInfo ||
        msg.viewOnceMessageV2
            ?.message
            ?.extendedTextMessage
            ?.contextInfo;

    return (
        context?.stanzaId ||
        context?.quotedMessageId ||
        null
    );
}

function channelContext(jid) {
    return {
        mentionedJid:
            jid ? [jid] : [],

        isForwarded: true,

        forwardingScore: 1,

        forwardedNewsletterMessageInfo: {
            newsletterJid:
                SOLO_CHANNEL_ID,

            newsletterName:
                SOLO_CHANNEL_NAME,

            serverMessageId: 0
        }
    };
}

/* =========================================================
   Shuffle
========================================================= */

function shuffle(array) {
    const result =
        [...array];

    for (
        let i =
            result.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}

/* =========================================================
   Eye data
========================================================= */

async function getEyeData() {
    const response =
        await axios.get(
            EYE_DATA_URL,
            {
                timeout: 20000,

                headers: {
                    "User-Agent":
                        "SOLO-BOT-Anime-Game/1.0"
                }
            }
        );

    const data =
        response?.data;

    if (!Array.isArray(data)) {
        throw new Error(
            "بيانات لعبة العين غير صالحة."
        );
    }

    const valid =
        data.filter(
            item =>
                item &&
                item.name &&
                item.img
        );

    if (!valid.length) {
        throw new Error(
            "لم يتم العثور على أسئلة صالحة."
        );
    }

    return valid;
}

function pickCharacter(data) {
    return data[
        Math.floor(
            Math.random() *
            data.length
        )
    ];
}

/* =========================================================
   Options
========================================================= */

function pickOptions(answer) {
    const answerName =
        normalize(
            answer.name
        );

    const pool =
        NAMES.filter(
            name =>
                normalize(name) !==
                answerName
        );

    const wrong =
        shuffle(pool)
            .slice(0, 3);

    return shuffle([
        answer.name,
        ...wrong
    ]);
}

/* =========================================================
   Resolve answer
========================================================= */

function resolveAnswer(
    text,
    game
) {
    const value =
        normalize(text);

    const buttonMatch =
        value.match(
            /^anime_eye_answer_([1-4])$/
        );

    if (buttonMatch) {
        const index =
            Number(
                buttonMatch[1]
            ) - 1;

        return game.options[index]
            ? normalize(
                game.options[index]
            )
            : null;
    }

    if (/^[1-4]$/.test(value)) {
        const index =
            Number(value) - 1;

        return game.options[index]
            ? normalize(
                game.options[index]
            )
            : null;
    }

    return value;
}

/* =========================================================
   Caption
========================================================= */

function createCaption() {
    return (
        "╭━〔 𝐒𝐎𝐋𝐎 𝐄𝐘𝐄 𝐐𝐔𝐈𝐙 〕━╮\n" +
        "┃\n" +
        "┃ 👁️ *مـيـن صـاحـب الـعـيـن؟*\n" +
        "┃  ركـز فـي الـعـيـن وخـمـن الـشـخـصـيـة.\n" +
        "┃\n" +
        "┣━━━━━━━━━━━━━━━━━━┫\n" +
        "┃\n" +
        "┃ ⏳ *الـوقـت : 60 ثـانـيـة*\n" +
        "┃ 💰 *الـجـائـزة : +20 عـمـلـة*\n" +
        "┃\n" +
        "┃ ⚠️ *لازم تعمل Reply على الصورة*\n" +
        "┃ وتختار إجابتك من الأزرار.\n" +
        "┃\n" +
        "╰━━━━━〔 𝐒𝐎𝐋𝐎 〕━━━━╯"
    );
}

/* =========================================================
   Texts
========================================================= */

function createSuccessText(
    sender,
    answer
) {
    return (
        "╭〔🏆 𝐒𝐎𝐋𝐎 𝐄𝐘𝐄 𝐖𝐈𝐍𝐍𝐄𝐑 🏆〕╮\n" +
        "┃\n" +
        "┃ 🎉 *إجـابـة صـحـيـحـة!*\n" +
        "┃\n" +
        `┃ 👤 الـفـائـز : @${sender.split("@")[0]}\n` +
        `┃ 👁️ الـشـخـصـيـة : *${answer}*\n` +
        "┃\n" +
        "┃ 💰 *+20 عـمـلـة*\n" +
        "┃\n" +
        "┃ ⚡ 𝐒𝐎𝐋𝐎 𝐄𝐘𝐄 𝐐𝐔𝐈𝐙\n" +
        "┃\n" +
        "╰━━━〔 𝐂𝐎𝐑𝐑𝐄𝐂𝐓 〕━━━╯"
    );
}

function createWrongText() {
    return (
        "╭━━〔❌ 𝐖𝐑𝐎𝐍𝐆 ❌〕━━╮\n" +
        "┃\n" +
        "┃ ❌ *إجـابـة غـلـط!*\n" +
        "┃\n" +
        "┃ 👁️ ركـز أكـتـر فـي تـفـاصـيـل الـعـيـن.\n" +
        "┃ جرب إجابة تانية على نفس الـReply.\n" +
        "┃\n" +
        "╰━━━━〔 𝐒𝐎𝐋𝐎 〕━━━━╯"
    );
}

function createTimeoutText(
    answer
) {
    return (
        "╭━〔⏰ 𝐓𝐈𝐌𝐄 𝐎𝐔𝐓 ⏰〕━╮\n" +
        "┃\n" +
        "┃ ⏳ *انـتـهـى الـوقـت!*\n" +
        "┃\n" +
        `┃ 💡 الإجـابـة كـانـت : *${answer}*\n` +
        "┃\n" +
        "┃ 🩸 محدش قدر يحزرها.\n" +
        "┃ 📥 تقدر تبدأ جولة جديدة الآن.\n" +
        "┃\n" +
        "╰━━〔 𝐒𝐎𝐋𝐎 𝐄𝐘𝐄 𝐐𝐔𝐈𝐙 〕━╯"
    );
}

function createAlreadyRunningText() {
    return (
        "╭━〔⚠️ 𝐒𝐎𝐋𝐎 𝐄𝐘𝐄 𝐐𝐔𝐈𝐙 ⚠️〕━╮\n" +
        "┃\n" +
        "┃ في لعبة شغالة بالفعل.\n" +
        "┃\n" +
        "┃ 👁️ اعمل Reply على صورة السؤال\n" +
        "┃ واختار إجابتك من الأزرار.\n" +
        "┃\n" +
        "┃ ⏳ الوقت المتبقي أقل من 60 ثانية.\n" +
        "┃\n" +
        "╰━━〔 𝐒𝐎𝐋𝐎 〕━━╯"
    );
}

/* =========================================================
   Bank
========================================================= */

async function resolveBankJid(
    sock,
    jid
) {
    if (!jid) return null;

    let resolved =
        jid;

    if (
        resolved.endsWith("@lid") &&
        sock?.signalRepository
            ?.lidMapping
    ) {
        try {
            const pn =
                await sock.signalRepository
                    .lidMapping
                    .getPNForLID(
                        resolved
                    );

            if (pn) {
                resolved = pn;
            }
        } catch {}
    }

    const number =
        resolved
            .split("@")[0]
            .split(":")[0];

    if (!number) return null;

    return (
        `${number}@s.whatsapp.net`
    );
}

async function awardWinner(
    sock,
    sender
) {
    try {
        const userJid =
            await resolveBankJid(
                sock,
                sender
            );

        if (!userJid) {
            throw new Error(
                "تعذر تحديد حساب اللاعب في البنك."
            );
        }

        await fs.ensureFile(
            BANK_PATH
        );

        let bankDB = {};

        try {
            bankDB =
                await fs.readJson(
                    BANK_PATH
                );
        } catch {
            bankDB = {};
        }

        if (
            !bankDB[userJid] ||
            typeof bankDB[userJid] !==
                "object"
        ) {
            bankDB[userJid] = {
                money: 0,
                rank:
                    "مـبـتـدئ 🌱",
                lastDaily: 0,
                inventory: []
            };
        }

        const account =
            bankDB[userJid];

        if (
            !Array.isArray(
                account.inventory
            )
        ) {
            account.inventory = [];
        }

        const currentMoney =
            Number(
                account.money
            ) || 0;

        account.money =
            currentMoney + 20;

        await fs.writeJson(
            BANK_PATH,
            bankDB,
            {
                spaces: 2
            }
        );

        return {
            success: true,
            jid: userJid,
            money:
                account.money
        };

    } catch (error) {

        console.error(
            "❌ SOLO Eye Bank Reward:",
            error?.stack ||
            error?.message ||
            error
        );

        return {
            success: false,
            jid: null,
            money: null
        };
    }
}

/* =========================================================
   Handle answer
========================================================= */

async function handleAnswer(
    sock,
    message
) {
    if (!message?.message)
        return;

    if (message.key?.fromMe)
        return;

    const chatId =
        getChatId(message);

    if (!chatId)
        return;

    const game =
        games.get(chatId);

    if (!game)
        return;

    const quotedId =
        getQuotedId(message);

    if (
        !quotedId ||
        quotedId !==
            game.messageId
    ) {
        return;
    }

    const text =
        getMessageText(message);

    if (!text?.trim())
        return;

    const sender =
        getSender(message);

    if (!sender)
        return;

    const answer =
        resolveAnswer(
            text,
            game
        );

    if (!answer)
        return;

    const correct =
        normalize(
            game.character.name
        );

    if (answer === correct) {

        clearTimeout(
            game.timer
        );

        games.delete(
            chatId
        );

        const reward =
            await awardWinner(
                sock,
                sender
            );

        await sock.sendMessage(
            chatId,
            {
                text:
                    createSuccessText(
                        sender,
                        game.character.name
                    ),

                mentions: [
                    sender
                ],

                contextInfo:
                    channelContext(
                        sender
                    )
            },
            {
                quoted: message
            }
        );

        try {
            await sock.sendMessage(
                chatId,
                {
                    react: {
                        text:
                            reward.success
                                ? "🏆"
                                : "⚠️",

                        key:
                            message.key
                    }
                }
            );
        } catch {}

        return;
    }

    const optionNames =
        game.options.map(
            option =>
                normalize(option)
        );

    if (
        optionNames.includes(
            answer
        )
    ) {
        await sock.sendMessage(
            chatId,
            {
                text:
                    createWrongText(),

                contextInfo:
                    channelContext(
                        sender
                    )
            },
            {
                quoted: message
            }
        );

        try {
            await sock.sendMessage(
                chatId,
                {
                    react: {
                        text: "❌",
                        key:
                            message.key
                    }
                }
            );
        } catch {}
    }
}

/* =========================================================
   Listener
========================================================= */

function registerListener(sock) {

    if (
        !sock?.ev ||
        listeners.has(sock)
    ) {
        return;
    }

    const listener =
        async update => {

            const messages =
                update?.messages ||
                [];

            for (
                const message
                of messages
            ) {
                try {

                    await handleAnswer(
                        sock,
                        message
                    );

                } catch (error) {

                    console.error(
                        "❌ SOLO Eye Listener:",
                        error?.stack ||
                        error?.message ||
                        error
                    );
                }
            }
        };

    sock.ev.on(
        "messages.upsert",
        listener
    );

    listeners.set(
        sock,
        listener
    );
}

/* =========================================================
   Send question with buttons
========================================================= */

async function sendQuestion(
    sock,
    chatId,
    image,
    caption,
    options,
    quoted
) {
    const media =
        await prepareWAMessageMedia(
            {
                image
            },
            {
                upload:
                    sock.waUploadToServer
            }
        );

    const buttons =
        options.map(
            (
                option,
                index
            ) => ({

                name:
                    "quick_reply",

                buttonParamsJson:
                    JSON.stringify({

                        display_text:
                            getButtonName(
                                option
                            ),

                        id:
                            `anime_eye_answer_${index + 1}`
                    })
            })
        );

    const message =
        generateWAMessageFromContent(
            chatId,
            {
                interactiveMessage: {

                    header: {
                        hasMediaAttachment:
                            true,

                        imageMessage:
                            media.imageMessage
                    },

                    body: {
                        text:
                            caption
                    },

                    nativeFlowMessage: {
                        buttons
                    },

                    contextInfo:
                        channelContext(
                            getSender(
                                quoted
                            )
                        )
                }
            },
            {
                quoted,

                userJid:
                    sock.user?.id
            }
        );

    await sock.relayMessage(
        chatId,
        message.message,
        {
            messageId:
                message.key.id,

            additionalNodes: [

                {
                    tag:
                        "biz",

                    attrs: {},

                    content: [

                        {
                            tag:
                                "interactive",

                            attrs: {
                                type:
                                    "native_flow",

                                v: "1"
                            },

                            content: [

                                {
                                    tag:
                                        "native_flow",

                                    attrs: {
                                        v: "9",

                                        name:
                                            "mixed"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    );

    return message;
}

/* =========================================================
   Plugin
========================================================= */

export default {

    name:
        "عين",

    aliases: [
        "eye"
    ],

    category:
        "games",

    description:
        "لعبة تخمين شخصية الأنمي من العين",

    usage: [
        ".عين"
    ],

    async run({
        sock,
        m,
        reply
    }) {

        const chatId =
            getChatId(m);

        if (!chatId)
            return;

        registerListener(
            sock
        );

        const current =
            games.get(chatId);

        if (current) {

            return reply(
                createAlreadyRunningText()
            );
        }

        try {

            await sock.sendMessage(
                chatId,
                {
                    react: {
                        text:
                            "👁️",

                        key:
                            m.key
                    }
                }
            );

            const data =
                await getEyeData();

            const character =
                pickCharacter(
                    data
                );

            const options =
                pickOptions(
                    character
                );

            const caption =
                createCaption();

            const image =
                await axios.get(
                    character.img,
                    {
                        responseType:
                            "arraybuffer",

                        timeout:
                            30000,

                        headers: {
                            "User-Agent":
                                "Mozilla/5.0"
                        }
                    }
                );

            const sent =
                await sendQuestion(
                    sock,
                    chatId,
                    Buffer.from(
                        image.data
                    ),
                    caption,
                    options,
                    m
                );

            const messageId =
                sent?.key?.id;

            if (!messageId) {

                throw new Error(
                    "تعذر الحصول على ID رسالة السؤال."
                );
            }

            const timer =
                setTimeout(
                    async () => {

                        const active =
                            games.get(
                                chatId
                            );

                        if (
                            !active ||
                            active.messageId !==
                                messageId
                        ) {
                            return;
                        }

                        games.delete(
                            chatId
                        );

                        try {

                            await sock.sendMessage(
                                chatId,
                                {
                                    text:
                                        createTimeoutText(
                                            character.name
                                        ),

                                    contextInfo:
                                        channelContext(
                                            getSender(m)
                                        )
                                }
                            );

                        } catch (error) {

                            console.error(
                                "❌ SOLO Eye Timeout:",
                                error?.message ||
                                error
                            );
                        }

                    },
                    60000
                );

            games.set(
                chatId,
                {
                    character,
                    options,
                    messageId,
                    timer,
                    createdAt:
                        Date.now()
                }
            );

        } catch (error) {

            console.error(
                "❌ SOLO Eye:",
                error?.stack ||
                error?.message ||
                error
            );

            try {

                await sock.sendMessage(
                    chatId,
                    {
                        react: {
                            text:
                                "❌",

                            key:
                                m.key
                        }
                    }
                );

            } catch {}

            return reply(
                "╭〔❌ 𝐒𝐎𝐋𝐎 𝐄𝐘𝐄 ❌〕╮\n" +
                "┃\n" +
                "┃ حـصـل خـطـأ أثـنـاء تـشـغـيـل الـلـعـبـة.\n" +
                "┃\n" +
                `┃ ${error?.message || "حاول مرة أخرى."}\n` +
                "┃\n" +
                "╰━━━━━━━━━━━━━━╯"
            );
        }
    }
};