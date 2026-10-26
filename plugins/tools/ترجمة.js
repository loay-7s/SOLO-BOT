// plugins/ترجمة.js
// 🌐 SOLO TRANSLATOR — نص + صور مترجمة 🌐
import axios from 'axios';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: "ترجمة",
    aliases: ["ترجم", "tr", "translate"],
    category: "tools",

    async run({ bot, message, args, reply }) {
        const jid = message.key.remoteJid;
        
        // ═══════════════════════════════════════════════
        // 🌐 خـريـطـة الـلـغـات
        // ═══════════════════════════════════════════════
        const languageMap = {
            'انجليزي': 'en', 'انجلش': 'en', 'إنجليزي': 'en', 'إنجليزية': 'en', 'انجيلزي': 'en',
            'الماني': 'de', 'ألماني': 'de', 'ألمانية': 'de', 'المانية': 'de',
            'فرنسي': 'fr', 'فرنساوي': 'fr', 'فرنسية': 'fr', 'فرنساوى': 'fr',
            'اسباني': 'es', 'أسباني': 'es', 'أسبانية': 'es', 'اسبانية': 'es',
            'تركي': 'tr', 'تركية': 'tr',
            'ايطالي': 'it', 'إيطالي': 'it', 'ايطالية': 'it',
            'روسي': 'ru', 'روسية': 'ru',
            'صيني': 'zh-CN', 'صينية': 'zh-CN',
            'ياباني': 'ja', 'يابانية': 'ja',
            'هندي': 'hi', 'هندية': 'hi',
            'كوري': 'ko', 'كورية': 'ko',
            'برتغالي': 'pt', 'برتغالية': 'pt',
            'هولندي': 'nl', 'هولندية': 'nl',
            'يوناني': 'el', 'يونانية': 'el',
            'عبري': 'he', 'عبرية': 'he',
            'فارسي': 'fa', 'فارسية': 'fa',
            'بولندي': 'pl', 'بولندية': 'pl',
            'فيتنامي': 'vi', 'فيتنامية': 'vi',
            'تايلاندي': 'th', 'تايلاندية': 'th',
            'اندونيسي': 'id', 'إندونيسي': 'id',
            'ماليزي': 'ms', 'ماليزية': 'ms',
            'سويدي': 'sv', 'سويدية': 'sv',
            'نرويجي': 'no', 'نرويجية': 'no',
            'دنماركي': 'da', 'دنماركية': 'da',
            'فنلندي': 'fi', 'فنلندية': 'fi',
            'روماني': 'ro', 'رومانية': 'ro',
            'مجري': 'hu', 'مجرية': 'hu',
            'اوكراني': 'uk', 'أوكراني': 'uk',
            'بنغالي': 'bn', 'بنغالية': 'bn',
            'بنجابي': 'pa', 'بنجابية': 'pa',
            'تاميلي': 'ta', 'تاميلية': 'ta',
            'اردو': 'ur', 'أردو': 'ur',
            'سواحيلي': 'sw', 'سواحيلية': 'sw',
            'تشيكي': 'cs', 'تشيكية': 'cs',
            'صربي': 'sr', 'صربية': 'sr',
            'بلغاري': 'bg', 'بلغارية': 'bg',
            'كرواتي': 'hr', 'كرواتية': 'hr',
            'سلوفاكي': 'sk', 'سلوفاكية': 'sk',
            'ليتواني': 'lt', 'ليتوانية': 'lt',
            'لاتفي': 'lv', 'لاتفية': 'lv',
            'استوني': 'et', 'إستونية': 'et',
            'سلوفيني': 'sl', 'سلوفينية': 'sl',
            'ايسلندي': 'is', 'أيسلندية': 'is',
            'الباني': 'sq', 'ألباني': 'sq',
            'ارمني': 'hy', 'أرميني': 'hy',
            'اذربيجاني': 'az', 'أذربيجاني': 'az',
            'جورجي': 'ka', 'جورجية': 'ka',
            'باسكي': 'eu', 'باسكية': 'eu',
            'بيلاروسي': 'be', 'بيلاروسية': 'be',
            'كاتالوني': 'ca', 'كاتالونية': 'ca',
            'إسبرانتو': 'eo', 'اسبرانتو': 'eo',
            'جاليكي': 'gl', 'جاليكية': 'gl',
            'غوجاراتي': 'gu', 'جوجراتي': 'gu',
            'هايتي': 'ht', 'هايتية': 'ht',
            'ايرلندي': 'ga', 'أيرلندي': 'ga',
            'كانادا': 'kn', 'كانادية': 'kn',
            'لاتيني': 'la', 'لاتينية': 'la',
            'مقدوني': 'mk', 'مقدونية': 'mk',
            'مالطي': 'mt', 'مالطية': 'mt',
            'ماوري': 'mi', 'ماورية': 'mi',
            'ويلزي': 'cy', 'ويلزية': 'cy',
            'يديشية': 'yi', 'يديشي': 'yi',
            'افريكاني': 'af', 'أفريكاني': 'af',
            'امهري': 'am', 'أمهري': 'am',
            'عربي': 'ar', 'عربية': 'ar',
            'كازاخي': 'kk', 'كازاخية': 'kk',
            'خميري': 'km', 'خميرية': 'km',
            'لاوي': 'lo', 'لاوية': 'lo',
            'مالايالامي': 'ml', 'مالايالامية': 'ml',
            'منغولي': 'mn', 'منغولية': 'mn',
            'ميانماري': 'my', 'ميانمارية': 'my',
            'نيبالي': 'ne', 'نيبالية': 'ne',
            'سنغالي': 'si', 'سنغالية': 'si',
            'صومالي': 'so', 'صومالية': 'so',
            'تاجيكي': 'tg', 'تاجيكية': 'tg',
            'اوزبكي': 'uz', 'أوزبكي': 'uz',
            'زولو': 'zu', 'زولوي': 'zu'
        };

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let textToTranslate = "";
        let targetLang = "ar";

        // تحديد اللغة الهدف
        let firstArg = args[0]?.replace(/[إأآا]/g, 'ا'); 
        let foundLang = Object.keys(languageMap).find(key => key.replace(/[إأآا]/g, 'ا') === firstArg);

        if (foundLang) {
            targetLang = languageMap[foundLang];
            args.shift();
        } else if (args[0] && args[0].length === 2) {
            targetLang = args[0].toLowerCase();
            if (targetLang === "eg") targetLang = "en";
            args.shift();
        }

        // ═══════════════════════════════════════════════
        // 🖼️ كـشـف الـصـورة
        // ═══════════════════════════════════════════════
        let quotedImage = null;
        if (quoted) {
            const unwrap = (msg) => {
                if (!msg) return null;
                if (msg.ephemeralMessage) return unwrap(msg.ephemeralMessage.message);
                if (msg.viewOnceMessage) return unwrap(msg.viewOnceMessage.message);
                if (msg.viewOnceMessageV2) return unwrap(msg.viewOnceMessageV2.message);
                return msg;
            };
            const content = unwrap(quoted);
            if (content?.imageMessage) quotedImage = content.imageMessage;
        }

        // ═══════════════════════════════════════════════
        // 🖼️ تـرجـمـة الـصـورة (رسم الترجمة على الصورة)
        // ═══════════════════════════════════════════════
        if (quotedImage) {
            try {
                await bot.sendMessage(jid, { react: { text: "🖼️", key: message.key } });

                // تحميل الصورة
                const stream = await downloadContentFromMessage(quotedImage, 'image');
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                const imageBuffer = Buffer.concat(chunks);

                await reply(`*⎔┄┄─ ⊱╎⌯ 🔍 ⌯╎⊰─┄┄⎔*
*┋ جـاري قـࢪاءة الـنـص مـن الـصـورة...* 🖼️
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

                // استخراج النص
                const { data: { text: extractedText } } = await Tesseract.recognize(
                    imageBuffer,
                    'eng+ara',
                    { logger: () => {} }
                );

                if (!extractedText?.trim()) {
                    await bot.sendMessage(jid, { react: { text: "❌", key: message.key } });
                    return reply(`*❌ مـفـيـش نـص واضـح فـي الـصـورة*`);
                }

                await reply(`*⎔┄┄─ ⊱╎⌯ 🌐 ⌯╎⊰─┄┄⎔*
*┋ جـاري تـࢪجـمـة وطـبـع الـنـص...* ✨
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

                // ترجمة النص
                const res = await axios.get(
                    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(extractedText.trim())}`
                );
                const translatedText = res.data[0].map(item => item[0]).join("");

                // ═══════════════════════════════════════
                // 🎨 رسـم الـتـرجـمـة عـلـى الـصـورة
                // ═══════════════════════════════════════
                const image = sharp(imageBuffer);
                const metadata = await image.metadata();
                const { width, height } = metadata;

                // قص النص لو طويل
                const lines = wrapText(translatedText, 40);
                const lineHeight = Math.max(28, Math.floor(width / 20));
                const padding = 20;
                const boxHeight = lines.length * lineHeight + padding * 2;
                const fontSize = Math.max(20, Math.floor(width / 22));

                // SVG overlay للنص
                const svgText = `
                <svg width="${width}" height="${boxHeight}">
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" rx="10"/>
                    ${lines.map((line, i) => `
                        <text x="50%" y="${padding + (i + 1) * lineHeight - 6}"
                            font-family="Arial, sans-serif"
                            font-size="${fontSize}"
                            font-weight="bold"
                            fill="white"
                            text-anchor="middle"
                            direction="${isRTL(targetLang) ? 'rtl' : 'ltr'}"
                        >${escapeXml(line)}</text>
                    `).join('')}
                </svg>`;

                const overlayBuffer = Buffer.from(svgText);

                // تركيب النص أسفل الصورة
                const translatedImage = await sharp(imageBuffer)
                    .extend({
                        bottom: boxHeight,
                        background: { r: 0, g: 0, b: 0, alpha: 1 }
                    })
                    .composite([{
                        input: overlayBuffer,
                        top: height,
                        left: 0
                    }])
                    .jpeg({ quality: 90 })
                    .toBuffer();

                await bot.sendMessage(jid, { react: { text: "✅", key: message.key } });

                // إرسال الصورة المترجمة
                await bot.sendMessage(jid, {
                    image: translatedImage,
                    caption: `*⎔┄┄─ ⊱╎⌯ 🌐 ⌯╎⊰─┄┄⎔*
*🏮┇ 𝐒𝐎𝐋𝐎 𝐓𝐑𝐀𝐍𝐒𝐋𝐀𝐓𝐎𝐑 ┇🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                }, { quoted: message });

                return;
            } catch (error) {
                console.error("❌ Image Translation Error:", error);
                await bot.sendMessage(jid, { react: { text: "❌", key: message.key } });
                return reply(`*❌ فـشـلـت تـࢪجـمـة الـصـورة*\n📌 ${error?.message || 'حاول تاني'}`);
            }
        }

        // ═══════════════════════════════════════════════
        // 📝 تـرجـمـة الـنـص الـعـادي
        // ═══════════════════════════════════════════════
        if (quoted) {
            textToTranslate = quoted.conversation || quoted.extendedTextMessage?.text || "";
        } else {
            textToTranslate = args.join(" ");
        }

        if (!textToTranslate) {
            return reply(`*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

   *🏮┇ 🌐 أمــࢪ الــتــرجــمــة ┇🏮*

*⎔┄┄─── ⊱⌯ 📖 ⌯⊰ ───┄┄⎔*

*┋ تـࢪجـمـة الـنـص :*
> *⬡ .ترجم فرنسي صباح الخير*

*┋ تـࢪجـمـة بـالـࢪد عـلـى ࢪسـالـة :*
> *⬡ اعـمـل ࢪيـبـلاي واكـتـب .ترجم عربي*

*┋ تـࢪجـمـة الـصـوࢪ 🖼️ :*
> *⬡ اعـمـل ࢪيـبـلاي عـلـى صـورة و اكـتـب .ترجم انجليزي*

*⎔┄┄─── ⊱⌯ 🌍 ⌯⊰ ───┄┄⎔*

*📌 يـدعـم أكـثـࢪ مـن 100 لـغـة 🌐*

*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        try {
            await bot.sendMessage(jid, { react: { text: "🌐", key: message.key } });

            const res = await axios.get(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
            );
            const translatedText = res.data[0].map(item => item[0]).join("");

            await bot.sendMessage(jid, { react: { text: "✅", key: message.key } });

            await bot.sendMessage(jid, { 
                text: `*${translatedText}*` 
            }, { quoted: message });

        } catch (error) {
            console.error("❌ Translation Error:", error);
            await bot.sendMessage(jid, { react: { text: "❌", key: message.key } });
            reply(`*❌ حـدث خـطـأ، تـأكـد مـن اسـم الـلـغـة أو الـنـص.*`);
        }
    }
};

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════

// تقسيم النص لأسطر
function wrapText(text, maxCharsPerLine) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines.slice(0, 8); // أقصى 8 أسطر
}

// تنظيف النص لـ SVG
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// كشف إذا كانت اللغة تُكتب من اليمين لليسار
function isRTL(lang) {
    return ['ar', 'he', 'fa', 'ur', 'yi'].includes(lang);
}