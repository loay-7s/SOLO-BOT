import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    Browsers,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import P from 'pino';
import fs from 'fs-extra';
import path from 'path';
import { EventEmitter } from 'events';
import { Handler } from './handler.js';
import { MessageSystem } from './messages.js';
import { ConsoleSystem } from './console.js';


const SUB_ROOT = './session/sub';
const MAX_SUB_BOTS = 10;
const PAIRING_DELAY = 2500;

class SubBots extends EventEmitter {
    constructor(mainBot) {
        super();
        this.mainBot = mainBot;
        this.bots = new Map();
        this.installing = new Set();
        this.pairing = new Set();
        this.config = {};
        this.initialized = false;
        this.logger = P({ level: 'silent' });
        fs.ensureDirSync(SUB_ROOT);
    }

    async setConfig(config = {}) {
        this.config = config;
        return this.config;
    }

    getCoreConfig() {
        return this.mainBot?.config || this.config || {};
    }

    list() {
        return Array.from(this.bots.values()).map(bot => ({
            id: bot.id,
            phone: bot.phone,
            connected: bot.connected,
            messages: bot.messages || 0,
            name: bot.name,
            sock: bot.sock || null
        }));
    }

    stats() {
        const bots = Array.from(this.bots.values());

        return {
            total: bots.length,
            connected: bots.filter(bot => bot.connected).length,
            disconnected: bots.filter(bot => !bot.connected).length,
            totalMessages: bots.reduce(
                (total, bot) => total + (bot.messages || 0),
                0
            )
        };
    }

    get(id) {
        return this.bots.get(String(id)) || null;
    }

    hasPhone(phone) {
        const cleanPhone = this.normalizePhone(phone);

        return Array.from(this.bots.values()).some(
            bot => bot.phone === cleanPhone
        );
    }

    normalizePhone(phone) {
        return String(phone || '').replace(/[^\d]/g, '');
    }

    getNextId() {
        for (let i = 1; i <= MAX_SUB_BOTS; i++) {
            if (!this.bots.has(String(i))) {
                return String(i);
            }
        }

        return null;
    }

    getSessionPath(id) {
        return path.resolve(
            SUB_ROOT,
            `SOLO BOT ${String(id)}`
        );
    }

