// plugins/عملة.js
// ⚔️ SOLO CURRENCY CONVERTER ⚔️

import axios from 'axios';

export default {
    name: "عملة",
    aliases: ["صرف", "عمله", "currency"],
    category: "tools",
    description: "تحويل العملات بين جميع العملات العالمية",

    async run({ sock, message, args, reply, react }) {
        const chatId = message.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            await react("🪙");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 🪙 تـحـويـل الـعـمـلات*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 اكـتـب الـمـبـلـغ والـعـمـلات*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.عملة 100 دولار الى مصري*
📌 *.عملة 50 يورو الى ريال*
📌 *.عملة 1000 جنيه الى دولار*

*📌 يـعـمـل مـع جـمـيـع الـعـمـلات*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("🪙");

        // 🌍 القاموس العملاق (55 عملة بأسماء كاملة)
        const currencyMap = {
            // عملات عربية
            "جنيه": { code: "EGP", full: "جنيه مصري" },
            "مصري": { code: "EGP", full: "جنيه مصري" },
            "ريال": { code: "SAR", full: "ريال سعودي" },
            "سعودي": { code: "SAR", full: "ريال سعودي" },
            "درهم": { code: "AED", full: "درهم إماراتي" },
            "اماراتي": { code: "AED", full: "درهم إماراتي" },
            "دينار": { code: "KWD", full: "دينار كويتي" },
            "كويتي": { code: "KWD", full: "دينار كويتي" },
            "قطري": { code: "QAR", full: "ريال قطري" },
            "بحريني": { code: "BHD", full: "دينار بحريني" },
            "عماني": { code: "OMR", full: "ريال عماني" },
            "اردني": { code: "JOD", full: "دينار أردني" },
            "عراقي": { code: "IQD", full: "دينار عراقي" },
            "مغربي": { code: "MAD", full: "درهم مغربي" },
            "جزائري": { code: "DZD", full: "دينار جزائري" },
            "تونسي": { code: "TND", full: "دينار تونسي" },
            "ليبي": { code: "LYD", full: "دينار ليبي" },
            "لبناني": { code: "LBP", full: "ليرة لبنانية" },
            "سوري": { code: "SYP", full: "ليرة سورية" },
            "سوداني": { code: "SDG", full: "جنيه سوداني" },
            "يمني": { code: "YER", full: "ريال يمني" },
            "موريتاني": { code: "MRU", full: "أوقية موريتانية" },
            "فلسطيني": { code: "ILS", full: "شيكل" },

            // عملات عالمية
            "دولار": { code: "USD", full: "دولار أمريكي" },
            "امريكي": { code: "USD", full: "دولار أمريكي" },
            "يورو": { code: "EUR", full: "يورو أوروبي" },
            "اوروبي": { code: "EUR", full: "يورو أوروبي" },
            "استرليني": { code: "GBP", full: "جنيه إسترليني" },
            "بريطاني": { code: "GBP", full: "جنيه إسترليني" },
            "ين": { code: "JPY", full: "ين ياباني" },
            "ياباني": { code: "JPY", full: "ين ياباني" },
            "يوان": { code: "CNY", full: "يوان صيني" },
            "صيني": { code: "CNY", full: "يوان صيني" },
            "كندي": { code: "CAD", full: "دولار كندي" },
            "استرالي": { code: "AUD", full: "دولار أسترالي" },
            "سويسري": { code: "CHF", full: "فرنك سويسري" },
            "روسي": { code: "RUB", full: "روبل روسي" },
            "تركي": { code: "TRY", full: "ليرة تركية" },
            "هندي": { code: "INR", full: "روبية هندية" },
            "برازيلي": { code: "BRL", full: "ريال برازيلي" },
            "جنوب_افريقي": { code: "ZAR", full: "راند جنوب أفريقي" },
            "كوري": { code: "KRW", full: "وون كوري" },
            "مكسيكي": { code: "MXN", full: "بيزو مكسيكي" },
            "سنغافوري": { code: "SGD", full: "دولار سنغافوري" },
            "سويدي": { code: "SEK", full: "كرونة سويدية" },
            "نرويجي": { code: "NOK", full: "كرونة نرويجية" },
            "دنماركي": { code: "DKK", full: "كرونة دنماركية" },
            "نيوزيلندي": { code: "NZD", full: "دولار نيوزيلندي" },
            "هونج_كونج": { code: "HKD", full: "دولار هونج كونج" },
            "ماليزي": { code: "MYR", full: "رينغيت ماليزي" },
            "تايلاندي": { code: "THB", full: "بات تايلاندي" },
            "اندونيسي": { code: "IDR", full: "روبية إندونيسية" },
            "فلبيني": { code: "PHP", full: "بيزو فلبيني" },
            "باكستاني": { code: "PKR", full: "روبية باكستانية" },
            "فيتنامي": { code: "VND", full: "دونغ فيتنامي" },
            "نيجيري": { code: "NGN", full: "نايرا نيجيرية" }
        };

        try {
            // ✅ استخراج المبلغ
            const amount = query.match(/\d+(\.\d+)?/)?.[0];
            const parts = query.replace(/[0-9.]/g, '').split(/\s+/);
            
            let fromData, toData;

            for (let word of parts) {
                if (currencyMap[word]) {
                    if (!fromData) fromData = currencyMap[word];
                    else if (fromData && fromData.code !== currencyMap[word].code) toData = currencyMap[word];
                }
            }

            if (!amount || !fromData || !toData) {
                await react("❌");
                return reply(`*❌ لـم افـهـم الـعـمـلات الـمـطـلـوبـة بـوضـوح*\n📌 *.عملة 100 دولار الى مصري*`);
            }

            // ✅ جلب سعر الصرف
            const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromData.code}`);
            const rate = res.data.rates[toData.code];
            
            if (!rate) {
                await react("❌");
                return reply(`*❌ عـمـلـة غـيـر مـعـروفـة*`);
            }

            // ✅ النتيجة
            const result = (amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const formattedRate = rate.toLocaleString('en-US', { minimumFractionDigits: 4 });

            // ✅ رسالة SOLO
            const exchangeText = `*⎔┄┄─── ⊱╎⌯ 🪙 ⌯╎⊰ ───┄┄⎔*

   *🏮┇ تـحـويـل الـعـمـلات ┇🏮*

*⎔┄┄─── ⊱╎⌯ 💰 ⌯╎⊰ ───┄┄⎔*

*┋ الـمـبـلـغ : ⦓ ${amount} ${fromData.full} ⦔*

*┋ الـعـمـلـة الـمـطـلـوبـة : ⦓ ${toData.full} ⦔*

*⎔┄┄─── ⊱╎⌯ 📊 ⌯╎⊰ ───┄┄⎔*

*┋ الـنـتـيـجـة : ⦓ ${result} ${toData.full} ⦔*

*┋ سـعـر الـصـرف : ⦓ 1 ${fromData.full.split(' ')[0]} = ${formattedRate} ${toData.full.split(' ')[0]} ⦔*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await reply(exchangeText);
            await react("✅");

        } catch (error) {
            console.error("❌ Currency Error:", error);
            await react("❌");
            
            let errorMsg = 'حـاول مـرة اخـرى';
            if (error.code === 'ECONNABORTED') {
                errorMsg = 'انـتـهـى وقـت الاتـصـال، حـاول مـرة اخـرى';
            } else if (error.response?.status === 429) {
                errorMsg = 'تـم تـجـاوز حـد الاسـتـخـدام، حـاول بـعـد قـلـيـل';
            }

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل تـحـويـل الـعـمـلات*
*┋ السـبب: ${errorMsg}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};