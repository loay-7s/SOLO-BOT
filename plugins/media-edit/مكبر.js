// plugins/مكبر.js
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const execPromise = promisify(exec);
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

export default {
    name: "مكبر",
    aliases: ["amplify", "تكبير"],
    description: "تكبير مستوى الصوت في الفيديو أو الصوت (من 1 إلى 10)",
    category: "تحويل",
    
    async run({ sock, message, reply, react, args }) {
        let mediaMessage = null;
        let isVideo = false;
        
        // ✅ جلب رقم التكبير
        let level = parseInt(args[0]);
        
        // ✅ التحقق من صحة الرقم
        if (isNaN(level) || level < 1 || level > 10) {
            await react("🔊");
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🔊 مـكـبـر الـصـوت*

*───━━━⊱  📋  ⊰━━━───*

*┋ استخدم الأمر مع رقم من 1 إلى 10*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.مكبر 2* - ضعف الصوت
📌 *.مكبر 5* - 5 أضعاف
📌 *.مكبر 10* - 10 أضعاف

*⚠️ المستويات من 6 لـ 10 قد تسبب تشويه*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
        
        // ✅ تحويل الرقم إلى مستوى صوت
        let volumeLevel = level === 1 ? 1.5 : level;
        
        // ✅ إيموجي حسب القوة
        const emojis = { 1: "🔈", 2: "🔉", 3: "🔊", 4: "📢", 5: "📣", 6: "🔔", 7: "⏰", 8: "💥", 9: "🤯", 10: "💀" };
        
        // ✅ رسائل مستوى الصوت
        const levelMessages = {
            1: "خـفـيـف", 2: "مـتـوسـط", 3: "واضـح", 4: "عـالـي", 5: "قـوي",
            6: "قـوي جـدا", 7: "مـدهـش", 8: "صـاخـب", 9: "جـنـونـي", 10: "مـدمـر"
        };
        
        // ✅ التحقق من وجود رد (صوت أو فيديو)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quoted?.audioMessage) {
            mediaMessage = quoted.audioMessage;
            isVideo = false;
        } else if (quoted?.videoMessage) {
            mediaMessage = quoted.videoMessage;
            isVideo = true;
        } else if (quoted?.stickerMessage && quoted.stickerMessage.isAnimated) {
            return reply(`*⚠️ هـذا مـلـصـق مـتـحـرك، اسـتـخـدم .لفيديو أولاً*`);
        }
        
        if (!mediaMessage) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*❌ يـرجـى الـرد عـلـى فـويـس أو فـيـديـو*

*───━━━⊱  📋  ⊰━━━───*

📌 *.مكبر 3* (رداً على فويس أو فيديو)

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
        
        await react(emojis[level] || "🔊");
        
        const tempPath = path.join(process.cwd(), 'temp');
        fs.ensureDirSync(tempPath);
        const ext = isVideo ? 'mp4' : 'mp3';
        const inputFile = path.join(tempPath, `in_${Date.now()}.${ext}`);
        const outputFile = path.join(tempPath, `out_${Date.now()}.${ext}`);
        
        try {
            // ✅ تنزيل الميديا
            const stream = await downloadContentFromMessage(mediaMessage, isVideo ? 'video' : 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await fs.writeFile(inputFile, buffer);
            
            // ✅ تكبير الصوت
            if (isVideo) {
                // ✅ للفيديو: تكبير الصوت مع الحفاظ على الفيديو
                await execPromise(`ffmpeg -i "${inputFile}" -c:v copy -af "volume=${volumeLevel}" "${outputFile}" -y`);
            } else {
                // ✅ للصوت: تكبير الصوت فقط
                await execPromise(`ffmpeg -i "${inputFile}" -af "volume=${volumeLevel}" "${outputFile}" -y`);
            }
            
            // ✅ التحقق من وجود الملف الناتج
            try {
                await fs.access(outputFile);
            } catch {
                return reply(`*❌ فـشـل مـعـالـجـة الـمـيـديـا*`);
            }
            
            // ✅ إرسال النتيجة
            const levelText = levelMessages[level] || `x${level}`;
            
            if (isVideo) {
                await sock.sendMessage(message.key.remoteJid, {
                    video: { url: outputFile },
                    mimetype: 'video/mp4',
                    caption: `*⎔┄┄─ ⊱╎⌯ 🔊 ⌯╎⊰─┄┄⎔*\n*┋ تـم تـكـبـيـر الـصـوت (${levelText})*\n*┋ المستوى: ${level} / 10*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                }, { quoted: message });
            } else {
                await sock.sendMessage(message.key.remoteJid, {
                    audio: { url: outputFile },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: SOLO_CHANNEL_ID,
                            serverMessageId: 1,
                            newsletterName: '𝑺𝑶𝑳𝑶'
                        }
                    }
                }, { quoted: message });
            }
            
            // ✅ تنظيف الملفات
            await fs.unlink(inputFile).catch(() => {});
            await fs.unlink(outputFile).catch(() => {});
            
            await react("✅");
            
        } catch (error) {
            console.error("❌ Amplify Error:", error);
            await react("❌");
            
            let errorMsg = `*❌ فـشـل مـعـالـجـة الـمـيـديـا*`;
            
            if (error.message?.includes('ffmpeg')) {
                errorMsg = `*❌ ffmpeg غـيـر مـثـبـت*\n📌 يـرجـى تـثـبـيـت ffmpeg`;
            }
            
            await reply(`${errorMsg}\n\n📌 حـاول مـرة اخـرى`);
        }
    }
};