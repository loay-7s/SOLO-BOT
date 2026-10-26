// plugins/مانهوا.js
// ⚔️ SOLO MANHWA DOWNLOADER ⚔️

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://engez.a7a.online/api/v1';
const MANHWA_ENDPOINT = `${API_BASE}/anime/manhwa`;
const TRANSLATE_ENDPOINT = `${API_BASE}/tools/translate`;
const MAX_CHAPTERS = 10;

// ✅ كشف إذا كان النص فيه حروف عربية
function hasArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
}

// ✅ ترجمة النص للعربي (لو فيه عربي)
async function translateToEnglish(text) {
    try {
        const url = `${TRANSLATE_ENDPOINT}?text=${encodeURIComponent(text)}&to=en`;
        const { data } = await axios.get(url, { timeout: 15000 });
        
        if (data?.success && data?.response) {
            // الـ response ممكن يكون نص أو object
            if (typeof data.response === 'string') {
                return data.response;
            }
            if (data.response.translated || data.response.text) {
                return data.response.translated || data.response.text;
            }
            if (data.response.result) {
                return data.response.result;
            }
        }
        
        return text;
    } catch (error) {
        console.error('Translation error:', error.message);
        return text;
    }
}

// ✅ البحث
async function searchManhwa(query) {
    const apiUrl = `${MANHWA_ENDPOINT}?action=${encodeURIComponent('بحث')}&q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(apiUrl, { timeout: 30000 });
    if (data?.success && data.response?.results?.length > 0) {
        return data.response.results;
    }
    return [];
}

// ✅ جلب الفصول
async function getChapters(seriesId) {
    const apiUrl = `${MANHWA_ENDPOINT}?action=${encodeURIComponent('فصول')}&id=${encodeURIComponent(seriesId)}`;
    const { data } = await axios.get(apiUrl, { timeout: 30000 });
    if (data?.success && data.response?.results?.length > 0) {
        return data.response.results;
    }
    return [];
}

// ✅ جلب الفصل كامل
async function getChapter(chapterId) {
    const apiUrl = `${MANHWA_ENDPOINT}?action=${encodeURIComponent('فصل')}&id=${encodeURIComponent(chapterId)}`;
    const { data } = await axios.get(apiUrl, { timeout: 30000 });
    if (data?.success && data.response?.images?.length > 0) {
        return data.response;
    }
    return null;
}

// ✅ تحويل الفصول لـ PDF (مع ضغط الصور)
async function createPDF(seriesTitle, chapters) {
    return new Promise(async (resolve, reject) => {
        try {
            const tempDir = path.join(__dirname, '../temp');
            fs.ensureDirSync(tempDir);
            const pdfPath = path.join(tempDir, `${Date.now()}.pdf`);

            const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
            const stream = fs.createWriteStream(pdfPath);
            doc.pipe(stream);

            let addedPages = 0;

            for (const chap of chapters) {
                const chapterData = await getChapter(chap.id);
                if (!chapterData) continue;

                for (const img of chapterData.images) {
                    try {
                        const res = await axios.get(img.image, {
                            responseType: 'arraybuffer',
                            timeout: 30000,
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });

                        const buffer = await sharp(Buffer.from(res.data))
                            .jpeg({
                                quality: 25,
                                mozjpeg: true,
                                chromaSubsampling: '4:2:0'
                            })
                            .resize(700, null, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .toBuffer();

                        const meta = await sharp(buffer).metadata();
                        if (!meta.width || !meta.height) continue;

                        doc.addPage({ size: [meta.width, meta.height] });
                        doc.image(buffer, 0, 0, { width: meta.width, height: meta.height });
                        addedPages++;
                    } catch (e) {
                        console.error('Skipping image:', e.message);
                    }
                }
            }

            if (addedPages === 0) {
                doc.destroy();
                reject(new Error('فشل تحميل الصور'));
                return;
            }

            doc.end();

            stream.on('finish', () => {
                const pdfBytes = fs.readFileSync(pdfPath);
                fs.unlinkSync(pdfPath);
                resolve(pdfBytes);
            });

            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
}

// ✅ استخراج اسم المانهوا + نطاق الفصول من النص
function parseQuery(input) {
    const text = String(input || '').trim();

    // النمط 1: "اسم المانهوا 11/20" أو "اسم المانهوا 11-20"
    const rangeMatch = text.match(/(.+?)\s+(\d+)\s*[\/\-]\s*(\d+)\s*$/);
    if (rangeMatch) {
        const name = rangeMatch[1].trim();
        const from = parseInt(rangeMatch[2]);
        const to = parseInt(rangeMatch[3]);
        return { name, from, to, single: null };
    }

    // النمط 2: "اسم المانهوا 10" (فصل واحد)
    const singleMatch = text.match(/(.+?)\s+(\d+)\s*$/);
    if (singleMatch) {
        const name = singleMatch[1].trim();
        const chapter = parseInt(singleMatch[2]);
        return { name, from: chapter, to: chapter, single: chapter };
    }

    // نمط 3: "اسم المانهوا" (كل الفصول - أول 10)
    return { name: text, from: null, to: null, single: null };
}

export default {
    name: "مانهوا",
    aliases: ["manhwa"],
    description: "تحميل المانهوا كاملة PDF (مضغوطة)",
    category: "تحميل",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const rawInput = args.join(' ').trim();

        if (!rawInput) {
            await react("📖");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
   *│ 📖 تـحـمـيـل مـانـهـوا PDF*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 اكتب اسم المانهوا*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📌 الأوامـࢪ:*

*⬡ .مانهوا solo leveling*
> *(أول 10 فصول)*

*⬡ .مانهوا solo leveling 5*
> *(الفصل 5 فقط)*

*⬡ .مانهوا solo leveling 11/20*
> *(من الفصل 11 لـ 20)*

*⬡ .مانهوا سولو ليفلينج*
> *(بالعربي - يتم الترجمة تلقائياً)*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*⚠️ الـحـد الأقـصـى : ${MAX_CHAPTERS} فصول*

*🌐 يـتـم تـࢪجـمـة الأسـمـاء الـعـࢪبـيـة تـلـقـائـيـاً*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("⏳");

        const parsed = parseQuery(rawInput);
        let seriesName = parsed.name;

        // ═══════════════════════════════════════════════
        // ✅ الترجمة التلقائية للعربي
        // ═══════════════════════════════════════════════
        let searchName = seriesName;
        let wasTranslated = false;

        if (hasArabic(seriesName)) {
            await reply(`*⎔┄┄─ ⊱╎⌯ 🌐 ⌯╎⊰─┄┄⎔*\n*┋ جـاري تـࢪجـمـة الأسـم...*\n*┋ ${seriesName}*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            const translated = await translateToEnglish(seriesName);

            if (translated && translated !== seriesName && !hasArabic(translated)) {
                searchName = translated;
                wasTranslated = true;

                await reply(`*⎔┄┄─ ⊱╎⌯ ✅ ⌯╎⊰─┄┄⎔*\n*┋ تـمـت الـتـࢪجـمـة:*\n*┋ ${seriesName} ➜ ${searchName}*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
            }
        }

        // ═══════════════════════════════════════════════
        // ✅ التحقق من الحد الأقصى
        // ═══════════════════════════════════════════════
        if (parsed.from !== null && parsed.to !== null) {
            if (parsed.to < parsed.from) {
                await react("❌");
                return reply(`*❌ تـرتـيـب الـفـصـول غـلـط*\n*┋ اكـتـب: .مانهوا ${seriesName} 11/20*`);
            }

            const count = parsed.to - parsed.from + 1;
            if (count > MAX_CHAPTERS) {
                await react("❌");
                return reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ عـدد الـفـصـول الـمـطـلـوب : ${count}*
*┋ الـحـد الأقـصـى : ${MAX_CHAPTERS} فصول*
*┋ قـلـل الـعـدد يـا نـجـم 🏮*
*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*`);
            }
        }

        const statusMsg = await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n*┋ جـاري الـبـحـث عـن: ${searchName}*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

        try {
            const results = await searchManhwa(searchName);
            if (results.length === 0) {
                await react("❌");
                return reply(`*❌ لـم أجـد نـتـائـج لـ: ${searchName}${wasTranslated ? `\n*┋ (الأصـل: ${seriesName})*` : ''}*`);
            }

            const series = results[0];
            const seriesTitle = series.title || searchName;

            await sock.sendMessage(chatId, {
                text: `*⎔┄┄─ ⊱╎⌯ 📖 ⌯╎⊰─┄┄⎔*\n*┋ ${seriesTitle}*\n*┋ جـاري جـلـب الـفـصـول...*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`,
                edit: statusMsg.key
            }).catch(() => {});

            const allChapters = await getChapters(series.id);
            if (allChapters.length === 0) {
                await react("❌");
                return reply(`*❌ لا تـوجـد فـصـول لـ: ${seriesTitle}*`);
            }

            // ═══════════════════════════════════════════════
            // ✅ تحديد الفصول المطلوبة
            // ═══════════════════════════════════════════════
            let selectedChapters = [];
            let rangeDescription = '';

            if (parsed.from === null && parsed.to === null) {
                selectedChapters = allChapters.slice(0, MAX_CHAPTERS);
                rangeDescription = `أول ${selectedChapters.length} فصول`;

            } else if (parsed.single !== null) {
                const chapterNum = parsed.single;
                const chapter = allChapters.find(c => {
                    const numMatch = String(c.title || c.name || '').match(/(\d+)/);
                    return numMatch && parseInt(numMatch[1]) === chapterNum;
                });

                if (!chapter) {
                    await react("❌");
                    return reply(`*❌ لـم أجـد الـفـصـل رقـم ${chapterNum}*`);
                }

                selectedChapters = [chapter];
                rangeDescription = `الفصل ${chapterNum}`;

            } else {
                const from = parsed.from;
                const to = parsed.to;

                selectedChapters = allChapters.filter(c => {
                    const numMatch = String(c.title || c.name || '').match(/(\d+)/);
                    if (!numMatch) return false;
                    const num = parseInt(numMatch[1]);
                    return num >= from && num <= to;
                });

                if (selectedChapters.length === 0) {
                    await react("❌");
                    return reply(`*❌ لـم أجـد فـصـول فـي الـنـطـاق ${from}-${to}*`);
                }

                rangeDescription = `الفصول ${from} لـ ${to} (${selectedChapters.length} فصل)`;
            }

            await sock.sendMessage(chatId, {
                text: `*⎔┄┄─ ⊱╎⌯ 📝 ⌯╎⊰─┄┄⎔*\n*┋ ${seriesTitle}*\n*┋ ${rangeDescription}*\n*┋ جـاري ضـغـط الـصـور...*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`,
                edit: statusMsg.key
            }).catch(() => {});

            await react("📥");

            const pdfBytes = await createPDF(seriesTitle, selectedChapters);

            const caption = `*⎔┄┄─ ⊱╎⌯ 📚 ⌯╎⊰─┄┄⎔*
*┋ تـم تـحـمـيـل الـمـانـهـوا*
*┋ الـعـنـوان : ${seriesTitle}*
*┋ ${rangeDescription}*
*┋ الـحـجـم : ${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            const tempDir = path.join(__dirname, '../temp');
            fs.ensureDirSync(tempDir);
            const filePath = path.join(tempDir, `${Date.now()}.pdf`);
            fs.writeFileSync(filePath, pdfBytes);

            await sock.sendMessage(chatId, {
                document: fs.readFileSync(filePath),
                mimetype: 'application/pdf',
                fileName: `${seriesTitle.replace(/[\/\\:*?"<>|]/g, '_')}.pdf`,
                caption: caption
            }, { quoted: message });

            fs.unlinkSync(filePath);
            await sock.sendMessage(chatId, { delete: statusMsg.key }).catch(() => {});
            await react("✅");

        } catch (error) {
            console.error("❌ Manhwa Error:", error);
            await react("❌");
            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل تـحـمـيـل الـمـانـهـوا*
*┋ السـبب: ${error.message || 'حـاول مـرة اخـرى'}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};