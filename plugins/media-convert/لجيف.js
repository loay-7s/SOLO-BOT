// plugins/لجيف.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOLO_CHANNEL_ID = "0029VbCEhNX7DAWrudaFBs41";

export default {
    name: "لجيف",
    aliases: ["gif", "تحويل_جيف", "gifme"],
    description: "تحويل فيديو إلى GIF متحرك بجودة عالية",
    category: "تحويل",
    group: true,

    async run({ sock, message, reply, react, userJid }) {
        const chatId = message.key.remoteJid;

        // ✅ التحقق من وجود فيديو في الرد
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let videoMsg = quoted?.videoMessage || message.message?.videoMessage;

        if (!videoMsg) {
            return reply(`*⚠️ قـم بـالـرد عـلـى فـيـديـو لـتـحـويـلـه إلـى GIF.*`);
        }

        await react("⏳");

        try {
            // ✅ تحميل الفيديو
            const stream = await downloadContentFromMessage(videoMsg, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // ✅ حفظ الفيديو مؤقتاً
            const tempDir = path.join(process.cwd(), 'temp');
            fs.ensureDirSync(tempDir);
            
            const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
            const outputPath = path.join(tempDir, `gif_${Date.now()}.mp4`);
            
            await fs.writeFile(videoPath, buffer);

            await react("🔄");

            const duration = videoMsg.seconds || 5;
            
            // ✅ إعدادات حسب المدة - جودة عالية
            let fps = 45;
            let scale = 400;
            
            if (duration <= 3) {
                fps = 45;
                scale = 500;
            } else if (duration <= 6) {
                fps = 45;
                scale = 450;
            } else if (duration <= 10) {
                fps = 45;
                scale = 400;
            } else {
                fps = 45;
                scale = 360;
            }

            // ✅ تحويل بجودة عالية (crf 18 = جودة ممتازة)
            await execPromise(
                `ffmpeg -i "${videoPath}" -vf "fps=${fps},scale=${scale}:-1:flags=lanczos" -an -c:v libx264 -crf 18 -preset medium -movflags +faststart "${outputPath}" -y`
            );

            // ✅ التحقق من وجود الملف
            if (!fs.existsSync(outputPath)) {
                throw new Error("فشل تحويل الفيديو إلى GIF");
            }

            // ✅ حساب الحجم
            let stats = await fs.stat(outputPath);
            let fileSizeMB = stats.size / (1024 * 1024);

            // ✅ لو الحجم أكبر من 6 ميجا، نضغط تدريجياً مع الحفاظ على الجودة
            if (fileSizeMB > 6) {
                let compressedPath = path.join(tempDir, `gif_compressed_${Date.now()}.mp4`);
                let currentScale = scale;
                let currentFps = fps;
                let currentFile = outputPath;
                let currentSize = fileSizeMB;
                let attempt = 0;
                const maxAttempts = 5;

                while (currentSize > 6 && attempt < maxAttempts) {
                    attempt++;
                    
                    // ✅ تقليل بسيط جداً
                    let reductionFactor;
                    if (attempt === 1) reductionFactor = 0.92;
                    else if (attempt === 2) reductionFactor = 0.88;
                    else if (attempt === 3) reductionFactor = 0.82;
                    else if (attempt === 4) reductionFactor = 0.75;
                    else reductionFactor = 0.68;

                    let newScale = Math.floor(currentScale * reductionFactor);
                    let newFps = Math.max(10, Math.floor(currentFps * reductionFactor));
                    
                    newScale = Math.max(220, newScale);

                    const tempCompressed = path.join(tempDir, `gif_attempt_${attempt}_${Date.now()}.mp4`);
                    
                    // ✅ crf خفيف
                    let crfValue = 20 + (attempt * 1);
                    if (crfValue > 26) crfValue = 26;

                    await execPromise(
                        `ffmpeg -i "${currentFile}" -vf "fps=${newFps},scale=${newScale}:-1:flags=lanczos" -c:v libx264 -crf ${crfValue} -preset medium -movflags +faststart "${tempCompressed}" -y`
                    );

                    const tempStats = await fs.stat(tempCompressed);
                    const tempSize = tempStats.size / (1024 * 1024);

                    if (tempSize < currentSize && tempSize <= 8) {
                        if (currentFile !== outputPath) {
                            await fs.unlink(currentFile).catch(() => {});
                        }
                        await fs.rename(tempCompressed, compressedPath);
                        currentFile = compressedPath;
                        currentSize = tempSize;
                        currentScale = newScale;
                        currentFps = newFps;
                    } else {
                        await fs.unlink(tempCompressed).catch(() => {});
                        
                        // ✅ لو ضاقت بيه، نستخدم آخر محاولة بضغط قوي
                        if (attempt === maxAttempts - 1) {
                            const finalCompressed = path.join(tempDir, `gif_final_${Date.now()}.mp4`);
                            const finalScale = Math.floor(currentScale * 0.6);
                            const finalFps = Math.max(8, Math.floor(currentFps * 0.6));
                            
                            await execPromise(
                                `ffmpeg -i "${currentFile}" -vf "fps=${finalFps},scale=${finalScale}:-1:flags=lanczos" -c:v libx264 -crf 28 -preset medium -movflags +faststart "${finalCompressed}" -y`
                            );
                            
                            const finalStats = await fs.stat(finalCompressed);
                            const finalSize = finalStats.size / (1024 * 1024);
                            
                            if (finalSize < currentSize) {
                                if (currentFile !== outputPath) {
                                    await fs.unlink(currentFile).catch(() => {});
                                }
                                await fs.rename(finalCompressed, compressedPath);
                                currentFile = compressedPath;
                                currentSize = finalSize;
                            } else {
                                await fs.unlink(finalCompressed).catch(() => {});
                            }
                        }
                        break;
                    }
                }

                // ✅ لو الحجم لسه كبير
                if (currentSize > 6) {
                    // ✅ محاولة أخيرة بضغط أعلى
                    const lastChance = path.join(tempDir, `gif_last_${Date.now()}.mp4`);
                    const lastScale = Math.floor(currentScale * 0.5);
                    const lastFps = Math.max(6, Math.floor(currentFps * 0.5));
                    
                    await execPromise(
                        `ffmpeg -i "${currentFile}" -vf "fps=${lastFps},scale=${lastScale}:-1:flags=lanczos" -c:v libx264 -crf 30 -preset fast -movflags +faststart "${lastChance}" -y`
                    );
                    
                    const lastStats = await fs.stat(lastChance);
                    const lastSize = lastStats.size / (1024 * 1024);
                    
                    if (lastSize < currentSize && lastSize <= 6.5) {
                        if (currentFile !== outputPath) {
                            await fs.unlink(currentFile).catch(() => {});
                        }
                        await fs.rename(lastChance, compressedPath);
                        currentFile = compressedPath;
                        currentSize = lastSize;
                    } else {
                        await fs.unlink(lastChance).catch(() => {});
                        await fs.unlink(currentFile).catch(() => {});
                        await fs.unlink(outputPath).catch(() => {});
                        return reply(`*❌ حـجـم الـ GIF كـبـيـر جـداً (${currentSize.toFixed(1)}MB)*\n📌 الـحـد الأقـصـى 6MB`);
                    }
                }

                // ✅ استبدال الملف النهائي
                if (currentFile !== outputPath) {
                    await fs.unlink(outputPath).catch(() => {});
                    await fs.rename(currentFile, outputPath);
                }
                fileSizeMB = currentSize;
            }

            const gifBuffer = await fs.readFile(outputPath);

            // ✅ كابتشن SOLO
            const caption = `*⎔┄┄─ ⊱╎⌯ 🎬 ⌯╎⊰─┄┄⎔*\n*┋ تـم تـحـويـل الـفـيـديـو لـ GIF*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            // ✅ إرسال الـ GIF
            await sock.sendMessage(chatId, {
                video: gifBuffer,
                mimetype: 'video/mp4',
                gifPlayback: true,
                caption: caption,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: false,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: `${SOLO_CHANNEL_ID}@newsletter`,
                        serverMessageId: 1,
                        newsletterName: '𝑺𝑶𝑳𝑶'
                    }
                }
            }, { quoted: message });

            // ✅ تنظيف الملفات
            await fs.unlink(videoPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            await react("✅");

        } catch (error) {
            console.error("❌ GIF Error:", error);
            
            let errorMsg = `*❌ فـشـل تـحـويـل الـفـيـديـو لـ GIF*`;
            
            if (error.message?.includes('ffmpeg')) {
                errorMsg = `*❌ تأكد من تثبيت ffmpeg*`;
            }
            
            await reply(`${errorMsg}\n\n📌 حـاول مـرة اخـرى`);
            await react("❌");
        }
    }
};