    createBot(id, phone) {
        return {
            id: String(id),
            phone: this.normalizePhone(phone),
            name: `SOLO BOT ${String(id)}`,
            sock: null,
            handler: null,
            messagesSystem: null,
            consoleSystem: null,
            config: this.getCoreConfig(),
            connected: false,
            messages: 0,
            restarting: false,
            createdAt: Date.now(),
            generation: 0
        };
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ المشكلة 3: تحميل البلجنز 5 مرات → اتصلحت
    // ═══════════════════════════════════════════════════════════
    async setupBotSystems(bot) {
        const coreConfig = this.getCoreConfig();

        if (!coreConfig || typeof coreConfig !== 'object') {
            throw new Error('Main bot config is not available');
        }

        bot.config = coreConfig;

        try {
            // 🆕 نستخدم Handler مشترك (لو البوت الأساسي محمّل)
            const mainHandler = this.mainBot?.handler;

            if (mainHandler && mainHandler.isInitialized && mainHandler.commands?.size > 0) {
                // ✅ البوت الأساسي محمّل — نشارك البيانات

                // نعمل Handler جديد (عشان `this.bot` يكون البوت الفرعي)
                bot.handler = new Handler(bot);
                bot.handler.pluginDir = path.resolve('./plugins');

                // 🆕 نشارك الـ commands و aliases و plugins
                bot.handler.commands = mainHandler.commands;
                bot.handler.aliases = mainHandler.aliases;
                bot.handler.plugins = mainHandler.plugins;
                bot.handler.autoCommands = mainHandler.autoCommands;
                bot.handler.continuousCommands = mainHandler.continuousCommands;

                // 🆕 نعلّمه إنه جاهز
                bot.handler.isInitialized = true;

                console.log(`  ✅ [${bot.name}] Shared handler (${mainHandler.plugins.size} plugins)`);
            } else {
                // ⚠️ مفيش Handler أساسي — نحمّل من جديد
                bot.handler = new Handler(bot);
                bot.handler.pluginDir = path.resolve('./plugins');

                if (typeof bot.handler.loadPlugins === 'function') {
                    await bot.handler.loadPlugins();
                }

                console.log(`  ✅ [${bot.name}] Main Handler loaded`);
            }
        } catch (error) {
            bot.handler = null;

            console.error(
                `❌ [${bot.name}] Handler loading error:`,
                error?.message || error
            );

            throw error;
        }

        try {
            bot.messagesSystem = new MessageSystem(bot);

            console.log(
                `  ✅ [${bot.name}] Main Message System loaded`
            );
        } catch (error) {
            bot.messagesSystem = null;

            console.error(
                `❌ [${bot.name}] Message System loading error:`,
                error?.message || error
            );

            throw error;
        }

        try {
            bot.consoleSystem = new ConsoleSystem(bot);

            console.log(
                `  ✅ [${bot.name}] Main Console System loaded`
            );
        } catch (error) {
            bot.consoleSystem = null;

            console.error(
                `❌ [${bot.name}] Console System loading error:`,
                error?.message || error
            );

            throw error;
        }

        return bot;
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ المشكلة 2: plugins.clear() → اتصلحت
    // ═══════════════════════════════════════════════════════════
    clearBotSystems(bot) {
        try {
            if (bot.handler) {
                // 🆕 متلمسش plugins — عشان مشتركة مع البوت الأساسي
                // بس نمسح الـ commands و aliases الخاصة بالبوت الفرعي
                // (بس خلي بالك: هي مشتركة، فمش بنمسحها)

                // ⚠️ بما إننا مشتركين، مش بنعمل clear للـ commands
                // (هنعمل reset مرجع بس)
            }
        } catch {}

        bot.handler = null;
        bot.messagesSystem = null;
        bot.consoleSystem = null;
    }

    async add(phone) {
        const cleanPhone = this.normalizePhone(phone);

        if (!cleanPhone || !/^\d+$/.test(cleanPhone)) {
            throw new Error('❌ رقم الهاتف غير صالح');
        }

        if (this.hasPhone(cleanPhone)) {
            throw new Error('❌ هذا الرقم لديه بوت فرعي بالفعل');
        }

        if (this.bots.size >= MAX_SUB_BOTS) {
            throw new Error(
                `❌ تم الوصول للحد الأقصى وهو ${MAX_SUB_BOTS} بوتات فرعية`
            );
        }

        if (this.installing.has(cleanPhone)) {
            throw new Error(
                '⏳ جاري تنصيب بوت لهذا الرقم بالفعل'
            );
        }

        const id = this.getNextId();

        if (!id) {
            throw new Error(
                '❌ لا يوجد رقم متاح لبوت فرعي جديد'
            );
        }

        this.installing.add(cleanPhone);

        try {
            const bot = this.createBot(id, cleanPhone);

            this.bots.set(id, bot);

            await this.start(id, cleanPhone);

            return id;
        } catch (error) {
            this.bots.delete(id);
            this.pairing.delete(id);
            throw error;
        } finally {
            this.installing.delete(cleanPhone);
        }
    }

    async start(id, phone = null) {
        id = String(id);

        let bot = this.bots.get(id);

        if (!bot) {
            if (!phone) {
                throw new Error(
                    `البوت الفرعي ${id} غير موجود`
                );
            }

            bot = this.createBot(id, phone);
            this.bots.set(id, bot);
        }

        bot.restarting = false;
        bot.generation =
            Number(bot.generation || 0) + 1;

        const generation = bot.generation;
        const sessionPath = this.getSessionPath(id);

        await fs.ensureDir(sessionPath);

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(sessionPath);

        let version;

        try {
            const latest =
                await fetchLatestBaileysVersion();

            version = latest.version;
        } catch {
            version = [7, 0, 0];
        }

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    this.logger
                )
            },
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            logger: this.logger,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            syncFullHistory: false
        });

        bot.sock = sock;
        bot.connected = false;

        this.setupBotMethods(bot);

        try {
            this.clearBotSystems(bot);
            await this.setupBotSystems(bot);
        } catch (error) {
            console.error(
                `❌ [${bot.name}] Core systems error:`,
                error?.message || error
            );
        }

        sock.ev.on(
            'creds.update',
            async creds => {
                try {
                    await saveCreds(creds);
                } catch (error) {
                    console.error(
                        `❌ [${bot.name}] Save creds error:`,
                        error?.message || error
                    );
                }
            }
        );

        sock.ev.on(
            'connection.update',
            async update => {
                if (
                    !this.bots.has(id) ||
                    bot.generation !== generation
                ) {
                    return;
                }

                try {
                    await this.handleConnectionUpdate(
                        id,
                        update,
                        generation
                    );
                } catch (error) {
                    console.error(
                        `❌ [${bot.name}] Connection handler error:`,
                        error?.message || error
                    );
                }
            }
        );

        sock.ev.on(
            'messages.upsert',
            async update => {
                if (
                    !this.bots.has(id) ||
                    bot.generation !== generation
                ) {
                    return;
                }

                try {
                    await this.handleMessages(
                        id,
                        update,
                        generation
                    );
                } catch (error) {
                    console.error(
                        `❌ [${bot.name}] Message handler error:`,
                        error?.message || error
                    );
                }
            }
        );

        sock.ev.on('group-participants.update', async (data) => {
            try {

                if (data.action !== 'add') return;

                const chatId = data.id;
                const participant = data.participants[0];

                const newMemberJid =
                    typeof participant === "string"
                        ? participant
                        : (participant.phoneNumber ?? participant.id ?? participant.jid);

                const settingsPath = './data/welcome_settings.json';

                if (!fs.existsSync(settingsPath)) return;

                const settings = fs.readJsonSync(settingsPath, { throws: false }) || {};

                if (!settings[chatId]?.enabled) return;

                try {

                    let memberName = newMemberJid.split('@')[0];

                    try {
                        const contact = await bot.sock.onWhatsApp(newMemberJid);
                        if (contact?.notify) memberName = contact.notify;
                    } catch {}

                    let ppUrl;
                    let hasImage = true;

                    try {
                        ppUrl = await bot.sock.profilePictureUrl(newMemberJid, 'image');
                    } catch {
                        hasImage = false;
                    }

                    const welcomeMsg = `*╭━─━─━─≪✠≫─━─━─━╮*  *💠𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐓𝐇𝐄 𝐆𝐑𝐎𝐔𝐏💠*
*╰━─━─━─≪✠≫─━─━─━╯*

*🛡️┇ بـكـل فـخـر و إعـتـزاز نـرحـب بـ*
*🔥┇ انـضـمامـك فـي جـࢪوبـنـا*

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*👤┇ الـعـضـو الـمـوقـر : ⦓ @${newMemberJid.split('@')[0]} ⦔ 🌸*

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*💎┇ أنـت الآن جـزء مـن عـائـلـتـنـا الـمـتـواضـعـة 🌟*

*✨┇ نـرجـو أن تـجـد مـعـنـا كـل الـتـقـديـر والاحـتـرام 🌹*

*⚜️┇نـتـمـنـى لـك رحـلـة مـمـتـعـة و مـمـيـزة مـعـنـا 🎐*

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*🚫┇الـࢪجـاء قـࢪاءة الـقـوانـيـن لـلأهـمـيـة.. اكـتـب [.القوانين]♦️*

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*🏛️┇ مـرحـبـاً بـك نـوࢪت فـي عـريـن الـعـظـمـاء.🍷*

   ~*『 𝐄𝐍𝐉𝐎𝐘  𝐘𝐎𝐔𝐑  𝐒𝐓𝐀𝐘 』*~
   *╰━─━─━─≪✠≫─━─━─━╯*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                    if (hasImage) {

                        await bot.sock.sendMessage(chatId, {
                            image: { url: ppUrl },
                            caption: welcomeMsg,
                            mentions: [newMemberJid]
                        });

                    } else {

                        await bot.sock.sendMessage(chatId, {
                            text: welcomeMsg,
                            mentions: [newMemberJid]
                        });

                    }

                    console.log(`✅ تم الترحيب بالعضو: ${newMemberJid.split('@')[0]}`);

                } catch (error) {

                    console.error("❌ خطأ في الترحيب:", error);

                }

            } catch (err) {

                console.log("❌ Welcome event error:", err);

            }
        });

        sock.ev.on('group-participants.update', async (data) => {

            try {

                if (data.action !== "add") return;

                const chatId = data.id;
                const participant = data.participants[0];

                const newMemberJid =
                    typeof participant === "string"
                        ? participant
                        : (participant.id ?? participant.jid ?? participant.phoneNumber);

                const settingsPath = "./data/reception_settings.json";

                if (!fs.existsSync(settingsPath)) return;

                const settings = fs.readJsonSync(settingsPath, { throws:false }) || {};

                if (!settings[chatId]?.enabled) return;

                const wait = (ms)=> new Promise(r=>setTimeout(r,ms));

                const msg1 = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*⌬ مـمـلـكـة و نـقـابـات الأنـمـي ⌬*
*───━━━⊱  🏮  ⊰━━━───*

*💎 عـضـو جـديـد :*
*⦓ @${newMemberJid.split('@')[0]} ⦔*

*🌸 جـئـتُ اهـلاً نـوࢪت و اشـࢪقـت اسـتـقـبـالـنـا الـجـمـيـل.*

*🔹 اذا كـانـت هـذه أول مـرة تـدخـل فـيـهـا جـࢪوب انـمـي ولا تـفـهـم مـعـنـى مـمـلـكـة أو نـقـابـة، اقـرأ الـتـالـي:*                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔

*❑ [ الـمـمـلـكـة ] 👑↯*

*الـمـمـلـكـة هـي تـجـمـع عـدد مـن الـنـقـابـات تـحـت مـسـؤولـيـة مـؤسـس او إمـبـراطـور. بـمـعـنـى انـهـا هـي الـنـظـام، والـنـقـابـات، والأعـضـاء، وفـروع مـسـابـقـات...الـخ.*

*⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔*

*❑ [ الـنـقـابـات ] ⚔️↯*

*الـنـقـابـة هـي جـروب انـمـي داخـل الـمـمـلـكـة. كـل عـضـو يـنـضـم لـنـقـابـة ويـشـارك ويـتـفـاعـل مـعـهـا.*

*⎔┄┄─── ⊱╎⌯ 📌 ⌯╎⊰ ───┄┄⎔*

*⚠️ مـلاحـظـة مـهـمـة:*

*كـل عـضـو يـلـتـزم بـالـنـقـابـة الـتـي دخـل إلـيـهـا، لا يـمـكـن الـتـواجـد فـي نـقـابـتـيـن مـخـتـلـفـتـيـن. لـكـن يـوجـد "زيـارة" بـحـيـث يـمـكـن زيـارة نـقـابـة اخـرى لـمـدة مـعـيـنـة ثـم تـخـرج.*

*⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔*

*❑ [ الـرتـب بـاخـتـصـار ] 🏅↯*

*👑 الإمـبـراطـور*
*قـائـد الـمـمـلـكـة الأعـلـى والـمـسـؤول عـنـها*

*⚜ نـائـب الإمـبـراطـور*
*يـسـاعـد فـي إدارة الـمـمـلـكـة*

*🏰 الـلـورد*
*مـسـؤول عـن الـمـمـلـكـة بـعـد الـنـائـب، ويـكـون لـديـه نـواب مـسـؤولـة عـن كـل جـزء فـي الـمـمـلـكـة، حـيـث انـه مـتـعـدد الـمـهـام*

*🛡 الـسـلـطـان*
*مـسـؤول عـن الأَمـن والـنـظـام فـي الـمـمـلـكـة*

*📜 الـدوق / الـمـارشـال*
*مـسـؤولـون عـن عـدد مـحـدد مـن الـنـقـابـات*

*⚓ الأدمـيـرال*
*يـديـر نـقـابـة واحـدة خـاصـة بـه ويـشـرف عـلى الأعـضـاء*


*⚔ بـاقـي الـرتـب:* 
*تـنـفـذ الـمـهـام الآتـيـة مـن الأدمـيـرال وتـتـدرج مـع الـنـشـاط*

⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔

*💠 انـضـم لـنـقـابـة، شـارك فـي الـتـفـاعـل والـفـعـالـيـات، ومـع الـوقـت تـرتـقـي فـي الـرتـب اذا أرَدت*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

                await bot.sock.sendMessage(chatId,{
                    text: msg1,
                    mentions:[newMemberJid]
                });

                await wait(1000);

                const msg2 = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*⌬ شـرح إسـتـمـاࢪة الاسـتـقـبـال 📄 ⌬*                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
*───━━━⊱  📋  ⊰━━━───*
*❑ [ الـلـقـب ] 🏷️↯*

*اخـتـار اسـم شـخـصـيـة انـمـي / مـانـهـوا / مـانـجـا / لـعـبـة، لـتـكـون لـقـبـك فـي الـنـقـابـة.*

*⚠️ يـجـب اخـتـيـار لـقـب مـتـاح، حـيـث الألـقـاب الـمـأخـوذة مـكـتـوبـة فـي مـعـلـومـات الـجـروب أو الـوصـف.*
*⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔*

*❑ [ الـطـرف ] 🔗↯*

*مـن الـشـخـص او مـا الـصـفـحـة الـذي أتـيـت إلـى الـجـروب هـنـا عـن طـرـيـقـهـا؟*    
*⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔*

*❑ [ الـجـنـس ] ⚥↯*

*بـنـت أو ولـد؟*

*⚠️ لا يـمـكـن لـبـنـت اخـذ لـقـب شـخـصـيـة ولـد والعكس.*                                     

*⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔*

*💎 تـم اࢪسـال اسـتـمـارة الأسـتـقـبـال يـࢪجـى نـسـخـهـا و مـلـئ الـفـࢪاغـات ثـم اࢪسـلـهـا و تـأكـد انـك اخـتـࢪت لـقـب مـتـاح لـيـس مـأخـوذ، الألـقـاب الـمـاخـوذة فـي الـوصـف [بـعـد أن تـمـلأ الإسـتـمـاࢪة، انـتـظـر حـتـى يـأتـي مـشـࢪف لـ يـدخـلـك الـجـࢪوب الأسـاسـي.🪷*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

                await bot.sock.sendMessage(chatId,{
                    text: msg2,
                    mentions:[newMemberJid]
                });

                await wait(1000);

                const msg3 = `﷽
*✪ ◞ اهـلا بـك فـي اسـتـقـبـال الـنـقـابـة ◜*
*⌬──≪══━━⊹𓆩🏮𓆪⊹━━══≽──⌬*

*✪ يـࢪجـى مـلء الإسـتـمـاࢪة📄*

*⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔*

*❐╎الــلــقـب؟↫「 」*


*❐╎مِـن طـرف مَـن؟↫「 」*


*❐╎بـنـت أو ولـد؟↫「 」*

*⌬──≪══━━⊹𓆩🏮𓆪⊹━━══≽──⌬*
> *~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;

                await bot.sock.sendMessage(chatId,{
                    text: msg3,
                    mentions:[newMemberJid]
                });

            } catch(err){

                console.log("Reception error:",err);

            }      

        });

        sock.ev.on('group-participants.update', async (data) => {
            try {

                if (data.action !== "remove") return;

                const chatId = data.id;
                const participant = data.participants[0];

                const newMemberJid =
                    typeof participant === "string"
                        ? participant
                        : (participant.phoneNumber ?? participant.id ?? participant.jid);

                if (!newMemberJid) return;

                const settingsPath = './data/farewell_settings.json';

                if (!fs.existsSync(settingsPath)) return;

                const settings = fs.readJsonSync(settingsPath, {
                    throws: false
                }) || {};

                if (!settings[chatId]?.enabled) return;

                try {

                    let memberName = newMemberJid.split('@')[0];

                    try {
                        const contact = await sock.onWhatsApp(newMemberJid);

                        if (contact?.notify) {
                            memberName = contact.notify;
                        }
                    } catch {}

                    let ppUrl;
                    let hasImage = true;

                    try {
                        ppUrl = await sock.profilePictureUrl(
                            newMemberJid,
                            'image'
                        );
                    } catch {
                        hasImage = false;
                    }

                    const farewellMsg = `*╭━─━─━─≪✠≫─━─━─━╮*  *💠𝐆𝐎𝐎𝐃𝐁𝐘𝐄 𝐅𝐑𝐎𝐌 𝐆𝐑𝐎𝐔𝐏👋🏻*
*╰━─━─━─≪✠≫─━─━─━╯*

*🛡️┇ بـكـل حـزن و أسـف نـودع بـ*
*👋🏻┇ عـضـوًا مـن أعـضـاء جـࢪوبـنـا*

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*👤┇ الـعـضـو الـمـغـادࢪ : ⦓ @${newMemberJid.split('@')[0]} ⦔ 🌸*

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*🥀┇نـتـمـنـى لـك كـل الـتـوفـيـق فـي حـيـاتـك*

*🚪┇الـࢪحـيـل لـيـس نـهـايـة الـطـࢪيـق..*

*💎┇سـيـظـل الـبـاب مـفـتـوحـاً لـك دائـمـاً.*

*⎔┄┄─── ⊱╎⌯🏮⌯╎⊰ ───┄┄⎔*

*🏛️┇ نـسـأل الـلـه لـك الـتـوفـيـق و الـسـعـادة.🍷*

   ~*『 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 𝐀𝐍𝐃 𝐋𝐔𝐂𝐊 』*~
   *╰━─━─━─≪✠≫─━─━─━╯*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                    if (hasImage) {

                        await sock.sendMessage(chatId, {
                            image: { url: ppUrl },
                            caption: farewellMsg,
                            mentions: [newMemberJid]
                        });

                    } else {

                        await sock.sendMessage(chatId, {
                            text: farewellMsg,
                            mentions: [newMemberJid]
                        });

                    }

                    console.log(
                        `👋 تم توديع العضو: ${newMemberJid.split('@')[0]}`
                    );

                } catch (error) {

                    console.error(
                        "❌ خطأ في التوديع:",
                        error
                    );

                }

            } catch (err) {

                console.log(
                    "❌ Farewell event error:",
                    err
                );

            }
        });

        if (!state.creds.registered) {
            this.requestPairingCode(
                id,
                generation
            );
        }

        return bot;
    }

    async requestPairingCode(id, generation = null) {
    id = String(id);

    if (this.pairing.has(id)) {
        return;
    }

    this.pairing.add(id);

    setTimeout(async () => {
        try {
            const bot = this.bots.get(id);

            if (!bot || !bot.sock) {
                return;
            }

            if (
                generation !== null &&
                bot.generation !== generation
            ) {
                return;
            }

            if (bot.connected) {
                return;
            }

            const phone =
                this.normalizePhone(bot.phone);

            if (!phone) {
                throw new Error(
                    '❌ رقم الهاتف غير صالح لطلب كود الاقتران'
                );
            }

            console.log(
                `🔐 [${bot.name}] Requesting pairing code for ${phone}`
            );

            // ═══════════════════════════════════════════════════
            // 🎯 محاولة استخدام الكود المخصص أولاً
            // ═══════════════════════════════════════════════════
            const customCode = global.__CUSTOM_PAIR_CODE__;
            let code = null;

            if (customCode) {
                try {
                    console.log(
                        `🎯 [${bot.name}] Trying custom code: ${customCode}`
                    );

                    code = await bot.sock.requestPairingCode(
                        phone,
                        customCode
                    );

                    console.log(
                        `✅ [${bot.name}] Custom code accepted: ${code}`
                    );
                } catch (customError) {
                    console.log(
                        `⚠️ [${bot.name}] Custom code rejected: ${customError?.message}`
                    );
                    code = null;
                }
            }

            // ═══════════════════════════════════════════════════
            // 🎯 لو الكود المخصص فشل → استخدم الكود العادي
            // ═══════════════════════════════════════════════════
            if (!code) {
                code = await bot.sock.requestPairingCode(phone);
            }

            if (!code) {
                throw new Error(
                    '❌ لم يتم استلام كود الاقتران من WhatsApp'
                );
            }

            console.log(
                `🔑 [${bot.name}] Pairing code: ${code}`
            );

            this.emit(
                'pair',
                id,
                code
            );
        } catch (error) {
            console.error(
                `❌ [SOLO BOT ${id}] Pairing error:`,
                error?.message || error
            );

            this.emit(
                'error',
                id,
                error
            );
        } finally {
            this.pairing.delete(id);
        }
    }, PAIRING_DELAY);
}

    setupBotMethods(bot) {
        bot.sendMessage = async (
            jid,
            content,
            options = {}
        ) => {
            if (!bot.sock) {
                throw new Error(
                    'Socket غير متصل'
                );
            }

            return bot.sock.sendMessage(
                jid,
                content,
                options
            );
        };

        bot.reply = async (
            jid,
            content,
            quoted
        ) => {
            if (!bot.sock) {
                throw new Error(
                    'Socket غير متصل'
                );
            }

            return bot.sock.sendMessage(
                jid,
                typeof content === 'string'
                    ? { text: content }
                    : content,
                quoted
                    ? { quoted }
                    : {}
            );
        };

        bot.react = async (
            message,
            emoji
        ) => {
            if (!bot.sock) {
                throw new Error(
                    'Socket غير متصل'
                );
            }

            return bot.sock.sendMessage(
                message.key.remoteJid,
                {
                    react: {
                        text: emoji,
                        key: message.key
                    }
                }
            );
        };
    }

    async handleConnectionUpdate(
        id,
        update,
        generation
    ) {
        const bot =
            this.bots.get(String(id));

        if (!bot) {
            return;
        }

        if (
            generation !== undefined &&
            bot.generation !== generation
        ) {
            return;
        }

        const {
            connection,
            lastDisconnect
        } = update;

        if (connection === 'open') {
            bot.connected = true;
            bot.restarting = false;

            this.pairing.delete(
                String(id)
            );

            bot.config = this.getCoreConfig();

            console.log(
                `✅ [${bot.name}] Connected: ${bot.phone}`
            );

            this.emit(
                'ready',
                id,
                bot.sock
            );

            return;
        }

        if (connection === 'close') {
            bot.connected = false;

            const statusCode =
                lastDisconnect?.error?.output?.statusCode;

            console.log(
                `🔌 [${bot.name}] Disconnected (${statusCode || 'unknown'})`
            );

            this.emit(
                'close',
                id
            );

            if (
                statusCode ===
                DisconnectReason.loggedOut
            ) {
                await this.handleBadSession(id);
                return;
            }

            if (
                statusCode ===
                DisconnectReason.connectionReplaced
            ) {
                await this.handleBadSession(id);
                return;
            }

            if (
                statusCode ===
                DisconnectReason.restartRequired
            ) {
                console.log(
                    `🔄 [${bot.name}] Restart required - reconnecting immediately...`
                );

                if (bot.restarting) {
                    return;
                }

                bot.restarting = true;

                try {
                    await this.start(
                        id,
                        bot.phone
                    );

                    console.log(
                        `🔄 [${bot.name}] New socket created`
                    );
                } catch (error) {
                    bot.restarting = false;

                    console.error(
                        `❌ [${bot.name}] Restart-required reconnect error:`,
                        error?.message || error
                    );

                    this.emit(
                        'error',
                        id,
                        error
                    );
                }

                return;
            }

            if (!bot.restarting) {
                bot.restarting = true;

                setTimeout(async () => {
                    try {
                        if (!this.bots.has(id)) {
                            return;
                        }

                        await this.start(
                            id,
                            bot.phone
                        );
                    } catch (error) {
                        bot.restarting = false;

                        console.error(
                            `❌ [${bot.name}] Reconnect error:`,
                            error?.message || error
                        );

                        this.emit(
                            'error',
                            id,
                            error
                        );
                    }
                }, 3000);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 🎯 فلتر ذكي للبوتات الفرعية
    // ═══════════════════════════════════════════════════════════
    async handleMessages(
        id,
        update,
        generation
    ) {
        const bot =
            this.bots.get(String(id));

        if (
            !bot ||
            !bot.sock
        ) {
            return;
        }

        if (
            generation !== undefined &&
            bot.generation !== generation
        ) {
            return;
        }

        const botJid = bot.sock.user?.id;
        const botNumber = botJid?.split(':')[0]?.split('@')[0];

        const mainBotJid = this.mainBot?.sock?.user?.id;
        const mainBotNumber = mainBotJid?.split(':')[0]?.split('@')[0];

        const allBotNumbers = new Set();
        if (mainBotNumber) allBotNumbers.add(mainBotNumber);
        for (const [otherId, otherBot] of this.bots) {
            const otherNumber = otherBot.sock?.user?.id?.split(':')[0]?.split('@')[0];
            if (otherNumber) allBotNumbers.add(otherNumber);
        }

        for (
            const message of update.messages || []
        ) {
            if (!message?.message) {
                continue;
            }

            if (
                message.key?.id?.includes('3EB0')
            ) {
                continue;
            }

            const senderNumber = message.key?.participant?.split(':')[0]?.split('@')[0];
            const isFromMe = message.key?.fromMe;

            if (isFromMe || (senderNumber && allBotNumbers.has(senderNumber))) {

                const msgText =
                    message.message?.conversation ||
                    message.message?.extendedTextMessage?.text ||
                    message.message?.imageMessage?.caption ||
                    message.message?.videoMessage?.caption ||
                    '';

                const prefix = bot.config?.PREFIX || this.getCoreConfig()?.PREFIX || '.';
                const trimmed = String(msgText).trim();

                if (!trimmed.startsWith(prefix)) {
                    continue;
                }

                // 🆕 لو الرسالة من البوت نفسه (fromMe) → نفّذها
if (isFromMe) {
    console.log(`🤖 [${bot.name}] Self-command: ${trimmed}`);
}
// لو الرسالة من بوت تاني → تجاهل
else if (senderNumber && allBotNumbers.has(senderNumber)) {
    if (senderNumber !== botNumber) {
        continue;
    }
    console.log(`🤖 [${bot.name}] Self-command (via participant): ${trimmed}`);
}
            }

            bot.messages++;

            this.emit(
                'message',
                id,
                message
            );

            try {
                if (
                    bot.messagesSystem &&
                    typeof bot.messagesSystem.handleMessage === 'function'
                ) {
                    await bot.messagesSystem.handleMessage(
                        message
                    );
                } else {
                    throw new Error(
                        'Main MessageSystem is not available'
                    );
                }
            } catch (error) {
                console.error(
                    `❌ [${bot.name}] Message processing error:`,
                    error?.message || error
                );

                this.emit(
                    'error',
                    id,
                    error
                );
            }
        }
    }

    async handleBadSession(id) {
        const bot =
            this.bots.get(String(id));

        if (!bot) {
            return;
        }

        console.log(
            `⚠️ [${bot.name}] Bad session, removing...`
        );

        this.pairing.delete(
            String(id)
        );

        bot.restarting = true;

        this.clearBotSystems(bot);

        try {
            if (bot.sock) {
                bot.sock.end?.(
                    new Error('Bad session')
                );
            }
        } catch {}

        this.bots.delete(
            String(id)
        );

        try {
            await fs.remove(
                this.getSessionPath(id)
            );
        } catch {}

        this.emit(
            'badSession',
            id
        );
    }

    async stop(id) {
        id = String(id);

        const bot =
            this.bots.get(id);

        if (!bot) {
            throw new Error(
                '❌ البوت الفرعي غير موجود'
            );
        }

        bot.connected = false;
        bot.restarting = true;

        this.pairing.delete(id);

        try {
            bot.sock?.end?.();
        } catch {}

        this.emit(
            'close',
            id
        );

        return true;
    }

    async remove(id) {
        id = String(id);

        const bot =
            this.bots.get(id);

        if (!bot) {
            throw new Error(
                '❌ البوت الفرعي غير موجود'
            );
        }

        try {
            bot.restarting = true;
            bot.sock?.end?.();
        } catch {}

        this.pairing.delete(id);

        this.clearBotSystems(bot);

        this.bots.delete(id);

        try {
            await fs.remove(
                this.getSessionPath(id)
            );
        } catch {}

        return true;
    }

    async load() {
        await fs.ensureDir(
            SUB_ROOT
        );

        const entries =
            await fs.readdir(
                SUB_ROOT,
                {
                    withFileTypes: true
                }
            );

        const folders = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .map(name => {
                const namedMatch =
                    name.match(
                        /^SOLO BOT (\d+)$/i
                    );

                if (namedMatch) {
                    return {
                        name,
                        id: namedMatch[1]
                    };
                }

                const legacyMatch =
                    name.match(/^\d+$/);

                if (legacyMatch) {
                    return {
                        name,
                        id: name
                    };
                }

                return null;
            })
            .filter(Boolean)
            .filter(item =>
                Number(item.id) <= MAX_SUB_BOTS
            )
            .sort(
                (a, b) =>
                    Number(a.id) -
                    Number(b.id)
            );

        let loadedCount = 0;

        for (const item of folders) {
            if (
                loadedCount >=
                MAX_SUB_BOTS
            ) {
                break;
            }

            const id =
                String(item.id);

            try {
                const sessionPath =
                    path.resolve(
                        SUB_ROOT,
                        item.name
                    );

                const credsPath =
                    path.join(
                        sessionPath,
                        'creds.json'
                    );

                if (
                    !fs.existsSync(
                        credsPath
                    )
                ) {
                    continue;
                }

                const creds =
                    await fs.readJson(
                        credsPath
                    );

                const phone =
                    creds?.me?.id?.split(':')[0] ||
                    creds?.me?.id?.split('@')[0];

                if (!phone) {
                    continue;
                }

                const cleanPhone =
                    this.normalizePhone(
                        phone
                    );

                const bot =
                    this.createBot(
                        id,
                        cleanPhone
                    );

                this.bots.set(
                    id,
                    bot
                );

                await this.start(
                    id,
                    cleanPhone
                );

                loadedCount++;
            } catch (error) {
                console.error(
                    `❌ Failed loading SubBot ${id}:`,
                    error?.message || error
                );
            }
        }

        this.initialized = true;

        return loadedCount;
    }

    async initialize() {
        if (this.initialized) {
            return this;
        }

        await this.load();

        return this;
    }
}

const subBots =
    new SubBots(
        global.bot || null
    );

global.subBots = subBots;

export {
    SubBots,
    subBots
};

export default async function initSubBots(
    client
) {
    if (client) {
        subBots.mainBot = client;

        if (client.config) {
            await subBots.setConfig(
                client.config
            );
        }
    }

    global.subBots = subBots;

    return subBots;
}