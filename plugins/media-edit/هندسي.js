// plugins/هندسي.js
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const execPromise = promisify(exec);
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

export default {
    name: "هندسي",
    aliases: ["خطوط", "cartoon", "كارتون"],
    description: "تحويل الصورة أو الفيديو إلى تأثير خطوط هندسية كرتونية",
    category: "تحويل",
    
    async run({ sock, message, reply, react }) {
        let mediaMessage = null;
        let isVideo = false;
        
        // ✅ التحقق من وجود رد (صورة أو فيديو)
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quoted?.imageMessage) {
            mediaMessage = quoted.imageMessage;
            isVideo = false;
        } else if (quoted?.videoMessage) {
            mediaMessage = quoted.videoMessage;
            isVideo = true;
        } else if (message.message?.imageMessage) {
            mediaMessage = message.message.imageMessage;
            isVideo = false;
        }
        
        if (!mediaMessage) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*✏️ تـأثـيـر هـنـدسـي*

*───━━━⊱  📋  ⊰━━━───*

*┋ رد على صورة أو فيديو بالأمر*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.هندسي* (رداً على صورة)
📌 *.هندسي* (رداً على فيديو)

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
        
        await react("✏️");
        
        const tempPath = path.join(process.cwd(), 'temp');
        fs.ensureDirSync(tempPath);
        const ext = isVideo ? 'mp4' : 'jpg';
        const inputFile = path.join(tempPath, `in_${Date.now()}.${ext}`);
        const outputFile = path.join(tempPath, `out_${Date.now()}.${ext}`);
        
        try {
            // ✅ تنزيل الميديا
            const stream = await downloadContentFromMessage(mediaMessage, isVideo ? 'video' : 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await fs.writeFile(inputFile, buffer);
            
            // ✅ معالجة حسب النوع
            if (isVideo) {
                // ✅ تأثير هندسي على الفيديو (متوافق مع واتساب)
                await execPromise(`ffmpeg -i "${inputFile}" -vf "edgedetect=low=0.1:high=0.3,negate" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k "${outputFile}" -y`);
            } else {
                // ✅ تأثير هندسي على الصورة
                await execPromise(`ffmpeg -i "${inputFile}" -vf "edgedetect=low=0.1:high=0.3,negate" "${outputFile}" -y`);
            }
            
            // ✅ التحقق من وجود الملف الناتج
            try {
                await fs.access(outputFile);
            } catch {
                return reply(`*❌ فـشـل مـعـالـجـة الـمـيـديـا*`);
            }
            
            // ✅ إرسال النتيجة
            const caption = `*⎔┄┄─ ⊱╎⌯ ✏️ ⌯╎⊰─┄┄⎔*\n*┋ تـم تـحـويـل الـ${isVideo ? 'فـيـديـو' : 'صـورة'} لـ خـطـوط هـنـدسـيـة*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;
            
            if (isVideo) {
                await sock.sendMessage(message.key.remoteJid, {
                    video: { url: outputFile },
                    mimetype: 'video/mp4',
                    caption: caption,
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
                    image: { url: outputFile },
                    caption: caption,
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
            console.error("❌ Geometric Error:", error);
            await react("❌");
            
            let errorMsg = `*❌ فـشـل مـعـالـجـة الـمـيـديـا*`;
            
            if (error.message?.includes('ffmpeg')) {
                errorMsg = `*❌ ffmpeg غـيـر مـثـبـت*\n📌 يـرجـى تـثـبـيـت ffmpeg`;
            }
            
            await reply(`${errorMsg}\n\n📌 حـاول مـرة اخـرى`);
        }
    }
};