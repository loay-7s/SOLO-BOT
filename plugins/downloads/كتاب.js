// plugins/اسرد.js
// ⚔️ SOLO ASRUD BOOK DOWNLOADER ⚔️

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://engez.a7a.online/api/v1';

// ✅ البحث عن الكتاب
async function searchAsrud(query) {
    try {
        const params = new URLSearchParams();
        params.append('action', 'بحث');
        params.append('q', query);
        params.append('limit', '5');

        const response = await axios.get(`${API_BASE}/reading/asrud?${params.toString()}`, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل البحث');
        }

        return response.data.results || [];
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

// ✅ جلب تفاصيل الكتاب
async function getStoryDetails(url) {
    try {
        const params = new URLSearchParams();
        params.append('action', 'تفاصيل');
        params.append('url', url);

        const response = await axios.get(`${API_BASE}/reading/asrud?${params.toString()}`, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل جلب التفاصيل');
        }

        return response.data;
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

// ✅ استخراج الرابط المباشر من صفحة ميديا فاير
async function getDirectMediaFireUrl(url) {
    try {
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        // ✅ البحث عن زر التحميل
        const downloadButton = document.querySelector('a#downloadButton') || 
                              document.querySelector('a[id*="download"]') ||
                              document.querySelector('a[class*="download"]');
        
        if (downloadButton && downloadButton.href) {
            return downloadButton.href;
        }

        // ✅ البحث في الـ JavaScript
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent || '';
            const match = content.match(/href\s*:\s*['"]([^'"]+\.(?:pdf|zip|rar))['"]/i);
            if (match) {
                return match[1];
            }
        }

        // ✅ البحث في كل الروابط
        const links = document.querySelectorAll('a[href]');
        for (const link of links) {
            const href = link.href;
            if (href && (href.includes('.pdf') || href.includes('.zip') || href.includes('.rar'))) {
                return href;
            }
        }

        throw new Error('لم يتم العثور على رابط تحميل مباشر');
    } catch (error) {
        throw new Error(`فشل استخراج الرابط المباشر: ${error.message}`);
    }
}

// ✅ تحديد نوع الملف
function detectFileType(buffer) {
    const h = buffer.subarray(0, 4);
    if (h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46) {
        return { ext: 'pdf', mimetype: 'application/pdf' };
    }
    if (h[0] === 0x50 && h[1] === 0x4b) {
        return { ext: 'zip', mimetype: 'application/zip' };
    }
    if (h[0] === 0x52 && h[1] === 0x61 && h[2] === 0x72) {
        return { ext: 'rar', mimetype: 'application/x-rar-compressed' };
    }
    return { ext: 'pdf', mimetype: 'application/pdf' };
}

function buildFileName(rawTitle, ext) {
    const clean = (rawTitle || 'كتاب').replace(/\.(pdf|zip|rar)$/i, '').trim();
    return `${clean}.${ext}`;
}

export default {
    name: "اسرد",
    aliases: ["asrud", "كتاب"],
    description: "تحميل كتاب من موقع أسرد PDF",
    category: "تحميل",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            await react("📚");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 📚 تـحـمـيـل كـتـاب مـن أسـرد*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 اكتب اسم الكتاب*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.اسرد خطأ واحد*
📌 *.اسرد رواية حب*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("⏳");
        const statusMsg = await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n*┋ جـاري الـبـحـث عـن: ${query}*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

        try {
            const results = await searchAsrud(query);
            if (results.length === 0) {
                await react("❌");
                return reply(`*❌ لـم أجـد كـتـابـاً بـاسـم: ${query}*`);
            }

            const book = results[0];
            const title = book.title || query;
            const author = book.author || 'غير معروف';
            const bookUrl = book.url;

            await sock.sendMessage(chatId, {
                text: `*⎔┄┄─ ⊱╎⌯ 📖 ⌯╎⊰─┄┄⎔*\n*┋ ${title}*\n*┋ الـكـاتـب : ${author}*\n*┋ جـاري جـلـب الـمـلـف...*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`,
                edit: statusMsg.key
            }).catch(() => {});

            const details = await getStoryDetails(bookUrl);

            if (!details?.downloadUrl) {
                await react("❌");
                return reply(`*❌ لا يـوجـد رابـط تـحـمـيـل لـ: ${title}*`);
            }

            await sock.sendMessage(chatId, {
                text: `*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*\n*┋ جـاري تـحـمـيـل الـكـتـاب...*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`,
                edit: statusMsg.key
            }).catch(() => {});

            // ✅ استخراج الرابط المباشر من ميديا فاير
            const directUrl = await getDirectMediaFireUrl(details.downloadUrl);

            // ✅ تحميل الملف مباشرة
            const fileResponse = await axios.get(directUrl, {
                responseType: 'arraybuffer',
                timeout: 120000,
                maxRedirects: 10,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ar,en;q=0.9',
                    'Connection': 'keep-alive'
                }
            });

            const buffer = Buffer.from(fileResponse.data);
            
            // ✅ التحقق من أن الملف PDF مش HTML
            const isHtml = buffer.toString('utf-8', 0, 100).includes('<!DOCTYPE html>') || 
                          buffer.toString('utf-8', 0, 100).includes('<html');
            
            if (isHtml) {
                throw new Error('تم تحميل صفحة HTML بدلاً من الملف، حاول مرة أخرى');
            }

            const { ext, mimetype } = detectFileType(buffer);
            // ✅ إصلاح: استخدام title بدل result
            const fileName = buildFileName(title, ext);
            const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

            const caption = `*⎔┄┄─ ⊱╎⌯ 📚 ⌯╎⊰─┄┄⎔*
*┋ تـم تـحـمـيـل الـكـتـاب*
*┋ ${title}*
*┋ ${author}*
*┋ الـحـجـم : ${fileSizeMB} MB*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await sock.sendMessage(chatId, {
                document: buffer,
                mimetype: mimetype,
                fileName: fileName,
                caption: caption
            }, { quoted: message });

            await sock.sendMessage(chatId, { delete: statusMsg.key }).catch(() => {});
            await react("✅");

        } catch (error) {
            console.error("❌ Asrud Error:", error);
            await react("❌");
            
            let errorMsg = error.message || 'حـاول مـرة اخـرى';
            if (errorMsg.includes('HTML')) {
                errorMsg = 'فشل تحميل الملف، قد يكون الرابط غير مباشر';
            }

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل تـحـمـيـل الـكـتـاب*
*┋ السـبب: ${errorMsg}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};