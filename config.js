import fs from 'fs-extra';
import path from 'path';

//============================================================
export const config = {
    // ==================== المعلومات الأساسية ====================
    BOT_NAME: "SOLO",
    DEVELOPER: "UNKNOWN",
    OWNERERROR: "201226018783@s.whatsapp.net",
    VERSION: "7.0.0-GOD-TIER",
    PREFIX: ".",
    MODE: "private",
    SESSION_PATH: "./session",

    // ==================== 🔐 نظام الماستر والمطورين ====================
    // ⚠️ الماستر (لا يمكن حذفه أو التلاعب به)
    MASTER: [
        "201226018783@s.whatsapp.net",
        "240707533041851@lid"
    ],
    
    // 👑 المطورين (يمكن للماستر إضافتهم وحذفهم)
    // المطور العادي يمكنه حذف نفسه فقط
    DEVELOPERS: [
    "201226018783@s.whatsapp.net",
    "240707533041851@lid",
    "992928357126@s.whatsapp.net",
    "143027511292103@lid"
],

    // ==================== إعدادات التشغيل ====================
    AUTO_READ_MESSAGES: false,
    AUTO_TYPING: false,
    MAX_FILE_SIZE: 200,
    AUTO_RECONNECT: true,
    RECONNECT_DELAY: 3000,

    // ==================== تحقق المطورين ====================
    DEVELOPER_VERIFICATION: {
        ENABLED: true,
        QUICK_MODE: true,
        DEVELOPER_GROUP: "120363169385603341@g.us",
        DEVELOPER_NAMES: ["UNKNOWN"],
        CACHE_DURATION: 86400000
    },

    // ==================== الأمان ====================
    SECURITY: {
        BLOCKED_USERS: [],
        MAX_LOGIN_ATTEMPTS: 5,
        SESSION_TIMEOUT: 3600000,
        ENCRYPT_SESSION: true
    },

    // ==================== الأداء ====================
    PERFORMANCE: {
        MAX_CACHE_SIZE: 500,
        MEMORY_MONITOR: false,
        AUTO_GC: true,
        GC_INTERVAL: 300000,
        MAX_MEMORY_USAGE: 512
    },

    // ==================== الميديا ====================
    MEDIA: {
        AUTO_DOWNLOAD: true,
        MAX_IMAGE_SIZE: 20,
        MAX_VIDEO_SIZE: 100,
        MAX_AUDIO_SIZE: 20,
        ALLOW_STICKERS: true,
        ALLOW_GIFS: true,
        COMPRESS_VIDEOS: true,
        COMPRESS_IMAGES: true,
        DEFAULT_QUALITY: 80
    },

    // ==================== البلجنات ====================
    PLUGINS: {
        AUTO_LOAD: true,
        WATCH_CHANGES: true,
        PLUGINS_DIR: "./plugins",
        MAX_PLUGINS: 100,
        AUTO_RELOAD: true,
        RELOAD_DELAY: 2000,
        EXCLUDE_PLUGINS: []
    },

    // ==================== الأوامر ====================
    COMMANDS: {
        ALLOW_ALIASES: true,
        DEFAULT_COOLDOWN: 1000,
        MAX_ALIASES: 5,
        ALLOW_CUSTOM_COMMANDS: true,
        COMMAND_TIMEOUT: 30000,
        MAX_COMMANDS_PER_MINUTE: 30
    },

    // ==================== الإشعارات ====================
    NOTIFICATIONS: {
        COMMAND_EXECUTION: false,
        PLUGIN_LOAD: true,
        ERROR_REPORTS: true,
        CONNECTION_STATUS: true,
        MESSAGE_STATS: false
    },

    // ==================== التحديثات ====================
    UPDATES: {
        AUTO_CHECK: false,
        NOTIFY_AVAILABLE: false,
        CHECK_INTERVAL: 86400000,
        AUTO_UPDATE: false
    },

    // ==================== التصحيح ====================
    DEBUG: {
        ENABLED: false,
        LOG_LEVEL: "error",
        LOG_FILE: "./data/debug.log",
        MAX_LOG_SIZE: 1048576
    },

    // ==================== النظام ====================
    SYSTEM: {
        TIMEZONE: "Africa/Cairo",
        LANGUAGE: "ar",
        FALLBACK_LANGUAGE: "en",
        MAX_QUEUE_SIZE: 1000,
        PROCESSING_TIMEOUT: 60000
    },

    // ==================== الحماية ====================
    PROTECTION: {
        ANTI_SPAM: true,
        SPAM_THRESHOLD: 5,
        SPAM_WINDOW: 10000,
        ANTI_LINK: true,
        ANTI_PHONE: false,
        ALLOWED_LINKS: [
            "youtube.com",
            "youtu.be",
            "instagram.com"
        ]
    },

    // ==================== الترحيب ====================
    WELCOME: {
        ENABLED: true,
        DEFAULT_MESSAGE: true,
        CUSTOM_MESSAGE: "",
        SEND_IMAGE: true,
        IMAGE_PATH: "./media/welcome.jpg"
    },

    // ==================== الاستقبال ====================
    RECEPTION: {
        ENABLED: true,
        REQUIRES_APPROVAL: false,
        APPROVAL_GROUP: "",
        AUTO_ACCEPT: false
    },

    // ==================== الذكاء الاصطناعي ====================
    AI: {
        ENABLED: true,
        DEFAULT_MODEL: "gpt-3.5-turbo",
        MAX_TOKENS: 2048,
        TEMPERATURE: 0.7,
        TOP_P: 0.9,
        FREQUENCY_PENALTY: 0.5,
        PRESENCE_PENALTY: 0.5
    },

    // ==================== الألعاب ====================
    GAMES: {
        ENABLED: true,
        MAX_PLAYERS: 10,
        DEFAULT_TIMEOUT: 60000,
        GAME_COOLDOWN: 30000
    },

    // ==================== التحميل ====================
    DOWNLOAD: {
        MAX_CONCURRENT: 5,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000,
        TIMEOUT: 60000,
        MAX_FILE_SIZE: 100
    },

    // ==================== البث ====================
    BROADCAST: {
        MAX_GROUPS: 50,
        DELAY_BETWEEN: 2000,
        MAX_MESSAGE_LENGTH: 4096,
        ALLOW_SCHEDULING: true,
        DELAY_BETWEEN: 2000
    },

    // ==================== الكاش ====================
    CACHE: {
        ENABLED: true,
        MAX_SIZE: 500,
        TTL: 3600000,
        AUTO_CLEANUP: true,
        CLEANUP_INTERVAL: 1800000
    },

    // ==================== التقارير ====================
    REPORTS: {
        ENABLED: true,
        AUTO_REPORT: true,
        REPORT_CHANNEL: "",
        MAX_REPORTS_PER_USER: 5,
        REPORT_TIMEOUT: 86400000
    },

    // ==================== البوت ====================
    BOT: {
        STATUS: "online",
        PRESENCE: "available",
        TYPING_INDICATOR: true,
        READ_RECEIPTS: false,
        DELIVERY_RECEIPTS: false
    },

    // ==================== المتغيرات المتقدمة ====================
    ADVANCED: {
        USE_MULTI_AUTH: true,
        SAVE_CREDS: true,
        CLEAN_SESSIONS: true,
        SESSION_CLEANUP_INTERVAL: 86400000,
        MAX_SESSION_AGE: 604800000,
        FORCE_RECONNECT: true,
        RECONNECT_INTERVAL: 300000
    },

    // ==================== إعدادات إضافية ====================
    EXTRA: {
        DEFAULT_LANGUAGE: "ar",
        CURRENCY: "EGP",
        DATE_FORMAT: "DD/MM/YYYY",
        TIME_FORMAT: "HH:mm:ss",
        NUMBER_FORMAT: "ar-EG",
        ALLOW_NSFW: false,
        NSFW_WARNING: true
    }
};

