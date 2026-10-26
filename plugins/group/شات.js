// plugins/شات.js
export default {
    name: "شات",
    aliases: ["chat", "جروب"],
    description: "يفتح أو يقفل الدردشة في المجموعة",
    category: "admin",
    group: true,
    botAdmin: true,

    async run({ sock, message, reply, args, isDeveloper }) {
        const subCommand = args[0]?.toLowerCase();

        // --- التحقق من الصلاحيات (مشرف أو مطور) ---
        const metadata = await sock.groupMetadata(message.key.remoteJid);
        const sender = metadata.participants.find(p => p.id === message.key.participant);
        const isAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';

        if (!isAdmin && !isDeveloper) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*⛔ عـذراً..*

*───━━━⊱  🔒  ⊰━━━───*

*📌 هـذا الأمـر لـلـمـشـرفـيـن فـقـط*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // --- منطق الأوامر الفرعية ---
        switch (subCommand) {
            case "قفل":
            case "close": {
                try {
                    await sock.groupSettingUpdate(message.key.remoteJid, 'announcement');
                    
                    return reply(`*🔒*`);
                    
                } catch (error) {
                    console.error("Error locking chat:", error);
                    return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ فـشـل قـفـل الـدردشـة*

*───━━━⊱  ⚠️  ⊰━━━───*

*📌 ${error.message}*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
                }
            }

            case "فتح":
            case "open": {
                try {
                    await sock.groupSettingUpdate(message.key.remoteJid, 'not_announcement');
                    
                    return reply(`*🔓*`);
                    
                } catch (error) {
                    console.error("Error unlocking chat:", error);
                    return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ فـشـل فـتـح الـدردشـة*

*───━━━⊱  ⚠️  ⊰━━━───*

*📌 ${error.message}*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
                }
            }

            default: {
                return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ اسـتـخـدام غـيـر صـحـيـح*

*───━━━⊱  📋  ⊰━━━───*

*📌 الأوامـر الـمـتـوفـرة:*

*┋ ⬡ .شات قفل* - *لـقـفـل الـدردشـة*
*┋ ⬡ .شات فتح* - *لـفـتـح الـدردشـة*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }
        }
    }
};