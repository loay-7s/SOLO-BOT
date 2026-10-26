// ========================================

import readline from 'readline';
import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

// 🗡️ نظام الألوان - SOLO LEVELING STYLE
const COLORS = {
    // الألوان الأساسية (مستوحاة من سولو ليفلنج)
    primary: chalk.hex('#00BFFF'),      // أزرق ساطع (مثل نظام اللاعب)
    secondary: chalk.hex('#FF4444'),    // أحمر الدم (مثل الوحوش)
    accent: chalk.hex('#FFD700'),       // ذهبي (مثل المكافآت)
    dark: chalk.hex('#1A1A2E'),         // ظلام (مثل الزنزانات)
    shadow: chalk.hex('#0D0D1A'),       // ظل عميق
    mana: chalk.hex('#6C5CE7'),         // أرجواني مانا
    health: chalk.hex('#00FF88'),       // أخضر صحي
    power: chalk.hex('#FF6B35'),        // برتقالي قوة
    legendary: chalk.hex('#FFD700'),    // ذهبي أسطوري
    rare: chalk.hex('#00BFFF'),         // أزرق نادر
    epic: chalk.hex('#9B59B6'),         // أرجواني ملحمي
    error: chalk.hex('#FF0000'),        // أحمر خطأ
    success: chalk.hex('#00FF88'),      // أخضر نجاح
    warning: chalk.hex('#FFA500'),      // برتقالي تحذير
    info: chalk.hex('#00BFFF'),         // أزرق معلومات
    silver: chalk.hex('#C0C0C0'),       // فضي
    gold: chalk.hex('#FFD700'),         // ذهبي
    white: chalk.white,
    gray: chalk.gray,
    bold: chalk.bold,
    dim: chalk.dim,
    // تأثيرات خاصة
    glow: chalk.hex('#FF6B6B'),
    system: chalk.hex('#4ECDC4'),
    player: chalk.hex('#00BFFF'),
    monster: chalk.hex('#FF4444'),
    boss: chalk.hex('#FF6B35'),
    shadow: chalk.hex('#2C3E50')
};

// ⚔️ التدرجات - مستوحاة من سولو ليفلنج
const GRADIENTS = {
    main: gradient(['#00BFFF', '#6C5CE7', '#FF6B35']),
    power: gradient(['#FF6B35', '#FF4444', '#FFD700']),
    mana: gradient(['#6C5CE7', '#00BFFF', '#4ECDC4']),
    shadow: gradient(['#0D0D1A', '#1A1A2E', '#2C3E50']),
    legendary: gradient(['#FFD700', '#FF6B35', '#FF4444']),
    system: gradient(['#00BFFF', '#4ECDC4', '#00FF88']),
    rainbow: gradient(['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'])
};

// 🏮 الشخصيات والنصوص
const ICONS = {
    player: '⚔️',
    system: '🛡️',
    monster: '👹',
    boss: '👑',
    shadow: '🗡️',
    mana: '✨',
    health: '❤️',
    power: '💪',
    loot: '💰',
    xp: '⭐',
    level: '📊',
    quest: '📜',
    dungeon: '🏛️',
    guild: '⚜️',
    rank: '🏆',
    skill: '🌀',
    warning: '⚠️',
    error: '❌',
    success: '✅',
    info: 'ℹ️',
    star: '🌟'
};

// 📋 البيانات الأساسية للاعب
const PLAYER_DATA = {
    name: '𝐒𝐎𝐋𝐎',
    level: 999,
    rank: '𒆜 𝐓𝐇𝐄 𝐔𝐋𝐓𝐈𝐌𝐀𝐓𝐄 𒆜',
    title: '🏮 𝐒𝐇𝐀𝐃𝐎𝐖 𝐌𝐎𝐍𝐀𝐑𝐂𝐇 🏮',
    stats: {
        strength: '∞',
        agility: '∞',
        intelligence: '∞',
        perception: '∞'
    }
};