// ============================================================
// 📦 كلاس إدارة البيانات المتقدم
// ============================================================
export class DataStore {
    constructor(name = 'global') {
        this.name = name;
        this.filePath = `./data/${name}.json`;
        this.data = new Map();
        this.cache = new Map();
        this.isSaving = false;
        this.saveQueue = [];
        this.ensureDirectory();
        this.load();
        this.startAutoSave();
    }

    ensureDirectory() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    async load() {
        try {
            if (await fs.pathExists(this.filePath)) {
                const storedData = await fs.readJSON(this.filePath);
                this.data = new Map(Object.entries(storedData));
            }
        } catch (error) {
            await this.save();
        }
    }

    async save() {
        if (this.isSaving) {
            return new Promise((resolve) => {
                this.saveQueue.push(resolve);
            });
        }

        this.isSaving = true;

        try {
            const dataObj = Object.fromEntries(this.data);
            await fs.writeJSON(this.filePath, dataObj);
            this.saveQueue.forEach(resolve => resolve());
            this.saveQueue = [];
        } catch (error) {
            // صمت تام
        } finally {
            this.isSaving = false;
        }
    }

    startAutoSave() {
        setInterval(() => {
            if (this.data.size > 0) {
                this.save();
            }
        }, 60000);
    }

    set(key, value) {
        this.data.set(key, value);
        this.cache.delete(key);
        return this;
    }

