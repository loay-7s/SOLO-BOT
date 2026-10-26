// plugins/بنترست.js
// ⚔️ SOLO PINTEREST IMAGE SEARCH ⚔️

import axios from 'axios';
import crypto from 'crypto';
import translate from 'translate-google-api';
import * as cheerio from 'cheerio';

/* ========= إعدادات Pinterest ========= */
const base = "https://www.pinterest.com";
const search = "/resource/BaseSearchResource/get/";

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

const headers = {
  accept: "application/json, text/javascript, */*, q=0.01",
  referer: "https://www.pinterest.com/",
  "user-agent": UA,
  "x-app-version": "a9522f",
  "x-pinterest-appstate": "active",
  "x-pinterest-pws-handler": "www/[username]/[slug].js",
  "x-requested-with": "XMLHttpRequest",
};

async function getCookies() {
  try {
    const response = await axios.get(base, {
      headers: { 'user-agent': UA, 'accept': 'text/html' },
      timeout: 15000
    });
    const setHeaders = response.headers["set-cookie"];
    if (setHeaders) {
      return setHeaders.map(v => v.split(";")[0]).join("; ");
    }
    return null;
  } catch {
    return null;
  }
}

/* ============================================================
   🆕 SCRAPING — بديل Pinterest API
   ============================================================ */