export class ConsoleSystem {
    constructor(bot) {
        this.bot = bot;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        // 📊 نظام الإحصائيات
        this.stats = {
            messages: { private: 0, group: 0, total: 0 },
            commands: { executed: 0, failed: 0 },
            errors: { count: 0, last: null },
            uptime: { start: Date.now(), lastPing: Date.now() },
            performance: { avgResponse: 0, peakMemory: 0 }
        };

        this.spinner = null;
        this.commands = new Map();
        this.errorLog = [];
        this.isPaused = false;

        // 🚀 تشغيل الأنظمة
        this.setupConsoleCommands();
        this.startInteractiveMode();
        this.startSystems();

        // عرض البانر الأسطوري
        this.showLegendaryBanner();
    }

    // ============================================================
    // 🏮 البانر الأسطوري (مظبوط 100%)
    // ============================================================
    showLegendaryBanner() {
        console.clear();

        // الإطار العلوي
        console.log(COLORS.legendary('╔═══════════════════════════════════════════════════════════════╗'));
        console.log(COLORS.legendary('║                                                               ║'));

        // البانر الرئيسي
        const banner = `
    ███████╗ ██████╗ ██╗      ██████╗     ██████╗  ██████╗ ████████╗
    ██╔════╝██╔═══██╗██║     ██╔═══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
    ███████╗██║   ██║██║     ██║   ██║    ██████╔╝██║   ██║   ██║   
    ╚════██║██║   ██║██║     ██║   ██║    ██╔══██╗██║   ██║   ██║   
    ███████║╚██████╔╝███████╗╚██████╔╝    ██████╔╝╚██████╔╝   ██║   
    ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   
        `;
        console.log(GRADIENTS.main(banner));

        // الإطار الداخلي
        console.log(COLORS.legendary('╠═══════════════════════════════════════════════════════════════╣'));
        console.log(COLORS.legendary('║                                                               ║'));

        // معلومات البطل
        console.log(COLORS.legendary(`║       ⚔️  ${COLORS.primary('𝐒𝐎𝐋𝐎')}  ${COLORS.mana('𝐋𝐄𝐕𝐄𝐋𝐈𝐍𝐆')}  ${COLORS.gold('𝐒𝐘𝐒𝐓𝐄𝐌')}  ⚔️       ║`));
        console.log(COLORS.legendary('║                                                               ║'));
        console.log(COLORS.legendary(`║     ${COLORS.rare('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}     ║`));
        console.log(COLORS.legendary('║                                                               ║'));
        console.log(COLORS.legendary(`║     ${COLORS.epic('🏆  𝐑𝐀𝐍𝐊:')} ${COLORS.gold('𒆜 𝐓𝐇𝐄 𝐔𝐋𝐓𝐈𝐌𝐀𝐓𝐄 𒆜')}     ║`));
        console.log(COLORS.legendary(`║     ${COLORS.rare('📊  𝐋𝐄𝐕𝐄𝐋:')} ${COLORS.primary('∞')}  ${COLORS.mana('✨  𝐏𝐎𝐖𝐄𝐑:')} ${COLORS.gold('𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐄')}      ║`));
        console.log(COLORS.legendary('║                                                               ║'));
        console.log(COLORS.legendary(`║     ${COLORS.accent('🏮  𝑫𝑬𝑽𝑬𝑳𝑶𝑷𝑬𝑫 𝑩𝒀 𝑼𝑵𝑲𝑵𝑶𝑾𝑵  🏮')}     ║`));
        console.log(COLORS.legendary(`║     ${COLORS.power('⚡  𝐕𝐄𝐑𝐒𝐈𝐎𝐍  𝟕.𝟎  𝐆𝐎𝐃  𝐓𝐈𝐄𝐑  ⚡')}      ║`));
        console.log(COLORS.legendary('║                                                               ║'));

        // الإطار السفلي
        console.log(COLORS.legendary('╠═══════════════════════════════════════════════════════════════╣'));
        console.log(COLORS.legendary('║                                                               ║'));
        console.log(COLORS.legendary(`║   ${COLORS.system('🛡️  𝐒𝐘𝐒𝐓𝐄𝐌  𝐒𝐓𝐀𝐓𝐔𝐒:')}  ${COLORS.success('🟢  𝐎𝐍𝐋𝐈𝐍𝐄')}  ${COLORS.mana('⚡  𝐑𝐄𝐀𝐃𝐘')}   ║`));
        console.log(COLORS.legendary('║                                                               ║'));
        console.log(COLORS.legendary(`║        ${COLORS.rare('💫  𝐓𝐘𝐏𝐄  "𝐡𝐞𝐥𝐩"  𝐓𝐎  𝐄𝐗𝐏𝐋𝐎𝐑𝐄  𝐓𝐇𝐄  𝐒𝐇𝐀𝐃𝐎𝐖𝐒  💫')}       ║`));
        console.log(COLORS.legendary('║                                                               ║'));
        console.log(COLORS.legendary('╚═══════════════════════════════════════════════════════════════╝'));

        console.log(GRADIENTS.shadow('\n  🏮  𝐓𝐇𝐄  𝐒𝐇𝐀𝐃𝐎𝐖𝐒  𝐀𝐖𝐀𝐈𝐓  𝐘𝐎𝐔𝐑  𝐂𝐎𝐌𝐌𝐀𝐍𝐃  🏮\n'));
    }

