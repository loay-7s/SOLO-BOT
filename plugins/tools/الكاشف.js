// plugins/كاشف_البوتات.js
// 🔍 SOLO ULTIMATE BOT DETECTOR — RATE-LIMIT SAFE ⚔️

import fs from 'fs-extra';
import path from 'path';

// ═══════════════════════════════════════════════════════════
// 💾 قاعدة بيانات
// ═══════════════════════════════════════════════════════════
const BOT_DB_FILE = path.join(process.cwd(), 'data', 'known_bots.json');
const CACHE_FILE = path.join(process.cwd(), 'data', 'bot_cache.json');

function loadJson(file, def = {}) {
    try {
        if (fs.existsSync(file)) return fs.readJsonSync(file) || def;
    } catch {}
    return def;
}

function saveJson(file, data) {
    try {
        fs.ensureDirSync(path.dirname(file));
        fs.writeJsonSync(file, data, { spaces: 2 });
        return true;
    } catch { return false; }
}

// ═══════════════════════════════════════════════════════════
// ⏱️ HELPERS
// ═══════════════════════════════════════════════════════════

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function cleanJid(jid) {
    if (!jid) return '';
    return String(jid).split(':')[0].split('/')[0];
}

function getNumber(jid) {
    if (!jid) return null;
    const v = String(jid).trim();
    if (v.includes('@')) return v.split('@')[0].replace(/\D/g, '');
    return v.replace(/\D/g, '');
}

function nameOf(p) {
    return (p?.notify || p?.name || '').trim();
}

function normalizeText(str) {
    return String(str || '')
        .toLowerCase()
        .replace(/[أإآا]/g, 'a')
        .replace(/ة/g, 'h')
        .replace(/ى/g, 'y');
}

// ═══════════════════════════════════════════════════════════
// 🛡️ SAFE CALL — معالجة rate-limit
// ═══════════════════════════════════════════════════════════

let RATE_LIMITED = false;

async function safeCall(fn, fallback = null, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (e) {
            const msg = e?.message || '';
            const isRate = msg.includes('rate-overlimit') ||
                           msg.includes('429') ||
                           e?.data === 429;

            if (isRate) {
                RATE_LIMITED = true;
                if (i < retries) {
                    await sleep(2000 * (i + 1));
                    continue;
                }
            }
            return fallback;
        }
    }
    return fallback;
}

// ═══════════════════════════════════════════════════════════
// 📦 CACHES
// ═══════════════════════════════════════════════════════════

const STATUS_CACHE = new Map();
const PIC_CACHE = new Map();
const STATUS_TTL = 300000; // 5 min
const PIC_TTL = 600000;    // 10 min

async function getStatusCached(sock, jid) {
    const c = STATUS_CACHE.get(jid);
    if (c && Date.now() - c.time < STATUS_TTL) return c.data;

    const data = await safeCall(() => sock.fetchStatus(jid), null, 1);
    STATUS_CACHE.set(jid, { data, time: Date.now() });
    return data;
}

async function getPicCached(sock, jid) {
    const c = PIC_CACHE.get(jid);
    if (c && Date.now() - c.time < PIC_TTL) return c.data;

    const data = await safeCall(() => sock.profilePictureUrl(jid, 'image'), null, 1);
    PIC_CACHE.set(jid, { data, time: Date.now() });
    return data;
}

// ═══════════════════════════════════════════════════════════
// 🎯 قوائم الكلمات
// ═══════════════════════════════════════════════════════════

const BOT_KEYWORDS = [
    'bot', 'robot', 'xbot', 'xbots', 'vbot', 'wabot', 'whatsbot',
    'assistant', 'helper', 'ai', 'gpt', 'chatgpt', 'gemini',
    'baileys', 'whatsapp-bot', 'wa-bot', 'xb', 'x-bot',
    'auto', 'automated', 'system', 'server', 'machine',
    'virtual', 'smart', 'genius', 'intelligence',
    'api', 'api-bot', 'service',
    'بوت', 'بوتات', 'روبوت', 'مساعد', 'ذكاء', 'ذكي',
    'سولو', 'نظام', 'سيستم', 'تلقائي', 'آلي',
    'خادم', 'سيرفر', 'خدمات', 'متعدد',
    '🤖', '⚙️', '🔧', '💻', '🖥️', '🧠', '⚡', '🔌', '📡', '🛰️'
];

