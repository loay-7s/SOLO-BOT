// plugins/SUB/احصائيات_فرعية.js
// ════════════════════════════════════════════════════════════════════
//  ⚡ SOLO BOT — Sub Bots Global Statistics (.احصائيات_فرعية)
//  إحصائيات شاملة لكل البوتات الفرعية معاً (وليس فردية)
// ════════════════════════════════════════════════════════════════════

import fs from 'fs-extra';
import path from 'path';

// ════════════════════════════════════════════════════════════════════
//  🎨 الزخرفة
// ════════════════════════════════════════════════════════════════════
const SOLO_HEADER = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*`;
const SOLO_FOOTER = `*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

const SUB_ROOT = './session/sub';

// ════════════════════════════════════════════════════════════════════
//  🛠️ Helpers
// ════════════════════════════════════════════════════════════════════
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(Number(num) || 0);
}

function formatUptime(ms) {
    if (!ms || ms < 0) return '0 ثانية';
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);
    if (secs > 0) parts.push(`${secs} ثانية`);

    return parts.join(' ') || '0 ثانية';
}

function formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(timestamp) {
    try {
        return new Date(timestamp).toLocaleString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'غير متاح';
    }
}

// ════════════════════════════════════════════════════════════════════
//  🔍 جمع الإحصائيات الشاملة
// ════════════════════════════════════════════════════════════════════
async function collectGlobalStats(sub) {
    const bots = sub.list();

    // ─── الإحصائيات الأساسية ───
    const global = {
        totalBots: bots.length,
        connected: 0,
        disconnected: 0,
        totalMessages: 0,
        totalCommandsExecuted: 0,
        totalErrors: 0,
        totalPlugins: 0,
        totalCommands: 0,
        totalUsers: 0,
        totalGroups: 0,
        totalGroupsAsAdmin: 0,
        totalGroupsAsSuperAdmin: 0,
        totalPrivates: 0,
        totalGameSessions: 0,
        totalUptime: 0,
        totalRestarts: 0,
        totalSessions: 0,
        totalSessionSize: 0,
        botDetails: [],
    };

    // ─── المرور على كل بوت ───
    for (const botInfo of bots) {
        const fullBot = sub.get(botInfo.id);
        if (!fullBot) continue;

        // ─── حالة الاتصال ───
        if (fullBot.connected) {
            global.connected++;
        } else {
            global.disconnected++;
        }

        // ─── الرسائل ───
        global.totalMessages += Number(fullBot.messages) || 0;

        // ─── مدة التشغيل ───
        if (fullBot.connected && fullBot.createdAt) {
            global.totalUptime += Date.now() - fullBot.createdAt;
        }

        // ─── مرات إعادة التشغيل ───
        if (fullBot.generation && fullBot.generation > 1) {
            global.totalRestarts += fullBot.generation - 1;
        }

        // ─── بيانات الـ Handler ───
        if (fullBot.handler) {
            try {
                if (fullBot.handler.stats) {
                    global.totalCommandsExecuted += Number(fullBot.handler.stats.commandsExecuted) || 0;
                    global.totalErrors += Number(fullBot.handler.stats.errors) || 0;
                }
                if (fullBot.handler.plugins) {
                    global.totalPlugins += fullBot.handler.plugins.size || 0;
                }
                if (fullBot.handler.commands) {
                    global.totalCommands += fullBot.handler.commands.size || 0;
                }
                if (fullBot.handler.userData) {
                    global.totalUsers += fullBot.handler.userData.size || 0;
                }
                if (fullBot.handler.gameSessions) {
                    global.totalGameSessions += fullBot.handler.gameSessions.size || 0;
                }
            } catch (e) {}
        }

        // ─── جلب المجموعات من الـ sock ───
        if (fullBot.sock && fullBot.connected) {
            try {
                const groupsData = await fullBot.sock.groupFetchAllParticipating();
                const groups = Object.values(groupsData || {});

                global.totalGroups += groups.length;

                // ─── كشف صلاحية البوت في كل مجموعة ───
                const botNumber = fullBot.sock?.user?.id?.split(':')[0]?.split('@')[0];
                const botLid = fullBot.sock?.authState?.creds?.me?.lid?.split(':')[0]?.split('@')[0];

                for (const group of groups) {
                    const participants = Array.isArray(group?.participants) ? group.participants : [];
                    const botParticipant = participants.find(p => {
                        const pId = p?.id?.split(':')[0]?.split('@')[0];
                        const pPhone = p?.phoneNumber?.split(':')[0]?.split('@')[0];
                        const pLid = p?.lid?.split(':')[0]?.split('@')[0];
                        return (botNumber && (pId === botNumber || pPhone === botNumber)) ||
                               (botLid && (pId === botLid || pLid === botLid));
                    });

                    if (botParticipant) {
                        if (botParticipant.admin === 'superadmin') {
                            global.totalGroupsAsSuperAdmin++;
                            global.totalGroupsAsAdmin++;
                        } else if (botParticipant.admin === 'admin') {
                            global.totalGroupsAsAdmin++;
                        }
                    }
                }
            } catch (e) {
                console.error(`[${fullBot.name}] Groups fetch error:`, e?.message);
            }

            // ─── الخاص ───
            try {
                const chats = fullBot.sock?.store?.chats;
                if (chats) {
                    for (const jid of Object.keys(chats)) {
                        if (jid.endsWith('@s.whatsapp.net')) {
                            global.totalPrivates++;
                        }
                    }
                }
            } catch (e) {}
        }

        // ─── تفاصيل البوت (للعرض المختصر) ───
        global.botDetails.push({
            id: fullBot.id,
            name: fullBot.name,
            phone: fullBot.phone,
            connected: fullBot.connected,
            messages: fullBot.messages || 0,
            createdAt: fullBot.createdAt,
        });
    }

    // ─── معلومات الجلسات (من الملفات) ───
    try {
        if (await fs.pathExists(SUB_ROOT)) {
            const entries = await fs.readdir(SUB_ROOT, { withFileTypes: true });
            const folders = entries.filter(e => e.isDirectory());
            global.totalSessions = folders.length;

            for (const folder of folders) {
                const folderPath = path.join(SUB_ROOT, folder.name);
                try {
                    const files = await fs.readdir(folderPath);
                    for (const file of files) {
                        const filePath = path.join(folderPath, file);
                        const stat = await fs.stat(filePath).catch(() => null);
                        if (stat?.isFile()) global.totalSessionSize += stat.size;
                    }
                } catch {}
            }
        }
    } catch (e) {}

    return global;
}

