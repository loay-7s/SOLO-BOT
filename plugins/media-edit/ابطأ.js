// plugins/ابطأ.js
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const execPromise = promisify(exec);
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

export default {
    name: "ابطأ",
    aliases: ["ابطا", "بطيء"],
    description: "تخفيف سرعة الفيديو أو الصوت",
    category: "تحويل",
    
    async run({ sock, message, reply, react }) {
        let mediaMessage = null;
        let isVideo = false;
        
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

*🐢 تـخـفـيـف الـسـرعـة*

*───━━━⊱  📋  ⊰━━━───*

*┋ رد على فيديو أو صوت بالأمر*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *رد على فيديو واكتب .ابطأ*
📌 *رد على فويس واكتب .ابطأ*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }
        
        await react("🐢");
        
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
            
            // ✅ معالجة حسب النوع
            if (isVideo) {
                // ✅ إبطاء الفيديو (0.7x)
                await execPromise(`ffmpeg -i "${inputFile}" -filter_complex "[0:v]setpts=1.43*PTS[v];[0:a]atempo=0.7[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 23 -preset medium "${outputFile}" -y`);
            } else {
                // ✅ إبطاء الصوت (0.7x)
                await execPromise(`ffmpeg -i "${inputFile}" -filter:a "atempo=0.7" "${outputFile}" -y`);
            }
            
            // ✅ التحقق من وجود الملف الناتج
            try {
                await fs.access(outputFile);
            } catch {
                return reply(`*❌ فـشـل مـعـالـجـة الـمـيـديـا*`);
            }
            
            // ✅ إرسال النتيجة
            if (isVideo) {
                await sock.sendMessage(message.key.remoteJid, {
                    video: { url: outputFile },
                    mimetype: 'video/mp4',
                    caption: `*⎔┄┄─ ⊱╎⌯ 🐢 ⌯╎⊰─┄┄⎔*\n*┋ تـم تـخـفـيـف سـرعـة الـفـيـديـو*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,
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
            console.error("❌ Slow Error:", error);
            await react("❌");
            
            let errorMsg = `*❌ فـشـل مـعـالـجـة الـمـيـديـا*`;
            
            if (error.message?.includes('ffmpeg')) {
                errorMsg = `*❌ ffmpeg غـيـر مـثـبـت*\n📌 يـرجـى تـثـبـيـت ffmpeg`;
            }
            
            await reply(`${errorMsg}\n\n📌 حـاول مـرة اخـرى`);
        }
    }
};