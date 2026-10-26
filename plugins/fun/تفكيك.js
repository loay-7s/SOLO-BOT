// plugins/تفكيك_مستمر.js
// ⚔️ SOLO CONTINUOUS WORD SCRAMBLE EVENT ⚔️

import fs from 'fs-extra';
import path from 'path';

const STATS_FILE = path.join(process.cwd(), 'data', 'scramble_stats.json');

fs.ensureDirSync(path.join(process.cwd(), 'data'));
if (!fs.existsSync(STATS_FILE)) {
    fs.writeJsonSync(STATS_FILE, {});
}

const legends = [
    // ... نفس القائمة بتاعة كتابة ...
    "لوفي", "زورو", "سانجي", "ترافلجار لاو", "ايس", "سابو", "شانكس", "ميهوك", "كايدو", "كاتاكوري",
    "دوفلامنجو", "كروكودايل", "اينيل", "رايلاي", "دراجون", "يوسوب", "نامي", "نيكو روبين", "فرانكي",
    "بروك", "جينبي", "ماركو", "ياماتو", "كوزوكي اودين", "بوني", "كوبي", "سينتومارو", "بيروسبيرو", "ارلونج",
    "سموكر", "تاشيجي", "ناروتو", "ساسكي", "ساكورا", "كاكاشي", "ايتاتشي", "مادارا", "اوبيتو", "شيسوي",
    "باين", "ناجاتو", "جيرايا", "تسونادي", "اوروتشيمارو", "ميناتو", "جارا", "هيدان", "كاكوزو", "ديتارا",
    "ساسوري", "كيسامي", "كونان", "زيتسو", "هاشيراما", "توبيراما", "هيروزين", "كيلر بي", "جين", "روفاي",
    "شيكامارو", "هيناتا", "تانجيرو", "نيزوكو", "زينيتسو", "اينوسكي", "رينجوكو", "توميوكا", "شينوبو",
    "اوزوي", "مويتشيرو", "ميتسوري", "اوباناي", "سانيمي", "جيومي", "موزان", "اكازا", "دوما", "كوكوشيبو",
    "هانتنج", "يوشيترو", "سابيتو", "جوكو", "فيجيتا", "جوهان", "ترانكس", "برولي", "فريزا", "سيل",
    "بو", "بيروس", "ويس", "جيرين", "هيت", "زاماسو", "بلاك", "جوتينكس", "فيجيتو", "جوجيتا",
    "كيرلين", "بيكولو", "تينشينهان", "يامتشا", "كانساي", "تشاويتسو", "نابا", "راديتز",
    "ايرين", "ميكاسا", "ليفاي", "ارمين", "اروين", "راينر", "برنو", "هيستوريا", "جان", "ساشا",
    "كوني", "اني", "ماركو", "لايشنر", "فالكو", "جوجو", "سوكونا", "ايتادوري", "ميغومي", "نوبارا",
    "ماكي", "نانامي", "توجي", "جيتو", "تشوسو", "ماهيتو", "هانامي", "داجون", "اينوماكي",
    "جون", "كيلوا", "كرابيكا", "ليوريو", "هيسوكا", "كرولو", "ميرويم", "نيتيرو", "بيتو", "يوبي",
    "بوف", "شيايا", "بيسكي", "جين", "ايلومي", "كانيكي", "توكا", "جوزو", "اياتو", "ريز",
    "اريميا", "اويكاي", "هيسا", "تاتسومي", "ياموري", "سوبارو", "اميليا", "ريم", "رام",
    "باتيلش", "روسوال", "بياتريس", "فريدريكا", "بيتكي", "الديرا", "سايتاما", "جينوس",
    "جارو", "تاتسوماكي", "بلاست", "سونيك", "كينج", "فوبوكي", "ياجاما", "موب",
    "استا", "يونو", "يامي", "نويل", "يوليوس", "ليخت", "جاك", "فانيسا", "فينكس", "ميموزا",
    "لايت", "ريوك", "نير", "ميلو", "ميسا", "ال", "سويتشيرو", "ماتسودا",
    "ايتشيغو", "بياكويا", "ايزن", "رينجي", "هيتسوغايا", "يورويتشي", "اوهانا", "كينباتشي",
    "اوراهارا", "يوشيكو", "جينريوساي", "سوي فيونغ", "ناتسو", "لوسي", "ايرزا", "جري",
    "جيرال", "زيريف", "ماكاروف", "جاجيل", "ويندي", "ليكسوس", "ميليوداس", "بان",
    "اسكانور", "ميرلين", "دين", "كينغ", "جوان", "اليزابيث", "هيندريكسون", "زيدراس",
    "باكتو", "ميدوريا", "تودوروكي", "شيغاراكي", "دابي", "توجا", "انديفور", "هوكيز",
    "اول مايت", "اوراكا", "ايدا", "اسوي", "كيريشيما", "مينيتا", "يوكو",
    "ليلوش", "سوزاكو", "سي سيل", "كوروفيا", "يويتشي", "ادوارد", "الفونس",
    "موستانج", "وينري", "سكار", "الين", "لينالي", "كافا", "كراون", "تيكي",
    "ماكا", "سول", "بلاك", "سيد", "باتي", "فاش ذا ستامبيد", "نيكولاس",
    "ميريل", "ميلي", "كنوبس", "سبايك", "جيت", "فاي", "اد", "اين",
    "شينجي", "ري", "اسكا", "ميساتو", "جيندو"
];