    // ============================================================
    // 🛡️ أنظمة الخلفية
    // ============================================================
    startSystems() {
        setInterval(() => this.updateStats(), 30000);
        setInterval(() => this.cleanMemory(), 300000);
        setInterval(() => this.monitorPerformance(), 60000);
    }

    updateStats() {
        this.stats.uptime.lastPing = Date.now();
        const memory = process.memoryUsage();
        if (memory.heapUsed > this.stats.performance.peakMemory) {
            this.stats.performance.peakMemory = memory.heapUsed;
        }
    }

    cleanMemory() {
        try {
            if (global.gc) global.gc();
            if (this.errorLog.length > 100) {
                this.errorLog = this.errorLog.slice(-50);
            }
        } catch (error) {}
    }

    monitorPerformance() {
    const memory = process.memoryUsage();
    const rss = memory.rss / 1024 / 1024;

    if (rss >= 2048) {
        console.log(`⚠️ RAM reached ${Math.round(rss)}MB - Restarting...`);
        process.exit(1);
    }
}

    // ============================================================
    // 📨 معالج الرسائل الأسطوري
    // ============================================================
    async logMessage(message) {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }

        try {
            const isGroup = message.key.remoteJid?.endsWith('@g.us') || false;
            this.stats.messages.total++;
            if (isGroup) {
                this.stats.messages.group++;
            } else {
                this.stats.messages.private++;
            }

            const data = this.extractMessageData(message);
            this.renderMessage(data);

        } catch (error) {
            this.handleError(error);
        }

