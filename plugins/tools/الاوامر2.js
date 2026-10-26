import fs from "fs";

const MENU_IMAGE = "./media/menu.jpg";

const categories = {
    "👑 أوامــࢪ الــمــطــوࢪ": [
    ".مطور", ".ريستارت", ".خاص", ".بلوك",
    ".انبلوك", ".برفكس", ".ملفات", ".باتش", ".تعديل", ".ميديا", ".خش",
    ".سحب", ".زرف", ".فنش", ".سبام", ".وهمي",".وضع", ".مجموعاتي", ".اي_دي2",
    ".ارسل", ".بوتاتي",".فرعي",
    ".اذاعة", ".متابعة", ".بث", ".احصائيات_البوت", ".اضف", ".اخرج",
    ".ايمو", ".بوتي"
],

    "🎭 الـتـرفـيـه والـتـسـلـيـة": [
        ".النظام", ".البنك", ".الارواح", ".اكس_اوه", ".احزر", ".عين",
        ".دينو", ".شطرنج",".سيارة",".سبيس",".زون", ".قارن", ".قيام", ".تسجيل_الدخول", ".تسجيل_الدخول2",
        ".تسجيل_الدخول3", ".شخصية", ".مزاجي", ".نرد", ".انبهر", ".بوسه",
        ".زنجي", ".زواج", ".زوجني", ".توأمي", ".توب", ".شاذ", ".كيوت",
        ".غازل", ".عاكس", ".حكمة", ".معلومة", ".هل", ".لو_خيروك", ".صراحة", ".احكم",
        ".كتابة", ".كت", ".تفكيك", ".فكك", ".طعام", ".علم", ".لغز",
        ".كورة", ".اقتراح", ".بصمة", ".قطوتي", ".قططي", ".تهكير", ".سـولـو"
    ],

    "🛡️ الـمـجـمـوعـة والإداࢪة": [
        ".ادمن", ".عضو", ".اسم", ".وصف", ".صورة", ".لينك", ".شات" , ".قبول", ".رفض", ".طرد", ".حذف",".كتم", ".انذار", ".انذاراتي",
        ".منشن", ".مخفي", ".تفاعلي", ".تصفية", ".ترقية", ".اعفاء",
        ".استقبال", ".توديع",".ترحيب", ".القوانين", ".رحب", ".تصويت", ".المجموعة",
        ".ستوري", ".استدعاء", ".كوبي"
    ],

    "⚙️ الأدوات والـتـقـنـيـة": [
        ".الاوامر", ".الاوامر2", ".المطور", ".تست", ".بروفايل", ".اي_دي", ".تنصيب",
        ".فرعي اضف", ".حقوق", ".زخرفة", ".مورس", ".اختصر", ".قول", ".كشف",
        ".سكرين", ".الكاشف", ".سرعة", ".مفتاح", ".صورة_حية", ".احسب",
        ".عملة", ".ترجمة", ".كيو_ار",".الوان" ,".توقيت", ".القمر", ".منبه",
        ".ملاحظاتي"
    ],

    "🎨 تـحـريـر الـوسـائـط": [
    ".شكل", ".جودة", ".ابيض_اسود", ".امباكت", ".ذهبي", ".نيون",
    ".سينيمائي", ".هندسي", ".عكس_الوان", ".كلاسيكي", ".بكسل", ".مكبر",
    ".ابطأ", ".اسرع", ".بطيء_جدا", ".سريع_جدا", ".عميق", ".خفيف",
    ".مخيف"
],

    "📸 تـحـويـل الـوسـائـط": [
        ".لملصق", ".لفيديو", ".لصورة", ".لجيف", ".لرابط",".لمستند", ".لصوت", ".لنص"
    ],

    "📥 الـتـحـمـيـل والـمـيـديـا": [
        ".تحميل", ".تطبيق", ".تيكتوك", ".انستا", ".فيسبوك",".عدسة", ".بنترست",
        ".ايديت", ".طقس", ".ويكي",".كتاب" ,".انمي", ".حزمة", ".متحركة", ".فيلم",
        ".مانهوا", ".بحث", ".خريطة", ".صور", ".خلفية", ".اغنية",
        ".كلمات_اغنية", ".سبوتيفاي", ".تيرابوكس", ".جيتهاب",".يوتيوب"
    ],

    "🤖 الـذكـاء الإصـطـنـاعـي": [
        ".جيبيتي", ".جيمناي", ".ديب_سيك", ".تخيل",".فيديو_ذكاء"
    ],

    "☪️ إســـلامـــيـــات": [
        ".اذكار", ".احاديث", ".ادعية", ".سورة", ".تقويم", ".الرجال"
    ]
};

const categoryEntries = Object.entries(categories);
const ALL_COMMANDS_INDEX = categoryEntries.length + 1;

function getCategoryEmoji(categoryName) {
    const match = categoryName.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u);
    return match ? match[1] : "📁";
}

function normalizeText(text = "") {
    return text
        .replace(/^\./, "")
        .replace(/[إأآ]/g, "ا")
        .replace(/ة/g, "ه")
        .trim()
        .toLowerCase();
}