const BOT_DESCRIPTIONS = [
    'bot', 'commands', 'menu', 'download', 'services',
    'developer', 'admin', 'auto', 'always', 'online',
    'api', 'script', 'server', 'multi', 'system',
    'chat', 'chatbot', 'assistant', 'helper',
    '24/7', 'always online', 'powered by',
    'بوت', 'أوامر', 'قائمة', 'تحميل', 'خدمات', 'خدمة',
    'مطور', 'مدير', 'تلقائي', 'دائماً', 'متصل',
    'سكريبت', 'سيرفر', 'متعدد', 'نظام', 'مساعد',
    'دعم', 'تواصل', 'اكتب', 'اضغط',
    'github', 'npm', 'node', 'javascript'
];

const BOT_NAME_PATTERNS = [
    /^[a-z]+bot$/i, /^bot[a-z]+$/i,
    /^[a-z]+_bot$/i, /^bot_[a-z]+$/i,
    /^\.[a-z]+$/i, /^[a-z]+\s*bot$/i,
    /bot$/i, /^bot/i,
    /^(ai|chat|gpt|solo|xb|vb)/i,
    /[0-9]{8,}/,
    /^[a-z]{1,3}\d{3,}$/i
];

const ADMIN_KEYWORDS = [
    'admin', 'owner', 'creator', 'founder',
    'أدمن', 'أدمين', 'مالك', 'مؤسس', 'مطور'
];

// ═══════════════════════════════════════════════════════════
// 🧠 الطبقات — لا تحتاج نت (بدون طلبات)
// ═══════════════════════════════════════════════════════════

function layerName(participant) {
    let score = 0;
    const reasons = [];

    const name = nameOf(participant);
    if (!name) return { score, reasons };

    const lower = normalizeText(name);

    for (const kw of BOT_KEYWORDS) {
        if (lower.includes(normalizeText(kw))) {
            score += 35;
            reasons.push(`📛 الاسم فيه "${kw}"`);
            break;
        }
    }

    for (const pattern of BOT_NAME_PATTERNS) {
        if (pattern.test(name)) {
            score += 20;
            reasons.push('🤖 نمط اسم بوت');
            break;
        }
    }

    if (/^[a-z]{3,10}$/i.test(name.trim()) && name.length <= 10) {
        score += 10;
        reasons.push('📝 اسم قصير جداً');
    }

    if (/[🤖⚙️🔧💻🖥️🧠⚡🔌📡]/u.test(name)) {
        score += 15;
        reasons.push('🤖 إيموجي تقني');
    }

    for (const kw of ADMIN_KEYWORDS) {
        if (lower.includes(normalizeText(kw))) {
            score += 15;
            reasons.push(`👑 الاسم فيه "${kw}"`);
            break;
        }
    }

    return { score, reasons };
}

function layerNumber(jid) {
    let score = 0;
    const reasons = [];

    const number = getNumber(jid);
    if (!number) return { score, reasons };

    if (!number.startsWith('20') && !number.startsWith('1')) {
        score += 5;
        reasons.push('🌍 رقم أجنبي');
    }

    if (number.length > 13) {
        score += 10;
        reasons.push('🔢 رقم طويل جداً');
    }

    if (/(\d)\1{5,}/.test(number)) {
        score += 15;
        reasons.push('🔢 أرقام متكررة');
    }

    return { score, reasons };
}

function layerDatabase(jid) {
    let score = 0;
    const reasons = [];

    const db = loadJson(BOT_DB_FILE, {});
    if (db[jid]) {
        score += 50;
        reasons.push(`💾 مسجل كبوت (${db[jid].score}/100)`);
    }

    const cache = loadJson(CACHE_FILE, {});
    if (cache[jid]) {
        if (cache[jid].verdict === 'bot') {
            score += 30;
            reasons.push('📦 نتيجة سابقة: بوت');
        } else if (cache[jid].verdict === 'suspect') {
            score += 15;
            reasons.push('📦 نتيجة سابقة: مشبوه');
        }
    }

    return { score, reasons };
}

function layerActivity(participant) {
    let score = 0;
    const reasons = [];

    if (participant?.admin) {
        score += 3;
    }

    return { score, reasons };
}

function layerLanguage(participant) {
    let score = 0;
    const reasons = [];

    const name = nameOf(participant);
    if (!name) return { score, reasons };

    if (/[\u4e00-\u9fff\uac00-\ud7af]/.test(name)) {
        score += 5;
        reasons.push('🌏 اسم بلغة آسيوية');
    }

    return { score, reasons };
}