        this.rl.prompt(true);
    }

    // ============================================================
    // 🔍 استخراج بيانات الرسالة
    // ============================================================
    extractMessageData(message) {
        const msg = message.message;
        const fromMe = message.key.fromMe || false;
        const senderName = message.pushName || 'Unknown';
        const jid = message.key.remoteJid || 'unknown';
        const isGroup = jid.endsWith('@g.us');

        let type = 'unknown';
        let text = '';
        let icon = '❓';
        let color = COLORS.silver;

// تحديد نوع الرسالة
if (msg?.conversation) {
    type = 'text';
    text = msg.conversation;
    icon = '💬';
    color = COLORS.player;

} else if (msg?.extendedTextMessage?.text) {
    type = 'text';
    text = msg.extendedTextMessage.text;
    icon = '💬';
    color = COLORS.player;

} else if (msg?.imageMessage) {
    type = 'image';
    text = msg.imageMessage.caption || '📸 Image';
    icon = '🖼️';
    color = COLORS.gold;

} else if (msg?.videoMessage) {
    type = 'video';
    text = msg.videoMessage.caption || '🎥 Video';
    icon = '🎬';
    color = COLORS.power;

} else if (msg?.audioMessage) {
    type = msg.audioMessage.ptt ? 'voice' : 'audio';
    text = msg.audioMessage.ptt ? '🎤 Voice' : '🎵 Audio';
    icon = msg.audioMessage.ptt ? '🎤' : '🎵';
    color = COLORS.mana;

} else if (msg?.stickerMessage) {
    type = 'sticker';
    text = '🩹 Sticker';
    icon = '🩹';
    color = COLORS.secondary;

} else if (msg?.documentMessage) {
    type = 'document';
    text = msg.documentMessage.fileName || '📄 Document';
    icon = '📄';
    color = COLORS.info;

} else if (msg?.locationMessage) {
    type = 'location';
    text = `📍 ${msg.locationMessage.name || 'Location'}`;
    icon = '📍';
    color = COLORS.health;

} else if (msg?.liveLocationMessage) {
    type = 'live_location';
    text = `📍 ${msg.liveLocationMessage.name || 'Live Location'}`;
    icon = '📍';
    color = COLORS.health;

} else if (msg?.contactMessage) {
    type = 'contact';
    text = `👤 ${msg.contactMessage.displayName || 'Contact'}`;
    icon = '👤';
    color = COLORS.info;

} else if (msg?.contactsArrayMessage) {
    type = 'contacts';
    text = `👥 ${msg.contactsArrayMessage.contacts?.length || 0} Contacts`;
    icon = '👥';
    color = COLORS.info;

} else if (msg?.buttonsMessage) {
    type = 'buttons';
    text = `🔘 ${msg.buttonsMessage.contentText || 'Buttons Message'}`;
    icon = '🔘';
    color = COLORS.accent;

} else if (msg?.buttonsResponseMessage) {
    type = 'button';
    text = `🔘 ${msg.buttonsResponseMessage.selectedButtonId || 'Selected'}`;
    icon = '🔘';
    color = COLORS.accent;

} else if (msg?.listMessage) {
    type = 'list';
    text = `📋 ${msg.listMessage.title || 'List Message'}`;
    icon = '📋';
    color = COLORS.epic;

} else if (msg?.listResponseMessage) {
    type = 'list_response';
    text = `📋 ${msg.listResponseMessage?.singleSelectReply?.selectedRowId || 'Selected'}`;
    icon = '📋';
    color = COLORS.epic;

} else if (msg?.templateMessage) {
    type = 'template';
    text = '🧩 Template Message';
    icon = '🧩';
    color = COLORS.mana;

} else if (msg?.templateButtonReplyMessage) {
    type = 'template_reply';
    text = `🔘 ${msg.templateButtonReplyMessage.selectedDisplayText || 'Template Reply'}`;
    icon = '🔘';
    color = COLORS.accent;

} else if (msg?.interactiveMessage) {
    type = 'interactive';
    text = '🎮 Interactive Message';
    icon = '🎮';
    color = COLORS.system;

} else if (msg?.interactiveResponseMessage) {
    type = 'interactive_response';
    text = '🎮 Interactive Response';
    icon = '🎮';
    color = COLORS.system;

} else if (msg?.groupInviteMessage) {
    type = 'group_invite';
    text = `👥 ${msg.groupInviteMessage.groupName || 'Group Invite'}`;
    icon = '👥';
    color = COLORS.system;

} else if (msg?.productMessage) {
    type = 'product';
    text = `🛒 ${msg.productMessage.product?.title || 'Product'}`;
    icon = '🛒';
    color = COLORS.gold;

} else if (msg?.orderMessage) {
    type = 'order';
    text = `🧾 ${msg.orderMessage.orderTitle || 'Order'}`;
    icon = '🧾';
    color = COLORS.gold;

} else if (msg?.pollCreationMessage) {
    type = 'poll';
    text = `📊 ${msg.pollCreationMessage.name || 'Poll'}`;
    icon = '📊';
    color = COLORS.epic;

} else if (msg?.pollUpdateMessage) {
    type = 'poll_update';
    text = '📊 Poll Update';
    icon = '📊';
    color = COLORS.epic;

} else if (msg?.pollResultSnapshotMessage) {
    type = 'poll_result';
    text = `📊 ${msg.pollResultSnapshotMessage.name || 'Poll Result'}`;
    icon = '📊';
    color = COLORS.epic;

} else if (msg?.eventMessage) {
    type = 'event';
    text = `📅 ${msg.eventMessage.name || 'Event'}`;
    icon = '📅';
    color = COLORS.system;

} else if (msg?.requestPhoneNumberMessage) {
    type = 'request_phone';
    text = '📱 Request Phone Number';
    icon = '📱';
    color = COLORS.info;

} else if (msg?.newsletterAdminInviteMessage) {
    type = 'newsletter_admin_invite';
    text = '📰 Newsletter Admin Invite';
    icon = '📰';
    color = COLORS.system;

} else if (msg?.albumMessage) {
    type = 'album';
    text = '🖼️ Album';
    icon = '🖼️';
    color = COLORS.gold;

} else if (msg?.stickerPackMessage) {
    type = 'sticker_pack';
    text = `🎨 ${msg.stickerPackMessage.name || 'Sticker Pack'}`;
    icon = '🎨';
    color = COLORS.epic;

} else if (msg?.messageHistoryBundle) {
    type = 'message_history';
    text = '📜 Message History';
    icon = '📜';
    color = COLORS.info;

} else if (msg?.messageHistoryNotice) {
    type = 'message_history_notice';
    text = '📜 Message History Notice';
    icon = '📜';
    color = COLORS.info;

} else if (msg?.reactionMessage) {
    type = 'reaction';
    text = `😊 ${msg.reactionMessage.text || 'React'}`;
    icon = '😊';
    color = COLORS.gold;

} else if (msg?.viewOnceMessage) {
    type = 'view_once';
    text = '👁️ View Once';
    icon = '👁️';
    color = COLORS.warning;

} else if (msg?.viewOnceMessageV2) {
    type = 'view_once_v2';
    text = '👁️ View Once V2';
    icon = '👁️';
    color = COLORS.warning;

} else if (msg?.viewOnceMessageV2Extension) {
    type = 'view_once_v2_extension';
    text = '👁️ View Once V2';
    icon = '👁️';
    color = COLORS.warning;

} else if (msg?.protocolMessage?.type === 0) {
    type = 'deleted';
    text = '🗑️ Deleted Message';
    icon = '🗑️';
    color = COLORS.secondary;

} else if (msg?.protocolMessage?.type === 14) {
    type = 'edited';
    text = '✏️ Edited Message';
    icon = '✏️';
    color = COLORS.warning;

} else {
    type = 'unknown';
    text = '❓ Unknown';
    icon = '❓';
    color = COLORS.error;
}

        // استخراج الردود والمنشن
        const contextInfo = msg?.extendedTextMessage?.contextInfo;
        let replyInfo = null;
        let mentions = [];

        if (contextInfo) {
            if (contextInfo.quotedMessage) {
                const quoted = contextInfo.quotedMessage;
                const quotedText = quoted.conversation || 
                                  quoted.extendedTextMessage?.text || 
                                  '[Message]';
                const quotedSender = contextInfo.participant?.split('@')[0] || 'Unknown';
                replyInfo = {
                    text: quotedText.substring(0, 40),
                    sender: quotedSender,
                    isMedia: !!(quoted.imageMessage || quoted.videoMessage || quoted.audioMessage)
                };
            }
            
            if (contextInfo.mentionedJid?.length > 0) {
                mentions = contextInfo.mentionedJid.map(j => j.split('@')[0]);
            }
        }

        return {
            type, text, icon, color, fromMe, senderName, jid, isGroup,
            replyInfo, mentions, timestamp: Date.now(), raw: message
        };
    }

    // ============================================================
    // 🎨 عرض الرسالة
    // ============================================================
    renderMessage(data) {
        const { type, text, icon, color, fromMe, senderName, isGroup, replyInfo, mentions } = data;

        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        // الإطار العلوي
        console.log(COLORS.shadow('╭────────────«𝐒 𝐎 𝐋 𝐎»───────────╮'));

        // اسم المرسل
        const senderIcon = fromMe ? '🤖' : (isGroup ? '👥' : '👤');
        const senderDisplay = fromMe ? '𝐒𝐎𝐋𝐎 𝐁𝐎𝐓' : senderName;
        console.log(COLORS.silver(`│ ${senderIcon} ${senderDisplay}`));

        // نوع الرسالة
        const typeDisplay = `${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        console.log(color(`│ ${typeDisplay}`));

        // نص الرسالة
        const maxLength = 45;
        let displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        console.log(COLORS.white(`│ ${displayText}`));

        // الردود
        if (replyInfo) {
            const replyIcon = replyInfo.isMedia ? '📎' : '💬';
            const replyText = replyInfo.text.length > 30 ? replyInfo.text.substring(0, 30) + '...' : replyInfo.text;
            console.log(COLORS.silver(`│ ↪️ ${replyIcon} @${replyInfo.sender}: "${replyText}"`));
        }

        // المنشن
        if (mentions.length > 0) {
            const mentionDisplay = mentions.map(m => `@${m}`).join(' ');
            console.log(COLORS.accent(`│ 📌 ${mentionDisplay}`));
        }

        // الإطار السفلي
        console.log(COLORS.shadow('╰────────────«𝐒 𝐎 𝐋 𝐎»───────────╯'));
    }

    // ============================================================
    // ⚡ أوامر الكونسول
    // ============================================================
    setupConsoleCommands() {
        this.commands.set('help', {
            description: '📜 Show all commands',
            execute: () => this.showHelp()
        });

        this.commands.set('status', {
            description: '📊 Show system status',
            execute: () => this.showStatus()
        });

        this.commands.set('stats', {
            description: '📈 Show detailed stats',
            execute: () => this.showStats()
        });

        this.commands.set('clear', {
            description: '🧹 Clear screen',
            execute: () => this.clearScreen()
        });

        this.commands.set('restart', {
            description: '🔄 Restart system',
            execute: () => this.restartSystem()
        });

        this.commands.set('gc', {
            description: '🧹 Clean memory',
            execute: () => this.cleanMemory()
        });

        this.commands.set('plugins', {
            description: '🔌 List plugins',
            execute: () => this.listPlugins()
        });

        this.commands.set('reload', {
            description: '🔄 Reload plugin',
            execute: (args) => this.reloadPlugin(args[0])
        });

        this.commands.set('exec', {
            description: '⚡ Execute code',
            execute: (args) => this.executeCode(args.join(' '))
        });

        this.commands.set('rf', {
            description: '🗑️ Remove file',
            execute: (args) => this.removeFile(args[0])
        });

        this.commands.set('speed', {
            description: '🚀 Test speed',
            execute: () => this.testSpeed()
        });

        this.commands.set('exit', {
            description: '🚪 Exit system',
            execute: () => this.exitSystem()
        });
    }

    // ============================================================
    // 🌟 أوامر التنفيذ
    // ============================================================
    startInteractiveMode() {
        this.setupInputHandler();
    }

    setupInputHandler() {
        const prompt = GRADIENTS.power('🗡️ SOLO> ');
        this.rl.setPrompt(prompt);
        this.rl.prompt();

        this.rl.on('line', (input) => {
            this.handleInput(input.trim());
            this.rl.prompt();
        });

        this.rl.on('close', () => {
            console.log(COLORS.warning('\n🗡️ Exiting the shadows...'));
            process.exit(0);
        });
    }

    async handleInput(input) {
        if (!input) return;

        const [command, ...args] = input.split(' ');
        const cmd = command.toLowerCase();

        if (this.commands.has(cmd)) {
            try {
                this.stats.commands.executed++;
                await this.commands.get(cmd).execute(args);
            } catch (error) {
                this.stats.commands.failed++;
                this.handleError(error);
            }
        } else {
            console.log(COLORS.error(`❌ Unknown command: ${cmd}`));
            console.log(COLORS.silver('💫 Type "help" to explore the shadows'));
        }
    }

    // ============================================================
    // 📜 عرض المساعدة
    // ============================================================
    showHelp() {
        console.log(GRADIENTS.power('\n⚔️ SOLO COMMANDS\n'));
        console.log(COLORS.silver('═'.repeat(50)));

        this.commands.forEach((cmd, name) => {
            const coloredName = COLORS.player(name.padEnd(10));
            console.log(`  ${coloredName} ${cmd.description}`);
        });

        console.log(COLORS.silver('═'.repeat(50)));
        console.log(COLORS.gold('\n🏮 The shadows await your command\n'));
    }

    // ============================================================
    // 📊 الحالة والإحصائيات
    // ============================================================
    showStatus() {
        const uptime = Date.now() - this.stats.uptime.start;
        const memory = process.memoryUsage();
        const usedMemory = Math.round(memory.heapUsed / 1024 / 1024);
        const totalMemory = Math.round(memory.heapTotal / 1024 / 1024);

        const status = `
╔═══════════════════════════════════════╗
║           🗡️ SOLO STATUS 🗡️           ║
╠═══════════════════════════════════════╣
║  ⏰ Uptime: ${this.formatTime(uptime)}
║  📨 Messages: ${this.stats.messages.total}
║  💬 Commands: ${this.stats.commands.executed}
║  🧠 Memory: ${usedMemory}MB / ${totalMemory}MB
║  🟢 Status: ${this.bot.isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}
╚═══════════════════════════════════════╝
        `;

        console.log(GRADIENTS.system(status));
    }

    showStats() {
        console.log(GRADIENTS.legendary('\n📊 DETAILED STATS\n'));
        console.log(COLORS.silver('═'.repeat(50)));
        console.log(COLORS.player(`  Private Messages: ${this.stats.messages.private}`));
        console.log(COLORS.player(`  Group Messages: ${this.stats.messages.group}`));
        console.log(COLORS.player(`  Total Messages: ${this.stats.messages.total}`));
        console.log(COLORS.accent(`  Commands Executed: ${this.stats.commands.executed}`));
        console.log(COLORS.error(`  Commands Failed: ${this.stats.commands.failed}`));
        console.log(COLORS.warning(`  Errors: ${this.stats.errors.count}`));
        console.log(COLORS.player(`  Peak Memory: ${Math.round(this.stats.performance.peakMemory / 1024 / 1024)}MB`));
        console.log(COLORS.silver('═'.repeat(50)));
        console.log(COLORS.gold('\n🏮 The shadows remember everything\n'));
    }

    // ============================================================
    // 🧹 العمليات الأساسية
    // ============================================================
    clearScreen() {
        console.clear();
        this.showLegendaryBanner();
    }

    async restartSystem() {
        console.log(COLORS.warning('\n🔄 Restarting the system...\n'));

        try {
            if (this.bot.softRestart) {
                await this.bot.softRestart();
                console.log(COLORS.success('✅ System restarted successfully'));
            } else {
                console.log(COLORS.warning('⚠️ Using fallback restart...'));
                process.exit(0);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    listPlugins() {
        if (!this.bot.handler?.plugins) {
            console.log(COLORS.error('❌ No plugins found'));
            return;
        }

        const plugins = Array.from(this.bot.handler.plugins.values());
        console.log(GRADIENTS.power('\n🔌 SOLO PLUGINS\n'));
        console.log(COLORS.silver('═'.repeat(50)));

        plugins.forEach((plugin, index) => {
            const name = COLORS.player(plugin.name || `Plugin ${index + 1}`);
            const commands = plugin.commands?.length || 0;
            console.log(`  ${String(index + 1).padStart(2, '0')}. ${name} (${commands} commands)`);
        });

        console.log(COLORS.silver('═'.repeat(50)));
        console.log(COLORS.accent(`\n  Total: ${plugins.length} plugins\n`));
    }

    async reloadPlugin(pluginName) {
        if (!pluginName) {
            console.log(COLORS.error('❌ Usage: reload <plugin-name>'));
            return;
        }

        try {
            if (this.bot.handler?.reloadPlugin) {
                await this.bot.handler.reloadPlugin(pluginName);
                console.log(COLORS.success(`✅ Reloaded: ${pluginName}`));
            } else {
                console.log(COLORS.error('❌ Reload system not available'));
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    executeCode(code) {
        if (!code) {
            console.log(COLORS.error('❌ Usage: exec <code>'));
            return;
        }

        try {
            const result = eval(code);
            console.log(COLORS.success(`✅ Result: ${JSON.stringify(result, null, 2)}`));
        } catch (error) {
            this.handleError(error);
        }
    }

    async removeFile(filename) {
        if (!filename) {
            console.log(COLORS.error('❌ Usage: rf <filename>'));
            return;
        }

        try {
            if (!fs.existsSync(filename)) {
                console.log(COLORS.error(`❌ File not found: ${filename}`));
                return;
            }

            fs.removeSync(filename);
            console.log(COLORS.success(`✅ Deleted: ${filename}`));
        } catch (error) {
            this.handleError(error);
        }
    }

    async testSpeed() {
        console.log(COLORS.info('\n⚡ Testing speed...\n'));

        const start = Date.now();
        let iterations = 0;
        const target = 1000000;

        for (let i = 0; i < target; i++) {
            iterations++;
        }

        const end = Date.now();
        const time = end - start;

        console.log(COLORS.success(`✅ ${iterations.toLocaleString()} iterations in ${time}ms`));
        console.log(COLORS.player(`   Speed: ${Math.round(iterations / (time / 1000)).toLocaleString()} ops/s`));
    }

    exitSystem() {
        console.log(COLORS.warning('\n🗡️ Leaving the shadows...\n'));
        console.log(COLORS.gold('🏮 The shadow monarch watches over you 🏮\n'));
        process.exit(0);
    }

    // ============================================================
    // 🛠️ دوال مساعدة
    // ============================================================
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    handleError(error) {
        this.stats.errors.count++;
        this.stats.errors.last = error.message;
        this.errorLog.push({
            message: error.message,
            stack: error.stack,
            time: Date.now()
        });

        console.log(COLORS.error(`\n❌ ERROR: ${error.message}`));
        if (error.stack) {
            const stackLine = error.stack.split('\n')[1]?.trim() || '';
            console.log(COLORS.silver(`   ${stackLine}`));
        }
    }

    // ============================================================
    // 📊 الحصول على الإحصائيات
    // ============================================================
    getStats() {
        return {
            messages: this.stats.messages,
            commands: this.stats.commands,
            errors: this.stats.errors,
            uptime: Date.now() - this.stats.uptime.start,
            performance: this.stats.performance,
            memory: process.memoryUsage()
        };
    }

    // ============================================================
    // 🚀 دوال سريعة
    // ============================================================
    quickLog(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            star: '⭐',
            shadow: '🗡️'
        };
        const colors = {
            info: COLORS.info,
            success: COLORS.success,
            error: COLORS.error,
            warning: COLORS.warning,
            star: COLORS.gold,
            shadow: COLORS.shadow
        };

        console.log(colors[type]?.(`${icons[type] || '📡'} [${timestamp}] ${message}`) || message);
    }

    showMessage(title, content, type = 'info') {
        const colors = {
            info: COLORS.info,
            success: COLORS.success,
            error: COLORS.error,
            warning: COLORS.warning,
            star: COLORS.gold,
            shadow: COLORS.shadow
        };

        const border = '═'.repeat(48);
        console.log(colors[type](`\n╔${border}╗`));
        console.log(colors[type](`║  ${title.padEnd(46)}║`));
        console.log(colors[type](`╠${border}╣`));
        console.log(colors[type](`║  ${content.padEnd(46)}║`));
        console.log(colors[type](`╚${border}╝\n`));
    }
}

export default ConsoleSystem;