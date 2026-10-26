// plugins/كود.js
// ════════════════════════════════════════════════════════════════════
//  ⚡ SOLO BOT — Protocol Extractor ULTIMATE v6.0 (.كود)
//  خارق 10/10 — يستخرج أي رسالة + يحوّل أي plugin + Forwarding كامل
//  🆕 v6.0: تحويل ذكي لـ text + إضافة const text تلقائياً
// ════════════════════════════════════════════════════════════════════

import util from 'util';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

// ════════════════════════════════════════════════════════════════════
//  🎨 الزخرفة الرسمية
// ════════════════════════════════════════════════════════════════════
const SOLO_HEADER = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*`;
const SOLO_FOOTER = `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

// ════════════════════════════════════════════════════════════════════
//  🎨 إرسال Rich Code
// ════════════════════════════════════════════════════════════════════
async function sendRichCode(sock, chatId, codeText) {
    const botNumber = sock.user.jid || sock.user.id;
    const lines = codeText.split('\n');
    const codeBlocks = [];
    const urlRegex = /(https?:\/\/[^\s"]+)/g;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('"') && line.includes(':')) {
            const parts = line.split(/(:)/);
            const keyPart = parts[0];
            const separator = parts[1];
            const valuePart = parts.slice(2).join('');

            codeBlocks.push({ highlightType: 2, codeContent: keyPart });
            codeBlocks.push({ highlightType: 1, codeContent: separator });

            if (urlRegex.test(valuePart)) {
                urlRegex.lastIndex = 0;
                const valParts = valuePart.split(urlRegex);
                for (const part of valParts) {
                    if (urlRegex.test(part) || part.startsWith('http')) {
                        codeBlocks.push({ highlightType: 3, codeContent: part });
                    } else {
                        codeBlocks.push({ highlightType: 1, codeContent: part });
                    }
                }
            } else {
                codeBlocks.push({ highlightType: 1, codeContent: valuePart });
            }
        } else {
            codeBlocks.push({ highlightType: 1, codeContent: line });
        }
        if (i < lines.length - 1) {
            codeBlocks.push({ highlightType: 1, codeContent: '\n' });
        }
    }

    const richMessage = {
        richResponseMessage: {
            messageType: 1,
            submessages: [{
                messageType: 5,
                codeMetadata: {
                    codeLanguage: 'javascript',
                    codeBlocks: codeBlocks
                }
            }],
            contextInfo: {
                isForwarded: true,
                forwardingScore: 1,
                forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
                forwardOrigin: 4
            }
        }
    };

    const previewMsg = await generateWAMessageFromContent(chatId, {
        botForwardedMessage: { message: richMessage }
    }, {
        userJid: botNumber,
        messageId: (sock.generateMessageIDV2 && typeof sock.generateMessageIDV2 === 'function')
            ? sock.generateMessageIDV2(botNumber)
            : 'SOLO-' + Date.now().toString(36).toUpperCase()
    });

    await sock.relayMessage(chatId, previewMsg.message, { messageId: previewMsg.key.id });
}

// ════════════════════════════════════════════════════════════════════
//  🔍 كشف نوع الرسالة
// ════════════════════════════════════════════════════════════════════
function getMessageType(msg) {
    if (!msg) return 'غير معروف';
    const keys = Object.keys(msg);

    const types = {
        'conversation': 'نص',
        'extendedTextMessage': 'نص مطوّل',
        'imageMessage': 'صورة',
        'videoMessage': 'فيديو',
        'audioMessage': 'صوت',
        'pttMessage': 'رسالة صوتية',
        'documentMessage': 'مستند',
        'stickerMessage': 'ملصق',
        'locationMessage': 'موقع',
        'liveLocationMessage': 'موقع حي',
        'contactMessage': 'جهة اتصال',
        'contactsArrayMessage': 'جهات اتصال',
        'buttonsMessage': 'أزرار قديمة',
        'buttonsResponseMessage': 'رد على أزرار',
        'listMessage': 'قائمة قديمة',
        'listResponseMessage': 'رد على قائمة',
        'templateMessage': 'قالب',
        'templateButtonReplyMessage': 'رد على قالب',
        'interactiveMessage': 'تفاعلية',
        'interactiveResponseMessage': 'رد تفاعلي',
        'pollCreationMessage': 'استفتاء',
        'pollCreationMessageV2': 'استفتاء V2',
        'pollCreationMessageV3': 'استفتاء V3',
        'pollUpdateMessage': 'تحديث استفتاء',
        'reactionMessage': 'تفاعل',
        'protocolMessage': 'بروتوكول',
        'viewOnceMessage': 'عرض مرة واحدة',
        'viewOnceMessageV2': 'عرض مرة واحدة V2',
        'viewOnceMessageV2Extension': 'عرض مرة واحدة V3',
        'ephemeralMessage': 'مؤقت',
        'documentWithCaptionMessage': 'مستند بشرح',
        'productMessage': 'منتج',
        'orderMessage': 'طلب',
        'invoiceMessage': 'فاتورة',
        'groupInviteMessage': 'دعوة مجموعة',
        'eventMessage': 'حدث',
        'albumMessage': 'ألبوم',
        'editedMessage': 'معدلة',
        'keepInChatMessage': 'ابقاء في المحادثة',
        'deviceSentMessage': 'مرسلة من جهاز',
        'senderKeyDistributionMessage': 'توزيع مفتاح',
        'stickerPackMessage': 'حزمة ملصقات',
    };

    for (const key of keys) {
        if (types[key]) return types[key];
    }
    return `غير معروف (${keys[0] || 'فارغ'})`;
}