function getUserNumber(userJid) {
    return userJid?.split("@")[0] || "غير معروف";
}

function getContextInfo(m) {
    return (
        m?.message?.extendedTextMessage?.contextInfo ||
        m?.message?.imageMessage?.contextInfo ||
        m?.message?.videoMessage?.contextInfo ||
        m?.message?.documentMessage?.contextInfo ||
        m?.message?.stickerMessage?.contextInfo ||
        null
    );
}

function getText(m) {
    return (
        m?.message?.conversation ||
        m?.message?.extendedTextMessage?.text ||
        m?.message?.imageMessage?.caption ||
        m?.message?.videoMessage?.caption ||
        m?.message?.documentMessage?.caption ||
        ""
    ).trim();
}

function getCategoriesMenu(userJid) {
    const userNumber = getUserNumber(userJid);

    let body = "";

    categoryEntries.forEach(([category], index) => {
        body += `*╭───────〔 ${String(index + 1).padStart(2, "0")} 〕───────╮*\n`;
        body += `  *│       ${category}*\n`;
        body += `*╰───────────────────╯*\n`;
    });

    body += `\n*╭───────〔 ${String(ALL_COMMANDS_INDEX).padStart(2, "0")} 〕───────╮*\n`;
    body += `  *│      🏮 عــࢪض كــل الأوامــࢪ*\n`;
    body += `*╰───────────────────╯*`;

    return `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ قــائــمــة أوامــࢪ سـولـو┇🏮*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*┋ مـࢪحـبـا بـكـم┋🌙*
*┋فـي قـائـمـة أوامـࢪ سـولـو┋🍷*

*👤 الـمـسـتـدعـي : ⦓ @${userNumber} ⦔*

*📊 إجـمـالـي الأقـسـام : ⦓ ${ALL_COMMANDS_INDEX} ⦔*

*💥 إجـمـالـي الأوامــࢪ : ⦓ 250 ⦔*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*
> *اضـغـط عـلـى "قـࢪاءة الـمـزيـد".👇🏻*                                                                                                                                                                                                                                                                                                                                                                                                                                             
${body}

*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*

*📌 طـريـقـة الـتـنـقـل :*

*┋ اعـمـل ࢪيـبـلاي عـلـى هـذه الـرسـالـة واكـتـب رقـم الـقـسـم 🔢*

*┋ لـلـعـودة لـلـقـائـمـة : اعـمـل ࢪيـبـلاي بـ « عـودة » 🔙*

*┋مـلـحـوظـة هـامـة: قـبـل أي أمـࢪ يـجـب كـتـابـة نـقـطـة ⦓ . ⦔*

*⚠️ يـجـب دائـمـا عـمـل ࢪيـبـلاي عـلـى رسـالـة الأوامـر*

> *❕ࢪيـبـلاي مـعـنـاهـا الࢪد عـلـى ࢪسـالـة الأوامـࢪ*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;
}

function getCategoryMenu(index, userJid) {
    const [category, commands] = categoryEntries[index];
    const userNumber = getUserNumber(userJid);

    let body = "";

    commands.forEach((command) => {
        body += `*┋ ⬡ [${command}]*\n`;
    });

    return `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ ${category} ┇🏮*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*

*👤 الـمـسـتـدعـي : ⦓ @${userNumber} ⦔*

*📜 عـدد أوامـر الـقـسـم : ⦓ ${commands.length} ⦔*

*⎔┄┄─── ⊱╎⌯ 📜 ⌯╎⊰ ───┄┄⎔*

${body}
*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*

*🔙 لـلـعـودة : اعـمـل ࢪيـبـلاي واكـتـب « عـودة »*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;
}

