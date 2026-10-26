// plugins/سورة.js
// 🌙 SOLO QURAN SYSTEM — COMPLETE EDITION ⚔️

import {
    generateWAMessageFromContent
} from '@whiskeysockets/baileys';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════
// 🎨 ZAKHRAFA
// ═══════════════════════════════════════════════════════════

const SOLO_HEADER = `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ─┄┄⎔*`;
const SOLO_FOOTER = `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

// ═══════════════════════════════════════════════════════════
// 📚 جميع سور القرآن (113 سورة — البقرة محذوفة)
// ═══════════════════════════════════════════════════════════

const ALL_SURAHS = [
    { num: 1,   name: 'الفاتحة',       type: 'مكية' },
    // { num: 2, name: 'البقرة', type: 'مدنية' }, // محذوفة بسبب الحجم
    { num: 3,   name: 'آل عمران',      type: 'مدنية' },
    { num: 4,   name: 'النساء',        type: 'مدنية' },
    { num: 5,   name: 'المائدة',       type: 'مدنية' },
    { num: 6,   name: 'الأنعام',       type: 'مكية' },
    { num: 7,   name: 'الأعراف',       type: 'مكية' },
    { num: 8,   name: 'الأنفال',       type: 'مدنية' },
    { num: 9,   name: 'التوبة',        type: 'مدنية' },
    { num: 10,  name: 'يونس',          type: 'مكية' },
    { num: 11,  name: 'هود',           type: 'مكية' },
    { num: 12,  name: 'يوسف',          type: 'مكية' },
    { num: 13,  name: 'الرعد',         type: 'مدنية' },
    { num: 14,  name: 'إبراهيم',       type: 'مكية' },
    { num: 15,  name: 'الحجر',         type: 'مكية' },
    { num: 16,  name: 'النحل',         type: 'مكية' },
    { num: 17,  name: 'الإسراء',       type: 'مكية' },
    { num: 18,  name: 'الكهف',         type: 'مكية' },
    { num: 19,  name: 'مريم',          type: 'مكية' },
    { num: 20,  name: 'طه',            type: 'مكية' },
    { num: 21,  name: 'الأنبياء',      type: 'مكية' },
    { num: 22,  name: 'الحج',          type: 'مدنية' },
    { num: 23,  name: 'المؤمنون',      type: 'مكية' },
    { num: 24,  name: 'النور',         type: 'مدنية' },
    { num: 25,  name: 'الفرقان',       type: 'مكية' },
    { num: 26,  name: 'الشعراء',       type: 'مكية' },
    { num: 27,  name: 'النمل',         type: 'مكية' },
    { num: 28,  name: 'القصص',         type: 'مكية' },
    { num: 29,  name: 'العنكبوت',      type: 'مكية' },
    { num: 30,  name: 'الروم',         type: 'مكية' },
    { num: 31,  name: 'لقمان',         type: 'مكية' },
    { num: 32,  name: 'السجدة',        type: 'مكية' },
    { num: 33,  name: 'الأحزاب',       type: 'مدنية' },
    { num: 34,  name: 'سبأ',           type: 'مكية' },
    { num: 35,  name: 'فاطر',          type: 'مكية' },
    { num: 36,  name: 'يس',            type: 'مكية' },
    { num: 37,  name: 'الصافات',       type: 'مكية' },
    { num: 38,  name: 'ص',             type: 'مكية' },
    { num: 39,  name: 'الزمر',         type: 'مكية' },
    { num: 40,  name: 'غافر',          type: 'مكية' },
    { num: 41,  name: 'فصلت',          type: 'مكية' },
    { num: 42,  name: 'الشورى',        type: 'مكية' },
    { num: 43,  name: 'الزخرف',        type: 'مكية' },
    { num: 44,  name: 'الدخان',        type: 'مكية' },
    { num: 45,  name: 'الجاثية',       type: 'مكية' },
    { num: 46,  name: 'الأحقاف',       type: 'مكية' },
    { num: 47,  name: 'محمد',          type: 'مدنية' },
    { num: 48,  name: 'الفتح',         type: 'مدنية' },
    { num: 49,  name: 'الحجرات',       type: 'مدنية' },
    { num: 50,  name: 'ق',             type: 'مكية' },
    { num: 51,  name: 'الذاريات',      type: 'مكية' },
    { num: 52,  name: 'الطور',         type: 'مكية' },
    { num: 53,  name: 'النجم',         type: 'مكية' },
    { num: 54,  name: 'القمر',         type: 'مكية' },
    { num: 55,  name: 'الرحمن',        type: 'مدنية' },
    { num: 56,  name: 'الواقعة',       type: 'مكية' },
    { num: 57,  name: 'الحديد',        type: 'مدنية' },
    { num: 58,  name: 'المجادلة',      type: 'مدنية' },
    { num: 59,  name: 'الحشر',         type: 'مدنية' },
    { num: 60,  name: 'الممتحنة',      type: 'مدنية' },
    { num: 61,  name: 'الصف',          type: 'مدنية' },
    { num: 62,  name: 'الجمعة',        type: 'مدنية' },
    { num: 63,  name: 'المنافقون',     type: 'مدنية' },
    { num: 64,  name: 'التغابن',       type: 'مدنية' },
    { num: 65,  name: 'الطلاق',        type: 'مدنية' },
    { num: 66,  name: 'التحريم',       type: 'مدنية' },
    { num: 67,  name: 'الملك',         type: 'مكية' },
    { num: 68,  name: 'القلم',         type: 'مكية' },
    { num: 69,  name: 'الحاقة',        type: 'مكية' },
    { num: 70,  name: 'المعارج',       type: 'مكية' },
    { num: 71,  name: 'نوح',           type: 'مكية' },
    { num: 72,  name: 'الجن',          type: 'مكية' },
    { num: 73,  name: 'المزمل',        type: 'مكية' },
    { num: 74,  name: 'المدثر',        type: 'مكية' },
    { num: 75,  name: 'القيامة',       type: 'مكية' },
    { num: 76,  name: 'الإنسان',       type: 'مدنية' },
    { num: 77,  name: 'المرسلات',      type: 'مكية' },
    { num: 78,  name: 'النبأ',         type: 'مكية' },
    { num: 79,  name: 'النازعات',      type: 'مكية' },
    { num: 80,  name: 'عبس',           type: 'مكية' },
    { num: 81,  name: 'التكوير',       type: 'مكية' },
    { num: 82,  name: 'الانفطار',      type: 'مكية' },
    { num: 83,  name: 'المطففين',      type: 'مكية' },
    { num: 84,  name: 'الانشقاق',      type: 'مكية' },
    { num: 85,  name: 'البروج',        type: 'مكية' },
    { num: 86,  name: 'الطارق',        type: 'مكية' },
    { num: 87,  name: 'الأعلى',        type: 'مكية' },
    { num: 88,  name: 'الغاشية',       type: 'مكية' },
    { num: 89,  name: 'الفجر',         type: 'مكية' },
    { num: 90,  name: 'البلد',         type: 'مكية' },
    { num: 91,  name: 'الشمس',         type: 'مكية' },
    { num: 92,  name: 'الليل',         type: 'مكية' },
    { num: 93,  name: 'الضحى',         type: 'مكية' },
    { num: 94,  name: 'الشرح',         type: 'مكية' },
    { num: 95,  name: 'التين',         type: 'مكية' },
    { num: 96,  name: 'العلق',         type: 'مكية' },
    { num: 97,  name: 'القدر',         type: 'مكية' },
    { num: 98,  name: 'البينة',        type: 'مدنية' },
    { num: 99,  name: 'الزلزلة',       type: 'مدنية' },
    { num: 100, name: 'العاديات',      type: 'مكية' },
    { num: 101, name: 'القارعة',       type: 'مكية' },
    { num: 102, name: 'التكاثر',       type: 'مكية' },
    { num: 103, name: 'العصر',         type: 'مكية' },
    { num: 104, name: 'الهمزة',        type: 'مكية' },
    { num: 105, name: 'الفيل',         type: 'مكية' },
    { num: 106, name: 'قريش',          type: 'مكية' },
    { num: 107, name: 'الماعون',       type: 'مكية' },
    { num: 108, name: 'الكوثر',        type: 'مكية' },
    { num: 109, name: 'الكافرون',      type: 'مكية' },
    { num: 110, name: 'النصر',         type: 'مدنية' },
    { num: 111, name: 'المسد',         type: 'مكية' },
    { num: 112, name: 'الإخلاص',       type: 'مكية' },
    { num: 113, name: 'الفلق',         type: 'مكية' },
    { num: 114, name: 'الناس',         type: 'مكية' }
];

// ═══════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ═══════════════════════════════════════════════════════════

// ✨ تزخرف اسم السورة باستخدام التطويل (كشيدة)
function zakhrifName(name) {
    const map = {
        'الفاتحة': 'الـفـاتـحـة',
        'آل عمران': 'آل عـمـران',
        'النساء': 'الـنـسـاء',
        'المائدة': 'الـمـائـدة',
        'الأنعام': 'الأنـعـام',
        'الأعراف': 'الأعـراف',
        'الأنفال': 'الأنـفـال',
        'التوبة': 'الـتـوبـة',
        'يونس': 'يـونـس',
        'هود': 'هـود',
        'يوسف': 'يـوسـف',
        'الرعد': 'الـرعـد',
        'إبراهيم': 'إبـراهـيـم',
        'الحجر': 'الـحـجـر',
        'النحل': 'الـنـحـل',
        'الإسراء': 'الإسـراء',
        'الكهف': 'الـكـهـف',
        'مريم': 'مـريـم',
        'طه': 'طـه',
        'الأنبياء': 'الأنـبـيـاء',
        'الحج': 'الـحـج',
        'المؤمنون': 'الـمـؤمـنـون',
        'النور': 'الـنـور',
        'الفرقان': 'الـفـرقـان',
        'الشعراء': 'الـشـعـراء',
        'النمل': 'الـنـمـل',
        'القصص': 'الـقـصـص',
        'العنكبوت': 'الـعـنـكـبـوت',
        'الروم': 'الـروم',
        'لقمان': 'لـقـمـان',
        'السجدة': 'الـسـجـدة',
        'الأحزاب': 'الأحـزاب',
        'سبأ': 'سـبـأ',
        'فاطر': 'فـاطـر',
        'يس': 'يـس',
        'الصافات': 'الـصـافـات',
        'ص': 'ص',
        'الزمر': 'الـزمـر',
        'غافر': 'غـافـر',
        'فصلت': 'فـصـلـت',
        'الشورى': 'الـشـورى',
        'الزخرف': 'الـزخـرف',
        'الدخان': 'الـدخـان',
        'الجاثية': 'الـجـاثـيـة',
        'الأحقاف': 'الأحـقـاف',
        'محمد': 'مـحـمـد',
        'الفتح': 'الـفـتـح',
        'الحجرات': 'الـحـجـرات',
        'ق': 'ق',
        'الذاريات': 'الـذاريـات',
        'الطور': 'الـطـور',
        'النجم': 'الـنـجـم',
        'القمر': 'الـقـمـر',
        'الرحمن': 'الـرحـمـن',
        'الواقعة': 'الـواقـعـة',
        'الحديد': 'الـحـديـد',
        'المجادلة': 'الـمـجـادلـة',
        'الحشر': 'الـحـشـر',
        'الممتحنة': 'الـمـمـتـحـنـة',
        'الصف': 'الـصـف',
        'الجمعة': 'الـجـمـعـة',
        'المنافقون': 'الـمـنـافـقـون',
        'التغابن': 'الـتـغـابـن',
        'الطلاق': 'الـطـلاق',
        'التحريم': 'الـتـحـريـم',
        'الملك': 'الـمـلـك',
        'القلم': 'الـقـلـم',
        'الحاقة': 'الـحـاقـة',
        'المعارج': 'الـمـعـارج',
        'نوح': 'نـوح',
        'الجن': 'الـجـن',
        'المزمل': 'الـمـزمـل',
        'المدثر': 'الـمـدثـر',
        'القيامة': 'الـقـيـامـة',
        'الإنسان': 'الإنسـان',
        'المرسلات': 'الـمـرسـلات',
        'النبأ': 'الـنـبـأ',
        'النازعات': 'الـنـازعـات',
        'عبس': 'عـبـس',
        'التكوير': 'الـتـكـويـر',
        'الانفطار': 'الانـفـطـار',
        'المطففين': 'الـمـطـفـفـيـن',
        'الانشقاق': 'الانـشـقـاق',
        'البروج': 'الـبـروج',
        'الطارق': 'الـطـارق',
        'الأعلى': 'الأعـلـى',
        'الغاشية': 'الـغـاشـيـة',
        'الفجر': 'الـفـجـر',
        'البلد': 'الـبـلـد',
        'الشمس': 'الـشـمـس',
        'الليل': 'الـلـيـل',
        'الضحى': 'الـضـحـى',
        'الشرح': 'الـشـرح',
        'التين': 'الـتـيـن',
        'العلق': 'الـعـلـق',
        'القدر': 'الـقـدر',
        'البينة': 'الـبـيـنـة',
        'الزلزلة': 'الـزلـزلـة',
        'العاديات': 'الـعـاديـات',
        'القارعة': 'الـقـارعـة',
        'التكاثر': 'الـتـكـاثـر',
        'العصر': 'الـعـصـر',
        'الهمزة': 'الـهـمـزة',
        'الفيل': 'الـفـيـل',
        'قريش': 'قـريـش',
        'الماعون': 'الـمـاعـون',
        'الكوثر': 'الـكـوثـر',
        'الكافرون': 'الـكـافـرون',
        'النصر': 'الـنـصـر',
        'المسد': 'الـمـسـد',
        'الإخلاص': 'الإخـلاص',
        'الفلق': 'الـفـلـق',
        'الناس': 'الـنـاس'
    };
    return map[name] || name;
}

// البحث عن سورة بالاسم أو الرقم
function findSurah(input) {
    const cleanInput = input
        .replace(/^ال/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة$/g, 'ه')
        .trim();

    // بحث بالرقم
    if (/^\d+$/.test(cleanInput)) {
        const num = parseInt(cleanInput, 10);
        return ALL_SURAHS.find(s => s.num === num) || null;
    }

    // بحث بالاسم
    let surah = ALL_SURAHS.find(s => {
        const cleanName = s.name
            .replace(/^ال/g, '')
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة$/g, 'ه');
        return cleanName === cleanInput;
    });

    if (!surah) {
        surah = ALL_SURAHS.find(s => {
            const cleanName = s.name
                .replace(/^ال/g, '')
                .replace(/[أإآ]/g, 'ا')
                .replace(/ة$/g, 'ه');
            return cleanName.includes(cleanInput);
        });
    }

    return surah || null;
}

// ═══════════════════════════════════════════════════════════
// 🎨 قائمة السور (114 سورة مباشرة)
// ═══════════════════════════════════════════════════════════

async function sendSurahsMenu(sock, chatId, message) {
    const totalSurahs = ALL_SURAHS.length;

    let text = `${SOLO_HEADER}\n\n`;
    text += `*📖 الـقـرآن الـكـࢪيـم*\n\n`;
    text += `*┋ اخـتـࢪ الـسـورة الـتـي تـࢪيـدهـا:*\n`;
    text += `*┋ مـن الـقـائـمـة أسـفـل 👇*\n\n`;
    text += `*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n\n`;
    text += `*📖 عـدد الـسـور : ${totalSurahs}*\n\n`;
    text += `*⚠️ ملاحظة: سورة البقرة غير متوفرة بسبب حجمها الكبير*\n\n`;
    text += `*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n\n`;
    text += `${SOLO_FOOTER}`;

    // ✨ أسماء السور بخط عريض مزخرف
    const rows = ALL_SURAHS.map(s => ({
        title: `◈ 📖 ${zakhrifName(s.name)} ◈`,
        description: `┋ رقم ${s.num} ┋ ${s.type} ┋`,
        id: `.سورة ${s.num}`
    }));

    const interactiveMessage = {
        body: { text },
        footer: { text: '𝐒 𝐎 𝐋 𝐎' },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📖 اخـتـࢪ الـسـورة',
                        sections: [
                            {
                                title: '📚 سـور الـقـرآن الـكـريـم',
                                rows
                            }
                        ]
                    })
                }
            ]
        }
    };

    const waMessage = generateWAMessageFromContent(
        chatId,
        { interactiveMessage },
        { userJid: sock.user?.id, quoted: message }
    );

    await sock.relayMessage(chatId, waMessage.message, {
        messageId: waMessage.key.id,
        additionalNodes: [
            {
                tag: "biz",
                attrs: {},
                content: [
                    {
                        tag: "interactive",
                        attrs: { type: "native_flow", v: "1" },
                        content: [
                            { tag: "native_flow", attrs: { v: "9", name: "mixed" } }
                        ]
                    }
                ]
            }
        ]
    });
}

// ═══════════════════════════════════════════════════════════
// 🎨 تحميل وإرسال السورة (نص + صوت)
// ═══════════════════════════════════════════════════════════

async function sendSurah(sock, chatId, message, surah) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📖", key: message.key } });

        // ─── جلب بيانات السورة من API ───
        const res = await axios.get(`https://api.alquran.cloud/v1/surah/${surah.num}/ar.alafasy`);
        const data = res.data.data;

        // ─── تجهيز نص السورة كاملاً ───
        let fullText = '';
        data.ayahs.forEach((ayah, i) => {
            let ayahText = ayah.text;

            // إزالة البسملة من أول آية (ما عدا الفاتحة والتوبة)
            if (i === 0 && surah.num !== 1 && surah.num !== 9) {
                ayahText = ayahText.replace(/^(بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ)\s*/, '').trim();
            }

            fullText += `*﴿ ${ayah.numberInSurah} ﴾ ${ayahText}*\n\n`;
        });

        // ─── ترويسة السورة (باسم مزخرف) ───
        let header = `${SOLO_HEADER}\n\n`;
        header += `*📖 سُـورَةُ ${zakhrifName(surah.name)} 📖*\n\n`;
        header += `*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n`;
        header += `*❀ الترتيب : رقم ${data.number}*\n`;
        header += `*✿ الآيات : ${data.numberOfAyahs} آية*\n`;
        header += `*✪ النزول : ${data.revelationType === 'Meccan' ? 'مكية 🕋' : 'مدنية 🕌'}*\n`;
        header += `*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n\n`;
        header += `*🎧 بـ صـوت الـقـاࢪئ : ياسر الدوسري*\n\n`;
        header += `*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n\n`;

        // ─── إرسال النص الكامل ───
        await sock.sendMessage(chatId, { text: header + fullText }, { quoted: message });

        // ─── رابط الصوت ───
        const formattedNumber = surah.num.toString().padStart(3, '0');
        const audioUrl = `https://download.quranicaudio.com/quran/yasser_ad-dussary/${formattedNumber}.mp3`;

        // ─── إرسال الصوت ───
        const response = await axios({
            method: 'GET',
            url: audioUrl,
            responseType: 'arraybuffer',
            timeout: 120000
        });

        const audioBuffer = Buffer.from(response.data);

        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

        return true;
    } catch (error) {
        console.error("❌ Surah Error:", error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, {
            text: `*❌ فـشـل إرسـال الـسـورة*\n📌 ${error.message}`
        }, { quoted: message });
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// ⚔️ COMMAND
// ═══════════════════════════════════════════════════════════

export default {
    name: "سورة",
    aliases: ["قران", "قرآن", "quran"],
    description: "نظام القرآن الكريم — نص + صوت",
    category: "إسلاميات",

    async run({ sock, message, args, reply, react }) {
        const chatId = message.key.remoteJid;

        try {
            await react("📖");

            // ─── بدون أوامر → عرض قائمة السور ───
            if (!args || args.length === 0) {
                await sendSurahsMenu(sock, chatId, message);
                return;
            }

            const input = args.join(' ').trim();

            // ─── اختيار برقم ───
            if (/^\d+$/.test(input)) {
                const num = parseInt(input, 10);

                // البقرة محذوفة
                if (num === 2) {
                    await react("⚠️");
                    return reply(`*⚠️ سـوࢪة الـبـقـࢪة غـيـࢪ مـتـوفـࢪة*\n\n📌 بـسـبـب حـجـمـهـا الـكـبـيـر الـذي يـمـنـع إࢪسـالـهـا عـبـࢪ الـواتـسـاب`);
                }

                const surah = findSurah(input);
                if (!surah) {
                    await react("❌");
                    return reply(`*❌ الـࢪقـم غـيـࢪ صـالـح*\n\n📌 مـن 1 لـ 114 (مـا عـدا الـبـقـࢪة)`);
                }

                await sendSurah(sock, chatId, message, surah);
                return;
            }

            // ─── اختيار بالاسم ───
            const surah = findSurah(input);

            if (!surah) {
                await react("❌");
                return reply(`*❌ الـسـورة غـيـࢪ مـوجـودة*\n\n📌 اكـتـب \`.سورة\` لـعـرض الـقـائـمـة`);
            }

            await sendSurah(sock, chatId, message, surah);

        } catch (error) {
            console.error("❌ Command Error:", error);
            await react("❌");
            await reply(`*❌ فـشـل الأمـر*\n📌 ${error.message}`);
        }
    }
};