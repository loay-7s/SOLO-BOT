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

const BANK_PATH = "./data/bank.json";

const games = new Map();
const listeners = new WeakMap();
const imageCache = new Map();

const characters = [
    // 62 famous

    { name:"يوتا", search:"Yuta Okkotsu", level:"famous", img:"https://files.catbox.moe/q23lo1.jpg" },
    { name:"مليودس", search:"Meliodas", level:"famous", img:"https://files.catbox.moe/n5j25b.jpg" },
    { name:"ساسكي", search:"Sasuke Uchiha", level:"famous", img:"https://files.catbox.moe/lbas99.jpg" },
    { name:"سونغ", search:"Sung Jin-Woo", level:"famous", img:"https://files.catbox.moe/f4uttg.jpg" },
    { name:"كرولو", search:"Chrollo Lucilfer", level:"famous", img:"https://files.catbox.moe/ljik7x.jpg" },
    { name:"ايتشيغو", search:"Ichigo Kurosaki", level:"famous", img:"https://files.catbox.moe/um1njn.jpg" },
    { name:"باين", search:"Pain", level:"famous", img:"https://files.catbox.moe/in6tnh.jpg" },
    { name:"ايزن", search:"Sosuke Aizen", level:"famous", img:"https://files.catbox.moe/42w2t0.jpg" },
    { name:"ايساغي", search:"Yoichi Isagi", level:"famous", img:"https://files.catbox.moe/sx7x6w.jpg" },
    { name:"غوجو", search:"Satoru Gojo", level:"famous", img:"https://files.catbox.moe/66kbtt.jpg" },
    { name:"ناغي", search:"Seishiro Nagi", level:"famous", img:"https://files.catbox.moe/yuz0lj.jpg" },
    { name:"سوكونا", search:"Ryomen Sukuna", level:"famous", img:"https://files.catbox.moe/pkc624.jpg" },
    { name:"ساي", search:"Sai", level:"famous", img:"https://files.catbox.moe/3w7y72.jpg" },
    { name:"رين", search:"Rin Itoshi", level:"famous", img:"https://files.catbox.moe/gz4xpg.jpg" },
    { name:"تشيغري", search:"Hyoma Chigiri", level:"famous", img:"https://files.catbox.moe/sq330s.jpg" },
    { name:"شيدو", search:"Ryusei Shidou", level:"famous", img:"https://files.catbox.moe/bawp0a.jpg" },
    { name:"كايزر", search:"Michael Kaiser", level:"famous", img:"https://files.catbox.moe/tpdpg4.jpg" },
    { name:"مايكي", search:"Manjiro Sano", level:"famous", img:"https://files.catbox.moe/byc2tt.jpg" },
    { name:"دراكن", search:"Ken Ryuguji", level:"famous", img:"https://files.catbox.moe/5sfl1s.jpg" },

    { name:"غوكو", search:"Goku", level:"famous" },
    { name:"فيجيتا", search:"Vegeta", level:"famous" },
    { name:"ناروتو", search:"Naruto Uzumaki", level:"famous" },
    { name:"لوفي", search:"Monkey D. Luffy", level:"famous" },
    { name:"زورو", search:"Roronoa Zoro", level:"famous" },
    { name:"إيرين", search:"Eren Yeager", level:"famous" },
    { name:"ليفاي", search:"Levi Ackerman", level:"famous" },
    { name:"ميكاسا", search:"Mikasa Ackerman", level:"famous" },
    { name:"لايت", search:"Light Yagami", level:"famous" },
    { name:"إل", search:"L Lawliet", level:"famous" },
    { name:"تانجيرو", search:"Tanjiro Kamado", level:"famous" },
    { name:"نيزوكو", search:"Nezuko Kamado", level:"famous" },
    { name:"زينيتسو", search:"Zenitsu Agatsuma", level:"famous" },
    { name:"كيلوا", search:"Killua Zoldyck", level:"famous" },
    { name:"غون", search:"Gon Freecss", level:"famous" },
    { name:"هيسوكا", search:"Hisoka Morow", level:"famous" },
    { name:"سايتاما", search:"Saitama", level:"famous" },
    { name:"جينوس", search:"Genos", level:"famous" },
    { name:"إدوارد إلريك", search:"Edward Elric", level:"famous" },
    { name:"ألوكارد", search:"Alucard", level:"famous" },
    { name:"ريمورو", search:"Rimuru Tempest", level:"famous" },
    { name:"روديوس", search:"Rudeus Greyrat", level:"famous" },
    { name:"يوجي", search:"Yuji Itadori", level:"famous" },

    // الشخصيات الجديدة

    { name:"كاكاشي", search:"Kakashi Hatake", level:"famous" },
    { name:"إيتاتشي", search:"Itachi Uchiha", level:"famous" },
    { name:"مادارا", search:"Madara Uchiha", level:"famous" },
    { name:"جيرايا", search:"Jiraiya", level:"famous" },
    { name:"ميناتو", search:"Minato Namikaze", level:"famous" },
    { name:"هاشيراما", search:"Hashirama Senju", level:"famous" },
    { name:"غارا", search:"Gaara", level:"famous" },
    { name:"ديدارا", search:"Deidara", level:"famous" },
    { name:"ساسوري", search:"Sasori", level:"famous" },
    { name:"أوروتشيمارو", search:"Orochimaru", level:"famous" },
    { name:"روك لي", search:"Rock Lee", level:"famous" },
    { name:"شيكامارو", search:"Shikamaru Nara", level:"famous" },
    { name:"ساكورا", search:"Sakura Haruno", level:"famous" },
    { name:"هيناتا", search:"Hinata Hyuga", level:"famous" },
    { name:"موزان", search:"Muzan Kibutsuji", level:"famous" },
    { name:"رينغوكو", search:"Kyojuro Rengoku", level:"famous" },
    { name:"غيّو", search:"Giyu Tomioka", level:"famous" },
    { name:"شينوبو", search:"Shinobu Kocho", level:"famous" },
    { name:"تينغن", search:"Tengen Uzui", level:"famous" },
    { name:"توجي", search:"Toji Fushiguro", level:"famous" },

    // 24 medium

    { name:"دينجي", search:"Denji", level:"medium" },
    { name:"باور", search:"Power", level:"medium" },
    { name:"ماكيما", search:"Makima", level:"medium" },
    { name:"ثورفين", search:"Thorfinn", level:"medium" },
    { name:"يوهان", search:"Johan Liebert", level:"medium" },
    { name:"لولوش", search:"Lelouch Lamperouge", level:"medium" },
    { name:"سوبارو", search:"Subaru Natsuki", level:"medium" },
    { name:"كازوما", search:"Kazuma Satou", level:"medium" },
    { name:"كيريتو", search:"Kirito", level:"medium" },
    { name:"غاتس", search:"Guts", level:"medium" },
    { name:"شينرا", search:"Shinra Kusakabe", level:"medium" },
    { name:"سينكو", search:"Senku Ishigami", level:"medium" },

    { name:"ميتسوري", search:"Mitsuri Kanroji", level:"medium" },
    { name:"أوباناي", search:"Obanai Iguro", level:"medium" },
    { name:"توكيتو", search:"Muichiro Tokito", level:"medium" },
    { name:"غيومي", search:"Gyomei Himejima", level:"medium" },
    { name:"أكازا", search:"Akaza", level:"medium" },
    { name:"دوما", search:"Doma", level:"medium" },
    { name:"كوكوشيبو", search:"Kokushibo", level:"medium" },
    { name:"ميغومي", search:"Megumi Fushiguro", level:"medium" },
    { name:"نوبارا", search:"Nobara Kugisaki", level:"medium" },
    { name:"نانامي", search:"Kento Nanami", level:"medium" },
    { name:"تودو", search:"Aoi Todo", level:"medium" },
    { name:"ماهيتو", search:"Mahito", level:"medium" },

    // 14 low

    { name:"ماش", search:"Mash Burnedead", level:"low" },
    { name:"أستا", search:"Asta", level:"low" },
    { name:"يونو", search:"Yuno", level:"low" },
    { name:"غابيمارو", search:"Gabimaru", level:"low" },
    { name:"دازاي", search:"Osamu Dazai", level:"low" },
    { name:"غينتوكي", search:"Gintoki Sakata", level:"low" },

    { name:"كينجاكو", search:"Kenjaku", level:"low" },
    { name:"تشوسو", search:"Choso", level:"low" },
    { name:"أوراهارا", search:"Kisuke Urahara", level:"low" },
    { name:"بياكويا", search:"Byakuya Kuchiki", level:"low" },
    { name:"روكيا", search:"Rukia Kuchiki", level:"low" },
    { name:"كينباتشي", search:"Kenpachi Zaraki", level:"low" },
    { name:"غريمجو", search:"Grimmjow Jaegerjaquez", level:"low" },
    { name:"أولكيورا", search:"Ulquiorra Cifer", level:"low" }
];