// ✅ دالة تفكيك الكلمة
function getScrambled(word) {
    return word.split('').join(' '); // "لوفي" → "ل و ف ي"
}

// ✅ دالة بدء جولة جديدة (نفس كتابة بالضبط)
export function startNewRound(sock, chatId, m) {
    const word = legends[Math.floor(Math.random() * legends.length)];
    const scrambled = getScrambled(word); // ✅ الإجابة الصحيحة = المفككة

    const design = `
*★┇فـ⛓️‍💥ـعـالـيـة تـفـكـيـك مـسـتـمـرة┇★*
*⎔┄┄── ⊱╎⌯🏮⌯╎⊰ ──┄┄⎔*

*⌠📜⌡ اڶـــــڜــــڔحۡ ↯*
*❑ فكك الكلمة التالية أسرع واحد يفوز🍷*
 
*⎈┆الـكـلـمـ🍷ــة :*
                      
                        *〖 ${word} 〗*


*💰 الـجـائـزة : 10 عـمـلات + 1 نـقـطة*

*⎔┄┄── ⊱╎⌯🏮⌯╎⊰ ──┄┄⎔*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

    sock.sendMessage(chatId, { text: design }, { quoted: m });

    global.scrambleEvent = global.scrambleEvent || {};
    global.scrambleEvent[chatId] = {
        answer: scrambled,  // ✅ الإجابة الصحيحة = "ل و ف ي"
        active: true,
        winner: null,
        startTime: Date.now(),
        sock: sock,
        m: m,
        chatId: chatId
    };

    if (global.scrambleEvent[chatId].timer) {
        clearTimeout(global.scrambleEvent[chatId].timer);
    }

    global.scrambleEvent[chatId].timer = setTimeout(() => {
        if (global.scrambleEvent[chatId] && global.scrambleEvent[chatId].active) {
            
            let stats = {};
            try {
                stats = fs.readJsonSync(STATS_FILE, { throws: false }) || {};
            } catch {
                stats = {};
            }
            
            if (stats[chatId]) {
                for (const userJid in stats[chatId]) {
                    stats[chatId][userJid].points = 0;
                }
                fs.writeJsonSync(STATS_FILE, stats, { spaces: 2 });
            }
            
            sock.sendMessage(chatId, {
                text: `*⌠⏰⌡ انـتـهـى وقـت الـجـولـة!*\n*┋ تـم تـصـفـيـر الـنـقـاط* ✅\n*🔄 جـاري بـدء جـولـة جـديـدة...*`
            });
            global.scrambleEvent[chatId].active = false;
            setTimeout(() => {
                if (global.scrambleEvent && global.scrambleEvent[chatId]) {
                    startNewRound(sock, chatId, m);
                }
            }, 2000);
        }
    }, 60000);
}

export default {
    name: "تفكيك",
    aliases: ["تفكيك مستمر", "فك مستمر", "فعالية تفكيك"],
    description: "فعالية تفكيك مستمرة - أول واحد يفك الكلمة يفوز بـ 10 عملات",
    category: "games",

    async run({ sock, m, args, reply, react, userJid }) {
        const chatId = m.key.remoteJid;
        const subCommand = args.join(' ');

        const stopCommands = ['ايقاف', 'إيقاف', 'وقف', 'stop', 'قف'];
        if (stopCommands.some(cmd => subCommand.includes(cmd))) {
            if (global.scrambleEvent && global.scrambleEvent[chatId]) {
                if (global.scrambleEvent[chatId].timer) {
                    clearTimeout(global.scrambleEvent[chatId].timer);
                }
                
                let stats = {};
                try {
                    stats = fs.readJsonSync(STATS_FILE, { throws: false }) || {};
                } catch {
                    stats = {};
                }
                
                if (stats[chatId]) {
                    for (const userJid in stats[chatId]) {
                        stats[chatId][userJid].points = 0;
                    }
                    fs.writeJsonSync(STATS_FILE, stats, { spaces: 2 });
                }
                
                delete global.scrambleEvent[chatId];
                await react("⏹️");
                return reply(`*⎔┄┄─ ⊱╎⌯ ⏹️ ⌯╎⊰─┄┄⎔*
*┋ تـم إيـقـاف فـعـالـيـة الـتـفـكـيـك*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
            } else {
                return reply(`*❌ لا تـوجـد فـعـالـيـة تـفـكـيـك لـإيـقـافـهـا*`);
            }
        }

        if (global.scrambleEvent && global.scrambleEvent[chatId]) {
            return reply(`*⚠️ هـنـاك فـعـالـيـة تـفـكـيـك مـسـتـمـرة قـائـمـة!*`);
        }

        await react("⛓️‍💥");

        startNewRound(sock, chatId, m);

        await reply(`*⎔┄┄─ ⊱╎⌯ ⛓️‍💥 ⌯╎⊰─┄┄⎔*
*┋ تـم بـدء فـعـالـيـة الـتـفـكـيـك الـمـسـتـمـرة*
*┋ فـكـك الـكـلـمـة لـتـفـوز*
*┋ لـإيـقـاف : اكـتـب ".فعالية ايقاف"*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
    }
};