// ════════════════════════════════════════════════════════════════════
//  🎨 بناء رسالة الإحصائيات
// ════════════════════════════════════════════════════════════════════
function buildStatsMessage(data) {
    const g = data;

    const connectionRate = g.totalBots > 0
        ? ((g.connected / g.totalBots) * 100).toFixed(1)
        : '0.0';

    let text = `${SOLO_HEADER}\n\n`;
    text += `*🏮┇ إحـصـائـيـات سـولـو الـشـامـلـة ┇🏮*\n\n`;
    text += `*───━━━⊱  📊  ⊰━━━───*\n\n`;

    // ═══════════════════════════════════════════════════════
    //  🤖 البوتات
    // ═══════════════════════════════════════════════════════
    text += `*🤖 الـبـوتـات:*\n\n`;
    text += `*┋ إجمالي البوتات:* ⦓ ${formatNumber(g.totalBots)} ⦔\n`;
    text += `*┋ متصل:* 🟢 ⦓ ${formatNumber(g.connected)} ⦔\n`;
    text += `*┋ غير متصل:* 🔴 ⦓ ${formatNumber(g.disconnected)} ⦔\n`;
    text += `*┋ نسبة الاتصال:* ⦓ ${connectionRate}% ⦔\n`;
    if (g.totalRestarts > 0) {
        text += `*┋ إعادات التشغيل:* ⦓ ${formatNumber(g.totalRestarts)} ⦔\n`;
    }
    text += `\n`;

    // ═══════════════════════════════════════════════════════
    //  💬 الرسائل والأوامر
    // ═══════════════════════════════════════════════════════
    text += `*───━━━⊱  💬  ⊰━━━───*\n\n`;
    text += `*💬 الـرسـائـل والأوامـر:*\n\n`;
    text += `*┋ إجمالي الرسائل:* ⦓ ${formatNumber(g.totalMessages)} ⦔\n`;
    text += `*┋ الأوامر المنفذة:* ⦓ ${formatNumber(g.totalCommandsExecuted)} ⦔\n`;
    text += `*┋ الأخطاء:* ⦓ ${formatNumber(g.totalErrors)} ⦔\n`;
    if (g.totalCommandsExecuted > 0) {
        const successRate = ((1 - (g.totalErrors / g.totalCommandsExecuted)) * 100).toFixed(1);
        text += `*┋ نسبة النجاح:* ⦓ ${successRate}% ⦔\n`;
    }
    text += `\n`;

    // ═══════════════════════════════════════════════════════
    //  👥 المجموعات
    // ═══════════════════════════════════════════════════════
    text += `*───━━━⊱  👥  ⊰━━━───*\n\n`;
    text += `*👥 الـمـجـمـوعـات والاتـصـالات:*\n\n`;
    text += `*┋ إجمالي المجموعات:* ⦓ ${formatNumber(g.totalGroups)} ⦔\n`;
    text += `*┋ البوت أدمن فيها:* 👑 ⦓ ${formatNumber(g.totalGroupsAsAdmin)} ⦔\n`;
    text += `*┋ البوت Super Admin:* 🏆 ⦓ ${formatNumber(g.totalGroupsAsSuperAdmin)} ⦔\n`;
    if (g.totalGroups > 0) {
        const adminRate = ((g.totalGroupsAsAdmin / g.totalGroups) * 100).toFixed(1);
        text += `*┋ نسبة الأدمن:* ⦓ ${adminRate}% ⦔\n`;
    }
    text += `*┋ المحادثات الخاصة:* ⦓ ${formatNumber(g.totalPrivates)} ⦔\n\n`;

    // ═══════════════════════════════════════════════════════
    //  ⚙️ النظام
    // ═══════════════════════════════════════════════════════
    text += `*───━━━⊱  ⚙️  ⊰━━━───*\n\n`;
    text += `*⚙️ مـعـلـومـات الـنـظـام:*\n\n`;
    text += `*┋ البلجنز المحملة:* ⦓ ${formatNumber(g.totalPlugins)} ⦔\n`;
    text += `*┋ الأوامر المتاحة:* ⦓ ${formatNumber(g.totalCommands)} ⦔\n`;
    text += `*┋ المستخدمون:* ⦓ ${formatNumber(g.totalUsers)} ⦔\n`;
    if (g.totalGameSessions > 0) {
        text += `*┋ جلسات الألعاب النشطة:* ⦓ ${formatNumber(g.totalGameSessions)} ⦔\n`;
    }
    text += `\n`;

    // ═══════════════════════════════════════════════════════
    //  🕐 الأداء
    // ═══════════════════════════════════════════════════════
    text += `*───━━━⊱  🕐  ⊰━━━───*\n\n`;
    text += `*🕐 الأداء والـجـلـسـات:*\n\n`;
    text += `*┋ إجمالي وقت التشغيل:* ⦓ ${formatUptime(g.totalUptime)} ⦔\n`;
    text += `*┋ عدد الجلسات:* ⦓ ${formatNumber(g.totalSessions)} ⦔\n`;
    text += `*┋ حجم الجلسات:* ⦓ ${formatSize(g.totalSessionSize)} ⦔\n\n`;

    // ═══════════════════════════════════════════════════════
    //  🤖 ملخص البوتات (سريع)
    // ═══════════════════════════════════════════════════════
    if (g.botDetails.length > 0) {
        text += `*───━━━⊱  📋  ⊰━━━───*\n\n`;
        text += `*📋 مـلـخـص الـبـوتـات:*\n\n`;

        for (let i = 0; i < g.botDetails.length; i++) {
            const bot = g.botDetails[i];
            const status = bot.connected ? '🟢' : '🔴';
            text += `*┋ ${i + 1}. ${status} ${bot.name}*`;
            text += ` ┋ ${formatNumber(bot.messages)} رسالة\n`;
        }
        text += `\n`;
    } else {
        text += `*───━━━⊱  📭  ⊰━━━───*\n\n`;
        text += `*┋ لا تـوجـد بـوتـات فـرعـيـة مـنـصـبـة*\n\n`;
    }

    // ═══════════════════════════════════════════════════════
    //  🕐 التوقيت
    // ═══════════════════════════════════════════════════════
    text += `*───━━━⊱  📅  ⊰━━━───*\n\n`;
    text += `*┋ آخر تحديث:*\n`;
    text += `*┋ ${formatDate(Date.now())}*\n\n`;

    text += `${SOLO_HEADER}\n`;
    text += `${SOLO_FOOTER}`;

    return text;
}