// ════════════════════════════════════════════════════════════════════
//  🔄 استخراج معلومات الـ Forwarding
// ════════════════════════════════════════════════════════════════════
function extractForwardingInfo(msg) {
    if (!msg || typeof msg !== 'object') return null;

    const searchContext = (obj, depth = 0) => {
        if (!obj || typeof obj !== 'object' || depth > 10) return null;
        if (obj.contextInfo) return obj.contextInfo;
        for (const key in obj) {
            if (typeof obj[key] === 'object') {
                const found = searchContext(obj[key], depth + 1);
                if (found) return found;
            }
        }
        return null;
    };

    const ctx = searchContext(msg);
    if (!ctx) return null;

    const info = {};
    if (ctx.isForwarded) info.isForwarded = true;
    if (ctx.forwardingScore) info.forwardingScore = ctx.forwardingScore;
    if (ctx.forwardOrigin) info.forwardOrigin = ctx.forwardOrigin;
    if (ctx.forwardedAiBotMessageInfo) info.forwardedAiBotMessageInfo = ctx.forwardedAiBotMessageInfo;
    if (ctx.forwardedNewsletterMessageInfo) info.forwardedNewsletterMessageInfo = ctx.forwardedNewsletterMessageInfo;
    if (ctx.forwarded) info.forwarded = ctx.forwarded;

    return Object.keys(info).length > 0 ? info : null;
}

// ════════════════════════════════════════════════════════════════════
//  📦 محوّل البيانات لـ JS Code
// ════════════════════════════════════════════════════════════════════
function stringifyPayload(obj, indent = '   ', isInsideContextInfo = false, seen = new WeakSet()) {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'function') return 'undefined';

    if (typeof obj === 'object') {
        if (seen.has(obj)) return '"[Circular Reference]"';
        seen.add(obj);
    }

    if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
        return `Buffer.from("${Buffer.from(obj).toString('base64')}", "base64")`;
    }

    if (typeof obj === 'object') {
        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
            return `Buffer.from("${Buffer.from(obj.data).toString('base64')}", "base64")`;
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            return `[\n${indent}   ${obj.map(item => stringifyPayload(item, indent + '   ', isInsideContextInfo, seen)).join(`,\n${indent}   `)}\n${indent}]`;
        }

        const keys = Object.keys(obj).filter(k => typeof obj[k] !== 'function' && k !== 'm' && k !== 'conn' && k !== 'sock');
        if (keys.length === 0) return '{}';

        const parts = keys.map(k => {
            const validKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
            const currentContext = isInsideContextInfo || k === 'contextInfo';
            if (currentContext && k === 'stanzaId') return `${validKey}: m.key.id`;
            if (currentContext && k === 'participant') return `${validKey}: m.sender`;
            if (currentContext && k === 'remoteJid') return `${validKey}: m.chat`;
            return `${validKey}: ${stringifyPayload(obj[k], indent + '   ', currentContext, seen)}`;
        });

        return `{\n${indent}   ${parts.join(`,\n${indent}   `)}\n${indent}}`;
    }

    return typeof obj === 'string' ? JSON.stringify(obj) : String(obj);
}