    get(key, defaultValue = null) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const value = this.data.get(key) || defaultValue;
        this.cache.set(key, value);
        return value;
    }

    has(key) {
        return this.data.has(key);
    }

    delete(key) {
        this.data.delete(key);
        this.cache.delete(key);
        return true;
    }

    clear() {
        this.data.clear();
        this.cache.clear();
    }

    size() {
        return this.data.size;
    }

    keys() {
        return Array.from(this.data.keys());
    }

    values() {
        return Array.from(this.data.values());
    }

    entries() {
        return Array.from(this.data.entries());
    }

    find(predicate) {
        for (const [key, value] of this.data) {
            if (predicate(value, key)) {
                return value;
            }
        }

        return null;
    }

    filter(predicate) {
        const results = [];

        for (const [key, value] of this.data) {
            if (predicate(value, key)) {
                results.push(value);
            }
        }

        return results;
    }

    increment(key, amount = 1) {
        const current = this.get(key, 0);
        const newValue = current + amount;
        this.set(key, newValue);
        return newValue;
    }

    decrement(key, amount = 1) {
        const current = this.get(key, 0);
        const newValue = current - amount;
        this.set(key, newValue);
        return newValue;
    }

    push(key, value) {
        const array = this.get(key, []);
        array.push(value);
        this.set(key, array);
        return array;
    }

    remove(key, value) {
        const array = this.get(key, []);
        const index = array.indexOf(value);

        if (index > -1) {
            array.splice(index, 1);
            this.set(key, array);
            return true;
        }

        return false;
    }

    setProperty(key, property, value) {
        const obj = this.get(key, {});
        obj[property] = value;
        this.set(key, obj);
        return obj;
    }

    getProperty(key, property, defaultValue = null) {
        const obj = this.get(key, {});
        return obj[property] || defaultValue;
    }

    setMany(entries) {
        for (const [key, value] of entries) {
            this.data.set(key, value);
            this.cache.delete(key);
        }

        return this;
    }

    getMany(keys) {
        return keys.map(key => this.get(key));
    }

    deleteMany(keys) {
        for (const key of keys) {
            this.data.delete(key);
            this.cache.delete(key);
        }

        return true;
    }

    count(predicate) {
        let count = 0;

        for (const value of this.data.values()) {
            if (predicate(value)) {
                count++;
            }
        }

        return count;
    }

    sum(key) {
        let total = 0;

        for (const value of this.data.values()) {
            total += value[key] || 0;
        }

        return total;
    }

    average(key) {
        let total = 0;
        let count = 0;

        for (const value of this.data.values()) {
            if (value[key] !== undefined) {
                total += value[key];
                count++;
            }
        }

        return count > 0 ? total / count : 0;
    }

    getOlderThan(timestamp) {
        const results = [];

        for (const [key, value] of this.data) {
            if (value.timestamp && value.timestamp < timestamp) {
                results.push({ key, value });
            }
        }

        return results;
    }

    getNewerThan(timestamp) {
        const results = [];

        for (const [key, value] of this.data) {
            if (value.timestamp && value.timestamp > timestamp) {
                results.push({ key, value });
            }
        }

        return results;
    }

    cleanOldEntries(maxAge) {
        const now = Date.now();
        const toDelete = [];

        for (const [key, value] of this.data) {
            if (value.timestamp && now - value.timestamp > maxAge) {
                toDelete.push(key);
            }
        }

        for (const key of toDelete) {
            this.delete(key);
        }

        return toDelete.length;
    }

    getCached(key) {
        return this.cache.get(key) || null;
    }

    clearCache() {
        this.cache.clear();
    }

    export() {
        return Object.fromEntries(this.data);
    }

    import(data) {
        this.data = new Map(Object.entries(data));
        this.cache.clear();
        return this;
    }

    getStats() {
        return {
            size: this.data.size,
            cacheSize: this.cache.size,
            keys: Array.from(this.data.keys()),
            hasPendingSaves: this.saveQueue.length > 0,
            isSaving: this.isSaving
        };
    }
}

// ============================================================
// 📦 إنشاء المتاجر
// ============================================================
export const dataStore = new DataStore('global');
export const userStore = new DataStore('users');
export const groupStore = new DataStore('groups');
export const catsStore = new DataStore('cats');