// ════════════════════════════════════════════════════════════════════
//  🔌 SOLO WRAPPER
// ════════════════════════════════════════════════════════════════════
export default {
    name       : "احصائيات_فرعية",
    aliases    : ["sub_stats", "احصائيات_البوتات", "substats", "احصائيات_فرعية"],
    description: "إحصائيات شاملة عن كل البوتات الفرعية معاً",
    category   : "sub",
    cooldown   : 15000,
    developer  : true,

    async run({ m, sock, reply, react }) {
        try {
            const sub = global.subBots;

            if (!sub) {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ نـظـام الـبـوتـات الـفـرعـيـة غـيـر مـتـاح*\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            }

            await react("📊");

            // ─── جمع الإحصائيات ───
            const data = await collectGlobalStats(sub);

            // ─── بناء الرسالة ───
            const message = buildStatsMessage(data);

            // ─── التقسيم لو طويلة ───
            if (message.length > 4000) {
                const parts = [];
                let currentPart = '';

                for (const line of message.split('\n')) {
                    if ((currentPart + line + '\n').length > 3800) {
                        parts.push(currentPart.trim());
                        currentPart = line + '\n';
                    } else {
                        currentPart += line + '\n';
                    }
                }
                if (currentPart.trim()) parts.push(currentPart.trim());

                for (let i = 0; i < parts.length; i++) {
                    await reply(
                        parts[i] +
                        (i < parts.length - 1
                            ? `\n\n*┋ الـصـفـحـة ${i + 1}/${parts.length}*\n`
                            : '')
                    );
                    if (i < parts.length - 1) {
                        await new Promise(r => setTimeout(r, 500));
                    }
                }
            } else {
                await reply(message);
            }

            await react("✅");

        } catch (err) {
            console.error('[SUB STATS ERROR]', err?.stack || err);
            try {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ حـدث خـطـأ*\n\n` +
                    `*📌 ${String(err?.message || err).slice(0, 200)}*\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            } catch {}
        }
    }
};