// ════════════════════════════════════════════════════════════════════
//  🧹 فك تغليف الرسالة
// ════════════════════════════════════════════════════════════════════
function unwrapAll(msg, depth = 0) {
    if (!msg || typeof msg !== 'object' || depth > 10) return msg;

    const cleanMsg = { ...msg };
    delete cleanMsg.key;
    delete cleanMsg.messageStubParameters;
    delete cleanMsg.messageStubType;

    if (cleanMsg.message) return unwrapAll(cleanMsg.message, depth + 1);
    if (cleanMsg.ephemeralMessage?.message) return unwrapAll(cleanMsg.ephemeralMessage.message, depth + 1);
    if (cleanMsg.viewOnceMessage?.message) return unwrapAll(cleanMsg.viewOnceMessage.message, depth + 1);
    if (cleanMsg.viewOnceMessageV2?.message) return unwrapAll(cleanMsg.viewOnceMessageV2.message, depth + 1);
    if (cleanMsg.viewOnceMessageV2Extension?.message) return unwrapAll(cleanMsg.viewOnceMessageV2Extension.message, depth + 1);
    if (cleanMsg.documentWithCaptionMessage?.message) return unwrapAll(cleanMsg.documentWithCaptionMessage.message, depth + 1);
    if (cleanMsg.ptvMessage?.message) return unwrapAll(cleanMsg.ptvMessage.message, depth + 1);
    if (cleanMsg.deviceSentMessage?.message) return unwrapAll(cleanMsg.deviceSentMessage.message, depth + 1);
    if (cleanMsg.editedMessage?.message) return unwrapAll(cleanMsg.editedMessage.message, depth + 1);

    return cleanMsg;
}

// ════════════════════════════════════════════════════════════════════
//  🔍 كشف إذا كان تفاعلي
// ════════════════════════════════════════════════════════════════════
function needsAdditionalNodes(payload) {
    if (!payload) return false;

    const check = ['interactiveMessage', 'buttonsMessage', 'listMessage', 'templateMessage'];

    for (const key of check) {
        if (payload[key]) return true;
    }

    const wrapped = payload.viewOnceMessage?.message || payload.viewOnceMessageV2?.message;
    if (wrapped) {
        for (const key of check) {
            if (wrapped[key]) return true;
        }
    }

    return false;
}

// ════════════════════════════════════════════════════════════════════
//  🆕 بناء الـ Forwarding ContextInfo
// ════════════════════════════════════════════════════════════════════
function buildForwardingContextString(forwardingInfo) {
    if (!forwardingInfo) return '';

    const parts = [];
    if (forwardingInfo.isForwarded) parts.push('isForwarded: true');
    if (forwardingInfo.forwardingScore) parts.push(`forwardingScore: ${forwardingInfo.forwardingScore}`);
    if (forwardingInfo.forwardOrigin) parts.push(`forwardOrigin: ${forwardingInfo.forwardOrigin}`);

    if (forwardingInfo.forwardedAiBotMessageInfo) {
        parts.push(`forwardedAiBotMessageInfo: ${stringifyPayload(forwardingInfo.forwardedAiBotMessageInfo)}`);
    }
    if (forwardingInfo.forwardedNewsletterMessageInfo) {
        parts.push(`forwardedNewsletterMessageInfo: ${stringifyPayload(forwardingInfo.forwardedNewsletterMessageInfo)}`);
    }
    if (forwardingInfo.forwarded) {
        parts.push(`forwarded: ${stringifyPayload(forwardingInfo.forwarded)}`);
    }

    if (parts.length === 0) return '';

    return `,
         contextInfo: {
            ${parts.join(',\n            ')}
         }`;
}

