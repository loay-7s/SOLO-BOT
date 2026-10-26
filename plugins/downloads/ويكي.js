import axios from 'axios';

const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

export default {
    name: "ويكيبيديا",
    aliases: ["ويكي", "wiki", "موسوعة"],
    description: "البحث في ويكيبيديا العربية وعرض المقال كاملاً",
    category: "بحث",

    async run({ sock, message, args, reply, react }) {
        const jid = message.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🌐 مـوسـوعـة ويـكـيـبـيـديـا*

*───━━━⊱  📋  ⊰━━━───*

*┋ اكـتـب مـا تـريـد الـبـحـث عـنـه*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.ويكي ميسي*
📌 *.ويكي القاهرة*
📌 *.ويكي محمد صلاح*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🌐⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("🌐");

        try {
            // ✅ البحث الأول (بالاسم الأصلي)
            let searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&explaintext=1&titles=${encodeURIComponent(query)}&redirects=1&pithumbsize=1000`;
            
            let res = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'SOLO_BOT_OFFICIAL' }
            });

            let pages = res.data.query.pages;
            let pageId = Object.keys(pages)[0];

            // ✅ لو مفيش نتيجة، نحاول البحث بمسافة أو بتشكيل مختلف
            if (pageId === "-1") {
                const cleanQuery = query.replace(/[^\w\s]/g, '').trim();
                if (cleanQuery !== query) {
                    searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&explaintext=1&titles=${encodeURIComponent(cleanQuery)}&redirects=1&pithumbsize=1000`;
                    res = await axios.get(searchUrl, {
                        headers: { 'User-Agent': 'SOLO_BOT_OFFICIAL' }
                    });
                    pages = res.data.query.pages;
                    pageId = Object.keys(pages)[0];
                }
            }

            // ✅ لو مفيش نتيجة، نحاول البحث بالاسم الإنجليزي
            if (pageId === "-1") {
                try {
                    const translateApi = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=ar|en`;
                    const translateRes = await axios.get(translateApi);
                    if (translateRes.data.responseData?.translatedText) {
                        const englishName = translateRes.data.responseData.translatedText;
                        searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&explaintext=1&titles=${encodeURIComponent(englishName)}&redirects=1&pithumbsize=1000`;
                        res = await axios.get(searchUrl, {
                            headers: { 'User-Agent': 'SOLO_BOT_OFFICIAL' }
                        });
                        pages = res.data.query.pages;
                        pageId = Object.keys(pages)[0];
                    }
                } catch (e) {}
            }

            // ✅ لو مفيش نتيجة، نبحث باستخدام البحث الداخلي للويكيبيديا
            if (pageId === "-1") {
                try {
                    const searchApi = `https://ar.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1`;
                    const searchRes = await axios.get(searchApi, {
                        headers: { 'User-Agent': 'SOLO_BOT_OFFICIAL' }
                    });
                    
                    if (searchRes.data.query?.search?.length > 0) {
                        const title = searchRes.data.query.search[0].title;
                        searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&explaintext=1&titles=${encodeURIComponent(title)}&redirects=1&pithumbsize=1000`;
                        res = await axios.get(searchUrl, {
                            headers: { 'User-Agent': 'SOLO_BOT_OFFICIAL' }
                        });
                        pages = res.data.query.pages;
                        pageId = Object.keys(pages)[0];
                    }
                } catch (e) {}
            }

            if (pageId === "-1") {
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ لـم أجـد هـذا الـمـوضـوع*

*───━━━⊱  🔍  ⊰━━━───*

*┋ تـأكـد مـن كـتـابـة الاسـم بـشـكـل صـحـيـح*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🌐⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            let fullContent = pages[pageId].extract || '';
            const title = pages[pageId].title || query;
            const thumbnail = pages[pageId].thumbnail?.source || 'https://i.imgur.com/8TnZ4Rv.png';

            // ✅ تنظيف المقال
            fullContent = fullContent.replace(/\[\d+\]/g, ''); // إزالة المراجع
            fullContent = fullContent.replace(/\n{3,}/g, '\n\n'); // تقليل الأسطر الفارغة

            // ✅ حساب عدد الأجزاء (5 رسائل كحد أقصى)
            const MAX_PARTS = 5;
            const CHARS_PER_PART = 3800; // حوالي 3800 حرف لكل جزء (آمن للواتساب)
            
            let chunks = [];
            
            // ✅ لو النص طويل، نقسمه
            if (fullContent.length > CHARS_PER_PART) {
                // تقسيم باستخدام الفقرات
                const paragraphs = fullContent.split('\n\n');
                let currentChunk = '';
                
                for (const para of paragraphs) {
                    // لو إضافة الفقرة هتعدي الحد الأقصى للشخصيات، نحفظ الجزء الحالي ونبدأ جزء جديد
                    if ((currentChunk + para).length > CHARS_PER_PART && currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = para;
                    } else {
                        currentChunk += (currentChunk ? '\n\n' : '') + para;
                    }
                }
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                }
                
                // ✅ لو عدد الأجزاء أكبر من 5، ندمج النص في 5 أجزاء متساوية
                if (chunks.length > MAX_PARTS) {
                    const totalChars = fullContent.length;
                    const charsPerPart = Math.ceil(totalChars / MAX_PARTS);
                    chunks = [];
                    
                    let start = 0;
                    for (let i = 0; i < MAX_PARTS; i++) {
                        let end = Math.min(start + charsPerPart, fullContent.length);
                        // نحاول نقص عند نهاية جملة (نقطة أو فاصلة)
                        if (end < fullContent.length) {
                            const lastPeriod = fullContent.lastIndexOf('.', end);
                            const lastNewLine = fullContent.lastIndexOf('\n\n', end);
                            const lastComma = fullContent.lastIndexOf('،', end);
                            const lastSlash = fullContent.lastIndexOf('/', end);
                            const cutPoint = Math.max(lastPeriod, lastNewLine, lastComma, lastSlash);
                            if (cutPoint > start + 500) {
                                end = cutPoint + 1;
                            }
                        }
                        chunks.push(fullContent.substring(start, end).trim());
                        start = end;
                    }
                }
            } else {
                chunks.push(fullContent);
            }

            // ✅ التأكد من أن عدد الأجزاء لا يتجاوز 5
            if (chunks.length > MAX_PARTS) {
                // لو لسه أكبر من 5، نجبرهم على 5 أجزاء
                const totalChars = fullContent.length;
                const charsPerPart = Math.ceil(totalChars / MAX_PARTS);
                chunks = [];
                for (let i = 0; i < MAX_PARTS; i++) {
                    const start = i * charsPerPart;
                    const end = Math.min(start + charsPerPart, fullContent.length);
                    chunks.push(fullContent.substring(start, end).trim());
                }
            }

            const totalParts = chunks.length;

            // ✅ إرسال الجزء الأول مع الصورة والهيدر (رسالة واحدة)
            const header = `*⎔┄┄─── ⊱╎⌯ 🌐 ⌯╎⊰ ───┄┄⎔*

   *🏮┇ مـوسـوعـة ويـكـيـبـيـديـا ┇🏮*

*⎔┄┄─── ⊱╎⌯ 📋 ⌯╎⊰ ───┄┄⎔*

*┋ الـمـوضـوع : ⦓ ${title} ⦔*

*⎔┄┄─── ⊱╎⌯ 📝 ⌯╎⊰ ───┄┄⎔*`;

            const firstPart = `${header}\n\n${chunks[0]}\n\n*⎔┄┄─── ⊱╎⌯ 📊 ⌯╎⊰ ───┄┄⎔*\n*┋ (1/${totalParts})*`;

            // ✅ إرسال أول جزء مع الصورة
            await sock.sendMessage(jid, {
                image: { url: thumbnail },
                caption: firstPart,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: false,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: SOLO_CHANNEL_ID,
                        serverMessageId: 1,
                        newsletterName: '𝑺𝑶𝑳𝑶'
                    }
                }
            }, { quoted: message });

            // ✅ إرسال باقي الأجزاء (2-5)
            for (let i = 1; i < chunks.length; i++) {
                if (i >= MAX_PARTS) break; // ✅ حد أقصى 5 رسائل
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const partText = `*⎔┄┄─── ⊱╎⌯ 📝 ⌯╎⊰ ───┄┄⎔*\n\n${chunks[i]}\n\n*⎔┄┄─── ⊱╎⌯ 📊 ⌯╎⊰ ───┄┄⎔*\n*┋ (${i + 1}/${totalParts})*`;
                
                await sock.sendMessage(jid, {
                    text: partText,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                }, { quoted: message });
            }

            // ✅ إرسال الرابط في آخر رسالة
            const footer = `*⎔┄┄─── ⊱╎⌯ 🔗 ⌯╎⊰ ───┄┄⎔*

*┋ الـرابـط الـكـامـل :*
https://ar.wikipedia.org/wiki/${encodeURIComponent(title)}

*⎔┄┄─ ⊱╎⌯ 🌐 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🌐⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.sendMessage(jid, {
                text: footer,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: false,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: SOLO_CHANNEL_ID,
                        serverMessageId: 1,
                        newsletterName: '𝑺𝑶𝑳𝑶'
                    }
                }
            }, { quoted: message });

            await react("✅");

        } catch (error) {
            console.error("❌ Wikipedia Error:", error);
            await react("❌");
            await reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ فـشـل الـبـحـث*

*───━━━⊱  ⚠️  ⊰━━━───*

*📌 اسـم الـشـخـصـيـة غـيـر صـحـيـح، تـأكـد مـن صـحـة الاسـم و تـأكـد ان الـشـخـصـيـة مـعـࢪوفـة.*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🌐⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
    }
};