function layerNameLength(participant) {
    let score = 0;
    const reasons = [];

    const name = nameOf(participant);
    if (!name) return { score, reasons };

    if (!name.includes(' ') && name.length < 15) {
        score += 5;
    }

    return { score, reasons };
}

function layerSymbolsInName(participant) {
    let score = 0;
    const reasons = [];

    const name = nameOf(participant);
    if (!name) return { score, reasons };

    const symbolCount = (name.match(/[_|.\-+@#$%^&*]/g) || []).length;
    if (symbolCount >= 3) {
        score += 10;
        reasons.push('🔣 رموز كثيرة في الاسم');
    }

    return { score, reasons };
}

function layerNameAnalysis(participant) {
    let score = 0;
    const reasons = [];

    const name = nameOf(participant);
    if (!name) return { score, reasons };

    const COMMON_BOT_NAMES = [
        'gpt', 'ai', 'chat', 'helper', 'assistant',
        'system', 'support', 'service', 'info'
    ];

    const lower = normalizeText(name);
    for (const n of COMMON_BOT_NAMES) {
        if (lower === n) {
            score += 25;
            reasons.push(`🎯 اسم بوت شائع: "${name}"`);
            break;
        }
    }

    return { score, reasons };
}

// ═══════════════════════════════════════════════════════════
// 🌐 الطبقات — تحتاج نت (مع كاش)
// ═══════════════════════════════════════════════════════════

async function layerAbout(sock, jid) {
    let score = 0;
    const reasons = [];

    try {
        const status = await getStatusCached(sock, jid);
        if (status?.status) {
            const text = normalizeText(status.status);

            for (const kw of BOT_DESCRIPTIONS) {
                if (text.includes(normalizeText(kw))) {
                    score += 25;
                    reasons.push(`📝 الوصف فيه "${kw}"`);
                    break;
                }
            }

            for (const kw of ['bot', 'بوت']) {
                if (text.includes(normalizeText(kw))) {
                    score += 20;
                    reasons.push(`📝 الوصف فيه "${kw}"`);
                    break;
                }
            }

            if (/https?:\/\//.test(status.status) || /wa\.me\//.test(status.status)) {
                score += 10;
                reasons.push('🔗 الوصف فيه رابط');
            }

            if (status.status.length > 100) {
                score += 5;
                reasons.push('📏 وصف طويل');
            }
        }
    } catch {}

    return { score, reasons };
}

async function layerProfilePicture(sock, jid) {
    let score = 0;
    const reasons = [];

    try {
        const pic = await getPicCached(sock, jid);

        if (pic) {
            const lowerPic = pic.toLowerCase();
            if (lowerPic.includes('bot') || lowerPic.includes('logo')) {
                score += 15;
                reasons.push('🖼️ رابط الصورة فيه "bot"');
            }
            score += 3;
        } else {
            score += 3;
        }
    } catch {}

    return { score, reasons };
}

async function layerAccountStatus(sock, jid) {
    let score = 0;
    const reasons = [];

    try {
        const status = await getStatusCached(sock, jid);
        if (status?.setAt) {
            const since = Date.now() - new Date(status.setAt).getTime();

            if (since < 3600000) score += 5;
            if (since < 300000) {
                score += 10;
                reasons.push('⏰ الحالة محدّثة خلال 5 دقائق');
            }
        }
    } catch {}

    return { score, reasons };
}

async function layerResponseSpeed(jid) {
    let score = 0;
    const reasons = [];

    const cache = loadJson(CACHE_FILE, {});
    if (cache[jid]?.avgSpeed) {
        if (cache[jid].avgSpeed < 1000) {
            score += 25;
            reasons.push('⚡ ردود سريعة جداً (< 1s)');
        } else if (cache[jid].avgSpeed < 2000) {
            score += 15;
            reasons.push('⚡ ردود سريعة (< 2s)');
        }
    }

    return { score, reasons };
}

async function layerKnownBots(jid) {
    let score = 0;
    const reasons = [];

    const db = loadJson(BOT_DB_FILE, {});
    if (db[jid]) {
        score += 30;
        reasons.push('⭐ بوت معروف من فحص سابق');
    }

    return { score, reasons };
}

// ═══════════════════════════════════════════════════════════
// 🎯 المحرك الرئيسي
// ═══════════════════════════════════════════════════════════

async function analyzeParticipant(sock, participant) {
    const jid = participant.id;

    // ─── الطبقات اللي مش محتاجة نت (سريعة) ───
    const localLayers = [
        layerName(participant),
        layerNumber(jid),
        layerDatabase(jid),
        layerActivity(participant),
        layerLanguage(participant),
        layerNameLength(participant),
        layerSymbolsInName(participant),
        layerNameAnalysis(participant)
    ];

    // ─── الطبقات اللي محتاجة نت (مع كاش) ───
    const remoteLayers = [
        await layerAbout(sock, jid),
        await layerProfilePicture(sock, jid),
        await layerAccountStatus(sock, jid),
        await layerResponseSpeed(jid),
        await layerKnownBots(jid)
    ];

    const layers = [...localLayers, ...remoteLayers];

    let totalScore = 0;
    const allReasons = [];

    for (const layer of layers) {
        totalScore += layer.score;
        allReasons.push(...layer.reasons);
    }

    return {
        jid,
        number: getNumber(jid),
        name: nameOf(participant) || 'بدون اسم',
        score: Math.min(100, totalScore),
        reasons: allReasons,
        admin: participant.admin === 'admin' || participant.admin === 'superadmin'
    };
}

// ═══════════════════════════════════════════════════════════
// 📊 التصنيف
// ═══════════════════════════════════════════════════════════

function getVerdict(score) {
    if (score >= 80) return { label: 'بوت مؤكد', emoji: '🔴', conf: 'عالية جداً' };
    if (score >= 60) return { label: 'مشبوه جداً', emoji: '🟠', conf: 'عالية' };
    if (score >= 40) return { label: 'مشبوه', emoji: '🟡', conf: 'متوسطة' };
    if (score >= 25) return { label: 'محتمل بوت', emoji: '🟣', conf: 'منخفضة' };
    return { label: 'إنسان', emoji: '🟢', conf: 'عالية' };
}

// ═══════════════════════════════════════════════════════════
// 🎨 التقرير
// ═══════════════════════════════════════════════════════════

function buildReport(results, totalChecked, metadata) {
    const now = new Date().toLocaleString('ar-EG');

    let text = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🔍 كـاشـف الـبـوتـات الأسـطـوري*

*───━━━⊱  🤖  ⊰━━━───*

*┋ 📛 الـمـجـمـوعـة : ⦓ ${metadata.subject} ⦔*
*┋ 👥 الأعـضـاء : ⦓ ${totalChecked} ⦔*
*┋ 🤖 الـبـوتـات : ⦓ ${results.length} ⦔*
*┋ 📅 الـوقـت : ⦓ ${now} ⦔*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n`;

    if (results.length === 0) {
        text += `\n*✅ مـبـروك! لا تـوجـد بـوتـات*\n`;
    } else {
        results.sort((a, b) => b.score - a.score);

        const confirmed = results.filter(r => r.score >= 80).length;
        const verySuspect = results.filter(r => r.score >= 60 && r.score < 80).length;
        const suspect = results.filter(r => r.score >= 40 && r.score < 60).length;
        const possible = results.filter(r => r.score >= 25 && r.score < 40).length;

        text += `\n*📊 الإحـصـائـيـات:*\n`;
        text += `*┋ 🔴 مـؤكـد : ⦓ ${confirmed} ⦔*\n`;
        text += `*┋ 🟠 مـشـبـوه جـداً : ⦓ ${verySuspect} ⦔*\n`;
        text += `*┋ 🟡 مـشـبـوه : ⦓ ${suspect} ⦔*\n`;
        text += `*┋ 🟣 مـحـتـمـل : ⦓ ${possible} ⦔*\n`;

        text += `\n*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n`;

        results.forEach((r, i) => {
            text += `\n*┋ ${i + 1}. ${r.verdict.emoji} @${r.number}*\n`;
            text += `*┋    📛 ${r.name}*\n`;
            if (r.admin) text += `*┋    👑 أدمن*\n`;
            text += `*┋    📊 الـنـقـاط : ⦓ ${r.score}/100 ⦔*\n`;
            text += `*┋    🎯 الـتـصـنـيـف : ${r.verdict.label}*\n`;

            if (r.reasons.length > 0) {
                text += `*┋    📌 الأسـبـاب :*\n`;
                r.reasons.slice(0, 5).forEach(reason => {
                    text += `*┋       ${reason}*\n`;
                });
            }
        });
    }

    text += `\n*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*\n\n*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

    return text;
}

// ═══════════════════════════════════════════════════════════
// ⚔️ COMMAND
// ═══════════════════════════════════════════════════════════

export default {
    name: "كاشف_البوتات",
    aliases: ["كاشف_بوت", "كشف_البوتات", "الكاشف", "detect_bots"],
    description: "كشف البوتات بفحص شامل",
    category: "developer",
    developer: true,
    group: true,

    async run({ sock, message, reply, react }) {
        const chatId = message.key.remoteJid;

        await react("🚀");

        try {
            // ═══════════════════════════════════════════════════════
            // 📥 جلب metadata
            // ═══════════════════════════════════════════════════════
            const metadata = await safeCall(
                () => sock.groupMetadata(chatId),
                null,
                3
            );

            if (!metadata) {
                await react("❌");
                return reply(`*❌ فـشـل جـلـب الـمـجـمـوعـة*\n📌 الـسـبـب: rate-limit — اسـتـنـى 5 دقـائـق`);
            }

            const participants = metadata.participants || [];
            const botJid = cleanJid(sock.user?.id);

            // ═══════════════════════════════════════════════════════
            // 📤 رسالة البداية
            // ═══════════════════════════════════════════════════════
            const startMsg = await sock.sendMessage(chatId, {
                text: `*🚀 بـدء الـفـحـص الأسـطـوري...*

*┋ 📛 الـمـجـمـوعـة : ${metadata.subject}*
*┋ 👥 الأعـضـاء : ${participants.length}*

*⏳ جـاري الـفـحـص...*`
            }, { quoted: message });

            // ═══════════════════════════════════════════════════════
            // 🕵️ الفحص
            // ═══════════════════════════════════════════════════════
            const results = [];
            let checked = 0;
            let failed = 0;

            for (const p of participants) {
                if (cleanJid(p.id) === botJid) continue;

                checked++;

                try {
                    const analysis = await analyzeParticipant(sock, p);

                    if (analysis.score >= 25) {
                        analysis.verdict = getVerdict(analysis.score);
                        results.push(analysis);
                    }
                } catch (e) {
                    failed++;
                    console.error(`[كاشف] فشل ${p.id}:`, e.message);
                }

                // 🛡️ تأخير بين الأعضاء
                await sleep(400);

                // 🛡️ لو rate limited — انتظر أطول
                if (RATE_LIMITED) {
                    await sleep(3000);
                    RATE_LIMITED = false;
                }

                // ─── تحديث كل 10 ───
                if (checked % 10 === 0) {
                    try {
                        await sock.sendMessage(chatId, {
                            text: `*🚀 جـاري الـفـحـص...*

*┋ ✅ تـم فـحـص : ${checked}/${participants.length}*
*┋ 🤖 بـوتـات : ${results.length}*
*┋ ❌ فـشـل : ${failed}*

*⏳ جـاري...*`,
                            edit: startMsg.key
                        }).catch(() => {});
                    } catch {}
                }
            }

            // ═══════════════════════════════════════════════════════
            // 💾 حفظ في القاعدة
            // ═══════════════════════════════════════════════════════
            const cache = loadJson(CACHE_FILE, {});

            for (const r of results) {
                cache[r.jid] = {
                    verdict: r.score >= 80 ? 'bot' : 'suspect',
                    score: r.score,
                    lastCheck: Date.now()
                };
            }

            saveJson(CACHE_FILE, cache);

            // ═══════════════════════════════════════════════════════
            // 📊 التقرير
            // ═══════════════════════════════════════════════════════
            await react(results.length > 0 ? "⚠️" : "✅");

            const report = buildReport(results, participants.length, metadata);

            await sock.sendMessage(chatId, {
                text: report,
                mentions: results.map(r => r.jid)
            }, { quoted: message });

            try {
                await sock.sendMessage(chatId, { delete: startMsg.key });
            } catch {}

        } catch (error) {
            console.error("❌ Detector Error:", error);
            await react("❌");

            let errorMsg = `*❌ فـشـل الـفـحـص*`;

            if (error.message?.includes('rate-overlimit') || error?.data === 429) {
                errorMsg = `*❌ الـبـوت مـحـظـور مـؤقـتـاً مـن واتـسـاب*\n\n📌 الـسـبـب: طـلـبـات كـثـيـرة\n📌 الـحـل: اسـتـنـى 5 دقـائـق وجـرب تـانـي`;
            }

            await reply(`${errorMsg}\n📌 ${error.message}`);
        }
    }
};