// ============================================================
// 🛠️ المساعد البرمجي الذكي (مع نظام الماستر)
// ============================================================
export const configHelper = {
    // 👑 التحقق من الماستر
    isMaster(jid) {
        if (!jid) return false;

        const cleanJid = jid.split('@')[0].split(':')[0];

        if (Array.isArray(config.MASTER)) {
            return config.MASTER.some(master => {
                const masterNumber = master.split('@')[0].split(':')[0];
                return cleanJid === masterNumber;
            });
        }

        const masterNumber = config.MASTER.split('@')[0].split(':')[0];
        return cleanJid === masterNumber;
    },

    // ✅ التحقق من المطورين (بما فيهم الماستر)
    isDeveloper(jid) {
        if (!jid) return false;

        const cleanJid = jid.split('@')[0].split(':')[0];

        if (Array.isArray(config.MASTER)) {
            const isMaster = config.MASTER.some(master => {
                const masterNumber = master.split('@')[0].split(':')[0];
                return cleanJid === masterNumber;
            });

            if (isMaster) return true;
        } else {
            const masterNumber = config.MASTER.split('@')[0].split(':')[0];

            if (cleanJid === masterNumber) {
                return true;
            }
        }

        return config.DEVELOPERS.some(dev => {
            const devNumber = dev.split('@')[0].split(':')[0];
            return cleanJid === devNumber;
        });
    },

    // 📋 الحصول على جميع المطورين
    getAllDevelopers() {
        const masters = Array.isArray(config.MASTER)
            ? config.MASTER
            : [config.MASTER];

        const all = [...masters, ...config.DEVELOPERS];

        return [...new Set(all)];
    },

    // 🔥 إضافة مطور جديد
    addDeveloper(jid) {
        if (!jid) return false;

        const cleanJid = jid.includes('@')
            ? jid
            : `${jid}@s.whatsapp.net`;

        if (this.isMaster(cleanJid)) return false;
        if (this.isDeveloper(cleanJid)) return false;

        config.DEVELOPERS.push(cleanJid);

        return true;
    },

    // 🗑️ حذف مطور
    removeDeveloper(jid, requester) {
        if (!jid || !requester) return false;

        const cleanJid = jid.includes('@')
            ? jid
            : `${jid}@s.whatsapp.net`;

        if (this.isMaster(cleanJid)) return false;

        if (!this.isMaster(requester)) {
            const requesterJid = requester.includes('@')
                ? requester
                : `${requester}@s.whatsapp.net`;

            if (cleanJid !== requesterJid) {
                return false;
            }
        }

        const index = config.DEVELOPERS.indexOf(cleanJid);

        if (index === -1) return false;

        config.DEVELOPERS.splice(index, 1);

        return true;
    },

    // 🔍 البحث عن مطور بالرقم
    findDeveloperByNumber(number) {
        const clean = number.replace(/\D/g, '');
        const all = this.getAllDevelopers();

        return all.find(dev => {
            const devNumber = dev.replace(/\D/g, '');
            return devNumber === clean;
        }) || null;
    },

    // 📊 إحصائيات المطورين
    getDeveloperStats() {
        const masters = Array.isArray(config.MASTER)
            ? config.MASTER
            : [config.MASTER];

        return {
            master: masters,
            developers: config.DEVELOPERS,
            total: this.getAllDevelopers().length,
            canAddMore: config.DEVELOPERS.length < 100
        };
    },

    // ==================== أوضاع البوت ====================

    // 🔒 وضع المطورين فقط
    isPrivateMode() {
        return config.MODE === 'private';
    },

    // 👑 وضع المطورين + أدمنز الجروبات
    isAdminsMode() {
        return config.MODE === 'admins';
    },

    // 🌍 الوضع العام
    isPublicMode() {
        return config.MODE === 'public';
    },

    // 📌 الحصول على الوضع الحالي
    getMode() {
        return config.MODE;
    },

    // 📌 تغيير الوضع في الذاكرة
    setMode(mode) {
        const allowedModes = ['private', 'public', 'admins'];

        if (!allowedModes.includes(mode)) {
            return false;
        }

        config.MODE = mode;
        return true;
    },

    getPrefix() {
        return config.PREFIX;
    },

    isBlocked(jid) {
        if (!jid) return false;

        const rawNumber = jid.split('@')[0];

        return config.SECURITY?.BLOCKED_USERS?.some(blocked => {
            return blocked === jid || blocked === rawNumber;
        }) || false;
    },

    getDevGroup() {
        return config.DEVELOPER_VERIFICATION?.DEVELOPER_GROUP || null;
    },

    isDevGroup(jid) {
        return jid === config.DEVELOPER_VERIFICATION?.DEVELOPER_GROUP;
    },

    getBotVersion() {
        return config.VERSION;
    },

    getBotName() {
        return config.BOT_NAME;
    },

    isAntiSpamEnabled() {
        return config.PROTECTION?.ANTI_SPAM || false;
    },

    isAntiLinkEnabled() {
        return config.PROTECTION?.ANTI_LINK || false;
    },

    getSpamThreshold() {
        return config.PROTECTION?.SPAM_THRESHOLD || 5;
    },

    getSpamWindow() {
        return config.PROTECTION?.SPAM_WINDOW || 10000;
    },

    getAllowedLinks() {
        return config.PROTECTION?.ALLOWED_LINKS || [];
    }
};

// ============================================================
// 🚀 تصدير الكل
// ============================================================
export default config;