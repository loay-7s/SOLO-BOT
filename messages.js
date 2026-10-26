import fs from 'fs-extra';
import { performance } from 'perf_hooks';

export class MessageSystem {
    constructor(bot) {
        this.bot = bot;
        
        // 📊 إحصائيات
        this.stats = {
            total: 0,
            processed: 0,
            text: 0,
            image: 0,
            video: 0,
            audio: 0,
            sticker: 0,
            document: 0,
            button: 0,
            list: 0,
            reaction: 0,
            errors: 0,
            spamBlocked: 0,
            mutedBlocked: 0,
            startTime: Date.now()
        };

        // 🛡️ أنظمة الحماية
        this.spamTracker = new Map();
        this.messageCache = new Map();
        this.userCache = new Map();
        this.groupCache = new Map();
        this.mediaCache = new Map();
        
        // ⚡ إعدادات الأداء
        this.config = {
            spamThreshold: 5,
            spamWindow: 10000,
            cooldown: 2000,
            maxCacheSize: 1000,
            saveInterval: 50,
            mediaSaveInterval: 100,
            errorLimit: 100
        };

        // 🚀 تشغيل الأنظمة
        this.startSystems();
        
        console.log('🔥 SOLO MESSAGE SYSTEM ACTIVATED');
        console.log('⚡ READY FOR BATTLE');
    }