// ════════════════════════════════════════════════════════════════════
//  🆕 كشف استخدام text بذكاء (بدون false positives)
// ════════════════════════════════════════════════════════════════════
function detectTextUsage(bodyStr) {
    // إزالة strings و template literals قبل الفحص
    let cleanBody = bodyStr
        .replace(/`[^`]*`/g, '')           // template literals
        .replace(/'[^']*'/g, '""')          // single quotes
        .replace(/"[^"]*"/g, '""');         // double quotes

    // إزالة comments
    cleanBody = cleanBody
        .replace(/\/\/[^\n]*/g, '')         // single-line
        .replace(/\/\*[\s\S]*?\*\//g, '');  // multi-line

    // فحص استخدام text كمتغير
    // - text (مش جزء من كلمة أطول)
    // - text. (property access)
    // - text[ (index access)
    // - text) (function arg)
    // - text, (function arg)
    // - text; (statement)
    // - text = (assignment)
    // - text ? (ternary)
    // - !text (negation)
    // - text || (logical)
    // - text && (logical)
    const textUsageRegex = /(?<![a-zA-Z0-9_$])text(?![a-zA-Z0-9_$])/;

    return textUsageRegex.test(cleanBody);
}

// ════════════════════════════════════════════════════════════════════
//  🔄 محوّل Plugins لبنية SOLO BOT
// ════════════════════════════════════════════════════════════════════
function convertPlugin(quotedText) {
    let code = quotedText;

    // ─── استخراج imports ───
    let imports = [];
    code = code.replace(/^(?:import\s+[\s\S]+?from\s+['"].+?['"]\s*;?|const\s+.+?\s*=\s*require\(['"].+?['"]\)\s*;?)/gm, (match) => {
        imports.push(match.trim());
        return '';
    });

    // ─── استخراج command ───
    let commandNames = ['command'];
    let cmdMatch = code.match(/handler\.command\s*=\s*(\[.*?\]|'.*?'|".*?"|\/.*?\/[a-z]*)/i);
    if (cmdMatch) {
        let rawCmd = cmdMatch[1];
        if (rawCmd.startsWith('/')) {
            let cleaned = rawCmd.replace(/^\/\^?|\$?\/[a-z]*$/gi, '');
            cleaned = cleaned.replace(/^\((.*?)\)$/, '$1');
            commandNames = cleaned.split('|').map(c => c.trim()).filter(Boolean);
        } else if (rawCmd.startsWith('[')) {
            commandNames = rawCmd
                .replace(/^\[|\]$/g, '')
                .split(',')
                .map(c => c.trim().replace(/['"]/g, ''))
                .filter(Boolean);
        } else {
            commandNames = [rawCmd.replace(/['"]/g, '').trim()];
        }
    }

    // ─── استخراج help ───
    let helpText = 'وصف الاستخدام';
    let helpMatch = code.match(/handler\.help\s*=\s*(\[.*?\]|'.*?'|".*?")/i);
    if (helpMatch) {
        let rawHelp = helpMatch[1];
        if (rawHelp.startsWith('[')) {
            let arr = rawHelp.replace(/^\[|\]$/g, '').split(',');
            helpText = arr[0] ? arr[0].trim().replace(/['"]/g, '') : 'وصف الاستخدام';
        } else {
            helpText = rawHelp.replace(/['"]/g, '').trim();
        }
    }

    // ─── استخراج tags ───
    let category = 'أدوات';
    let tagsMatch = code.match(/handler\.tags\s*=\s*(\[.*?\]|'.*?'|".*?")/i);
    if (tagsMatch) {
        let rawTags = tagsMatch[1];
        if (rawTags.startsWith('[')) {
            let arr = rawTags.replace(/^\[|\]$/g, '').split(',');
            category = arr[0] ? arr[0].trim().replace(/['"]/g, '') : 'أدوات';
        } else {
            category = rawTags.replace(/['"]/g, '').trim();
        }
    }

    // ─── استخراج flags ───
    const developer = /handler\.(owner|rowner)\s*=\s*true/i.test(code);
    const admin     = /handler\.admin\s*=\s*true/i.test(code);
    const group     = /handler\.group\s*=\s*true/i.test(code);
    const isPrivate = /handler\.private\s*=\s*true/i.test(code);
    const premium   = /handler\.premium\s*=\s*true/i.test(code);
    const limit     = /handler\.limit\s*=\s*true/i.test(code);

    // ─── استخراج جسم الـ handler ───
    let linesOfCode = quotedText.split('\n');
    let bodyLines = [];
    let insideHandler = false;

    for (let line of linesOfCode) {
        let trimmed = line.trim();

        if (/let\s+handler\s*=\s*async/i.test(line) ||
            /const\s+handler\s*=\s*async/i.test(line) ||
            /async\s+function\s+handler/i.test(line) ||
            /handler\s*=\s*async/i.test(line)) {
            insideHandler = true;
            continue;
        }

        if (insideHandler) {
            if (trimmed.startsWith('handler.') ||
                trimmed.startsWith('export default') ||
                trimmed.startsWith('module.exports')) {
                break;
            }
            bodyLines.push(line);
        }
    }

    let bodyStr = bodyLines.join('\n').trim();

    if (bodyStr.endsWith('};')) bodyStr = bodyStr.substring(0, bodyStr.length - 2).trim();
    else if (bodyStr.endsWith('}')) bodyStr = bodyStr.substring(0, bodyStr.length - 1).trim();

    // ─── 🆕 كشف استخدام text قبل التحويل ───
    const usesText = detectTextUsage(bodyStr);

    // ─── تحويل الميثودز ───
    bodyStr = bodyStr.replace(
        /(conn|client|sock)\.sendMessage\(\s*m\.chat\s*,\s*\{\s*text:\s*([\s\S]*?)\s*\}\s*(?:,\s*\{\s*quoted:\s*m\s*\}\s*)?\)/g,
        'await reply($2)'
    );

    bodyStr = bodyStr.replace(
        /(conn|client|sock)\.reply\(\s*m\.chat\s*,\s*([\s\S]*?)\s*,\s*m\s*\)/g,
        'await reply($2)'
    );

    bodyStr = bodyStr.replace(
        /(conn|client|sock)\.sendMessage\(\s*m\.chat\s*,\s*/g,
        'sock.sendMessage(message.key.remoteJid, '
    );

    bodyStr = bodyStr.replace(/\bm\.reply\s*\(/g, 'reply(');
    bodyStr = bodyStr.replace(/\bm\.react\s*\(/g, 'react(');
    bodyStr = bodyStr.replace(/\bm\.chat\b/g, 'message.key.remoteJid');
    bodyStr = bodyStr.replace(/\bm\.sender\b/g, '(message.key.participant || message.key.remoteJid)');
    bodyStr = bodyStr.replace(/\bm\.key\b/g, 'message.key');
    bodyStr = bodyStr.replace(/\busedPrefix\b/g, '"."');
    bodyStr = bodyStr.replace(/\bconn\b/g, 'sock');
    bodyStr = bodyStr.replace(/\bclient\b/g, 'sock');

    // ─── 🆕 إضافة const text تلقائياً إذا كان مستخدم ───
    let textDef = '';
    if (usesText) {
        textDef = '            const text = args.join(\' \').trim();\n\n';
    }

    // ─── بناء الكود النهائي ───
    const name = commandNames[0] || 'command';
    const aliases = commandNames.slice(1);

    let flagsStr = '';
    if (developer) flagsStr += '    developer  : true,\n';
    if (admin) flagsStr += '    admin      : true,\n';
    if (group) flagsStr += '    group      : true,\n';
    if (isPrivate) flagsStr += '    private    : true,\n';
    if (premium) flagsStr += '    premium    : true,\n';
    if (limit) flagsStr += '    cooldown   : 5000,\n';

    let pluginCode = `${imports.join('\n')}${imports.length > 0 ? '\n\n' : ''}export default {
    name       : '${name}',
    aliases    : [${aliases.map(a => `'${a}'`).join(', ')}],
    description: '${helpText}',
    category   : '${category}',
${flagsStr}
    async run({ sock, message, args, reply, react, command }) {
        try {
${textDef}${bodyStr.split('\n').map(l => '            ' + l).join('\n')}
        } catch (error) {
            console.error('[${name} ERROR]', error);
            return reply(\`*❌ حدث خطأ*\\n\\n📌 \${error.message}\`);
        }
    }
};`;

    return pluginCode;
}

// ════════════════════════════════════════════════════════════════════
//  🎨 رسائل مساعدة
// ════════════════════════════════════════════════════════════════════
function formatWelcome() {
    return (
        `${SOLO_HEADER}\n\n` +
        `*🏮┇ اسـتـخـراج الـكـود ┇🏮*\n\n` +
        `*───━━━⊱  ⚡  ⊰━━━───*\n\n` +
        `*┋ يـرجـى الـرد عـلـى الـرسـالـة أو الـكـود* 🗡️\n\n` +
        `*───━━━⊱  📋  ⊰━━━───*\n\n` +
        `*🔹 .كود* ← رد على أي رسالة\n` +
        `*🔹 .كود* ← رد على plugin\n` +
        `*🔹 .كود* ← رد على كود JS\n\n` +
        `*───━━━⊱  💡  ⊰━━━───*\n\n` +
        `*┋ الـطـريـقـة:*\n` +
        `*┋ 1. اعـمـل ريـبـلاي عـلـى الـرسـالـة*\n` +
        `*┋ 2. اكـتـب .كود*\n` +
        `*┋ 3. هـيـرجـعـلـك الـكـود جـاهـز\n\n` +
        `${SOLO_HEADER}\n` +
        `${SOLO_FOOTER}`
    );
}

function formatSuccess(type, details) {
    return (
        `${SOLO_HEADER}\n\n` +
        `*✅ تـم الـنـجـاح*\n\n` +
        `*───━━━⊱  🏮  ⊰━━━───*\n\n` +
        `*📌 الـنـوع:* ⦓ ${type} ⦔\n` +
        `${details}\n\n` +
        `${SOLO_HEADER}\n` +
        `${SOLO_FOOTER}`
    );
}

function formatError(errorMessage) {
    const shortError = String(errorMessage).slice(0, 300);

    return (
        `${SOLO_HEADER}\n\n` +
        `*❌ حـدث خـطـأ*\n\n` +
        `*───━━━⊱  ⚠️  ⊰━━━───*\n\n` +
        `*📌 الـخـطـأ:* \`${shortError}\`\n\n` +
        `*───━━━⊱  💡  ⊰━━━───*\n\n` +
        `*┋ تـأكـد مـن الـرد عـلـى رسـالـة فـعـلـيـة*\n` +
        `*┋ أو جـرب مـرة أخـرى\n\n` +
        `${SOLO_HEADER}\n` +
        `${SOLO_FOOTER}`
    );
}

// ════════════════════════════════════════════════════════════════════
//  🎯 الدالة الرئيسية
// ════════════════════════════════════════════════════════════════════
async function protocolExtractorHandler(m, { sock, command }) {
    // ─── بدون رد → رسالة المساعدة ───
    if (!m.quoted) {
        return m.reply(formatWelcome());
    }

    const quotedText = m.quoted.text || m.quoted.msg?.text || m.quoted.msg?.caption || '';
    const isExplicitCode = quotedText.startsWith('=>') || quotedText.startsWith('>');

    const isPluginConversion = quotedText.includes('handler') &&
        (quotedText.includes('handler.command') ||
         quotedText.includes('module.exports') ||
         quotedText.includes('export default'));

    // ═══════════════════════════════════════════════════════════════
    //  🔄 تحويل Plugin
    // ═══════════════════════════════════════════════════════════════
    if (isPluginConversion) {
        try {
            const pluginCode = convertPlugin(quotedText);
            await sendRichCode(sock, m.chat, pluginCode);

            return m.reply(formatSuccess(
                'تحويل Plugin',
                `*┋ الـكـود جـاهـز فـوق 👆*\n` +
                `*┋ انـسـخـه وحـطـه فـي plugins/\n` +
                `*┋ تـم إضـافـة const text تـلـقـائـيـاً (لـو مـسـتـخـدم) ✨`
            ));
        } catch (convertError) {
            console.error('[CONVERT ERROR]', convertError);
            return m.reply(formatError(`فشل تحويل Plugin: ${convertError.message}`));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  🎯 تنفيذ كود JavaScript
    // ═══════════════════════════════════════════════════════════════
    if (isExplicitCode) {
        let cleanText = quotedText.trim().replace(/^(>|=>)\s*/, '');
        const isMessageBuilder = cleanText.includes('relayMessage') ||
            cleanText.includes('sendMessage') ||
            (cleanText.startsWith('{') && cleanText.endsWith('}'));

        if (!isMessageBuilder) {
            try {
                let evalResult = await eval(`(async () => { return ${cleanText} })()`);
                if (evalResult === undefined) {
                    evalResult = await eval(`(async () => { ${cleanText} })()`);
                }
                const resultString = util.inspect(evalResult, { depth: 3, maxArrayLength: 50 });

                return m.reply(
                    `${SOLO_HEADER}\n\n` +
                    `*✨ الـنـتـيـجـة*\n\n` +
                    `*───━━━⊱  ⚡  ⊰━━━───*\n\n` +
                    `\`\`\`${resultString}\`\`\`\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            } catch (evalError) {
                return m.reply(
                    `${SOLO_HEADER}\n\n` +
                    `*⚠️ خـطـأ فـي تـنـفـيـذ الـكـود*\n\n` +
                    `*───━━━⊱  📌  ⊰━━━───*\n\n` +
                    `\`\`\`${String(evalError).slice(0, 500)}\`\`\`\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  📦 استخراج البروتوكول
    // ═══════════════════════════════════════════════════════════════
    let messagePayload = null;

    let rawQuoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!rawQuoted) {
        if (m.quoted?.message) rawQuoted = m.quoted.message;
        else if (m.quoted?.mtype && m.quoted?.msg) rawQuoted = { [m.quoted.mtype]: m.quoted.msg };
        else rawQuoted = m.quoted;
    }

    messagePayload = unwrapAll(rawQuoted);
    if (!messagePayload || Object.keys(messagePayload).length === 0) {
        messagePayload = { ...rawQuoted };
        delete messagePayload.m;
        delete messagePayload.conn;
        delete messagePayload.sender;
    }

    if (!messagePayload || typeof messagePayload !== 'object') {
        return m.reply(
            `${SOLO_HEADER}\n\n` +
            `*❌ فـشـل الاسـتـخـراج*\n\n` +
            `*───━━━⊱  ⚠️  ⊰━━━───*\n\n` +
            `*┋ تـأكـد مـن الـرد عـلـى رسـالـة فـعـلـيـة*\n\n` +
            `${SOLO_HEADER}\n` +
            `${SOLO_FOOTER}`
        );
    }

    // ─── استخراج معلومات الـ Forwarding ───
    const forwardingInfo = extractForwardingInfo(rawQuoted) || extractForwardingInfo(messagePayload);

    // ─── بناء البروتوكول ───
    const messageType = getMessageType(messagePayload);
    const payloadString = stringifyPayload(messagePayload);
    const isInteractive = needsAdditionalNodes(messagePayload);
    const forwardingContextStr = buildForwardingContextString(forwardingInfo);

    let additionalNodesStr = '';
    if (isInteractive) {
        additionalNodesStr = `,
         additionalNodes: [
            {
               tag: 'biz',
               attrs: {},
               content: [
                  {
                     tag: 'interactive',
                     attrs: { type: 'native_flow', v: '1' },
                     content: [
                        { tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }
                     ]
                  }
               ]
            }
         ]`;
    }

    let headerInfo = `> // 📦 نوع الرسالة: ${messageType}\n`;
    headerInfo += `> // ${isInteractive ? '⚠️ رسالة تفاعلية — تحتاج additionalNodes' : '✅ رسالة عادية'}\n`;
    if (forwardingInfo) {
        headerInfo += `> // 🔄 الرسالة معاد توجيهها (Forwarded)\n`;
        if (forwardingInfo.forwardedAiBotMessageInfo) {
            headerInfo += `> // 🤖 مصدرها: بوت AI\n`;
        }
        if (forwardingInfo.forwardedNewsletterMessageInfo) {
            headerInfo += `> // 📢 مصدرها: قناة\n`;
        }
    }

    const formattedProtocol = `${headerInfo}> try {
   await sock.relayMessage(
      m.chat,
      ${payloadString},
      { 
         messageId: (sock.generateMessageIDV2 && typeof sock.generateMessageIDV2 === 'function') 
            ? sock.generateMessageIDV2(m.chat) 
            : "SOLO-" + Date.now().toString(36).toUpperCase()${additionalNodesStr}${forwardingContextStr}
      }
   );
   await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
} catch (e) {
   m.reply(String(e?.stack || e));
}`;

    try {
        await sendRichCode(sock, m.chat, formattedProtocol);
    } catch (sendError) {
        console.error('[SEND PROTOCOL ERROR]', sendError);
        return m.reply(formatError(`فشل إرسال البروتوكول: ${sendError.message}`));
    }

    // ─── إرسال تجريبي ───
    const patchPayloadForLiveTest = (obj, seenLive = new WeakSet()) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) return obj;
        if (seenLive.has(obj)) return undefined;
        seenLive.add(obj);
        const cloned = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (typeof obj[key] === 'function') continue;
                if (key === 'stanzaId') cloned[key] = m.key.id;
                else if (key === 'participant') cloned[key] = m.sender;
                else if (key === 'remoteJid') cloned[key] = m.chat;
                else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (obj[key].type === 'Buffer' && Array.isArray(obj[key].data)) {
                        cloned[key] = Buffer.from(obj[key].data);
                    } else {
                        cloned[key] = patchPayloadForLiveTest(obj[key], seenLive);
                    }
                } else cloned[key] = obj[key];
            }
        }
        return cloned;
    };

    const relayOptions = {
        messageId: (sock.generateMessageIDV2 && typeof sock.generateMessageIDV2 === 'function')
            ? sock.generateMessageIDV2(m.chat)
            : 'SOLO-TEST-' + Date.now().toString(36).toUpperCase()
    };

    if (isInteractive) {
        relayOptions.additionalNodes = [
            {
                tag: 'biz',
                attrs: {},
                content: [
                    {
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [
                            { tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }
                        ]
                    }
                ]
            }
        ];
    }

    if (forwardingInfo) {
        relayOptions.contextInfo = {
            ...forwardingInfo,
            ...(forwardingInfo.forwardedAiBotMessageInfo && {
                forwardedAiBotMessageInfo: forwardingInfo.forwardedAiBotMessageInfo
            }),
            ...(forwardingInfo.forwardedNewsletterMessageInfo && {
                forwardedNewsletterMessageInfo: forwardingInfo.forwardedNewsletterMessageInfo
            })
        };
    }

    try {
        await sock.relayMessage(m.chat, patchPayloadForLiveTest(messagePayload), relayOptions);
        await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        return m.reply(formatSuccess(
            'استخراج بروتوكول',
            `*┋ نوع الرسالة:* ⦓ ${messageType} ⦔\n` +
            `*┋ الـكـود جـاهـز فـوق 👆\n` +
            `*┋ تـم اخـتـبـاره حـيـاً ✨`
        ));

    } catch (testError) {
        console.error('[LIVE TEST ERROR]', testError);
        return m.reply(
            `${SOLO_HEADER}\n\n` +
            `*⚠️ الـكـود فـوق صـحـيـح، لـكـن الاخـتـبـار فـشـل*\n\n` +
            `*───━━━⊱  📌  ⊰━━━───*\n\n` +
            `*┋ نوع الرسالة:* ⦓ ${messageType} ⦔\n` +
            `*┋ الـخـطـأ:* \`${String(testError.message || testError).slice(0, 200)}\`\n\n` +
            `${SOLO_HEADER}\n` +
            `${SOLO_FOOTER}`
        );
    }
}

// ════════════════════════════════════════════════════════════════════
//  🔌 SOLO WRAPPER — محمي للمطورين فقط
// ════════════════════════════════════════════════════════════════════
export default {
    name       : 'كود',
    aliases    : ['استخراج', '-->', 'protocol', 'extract', 'code'],
    description: 'استخراج البروتوكول + تحويل Plugins لبنية SOLO BOT',
    category   : 'أدوات',
    cooldown   : 3000,
    developer  : true,

    async run({ sock, message, args, reply, react, command }) {
        try {
            // ─── تحويل message للشكل المطلوب ───
            const m = message;
            m.chat   = message.key.remoteJid;
            m.sender = message.key.participant || message.key.remoteJid;

            m.reply = (content) =>
                reply(typeof content === 'string' ? content : content.text || '');

            // ─── محاكاة m.quoted ───
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const ctx = message.message.extendedTextMessage.contextInfo;
                const quotedMsg = ctx.quotedMessage;

                m.quoted = {
                    message   : quotedMsg,
                    text      : quotedMsg?.conversation ||
                                quotedMsg?.extendedTextMessage?.text ||
                                quotedMsg?.imageMessage?.caption ||
                                quotedMsg?.videoMessage?.caption || '',
                    msg       : quotedMsg?.extendedTextMessage || quotedMsg,
                    mtype     : Object.keys(quotedMsg)[0],
                    sender    : ctx.participant,
                    key       : {
                        id        : ctx.stanzaId,
                        remoteJid : m.chat,
                        participant: ctx.participant
                    }
                };
            } else {
                m.quoted = null;
            }

            // ─── ريأكت تلقائي ───
            await react('🏮');

            // ─── استدعاء الدالة الرئيسية ───
            return await protocolExtractorHandler(m, {
                sock,
                command: command || 'كود'
            });

        } catch (err) {
            console.error('[EXTRACTOR CRITICAL]', err?.stack || err);
            try {
                await react('❌');
                return reply(formatError(err?.message || 'unknown'));
            } catch (finalError) {
                console.error('[FINAL ERROR]', finalError);
            }
        }
    }
};