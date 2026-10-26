import fs from 'fs-extra';

export default {
    name: "رصيدي",
    aliases: ["فلوسي", "محفظتي", "ثروتي"],
    category: "economy",

    async run({ sock, m, userJid }) {
        const chatId = m.key.remoteJid;

        try {
            // 1. تنظيف المعرف
            const cleanId = userJid.split('@')[0].split(':')[0] + "@s.whatsapp.net";

            // ═══════════════════════════════════════════════
            // 🆕 اقرأ من الذاكرة أولاً (global.bankCache)
            // ═══════════════════════════════════════════════
            let userData;

            if (global.bankCache && global.bankCache.has(cleanId)) {
                // ✅ موجود في الذاكرة → استخدمه
                userData = global.bankCache.get(cleanId);
            } else {
                // 🆕 مش موجود → اقرأ من الملف
                const bankPath = './data/bank.json';
                const bankDB = fs.readJsonSync(bankPath, { throws: false }) || {};
                
                userData = bankDB[cleanId] || bankDB[userJid] || { 
                    money: 0, 
                    rank: "عضو مكافح 🌱", 
                    inventory: [] 
                };

                // 🆕 حطه في الذاكرة للمرة الجاية
                if (!global.bankCache) global.bankCache = new Map();
                global.bankCache.set(cleanId, userData);
            }

            // ═══════════════════════════════════════════════
            // 🟢 فحص "فيروس التشفير"
            // ═══════════════════════════════════════════════
            const now = Date.now();
            if (userData.virus && (now - userData.virus < 24 * 60 * 60 * 1000)) {
                await sock.sendMessage(chatId, { react: { text: "⚠️", key: m.key } });
                return await sock.sendMessage(chatId, { 
                    text: `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 🇱 𝐎 ⌯╎⊰─┄┄⎔*\n\n*⚠️ تـنـبـيـه أمنـي : تـعـذر قـراءة بـيـانـات الـحـسـاب!*\n\n*┛── ℹ️ الـسـبـب: حـسـابـك مـصـاب بـ [ فيروس التشفير 🦠 ]*\n*🔒 جـمـيـع بـيـانـاتـك مـحـجـوبـة حـالـيـاً لـأغـراض الـتـأمـيـن.*\n\n*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*` 
                }, { quoted: m });
            }
            
            // ═══════════════════════════════════════════════
            // 🎒 تجهيز العرض
            // ═══════════════════════════════════════════════
            const inventory = (userData.inventory && userData.inventory.length > 0) 
                ? userData.inventory.join(' ، ') 
                : "خالية 📭";

            const formattedMoney = (userData.money || 0).toLocaleString('en-US');
            const shadowId = userJid.split('@')[0];

            // تفاعل الرياكت
            await sock.sendMessage(chatId, { react: { text: "💳", key: m.key } });

            // ═══════════════════════════════════════════════
            // 💰 الاستمارة
            // ═══════════════════════════════════════════════
            const balanceTemplate = `
*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*

*★┇ كـشـف الـحـسـاب الـمـالـي 💰 ┇★*

*⎔┄┄─── ⊱╎⌯ 🌑 ⌯╎⊰ ───┄┄⎔*

*👤 الـعـمـيـل : ⦓ @${shadowId} ⦔*

*💰 الـرصـيـد : ⦓ ${formattedMoney} 🪙 ⦔*

*📈 الـرتـبـة : ⦓ ${userData.rank} ⦔*

*⎔┄┄─── ⊱╎⌯ 🎒 ⌯╎⊰ ───┄┄⎔*

*❑ مـحـتـويـات الـحقـيـبـة ↯*

*📦 الـمـخـزن : ⦓ ${inventory} ⦔*

*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*`.trim();

            return await sock.sendMessage(chatId, { 
                text: balanceTemplate, 
                mentions: [userJid] 
            }, { quoted: m });

        } catch (e) {
            console.error("Error in Balance Command:", e);
        }
    }
};