    // ============================================================
    // 🎯 المعالج الرئيسي
    // ============================================================
    async handleMessage(m) {
        const message = m.messages ? m.messages[0] : m;
        if (!message?.message) return;

        const chatId = message.key.remoteJid;
        const isGroup = chatId?.endsWith('@g.us') || false;
        const userJid = message.key.participant || message.key.remoteJid;
 // ═══════════════════════════════════════════════════════════
            // ✅ نظام حماية الخاص (PV Protection) — يحظر الأوامر فقط
            // ═══════════════════════════════════════════════════════════
            if (!message.key.remoteJid.endsWith('@g.us')) {

                // 🆕 التحقق هل الرسالة أمر (تبدأ بالبرفكس) أم رسالة عادية
                const pvPrefix = this.bot.config?.PREFIX || this.bot.config?.prefix || '.';
                const pvText = message.message?.conversation
                            || message.message?.extendedTextMessage?.text
                            || message.message?.imageMessage?.caption
                            || message.message?.videoMessage?.caption
                            || '';

                const isCommand = String(pvText).trim().startsWith(pvPrefix);

                // 🆕 لو مش أمر → تجاهل حماية الخاص تماماً (رسالة عادية)
                if (!isCommand) {
                    // كمّل عادي — هيتم تمريره للهاندلر كرسالة عادية
                } else {
                    const PV_FILE = './data/pv_warnings.json';
                    let pvData = { status: false, warnings: {} };
                    try {
                        pvData = JSON.parse(fs.readFileSync(PV_FILE, 'utf8'));
                    } catch {
                        pvData = { status: false, warnings: {} };
                    }

                    if (pvData.status === true) {
                        const sender = message.key.participant || message.key.remoteJid;

                        // 🆕 اسمح للبوت بأوامره فقط
                        if (message.key.fromMe) {
                            // البوت يرسل أمر → اسمح
                            // (مش بنعمل return عشان يكمل)
                        } else {
                            // ✅ ===== استثناء المطورين والماستر =====
                            const isDev = this.bot.handler?.isDeveloper ? this.bot.handler.isDeveloper(sender) : false;
                            const isMaster = this.bot.handler?.isMaster ? this.bot.handler.isMaster(sender) : false;

                            if (isDev || isMaster) {
                                console.log(`👑 تم استثناء المطور/الماستر: ${sender}`);
                            } else {
                                // ✅ التحقق من وجود الصورة
                                const PV_IMAGE = './media/pv.jpg';
                                let imageBuffer = null;
                                try {
                                    if (fs.existsSync(PV_IMAGE)) {
                                        imageBuffer = fs.readFileSync(PV_IMAGE);
                                    }
                                } catch (e) {}

                                // ✅ جلب عدد التحذيرات
                                if (!pvData.warnings[sender]) {
                                    pvData.warnings[sender] = { count: 0, firstWarn: Date.now() };
                                }

                                const warnCount = pvData.warnings[sender].count + 1;
                                pvData.warnings[sender].count = warnCount;
                                fs.writeFileSync(PV_FILE, JSON.stringify(pvData, null, 2));

                                // ✅ حظر بعد 4 تحذيرات
                                if (warnCount >= 4) {
                                    const blockMsg = `*⎔┄┄─ ⊱╎⌯ 🚫 ⌯╎⊰─┄┄⎔*
*┋ تـم حـظـر رقـمـك تـلـقـائـياً*

*┋ السـبب : تـجـاوز عـدد الـتـحـذيـرات (4/4)*

*┋ لا يـمـكـنـك مـراسـلـة الـبـوت بـعـد الآن*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`;

                                    if (imageBuffer) {
                                        await this.bot.sock.sendMessage(message.key.remoteJid, {
                                            image: imageBuffer,
                                            caption: blockMsg
                                        });
                                    } else {
                                        await this.bot.sock.sendMessage(message.key.remoteJid, {
                                            text: blockMsg
                                        });
                                    }

                                    try {
                                        await this.bot.sock.updateBlockStatus(sender, 'block');
                                        console.log(`✅ تم حظر: ${sender}`);
                                    } catch (error) {
                                        console.error('❌ فشل حظر المستخدم:', error);
                                    }

                                    delete pvData.warnings[sender];
                                    fs.writeFileSync(PV_FILE, JSON.stringify(pvData, null, 2));

                                    try {
                                        await this.bot.sock.sendMessage(message.key.remoteJid, {
                                            delete: message.key
                                        });
                                    } catch (e) {}

                                    return;
                                }

                                // ✅ تحذير عادي
                                const remaining = 4 - warnCount;
                                const warnMsg = `*⎔┄┄─ ⊱╎⌯ ⚠️ ⌯╎⊰─┄┄⎔*
*┋ تـحـذيـر !*

*┋ مـمـنـوع اسـتـخـدام الأوامـر فـي الـخـاص*

*┋ عـدد الـتـحـذيـرات : ${warnCount}/4*

*┋ تـبـقـى ${remaining} تـحـذيـرات قـبـل الـحـظـر*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`;

                                if (imageBuffer) {
                                    await this.bot.sock.sendMessage(message.key.remoteJid, {
                                        image: imageBuffer,
                                        caption: warnMsg
                                    });
                                } else {
                                    await this.bot.sock.sendMessage(message.key.remoteJid, {
                                        text: warnMsg
                                    });
                                }

                                try {
                                    await this.bot.sock.sendMessage(message.key.remoteJid, {
                                        delete: message.key
                                    });
                                } catch (e) {}

                                return;
                            }
                        }
                    }
                }
            }

        let text = '';
        const msg = message.message;

        if (msg?.conversation) {
            text = msg.conversation;
        } else if (msg?.extendedTextMessage?.text) {
            text = msg.extendedTextMessage.text;
        } else if (msg?.imageMessage?.caption) {
            text = msg.imageMessage.caption;
        } else if (msg?.videoMessage?.caption) {
            text = msg.videoMessage.caption;
        }

        const lowerText = text.toLowerCase().trim();

        // ═══════════════════════════════════════════════════════════
        // ⚡ الأوامر (البوت يستخدمها عادي)
        // ═══════════════════════════════════════════════════════════
        if (text.startsWith('.')) {
            if (this.bot.handler) {
                await this.bot.handler.handleMessage(message);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // 🎯 الردود التلقائية (للعضو فقط)
        // ═══════════════════════════════════════════════════════════
      if (['تست', 'test', 'بوت', 'bot'].includes(lowerText)) {
    const sock = this.bot.sock;
    const chatId = message.key.remoteJid;
    const target = 'Solo Is Here';
    const ticks = '```';

    try {
        // إرسال أول حرف مع مؤشر الكتابة
        const sent = await sock.sendMessage(
            chatId,
            { text: `${ticks}S|${ticks}` },
            { quoted: message }
        );

        // تجهيز جميع حالات الكتابة مسبقًا
        const states = [];
        let current = 'S';

        for (const char of target.slice(1)) {
            current += char;
            states.push(`${ticks}${current}|${ticks}`);
        }

        // إطلاق جميع التعديلات بالتوازي
        const edits = states.map(text =>
            sock.sendMessage(chatId, {
                edit: sent.key,
                text
            })
        );

        await Promise.allSettled(edits);

        // إظهار النص النهائي بدون مؤشر الكتابة
        await sock.sendMessage(chatId, {
            edit: sent.key,
            text: `${ticks}${target}${ticks}`
        });

    } catch (err) {
        console.error('[MAX SPEED TYPEWRITER]', err);
    }

    return;
      }
      
        if (!message.key.fromMe) {
            // 1️⃣ بوت → ريأكت 🍷
            if (lowerText.includes('بوت')) {
                await this.bot.sock.sendMessage(message.key.remoteJid, {
                    react: { text: '🍷', key: message.key }
                });
            }

            // 2️⃣ سولو → رد بقولة
            if (lowerText.includes('سولو')) {
                await this.bot.sock.sendMessage(message.key.remoteJid, {
                    text: `> *قـلـب سـولـو مـن جـوه 😂🩶*`,
                    mentions: [userJid]
                }, { quoted: message });
            }

            // 3️⃣ السلام عليكم → رد بالسلام
            if (lowerText.includes('السلام عليكم') || lowerText.includes('السلام عليكم ورحمة الله') || lowerText.includes('السلام عليكم ورحمة الله وبركاته')) {
                await this.bot.sock.sendMessage(message.key.remoteJid, {
                    text: `> *وعـلـيـكـم الـسـلام وࢪحـمـة الله وبـࢪكـاتـه 🩶*`,
                    mentions: [userJid]
                }, { quoted: message });
            }

            // 4️⃣ سونغ / ثونغ / لؤي → رد بـ "عـمـك 😍🍷"
            if (lowerText.includes('سونغ') || lowerText.includes('ثونغ') || lowerText.includes('لؤي')) {
                await this.bot.sock.sendMessage(message.key.remoteJid, {
                    text: `> *عـمـك 🫦🍷*`,
                    mentions: [userJid]
                }, { quoted: message });
            }
        }

        // ═══════════════════════════════════════════════════════════
        // ✅ فعالية الكتابة المستمرة
        // ═══════════════════════════════════════════════════════════
        if (global.writingEvent && global.writingEvent[message.key.remoteJid]) {
            const event = global.writingEvent[message.key.remoteJid];
            
            if (message.key.fromMe) return;
            
            let text = '';
            const msg = message.message;
            if (msg?.conversation) text = msg.conversation;
            else if (msg?.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
            else return;
            
            if (!text) return;
            
            const chatId = message.key.remoteJid;
            const STATS_FILE = './data/writing_stats.json';
            
            const stopCommands = ['ايقاف', 'إيقاف', 'وقف', 'stop', 'قف'];
            if (stopCommands.some(cmd => text.includes(cmd))) {
                if (global.writingEvent && global.writingEvent[chatId]) {
                    if (global.writingEvent[chatId].timer) {
                        clearTimeout(global.writingEvent[chatId].timer);
                    }
                    
                    let stats = {};
                    try {
                        stats = fs.readJsonSync(STATS_FILE, { throws: false }) || {};
                    } catch {
                        stats = {};
                    }
                    
                    if (stats[chatId]) {
                        for (const userJid in stats[chatId]) {
                            stats[chatId][userJid].points = 0;
                        }
                        fs.writeJsonSync(STATS_FILE, stats, { spaces: 2 });
                    }
                    
                    delete global.writingEvent[chatId];
                    
                    await this.bot.sock.sendMessage(chatId, {
                        text: `*⎔┄┄─ ⊱╎⌯ ⏹️ ⌯╎⊰─┄┄⎔*
*┋ تـم إيـقـاف فـعـالـيـة الـكـتـابـة*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                    });
                    return;
                }
            }
            
            if (event.active && !event.winner) {
                const userAnswer = text.trim();
                const correctAnswer = event.answer;
                
                if (userAnswer === correctAnswer) {
                    if (event.winner) return;
                    
                    const winnerJid = message.key.participant || message.key.remoteJid;
                    event.winner = winnerJid;
                    event.active = false;
                    
                    if (event.timer) {
                        clearTimeout(event.timer);
                        event.timer = null;
                    }
                    
                    let stats = {};
                    try {
                        stats = fs.readJsonSync(STATS_FILE, { throws: false }) || {};
                    } catch {
                        stats = {};
                    }
                    
                    if (!stats[chatId]) stats[chatId] = {};
                    if (!stats[chatId][winnerJid]) {
                        stats[chatId][winnerJid] = { points: 0, coins: 0, wins: 0 };
                    }
                    
                    stats[chatId][winnerJid].points += 1;
                    stats[chatId][winnerJid].coins += 10;
                    stats[chatId][winnerJid].wins += 1;
                    
                    fs.writeJsonSync(STATS_FILE, stats, { spaces: 2 });
                    
                    const winMsg = `*★┇ فـ✍️ـائـز الـجـولـة ┇★*
*⎔┄┄── ⊱╎⌯🏮⌯╎⊰ ──┄┄⎔*

*👤 الـفـائـز : ⦓ @${winnerJid.split('@')[0]} ⦔*

*💰 الـجـائـزة : 10 عـمـلات + 1 نـقـطة*

*📊 إحـصـائـيـات الـفـائـز :*
*┋ الـنـقـاط : ${stats[chatId][winnerJid].points}*
*┋ إجـمـالـي الـعـمـلات : ${stats[chatId][winnerJid].coins}*
*┋ إجـمـالـي عـدد الـفـوز : ${stats[chatId][winnerJid].wins}*

*⎔┄┄── ⊱╎⌯🏮⌯╎⊰ ──┄┄⎔*
*⛔ لإيقاف الفعالية اكتب:فعالية ايقاف*
*🔄 جـاري بـدء جـولـة جـديـدة...*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                    await this.bot.sock.sendMessage(chatId, {
                        text: winMsg,
                        mentions: [winnerJid]
                    });
                    
                    setTimeout(async () => {
                        if (global.writingEvent && global.writingEvent[chatId]) {
                            const { startNewRound } = await import('./plugins/كتابة.js');
                            startNewRound(this.bot.sock, chatId, event.m || message);
                        }
                    }, 2000);
                }
            }
        }

        // ═══════════════════════════════════════════════════════════
        // ✅ فعالية التفكيك المستمرة
        // ═══════════════════════════════════════════════════════════
        if (global.scrambleEvent && global.scrambleEvent[message.key.remoteJid]) {
            const event = global.scrambleEvent[message.key.remoteJid];
            
            if (message.key.fromMe) return;
            
            let text = '';
            const msg = message.message;
            if (msg?.conversation) text = msg.conversation;
            else if (msg?.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
            else return;
            
            if (!text) return;
            
            const chatId = message.key.remoteJid;
            const STATS_FILE = './data/scramble_stats.json';
            
            const stopCommands = ['ايقاف', 'إيقاف', 'وقف', 'stop', 'قف'];
            if (stopCommands.some(cmd => text.includes(cmd))) {
                if (global.scrambleEvent && global.scrambleEvent[chatId]) {
                    if (global.scrambleEvent[chatId].timer) {
                        clearTimeout(global.scrambleEvent[chatId].timer);
                    }
                    
                    let stats = {};
                    try {
                        stats = fs.readJsonSync(STATS_FILE, { throws: false }) || {};
                    } catch {
                        stats = {};
                    }
                    
                    if (stats[chatId]) {
                        for (const userJid in stats[chatId]) {
                            stats[chatId][userJid].points = 0;
                        }
                        fs.writeJsonSync(STATS_FILE, stats, { spaces: 2 });
                    }
                    
                    delete global.scrambleEvent[chatId];
                    
                    await this.bot.sock.sendMessage(chatId, {
                        text: `*⎔┄┄─ ⊱╎⌯ ⏹️ ⌯╎⊰─┄┄⎔*
*┋ تـم إيـقـاف فـعـالـيـة الـتـفـكـيـك*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                    });
                    return;
                }
            }
            
            if (event.active && !event.winner) {
                const userAnswer = text.trim();
                const correctAnswer = event.answer;
                
                if (userAnswer === correctAnswer) {
                    if (event.winner) return;
                    
                    const winnerJid = message.key.participant || message.key.remoteJid;
                    event.winner = winnerJid;
                    event.active = false;
                    
                    if (event.timer) {
                        clearTimeout(event.timer);
                        event.timer = null;
                    }
                    
                    let stats = {};
                    try {
                        stats = fs.readJsonSync(STATS_FILE, { throws: false }) || {};
                    } catch {
                        stats = {};
                    }
                    
                    if (!stats[chatId]) stats[chatId] = {};
                    if (!stats[chatId][winnerJid]) {
                        stats[chatId][winnerJid] = { points: 0, coins: 0, wins: 0 };
                    }
                    
                    stats[chatId][winnerJid].points += 1;
                    stats[chatId][winnerJid].coins += 10;
                    stats[chatId][winnerJid].wins += 1;
                    
                    fs.writeJsonSync(STATS_FILE, stats, { spaces: 2 });
                    
                    const winMsg = `*★┇ فـ⛓️‍💥ـائـز الـجـولـة ┇★*
*⎔┄┄── ⊱╎⌯🏮⌯╎⊰ ──┄┄⎔*

*👤 الـفـائـز : ⦓ @${winnerJid.split('@')[0]} ⦔*

*💰 الـجـائـزة : 10 عـمـلات + 1 نـقـطة*

*📊 إحـصـائـيـات الـفـائـز :*
*┋ الـنـقـاط : ${stats[chatId][winnerJid].points}*
*┋ إجـمـالـي الـعـمـلات : ${stats[chatId][winnerJid].coins}*
*┋ إجـمـالـي عـدد الـفـوز : ${stats[chatId][winnerJid].wins}*

*⎔┄┄── ⊱╎⌯🏮⌯╎⊰ ──┄┄⎔*
*🔄 جـاري بـدء جـولـة جـديـدة...*
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                    await this.bot.sock.sendMessage(chatId, {
                        text: winMsg,
                        mentions: [winnerJid]
                    });
                    
                    setTimeout(async () => {
                        if (global.scrambleEvent && global.scrambleEvent[chatId]) {
                            const { startNewRound } = await import('./plugins/تفكيك.js');
                            startNewRound(this.bot.sock, chatId, event.m || message);
                        }
                    }, 2000);
                }
            }
        }

        const startTime = performance.now();

        try {
            const { userJid, groupJid, isGroup, msgType, text } = this.extractMessageData(message);
                
            this.stats.total++;
                    
            // 💾 التخزين الذكي
            this.storeUserData(userJid, msgType);
            this.storeMediaStats(msgType);

            // 📨 معالجة حسب النوع
            await this.processByType(message, msgType, text);

            // ⚡ تمرير للهاندلر
            if (this.bot.handler) {
                await this.bot.handler.handleMessage(message);
            }

            this.stats.processed++;

        } catch (error) {
            this.handleError('handleMessage', error);
        } finally {
            if (this.stats.total % 1000 === 0) {
                this.optimizePerformance();
            }
        }
    }

    // ============================================================
    // 🔍 استخراج بيانات الرسالة
    // ============================================================
    extractMessageData(message) {
        const msg = message.message;
        const userJid = message.key.participant || message.key.remoteJid;
        const groupJid = message.key.remoteJid;
        const isGroup = groupJid.endsWith('@g.us');

        let msgType = 'unknown';
        let text = '';

        if (msg.conversation) {
            msgType = 'text';
            text = msg.conversation;
        } else if (msg.extendedTextMessage?.text) {
            msgType = 'text';
            text = msg.extendedTextMessage.text;
        } else if (msg.imageMessage) {
            msgType = 'image';
            text = msg.imageMessage.caption || '';
        } else if (msg.videoMessage) {
            msgType = 'video';
            text = msg.videoMessage.caption || '';
        } else if (msg.audioMessage) {
            msgType = 'audio';
        } else if (msg.stickerMessage) {
            msgType = 'sticker';
        } else if (msg.documentMessage) {
            msgType = 'document';
        } else if (msg.buttonsResponseMessage) {
            msgType = 'button';
            text = msg.buttonsResponseMessage.selectedButtonId || '';
        } else if (msg.listResponseMessage) {
            msgType = 'list';
            text = msg.listResponseMessage.singleSelectReply?.selectedRowId || '';
        } else if (msg.reactionMessage) {
            msgType = 'reaction';
        } else if (msg.interactiveResponseMessage) {
            msgType = 'interactive';
        }

        return { userJid, groupJid, isGroup, msgType, text };
    }

    // ============================================================
    // 🚫 نظام مكافحة السبام
    // ============================================================
    isSpam(userJid) {
        const now = Date.now();
        const data = this.spamTracker.get(userJid);

        if (!data) {
            this.spamTracker.set(userJid, { 
                count: 1, 
                first: now, 
                last: now,
                warnings: 0
            });
            return false;
        }

        const timeSinceLast = now - data.last;

        if (timeSinceLast > this.config.spamWindow) {
            this.spamTracker.set(userJid, { 
                count: 1, 
                first: now, 
                last: now,
                warnings: 0
            });
            return false;
        }

        if (timeSinceLast < this.config.cooldown) {
            data.count++;
            data.last = now;
            data.warnings++;

            if (data.count > this.config.spamThreshold) {
                data.warnings++;
                if (data.warnings > 3) {
                    return true;
                }
                return true;
            }
            return false;
        }

        data.count = 1;
        data.last = now;
        data.warnings = 0;
        this.spamTracker.set(userJid, data);

        return false;
    }

    // ============================================================
    // 💾 التخزين الذكي
    // ============================================================
    storeUserData(userJid, msgType) {
        try {
            const userData = this.userCache.get(userJid) || { 
                messages: 0, 
                lastSeen: Date.now(),
                firstSeen: Date.now()
            };
            
            userData.messages++;
            userData.lastSeen = Date.now();
            
            const typeMap = {
                'text': 'texts',
                'image': 'images',
                'video': 'videos',
                'audio': 'audios',
                'sticker': 'stickers'
            };
            const key = typeMap[msgType] || 'other';
            userData[key] = (userData[key] || 0) + 1;

            this.userCache.set(userJid, userData);

            if (this.stats.total % this.config.saveInterval === 0) {
                this.flushUserData();
            }

        } catch (error) {
            this.handleError('storeUserData', error);
        }
    }

    async flushUserData() {
        try {
            if (this.userCache.size === 0) return;
            
            const userPath = './data/users.json';
            let userDB = fs.readJsonSync(userPath, { throws: false }) || {};
            
            for (const [jid, data] of this.userCache) {
                if (!userDB[jid]) {
                    userDB[jid] = { firstSeen: data.firstSeen };
                }
                userDB[jid].messages = data.messages;
                userDB[jid].lastSeen = data.lastSeen;
                if (data.texts) userDB[jid].texts = data.texts;
                if (data.images) userDB[jid].images = data.images;
                if (data.videos) userDB[jid].videos = data.videos;
                if (data.audios) userDB[jid].audios = data.audios;
                if (data.stickers) userDB[jid].stickers = data.stickers;
            }
            
            fs.writeJsonSync(userPath, userDB, { spaces: 2 });
            this.userCache.clear();

        } catch (error) {
            this.handleError('flushUserData', error);
        }
    }

    // ============================================================
    // 📊 إحصائيات الميديا
    // ============================================================
    storeMediaStats(msgType) {
        try {
            const mediaTypes = ['image', 'video', 'audio'];
            if (!mediaTypes.includes(msgType)) return;

            const key = msgType + 's';
            this.stats[key] = (this.stats[key] || 0) + 1;

            if (this.stats.total % this.config.mediaSaveInterval === 0) {
                this.flushMediaStats();
            }

        } catch (error) {
            this.handleError('storeMediaStats', error);
        }
    }

    async flushMediaStats() {
        try {
            const mediaPath = './data/media.json';
            let mediaDB = fs.readJsonSync(mediaPath, { throws: false }) || { total: 0 };
            
            mediaDB.total = (mediaDB.total || 0) + this.stats.image + this.stats.video + this.stats.audio;
            mediaDB.images = (mediaDB.images || 0) + this.stats.image;
            mediaDB.videos = (mediaDB.videos || 0) + this.stats.video;
            mediaDB.audios = (mediaDB.audios || 0) + this.stats.audio;
            mediaDB.lastUpdate = Date.now();
            
            fs.writeJsonSync(mediaPath, mediaDB, { spaces: 2 });
            
            this.stats.image = 0;
            this.stats.video = 0;
            this.stats.audio = 0;

        } catch (error) {
            this.handleError('flushMediaStats', error);
        }
    }

    // ============================================================
    // 📨 معالجة حسب النوع
    // ============================================================
    async processByType(message, msgType, text) {
        switch (msgType) {
            case 'text':
                this.stats.text++;
                break;
            case 'image':
                this.stats.image++;
                await this.processImage(message);
                break;
            case 'video':
                this.stats.video++;
                await this.processVideo(message);
                break;
            case 'audio':
                this.stats.audio++;
                await this.processAudio(message);
                break;
            case 'sticker':
                this.stats.sticker++;
                break;
            case 'document':
                this.stats.document++;
                break;
            case 'button':
                this.stats.button++;
                await this.processButton(message);
                break;
            case 'list':
                this.stats.list++;
                await this.processList(message);
                break;
            case 'reaction':
                this.stats.reaction++;
                break;
            default:
                break;
        }
    }

    async processImage(message) {
        try {
            const msg = message.message.imageMessage;
            if (msg?.url) {
                const cacheKey = `img_${Date.now()}`;
                this.mediaCache.set(cacheKey, { url: msg.url, time: Date.now() });
            }
        } catch (error) {
            this.handleError('processImage', error);
        }
    }

    async processVideo(message) {
        try {
            const msg = message.message.videoMessage;
            if (msg?.url) {
                const cacheKey = `vid_${Date.now()}`;
                this.mediaCache.set(cacheKey, { 
                    url: msg.url, 
                    duration: msg.seconds || 0,
                    time: Date.now()
                });
            }
        } catch (error) {
            this.handleError('processVideo', error);
        }
    }

    async processAudio(message) {
        try {
            const msg = message.message.audioMessage;
            if (msg?.url) {
                const cacheKey = `aud_${Date.now()}`;
                this.mediaCache.set(cacheKey, { 
                    url: msg.url, 
                    ptt: msg.ptt || false,
                    time: Date.now()
                });
            }
        } catch (error) {
            this.handleError('processAudio', error);
        }
    }

    async processButton(message) {
        try {
            const msg = message.message.buttonsResponseMessage;
            const buttonId = msg?.selectedButtonId || '';
        } catch (error) {
            this.handleError('processButton', error);
        }
    }

    async processList(message) {
        try {
            const msg = message.message.listResponseMessage;
            const selectedId = msg?.singleSelectReply?.selectedRowId || '';
        } catch (error) {
            this.handleError('processList', error);
        }
    }

    // ============================================================
    // 🗑️ حذف فائق السرعة
    // ============================================================
    async ultraDelete(message) {
        try {
            const key = {
                remoteJid: message.key.remoteJid,
                fromMe: message.key.fromMe || false,
                id: message.key.id
            };

            if (message.key.participant) {
                key.participant = message.key.participant;
            }

            await this.bot.sock.sendMessage(
                message.key.remoteJid,
                { delete: key }
            );

        } catch (error) {
            console.log(
                `❌ فشل حذف رسالة المكتوم: ${error?.message || error}`
            );
        }
    }

    extractText(message) {
        const msg = message.message;
        return msg.conversation ||
               msg.extendedTextMessage?.text ||
               msg.imageMessage?.caption ||
               msg.videoMessage?.caption ||
               msg.buttonsResponseMessage?.selectedButtonId ||
               msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
               '';
    }

    isMediaMessage(message) {
        const msg = message.message;
        return !!(msg.imageMessage || msg.videoMessage || msg.audioMessage || 
                  msg.documentMessage || msg.stickerMessage);
    }

    // ============================================================
    // 📢 البث
    // ============================================================
    async broadcastToGroups(message, groupJids = null) {
        try {
            let targets = groupJids;
            if (!targets) {
                const groups = await this.bot.sock.groupFetchAllParticipating();
                targets = Object.keys(groups);
            }

            let success = 0;
            for (const jid of targets) {
                try {
                    await this.bot.sendMessage(jid, message);
                    success++;
                } catch (e) {}
            }
            return { success, total: targets.length };

        } catch (error) {
            return { success: 0, total: 0 };
        }
    }

    // ============================================================
    // ⚡ أنظمة الأداء
    // ============================================================
    startSystems() {
        setInterval(() => this.optimizeMemory(), 120000);
        setInterval(() => this.cleanCache(), 300000);
        setInterval(() => this.flushAll(), 30000);
        setInterval(() => this.optimizeConnection(), 300000);
        setInterval(() => this.cleanSpamTracker(), 60000);

        this.optimizePerformance();
    }

    optimizePerformance() {
        process.setMaxListeners(0);
        if (this.bot.sock?.ws) {
            this.bot.sock.ws.binaryType = 'arraybuffer';
        }
        console.debug = () => {};
    }

    optimizeMemory() {
        try {
            if (global.gc) global.gc();
            if (this.mediaCache.size > this.config.maxCacheSize) {
                const entries = Array.from(this.mediaCache.entries());
                const toDelete = entries.slice(0, this.mediaCache.size - this.config.maxCacheSize);
                for (const [key] of toDelete) {
                    this.mediaCache.delete(key);
                }
            }
        } catch (error) {}
    }

    cleanCache() {
        const now = Date.now();
        const expiry = 600000;
        
        for (const [key, data] of this.mediaCache) {
            if (data.time && now - data.time > expiry) {
                this.mediaCache.delete(key);
            }
        }
        
        for (const [key] of this.messageCache) {
            if (now - parseInt(key.split('_')[1] || 0) > expiry) {
                this.messageCache.delete(key);
            }
        }
    }

    cleanSpamTracker() {
        const now = Date.now();
        for (const [jid, data] of this.spamTracker) {
            if (now - data.last > 60000) {
                this.spamTracker.delete(jid);
            }
        }
    }

    optimizeConnection() {
        try {
            if (this.bot.sock?.ws?.readyState === 1) {
                this.bot.sock.ws.ping();
            }
        } catch (error) {}
    }

    async flushAll() {
        await this.flushUserData();
        await this.flushMediaStats();
        this.flushErrors();
    }

    handleError(place, error) {
        this.stats.errors++;
        if (this.stats.errors > this.config.errorLimit) {
            this.stats.errors = 0;
            this.errorLog = [];
        }
    }

    flushErrors() {
        try {
            if (this.errorLog.length > 0) {
                fs.writeJsonSync('./data/errors.json', this.errorLog.slice(-50), { spaces: 2 });
            }
        } catch (e) {}
    }

    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        return {
            ...this.stats,
            uptime: this.formatUptime(uptime),
            cacheSize: this.mediaCache.size,
            spamTracked: this.spamTracker.size,
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        };
    }

    formatUptime(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const d = Math.floor(h / 24);
        return d > 0 ? `${d}d ${h%24}h` : `${h}h ${m%60}m`;
    }

    async ultraFastSend(jid, content, options = {}) {
        try {
            await this.bot.sendMessage(jid, content, {
                ...options,
                upload: false,
                mediaUploadTimeoutMs: 5000,
            });
            return true;
        } catch {
            return false;
        }
    }

    quickReset() {
        this.stats.total = 0;
        this.stats.processed = 0;
        this.stats.errors = 0;
        this.errorLog = [];
        this.spamTracker.clear();
        this.mediaCache.clear();
        this.messageCache.clear();
    }
}

export default MessageSystem;