const answerAliases = {
    "يوتا":["يوتا","يـوتا","yuta"],
    "مليودس":["مليودس","ميلوداس","meliodas"],
    "ساسكي":["ساسكي","sasuke"],
    "سونغ":["سونغ","سونج","سونغ جين وو","sung jin woo"],
    "كرولو":["كرولو","كرولو لوسيلفر","chrollo"],
    "ايتشيغو":["ايتشيغو","ايتشيجو","ichigo"],
    "باين":["باين","pain"],
    "ايزن":["ايزن","آيزن","aizen"],
    "ايساغي":["ايساغي","إيساجي","isagi"],
    "غوجو":["غوجو","جوجو","gojo"],
    "ناغي":["ناغي","ناجي","nagi"],
    "سوكونا":["سوكونا","sukuna"],
    "ساي":["ساي","sai"],
    "رين":["رين","rin"],
    "تشيغري":["تشيغري","تشيجيري","chigiri"],
    "شيدو":["شيدو","شيدو ريوسي","shidou"],
    "كايزر":["كايزر","kaiser"],
    "مايكي":["مايكي","مايكي سان","mikey"],
    "دراكن":["دراكن","درايكين","draken"],
    "غوكو":["غوكو","جوكو","goku"],
    "فيجيتا":["فيجيتا","vegeta"],
    "ناروتو":["ناروتو","naruto"],
    "لوفي":["لوفي","luffy"],
    "زورو":["زورو","zoro"],
    "إيرين":["ايرين","إيرين","eren"],
    "ليفاي":["ليفاي","ليڤاي","levi"],
    "ميكاسا":["ميكاسا","mikasa"],
    "لايت":["لايت","لايت ياغامي","light"],
    "إل":["l","ال","إل"],
    "تانجيرو":["تانجيرو","tanjiro"],
    "نيزوكو":["نيزوكو","nezuko"],
    "زينيتسو":["زينيتسو","zenitsu"],
    "كيلوا":["كيلوا","killua"],
    "غون":["غون","جون","gon"],
    "هيسوكا":["هيسوكا","hisoka"],
    "سايتاما":["سايتاما","saitama"],
    "جينوس":["جينوس","genos"],
    "إدوارد إلريك":["إدوارد إلريك","إدوارد","edward"],
    "ألوكارد":["ألوكارد","alucard"],
    "ريمورو":["ريمورو","rimuru"],
    "روديوس":["روديوس","rudeus"],
    "يوجي":["يوجي","ايتادوري","إيتادوري","itadori","yuji"],
    "دينجي":["دينجي","denji"],
    "باور":["باور","power"],
    "ماكيما":["ماكيما","makima"],
    "ثورفين":["ثورفين","thorfinn"],
    "يوهان":["جوهان","يوهان","johan"],
    "لولوش":["لولوش","lelouch"],
    "سوبارو":["سوبارو","subaru"],
    "كازوما":["كازوما","kazuma"],
    "كيريتو":["كيريتو","kirito"],
    "غاتس":["غاتس","جاتس","guts"],
    "شينرا":["شينرا","shinra"],
    "سينكو":["سينكو","senku"],
    "ماش":["ماش","mash"],
    "أستا":["أستا","استا","asta"],
    "يونو":["يونو","yuno"],
    "غابيمارو":["غابيمارو","gabimaru"],
    "دازاي":["دازاي","dazai"],
    "غينتوكي":["غينتوكي","جينتوكي","gintoki"]
};

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/ـ/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/\s+/g, " ");
}

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
    const msg = m?.message || {};

    if (msg.conversation) {
        return msg.conversation;
    }

    if (msg.extendedTextMessage?.text) {
        return msg.extendedTextMessage.text;
    }

    if (msg.imageMessage?.caption) {
        return msg.imageMessage.caption;
    }

    if (msg.videoMessage?.caption) {
        return msg.videoMessage.caption;
    }

    if (msg.documentMessage?.caption) {
        return msg.documentMessage.caption;
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
    const msg = m?.message || {};

    const context =
        msg.extendedTextMessage?.contextInfo ||
        msg.imageMessage?.contextInfo ||
        msg.videoMessage?.contextInfo ||
        msg.documentMessage?.contextInfo ||
        msg.stickerMessage?.contextInfo ||
        msg.templateButtonReplyMessage
            ?.contextInfo ||
        msg.interactiveResponseMessage
            ?.contextInfo ||
        msg.viewOnceMessage?.message
            ?.extendedTextMessage
            ?.contextInfo ||
        msg.viewOnceMessageV2?.message
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
        mentionedJid: jid ? [jid] : [],
        isForwarded: true,
        forwardingScore: 1,
        forwardedNewsletterMessageInfo: {
            newsletterJid: SOLO_CHANNEL_ID,
            newsletterName: SOLO_CHANNEL_NAME,
            serverMessageId: 0
        }
    };
}