function getAllCommandsMenu(userJid) {
    const userNumber = getUserNumber(userJid);

    let body = "";

    for (const [category, commands] of categoryEntries) {
        body += `*「 ${category} 】*\n`;
        body += `╭───────────────────⊷\n`;

        for (const command of commands) {
            body += `*┋ ⬡ [${command}]*\n`;
        }

        body += `╰───────────────────⊷\n\n`;
    }

    return `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ قــائــمــة أوامــࢪ سـولـو┇🏮*

*⎔┄┄─── ⊱╎⌯ 📚 ⌯╎⊰ ───┄┄⎔*

*👤 الـمـسـتـدعـي : ⦓ @${userNumber} ⦔*

${body}*⎔┄┄─── ⊱╎⌯ 🌌 ⌯╎⊰ ───┄┄⎔*

*🔙 لـلـعـودة : اعـمـل Reply واكـتـب « عـودة »*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;
}

export default {
    name: "الاوامر2",

    aliases: [
        "help2",
        "القائمة2",
        "2الأوامر",
        "2أوامر",
        "2اوامر",
        "2قائمة",
        "menu2",
        "2ألأوامر",
        "orders2",
        "plugins2",
        "بلجنس2",
        "2اوردرز"
    ],

    category: "system",

    async run({ sock, m, userJid }) {
        const chatId = m.key.remoteJid;

        try {
            await sock.sendMessage(chatId, {
                react: {
                    text: "🏮",
                    key: m.key
                }
            });

            // ═══════════════════════════════════════════════
            // 1️⃣ إرسال الصورة لوحدها (بريبلاي على رسالة الأمر)
            // ═══════════════════════════════════════════════
            await sock.sendMessage(
                chatId,
                {
                    image: fs.readFileSync(MENU_IMAGE)
                },
                { quoted: m }
            );

            // ═══════════════════════════════════════════════
            // 2️⃣ إرسال رسالة الأوامر (نص فقط، بدون ريبلاي)
            // ═══════════════════════════════════════════════
            const menuMessage = await sock.sendMessage(
                chatId,
                {
                    text: getCategoriesMenu(userJid),
                    mentions: [userJid]
                }
            );

            const menuKey = menuMessage.key;

            if (!globalThis.__SOLO_COMMAND_MENUS__) {
                globalThis.__SOLO_COMMAND_MENUS__ = new WeakMap();
            }

            let botMenus = globalThis.__SOLO_COMMAND_MENUS__.get(sock);

            if (!botMenus) {
                botMenus = new Map();
                globalThis.__SOLO_COMMAND_MENUS__.set(sock, botMenus);
            }

            botMenus.set(chatId, {
                key: menuKey,
                userJid,
                createdAt: Date.now()
            });

            if (!globalThis.__SOLO_COMMAND_MENU_EVENTS__) {
                globalThis.__SOLO_COMMAND_MENU_EVENTS__ = new WeakSet();
            }

            if (globalThis.__SOLO_COMMAND_MENU_EVENTS__.has(sock)) {
                return;
            }

            globalThis.__SOLO_COMMAND_MENU_EVENTS__.add(sock);

            sock.ev.on("messages.upsert", async ({ messages }) => {
                try {
                    if (!messages?.length) return;

                    for (const incoming of messages) {
                        if (!incoming?.key?.remoteJid) continue;

                        const incomingChat = incoming.key.remoteJid;
                        const activeMenu = botMenus.get(incomingChat);

                        if (!activeMenu) continue;

                        const context = getContextInfo(incoming);

                        if (!context?.stanzaId) continue;

                        if (context.stanzaId !== activeMenu.key.id) {
                            continue;
                        }

                        const text = getText(incoming);

                        if (!text) continue;

                        const normalized = normalizeText(text);

                        // ═══════════════════════════════════
                        // 🔙 عودة
                        // ═══════════════════════════════════
                        if (
                            normalized === "عودة" ||
                            normalized === "عوده"
                        ) {
                            await sock.sendMessage(incomingChat, {
                                react: {
                                    text: "🔙",
                                    key: incoming.key
                                }
                            });

                            const edited = await sock.sendMessage(incomingChat, {
                                text: getCategoriesMenu(activeMenu.userJid),
                                mentions: [activeMenu.userJid],
                                edit: activeMenu.key
                            });

                            await sock.sendMessage(incomingChat, {
                                text: "🔙"
                            }, { quoted: edited });

                            continue;
                        }

                        // ═══════════════════════════════════
                        // 🔢 اختيار قسم
                        // ═══════════════════════════════════
                        if (!/^\d+$/.test(normalized)) {
                            continue;
                        }

                        const selected = Number(normalized);

                        if (
                            selected < 1 ||
                            selected > ALL_COMMANDS_INDEX
                        ) {
                            continue;
                        }

                        // ─── عرض كل الأوامر ───
                        if (selected === ALL_COMMANDS_INDEX) {
                            await sock.sendMessage(incomingChat, {
                                react: {
                                    text: "🏮",
                                    key: incoming.key
                                }
                            });

                            const edited = await sock.sendMessage(incomingChat, {
                                text: getAllCommandsMenu(activeMenu.userJid),
                                mentions: [activeMenu.userJid],
                                edit: activeMenu.key
                            });

                            await sock.sendMessage(incomingChat, {
                                text: "✅"
                            }, { quoted: edited });

                            continue;
                        }

                        // ─── عرض قسم معين ───
                        const [categoryName] = categoryEntries[selected - 1];
                        const categoryEmoji = getCategoryEmoji(categoryName);

                        await sock.sendMessage(incomingChat, {
                            react: {
                                text: categoryEmoji,
                                key: incoming.key
                            }
                        });

                        const edited = await sock.sendMessage(incomingChat, {
                            text: getCategoryMenu(
                                selected - 1,
                                activeMenu.userJid
                            ),
                            mentions: [activeMenu.userJid],
                            edit: activeMenu.key
                        });

                        await sock.sendMessage(incomingChat, {
                            text: "✅"
                        }, { quoted: edited });
                    }
                } catch (error) {
                    console.log(
                        "SOLO COMMAND MENU ERROR:",
                        error?.message || error
                    );
                }
            });

        } catch (error) {
            console.log(
                "Menu Error:",
                error?.message || error
            );

            await sock.sendMessage(chatId, {
                text: "｢ ❌ ｣ *تـأكـد مـن وجـود مـجـلـد media وبـداخـلـه صـورة menu.jpg*"
            });
        }
    }
};