// 🎯 استخراج الصور من HTML صفحة Pinterest
function extractImagesFromHtml(html) {
  const images = new Set();
  const $ = cheerio.load(html);

  // 1️⃣ صور og:image
  $('meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr('content');
    if (src && src.includes('pinimg.com')) {
      images.add(src.replace(/\/\d+x\//, '/originals/'));
    }
  });

  // 2️⃣ صور من img tags
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && src.includes('pinimg.com') && !src.includes('avatar')) {
      images.add(src.replace(/\/\d+x\//, '/originals/'));
    }
  });

  // 3️⃣ صور من script JSON
  const scriptRegex = /https?:\\?\/\\?\/[^"'\s<>]*pinimg\.com[^"'\s<>]*\.(?:jpg|jpeg|png|webp)/gi;
  const scriptMatches = html.match(scriptRegex) || [];
  for (const match of scriptMatches) {
    const clean = match
      .replace(/\\u002F/g, '/')
      .replace(/\\\//g, '/')
      .replace(/\/\d+x\//, '/originals/');
    images.add(clean);
  }

  return [...images];
}

// 🎯 البحث عن طريق زحف صفحة Pinterest
async function scrapePinterest(query, limit = 20) {
  const allImages = new Set();
  const seen = new Set();

  try {
    // 🎯 البحث عبر صفحات متعددة (pagination)
    for (let page = 0; page < 3 && allImages.size < limit * 2; page++) {
      try {
        const searchUrl = `${base}/search/pins/?q=${encodeURIComponent(query)}&rs=typed&page=${page}`;

        const { data } = await axios.get(searchUrl, {
          headers: {
            'user-agent': UA,
            'accept': 'text/html,application/xhtml+xml',
            'accept-language': 'en-US,en;q=0.9',
          },
          timeout: 20000,
          maxRedirects: 5
        });

        const pageImages = extractImagesFromHtml(data);
        for (const img of pageImages) {
          if (!seen.has(img)) {
            seen.add(img);
            allImages.add(img);
          }
        }

        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.log(`[scrape page ${page}]`, e.message);
      }
    }

    if (allImages.size === 0) {
      return { status: false, message: "لم يتم العثور على نتائج." };
    }

    return {
      status: true,
      query: query,
      originalQuery: query,
      isTranslated: false,
      pins: [...allImages].slice(0, Math.min(limit, 20)).map((img, idx) => ({
        id: `scraped_${idx}`,
        image: img,
        title: query,
      })),
    };
  } catch (e) {
    console.error('[Scrape Error]', e.message);
    return { status: false, message: "حدث خطأ في البحث." };
  }
}

// ═══════════════════════════════════════════════════════════
// ✅ دالة البحث النهائية (API → Scraping Fallback)
// ═══════════════════════════════════════════════════════════
async function searchPinterest(query, limit = 20) {
  try {
    // ✅ التحقق من اللغة (عربي ولا إنجليزي)
    const isArabic = /[\u0600-\u06FF]/.test(query);
    let searchQuery = query;

    if (isArabic) {
      try {
        const translated = await translate(query, { to: 'en' });
        searchQuery = Array.isArray(translated) ? translated[0] : translated;
        console.log(`🌍 تمت الترجمة: "${query}" → "${searchQuery}"`);
      } catch (e) {
        console.log('⚠️ فشل الترجمة، سيتم البحث بالنص الأصلي');
        searchQuery = query;
      }
    }

    // ═══════════════════════════════════════════
    // 1️⃣ محاولة API
    // ═══════════════════════════════════════════
    try {
      const cookies = await getCookies();
      if (cookies) {
        const params = {
          source_url: `/search/pins/?q=${encodeURIComponent(searchQuery)}`,
          data: JSON.stringify({
            options: {
              isPrefetch: false,
              query: searchQuery,
              scope: "pins",
              bookmarks: [""],
              page_size: Math.min(limit, 20),
            },
            context: {},
          }),
          _: Date.now(),
        };

        const { data } = await axios.get(`${base}${search}`, {
          headers: { ...headers, cookie: cookies },
          params,
          timeout: 20000
        });

        const results = data.resource_response?.data?.results?.filter(
          v => v.images?.orig
        ) || [];

        if (results.length > 0) {
          return {
            status: true,
            query: searchQuery,
            originalQuery: query,
            isTranslated: isArabic,
            pins: results.slice(0, Math.min(limit, 20)).map(v => ({
              id: v.id,
              image: v.images.orig.url,
              title: v.title || v.alt_text || '',
            })),
          };
        }
      }
    } catch (apiErr) {
      console.log('⚠️ API فشل، سيتم استخدام Scraping:', apiErr.message);
    }

    // ═══════════════════════════════════════════
    // 2️⃣ Scraping Fallback
    // ═══════════════════════════════════════════
    const scraped = await scrapePinterest(searchQuery, limit);

    if (scraped.status) {
      return {
        ...scraped,
        originalQuery: query,
        isTranslated: isArabic,
      };
    }

    return { status: false, message: "لم يتم العثور على نتائج." };

  } catch (e) {
    console.error('[Pinterest Error]', e.message);
    return { status: false, message: "حدث خطأ في البحث." };
  }
}

/* ========= الأمر الرئيسي ========= */
export default {
  name: "بنترست",
  aliases: ["pinterest", "pint", "بنتريست"],
  category: "تحميل",
  description: "جلب صور من Pinterest (حد أقصى 20 صورة)",

  async run({ sock, m, args, reply, react, userJid }) {
    const chatId = m.key.remoteJid;

    // ✅ استخراج العدد والكلمة
    let limit = 5;
    let query = '';

    const firstArg = args[0];
    const numMatch = firstArg?.match(/^(\d+)$/);

    if (numMatch) {
      limit = parseInt(numMatch[1]);
      if (limit > 20) limit = 20;
      if (limit < 1) limit = 1;
      query = args.slice(1).join(' ');
    } else {
      query = args.join(' ');
    }

    if (!query) {
      await react("📌");
      return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 📌 بـحـث بـنـتـرست*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 ابـحـث عـن الـصـوࢪ الـتـي تـࢪيـدهـا*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.بنترست سونغ* - (20 صورة افتراضي)
📌 *.بنترست 5 سونغ* - (5 صور)
📌 *.بنترست 10 لوفي* - (10 صور)
📌 *.بنترست 15 مناظر طبيعية* - (15 صورة)

*⚠️ الـحـد الأقـصـى 20 صـورة*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
    }

    await react("🔍");

    const result = await searchPinterest(query, limit);

    if (!result.status) {
      await react("❌");
      return reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل الـبـحـث عـن: ${query}*
*┋ السـبب: ${result.message}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
    }

    const pins = result.pins.slice(0, limit);
    if (pins.length === 0) {
      await react("❌");
      return reply(`*❌ لـم يـتـم الـعـثـور عـلـى صـور لـ ${query}*`);
    }

    await react("📥");

    // ✅ رسالة النتيجة
    const resultMsg = `*⎔┄┄─ ⊱╎⌯ 📌 ⌯╎⊰─┄┄⎔*
*┋ تـم الـعـثـور عـلـى ${pins.length} صـورة*
*┋ الـبـحـث: ${result.isTranslated ? `"${result.originalQuery}" → "${result.query}"` : `"${result.query}"`}*
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`;

    await reply(resultMsg);

    // ✅ إرسال الصور (5 صور في كل رسالة)
    let imageBatch = [];
    let batchCount = 0;

    for (let i = 0; i < pins.length; i++) {
      try {
        const imgRes = await axios.get(pins[i].image, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: { 'user-agent': UA }
        });

        imageBatch.push({
          image: Buffer.from(imgRes.data),
          caption: i === 0 ? `*⎔┄┄─ ⊱╎⌯ 🖼️ ⌯╎⊰─┄┄⎔*\n*┋ ${result.query} (${i + 1}/${pins.length})*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*` : '',
        });

        // ✅ إرسال كل 5 صور
        if (imageBatch.length === 5 || i === pins.length - 1) {
          batchCount++;
          await new Promise(resolve => setTimeout(resolve, 500));

          for (const img of imageBatch) {
            try {
              await sock.sendMessage(chatId, {
                image: img.image,
                caption: img.caption,
              }, { quoted: m });
            } catch (err) {
              console.error(`❌ فشل إرسال الصورة:`, err.message);
            }
          }

          imageBatch = [];
        }
      } catch (err) {
        console.error(`❌ فشل تحميل الصورة ${i + 1}:`, err.message);
      }
    }

    await react("✅");
  }
};