function shuffle(array) {
    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {
        const j =
            Math.floor(
                Math.random() * (i + 1)
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

function pickCharacter(chatId) {
    const current =
        games.get(chatId);

    const roll =
        Math.random();

    let level;

    if (roll < 0.70) {
        level = "famous";
    } else if (roll < 0.90) {
        level = "medium";
    } else {
        level = "low";
    }

    let pool =
        characters.filter(
            character =>
                character.level === level
        );

    if (current?.character?.name) {
        const withoutLast =
            pool.filter(
                character =>
                    character.name !==
                    current.character.name
            );

        if (withoutLast.length) {
            pool = withoutLast;
        }
    }

    return pool[
        Math.floor(
            Math.random() * pool.length
        )
    ];
}

function pickOptions(answer) {
    const others =
        shuffle(
            characters.filter(
                character =>
                    character.name !==
                    answer.name
            )
        ).slice(0, 3);

    return shuffle([
        answer,
        ...others
    ]);
}

function getAcceptedAnswers(character) {
    const values =
        answerAliases[
            character.name
        ] || [];

    return new Set([
        normalize(character.name),
        normalize(character.search),
        ...values.map(normalize)
    ]);
}

function resolveOptionAnswer(
    text,
    game
) {
    const value =
        normalize(text);

    const buttonMatch =
        value.match(
            /^anime_answer_([1-4])$/
        );

    if (buttonMatch) {
        const index =
            Number(
                buttonMatch[1]
            ) - 1;

        return game.options[index]
            ?.name
            ? normalize(
                game.options[index]
                    .name
            )
            : null;
    }

    if (/^[1-4]$/.test(value)) {
        const index =
            Number(value) - 1;

        return game.options[index]
            ?.name
            ? normalize(
                game.options[index]
                    .name
            )
            : null;
    }

    return value;
}

async function fetchAniListImages(list) {
    const missing =
        list.filter(
            character =>
                !character.img &&
                !imageCache.has(
                    character.search
                )
        );

    if (!missing.length) return;

    const fields =
        missing.map(
            (
                character,
                index
            ) => {
                const alias =
                    `c${index}`;

                const search =
                    JSON.stringify(
                        character.search
                    );

                return `
                ${alias}: Character(search: ${search}) {
                    name {
                        full
                        native
                    }
                    image {
                        large
                    }
                }
            `;
            }
        ).join("\n");

    const query =
        `query { ${fields} }`;

    try {
        const response =
            await axios.post(
                "https://graphql.anilist.co",
                { query },
                {
                    timeout: 15000,
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json",
                        "User-Agent":
                            "SOLO-BOT-Anime-Game/1.0"
                    }
                }
            );

        const data =
            response?.data?.data ||
            {};

        missing.forEach(
            (
                character,
                index
            ) => {
                const result =
                    data[
                        `c${index}`
                    ];

                const image =
                    result?.image?.large;

                if (image) {
                    imageCache.set(
                        character.search,
                        image
                    );
                }
            }
        );
    } catch (error) {
        console.error(
            "❌ AniList image resolver:",
            error?.response?.status ||
            error?.message ||
            error
        );
    }
}

async function getCharacterImage(character) {
    if (character.img) {
        return character.img;
    }

    if (
        imageCache.has(
            character.search
        )
    ) {
        return imageCache.get(
            character.search
        );
    }

    await fetchAniListImages([
        character
    ]);

    return (
        imageCache.get(
            character.search
        ) || null
    );
}

async function downloadImage(url) {
    if (!url) {
        throw new Error(
            "لم أستطع الحصول على صورة الشخصية."
        );
    }

    const cached =
        imageCache.get(
            `buffer:${url}`
        );

    if (cached) {
        return cached;
    }

    const response =
        await axios.get(
            url,
            {
                responseType:
                    "arraybuffer",
                timeout: 30000,
                headers: {
                    "User-Agent":
                        "Mozilla/5.0"
                }
            }
        );

    const buffer =
        Buffer.from(response.data);

    if (!buffer.length) {
        throw new Error(
            "صورة الشخصية فارغة."
        );
    }

    imageCache.set(
        `buffer:${url}`,
        buffer
    );

    return buffer;
}

async function prepareQuestion(
    character,
    options
) {
    await fetchAniListImages(
        options
    );

    const url =
        await getCharacterImage(
            character
        );

    if (!url) {
        throw new Error(
            `لم أجد صورة لـ ${character.name}`
        );
    }

    return downloadImage(url);
}

function createCaption() {
    return (
        "╭〔 𝐒𝐎𝐋𝐎 𝐀𝐍𝐈𝐌𝐄 𝐐𝐔𝐈𝐙 〕╮\n" +
        "┃\n" +
        "┃  🎭 *مـيـن الـشـخـصـيـة؟*\n" +
        "┃  شـوف الـصـورة وخـمـن الـشـخـصـيـة.\n" +
        "┃\n" +
        "┣━━━━━━━━━━━━━━━━━┫\n" +
        "┃\n" +
        "┃ ⏳ *الـوقـت : 60 ثـانـيـة*\n" +
        "┃ 💰 *الـجـائـزة : +20 عـمـلـة*\n" +
        "┃\n" +
        "┃ ⚠️ *لازم تعمل Reply على الصورة*\n" +
        "┃ وتكتب رقم الإجابة أو اسم الشخصية.\n" +
        "┃\n" +
        "╰━━━━〔 𝐒𝐎𝐋𝐎 〕━━━╯"
    );
}

function createSuccessText(
    sender,
    answer
) {
    return (
        "╭〔 🏆 𝐒𝐎𝐋𝐎 𝐖𝐈𝐍𝐍𝐄𝐑 🏆 〕╮\n" +
        "┃\n" +
        "┃ 🎉 *إجـابـة صـحـيـحـة!*\n" +
        "┃\n" +
        `┃ 👤 الـفـائـز : @${sender.split("@")[0]}\n` +
        `┃ 🎭 الـشـخـصـيـة : *${answer}*\n` +
        "┃\n" +
        "┃ 💰 *+20 عـمـلـة*\n" +
        "┃\n" +
        "┃ ⚡ 𝐒𝐎𝐋𝐎 𝐀𝐍𝐈𝐌𝐄 𝐐𝐔𝐈𝐙\n" +
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
        "┃ 🧠 لسه عندك فرصة.\n" +
        "┃ جرب إجابة تانية على نفس الـReply.\n" +
        "┃\n" +
        "╰━━━〔 𝐒𝐎𝐋𝐎 〕━━━╯"
    );
}

function createTimeoutText(answer) {
    return (
        "╭━〔⏰ 𝐓𝐈𝐌𝐄 𝐎𝐔𝐓 ⏰〕━╮\n" +
        "┃\n" +
        "┃ ⏳ *انـتـهـى الـوقـت!*\n" +
        "┃\n" +
        `┃ 💡 الإجـابـة كـانـت : *${answer}*\n` +
        "┃\n" +
        "┃ 🩸 محدش قدر يحزرها.\n" +
        "┃\n" +
        "╰━━〔 𝐒𝐎𝐋𝐎 𝐐𝐔𝐈𝐙 〕━╯"
    );
}

function createAlreadyRunningText() {
    return (
        "╭━〔⚠️ 𝐒𝐎𝐋𝐎 𝐐𝐔𝐈𝐙 ⚠️〕━╮\n" +
        "┃\n" +
        "┃ في لعبة شغالة بالفعل.\n" +
        "┃\n" +
        "┃ 🎯 اعمل Reply على صورة السؤال\n" +
        "┃ واكتب رقم إجابتك أو اسم الشخصية.\n" +
        "┃\n" +
        "╰━━〔 𝐒𝐎𝐋𝐎 〕━━╯"
    );
}

async function resolveBankJid(
    sock,
    jid
) {
    if (!jid) return null;

    let resolved = jid;

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

    return `${number}@s.whatsapp.net`;
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
                rank: "مـبـتـدئ 🌱",
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
            Number(account.money) ||
            0;

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
            money: account.money
        };
    } catch (error) {
        console.error(
            "❌ SOLO Bank Reward:",
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

async function handleAnswer(
    sock,
    message
) {
    if (!message?.message) return;
    if (message.key?.fromMe) return;

    const chatId =
        getChatId(message);

    if (!chatId) return;

    const game =
        games.get(chatId);

    if (!game) return;

    const quotedId =
        getQuotedId(message);

    if (
        !quotedId ||
        quotedId !== game.messageId
    ) {
        return;
    }

    const text =
        getMessageText(message);

    if (!text?.trim()) return;

    const sender =
        getSender(message);

    if (!sender) return;

    const answer =
        resolveOptionAnswer(
            text,
            game
        );

    if (!answer) return;

    const accepted =
        getAcceptedAnswers(
            game.character
        );

    if (accepted.has(answer)) {
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
                normalize(
                    option.name
                )
        );

    if (
        optionNames.includes(answer)
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
                update?.messages || [];

            for (
                const message of messages
            ) {
                try {
                    await handleAnswer(
                        sock,
                        message
                    );
                } catch (error) {
                    console.error(
                        "❌ SOLO Guess Listener:",
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

    function stylizeName(name) {
        const styles = {
            "يوتا": "يـوتـا",
            "مليودس": "مـليـودس",
            "ساسكي": "سـاسـكـي",
            "سونغ": "سـونـغ",
            "كرولو": "كـرولـو",
            "ايتشيغو": "ايتـشـيـغـو",
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

        return styles[name] || name;
    }

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
                            stylizeName(
                                option.name
                            ),

                        id:
                            `anime_answer_${index + 1}`
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
                        text: caption
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
                    tag: "biz",
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

export default {
    name: "احزر",

    aliases: [
        "خمن",
        "احزر_الشخصية",
        "مين"
    ],

    category: "games",

    description:
        "لعبة تخمين شخصية الأنمي من الصورة",

    usage: [
        ".احزر"
    ],

    async run({
        sock,
        m,
        reply
    }) {
        const chatId =
            getChatId(m);

        if (!chatId) return;

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
                        text: "🧩",
                        key: m.key
                    }
                }
            );

            const character =
                pickCharacter(
                    chatId
                );

            const options =
                pickOptions(
                    character
                );

            const image =
                await prepareQuestion(
                    character,
                    options
                );

            const caption =
                createCaption();

            const sent =
                await sendQuestion(
                    sock,
                    chatId,
                    image,
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
                                            getSender(
                                                m
                                            )
                                        )
                                }
                            );
                        } catch (error) {
                            console.error(
                                "❌ SOLO Guess Timeout:",
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
                "❌ SOLO Guess:",
                error?.stack ||
                error?.message ||
                error
            );

            try {
                await sock.sendMessage(
                    chatId,
                    {
                        react: {
                            text: "❌",
                            key: m.key
                        }
                    }
                );
            } catch {}

            return reply(
                "╭━━〔❌ 𝐒𝐎𝐋𝐎 𝐆𝐔𝐄𝐒𝐒 ❌〕━━╮\n" +
                "┃\n" +
                "┃ حـصـل خـطـأ أثـنـاء تـشـغـيـل الـلـعـبـة.\n" +
                "┃\n" +
                `┃ ${error?.message || "حاول مرة أخرى."}\n` +
                "┃\n" +
                "╰━━━━━━━━━━━━━━━━━━╯"
            );
        }
    }
};