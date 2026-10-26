// plugins/انستا.js
// ⚔️ SOLO INSTAGRAM DOWNLOADER V3.0 ⚔️

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    name: "انستا",
    aliases: ["instagram", "ig", "انستجرام"],
    description: "تحميل فيديوهات وصور وصوت من الانستجرام (نسخة مطورة)",
    category: "تحميل",

    async run({ sock, message, reply, react, args }) {
        const chatId = message.key.remoteJid;
        const userJid = message.key.participant || message.key.remoteJid;

        try {
            // ✅ استخراج الروابط
            let url = args.join(" ");
            let extractAudio = false;

            // ✅ التحقق من خيار الصوت
            if (args.includes('صوت') || args.includes('audio')) {
                extractAudio = true;
                // ✅ إزالة كلمة "صوت" من الأرجومنتس
                url = args.filter(arg => arg !== 'صوت' && arg !== 'audio').join(' ');
            }

            // جلب الرابط من الرد
            if (!url && message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage;
                url = quoted.conversation || quoted.extendedTextMessage?.text || "";
            }

            if (!url) {
                await react("📸");
                return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 📸 تـحـمـيـل مـن الانـسـتـجـرام*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📌 ارسـل رابـط الـفـيـديـو أو الـصـورة*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.انستا https://instagram.com/reel/xxx*
📌 رد على الرابط واكتب *.انستا*
📌 *.انستا رابط1 رابط2* (تحميل متعدد)

*⚙️ خـيـارات إضـافـيـة:*
📌 *.انستا صوت رابط* (تحميل الصوت فقط)

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
            }

            // ✅ استخراج الروابط
            const urlMatches = url.match(/(https?:\/\/[^\s]+)/g);
            if (!urlMatches || urlMatches.length === 0) {
                return reply("*❌ لـم يـتـم الـعـثـور عـلـى رابـط صـحـيـح!*");
            }

            // ✅ التحقق من صحة الروابط (انستا)
            const instagramPatterns = [
                /https?:\/\/(?:www\.)?instagram\.com\//,
                /https?:\/\/(?:www\.)?instagr\.am\//,
                /https?:\/\/(?:www\.)?instagram\.com\/p\//,
                /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
                /https?:\/\/(?:www\.)?instagram\.com\/tv\//
            ];

            let links = [];
            for (const link of urlMatches) {
                const isValid = instagramPatterns.some(pattern => pattern.test(link));
                if (isValid) {
                    links.push(link);
                }
            }

            if (links.length === 0) {
                await react("⚠️");
                return reply(`*❌ رابـط انـسـتـجـرام غـيـر صـالـح*\n📌 تأكد من الرابط وحاول مرة أخرى`);
            }

            const typeText = extractAudio ? 'الـصـوت' : 'الـمـيـديـا';
            await react(extractAudio ? "🎵" : "📥");
            await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري تـحـمـيـل ${links.length} ${typeText} مـن انـسـتـجـرام...*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

            let successCount = 0;
            let failCount = 0;

            // ✅ مجلد temp
            const tempPath = path.join(process.cwd(), 'temp');
            fs.ensureDirSync(tempPath);

            for (let index = 0; index < links.length; index++) {
                const instaUrl = links[index];
                const videoFile = path.join(tempPath, `insta_${Date.now()}_${index}.mp4`);
                const compressedFile = path.join(tempPath, `insta_compressed_${Date.now()}_${index}.mp4`);
                const audioFile = path.join(tempPath, `insta_audio_${Date.now()}_${index}.mp3`);

                try {
                    await sock.sendMessage(chatId, { 
                        react: { text: "⏳", key: message.key } 
                    });

                    // ✅ جلب البيانات من API
                    const apiUrl = `https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(instaUrl)}`;
                    const response = await axios.get(apiUrl, {
                        timeout: 60000,
                        headers: { "User-Agent": "Mozilla/5.0" }
                    });

                    let medias = [];

                    if (Array.isArray(response.data?.result)) {
                        medias = response.data.result;
                    } else {
                        function findMedia(obj) {
                            if (!obj) return;
                            if (Array.isArray(obj)) {
                                for (const item of obj) findMedia(item);
                            } else if (typeof obj === "object") {
                                if (obj.url && (obj.url.includes(".mp4") || obj.type === "video")) {
                                    medias.push({ type: "video", url: obj.url });
                                } else if (obj.url && (obj.url.includes(".jpg") || obj.url.includes(".jpeg") || obj.url.includes(".png"))) {
                                    medias.push({ type: "image", url: obj.url });
                                }
                                if (obj.displayUrl) medias.push({ type: "image", url: obj.displayUrl });
                                if (obj.videoUrl) medias.push({ type: "video", url: obj.videoUrl });
                                if (obj.downloadUrl) medias.push({ type: "video", url: obj.downloadUrl });
                                // ✅ البحث عن الصوت
                                if (obj.audio_url || obj.audioUrl || obj.music_url || obj.musicUrl) {
                                    const audioUrl = obj.audio_url || obj.audioUrl || obj.music_url || obj.musicUrl;
                                    if (audioUrl) {
                                        medias.push({ type: "audio", url: audioUrl });
                                    }
                                }
                                for (const key in obj) findMedia(obj[key]);
                            }
                        }
                        findMedia(response.data);
                    }

                    medias = medias.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

                    if (!medias.length) {
                        throw new Error("لم يتم العثور على ميديا صالحة للرابط.");
                    }

                    // ✅ لو المستخدم طلب صوت بس
                    if (extractAudio) {
                        // ✅ البحث عن الصوت في الميديا
                        let audioFound = false;
                        for (const media of medias) {
                            if (media.type === "audio" || media.url.includes('.mp3') || media.url.includes('.m4a') || media.url.includes('.aac')) {
                                try {
                                    const audioResponse = await axios.get(media.url, {
                                        responseType: 'arraybuffer',
                                        timeout: 60000
                                    });
                                    const audioBuffer = Buffer.from(audioResponse.data);
                                    
                                    const audioCaption = `*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*
*┋ تـم تـحـمـيـل الـصـوت مـن انـسـتـجـرام*
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                                    await sock.sendMessage(chatId, {
                                        audio: audioBuffer,
                                        mimetype: 'audio/mpeg',
                                        fileName: `instagram_audio_${Date.now()}.mp3`,
                                        caption: audioCaption
                                    }, { quoted: message });
                                    
                                    audioFound = true;
                                    successCount++;
                                    break;
                                } catch (audioError) {
                                    console.error('❌ فشل تحميل الصوت:', audioError.message);
                                }
                            }
                        }
                        
                        if (!audioFound) {
                            // ✅ لو مفيش صوت مباشر، نحاول استخراج الصوت من الفيديو
                            for (const media of medias) {
                                if (media.type === "video" || media.url.includes(".mp4")) {
                                    try {
                                        const videoResponse = await axios.get(media.url, {
                                            responseType: 'arraybuffer',
                                            timeout: 60000
                                        });
                                        await fs.writeFile(videoFile, Buffer.from(videoResponse.data));
                                        
                                        // ✅ استخراج الصوت من الفيديو
                                        await execPromise(`ffmpeg -i "${videoFile}" -q:a 0 -map a "${audioFile}" -y`);
                                        
                                        if (fs.existsSync(audioFile)) {
                                            const audioBuffer = await fs.readFile(audioFile);
                                            const audioCaption = `*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*
*┋ تـم اسـتـخـراج الـصـوت مـن الـفـيـديـو*
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                                            await sock.sendMessage(chatId, {
                                                audio: audioBuffer,
                                                mimetype: 'audio/mpeg',
                                                fileName: `instagram_audio_${Date.now()}.mp3`,
                                                caption: audioCaption
                                            }, { quoted: message });
                                            
                                            audioFound = true;
                                            successCount++;
                                            await fs.unlink(audioFile).catch(() => {});
                                        }
                                        await fs.unlink(videoFile).catch(() => {});
                                        break;
                                    } catch (extractError) {
                                        console.error('❌ فشل استخراج الصوت:', extractError.message);
                                    }
                                }
                            }
                        }
                        
                        if (!audioFound) {
                            failCount++;
                            await sock.sendMessage(chatId, {
                                text: `*❌ لـم يـتـم الـعـثـور عـلـى صـوت فـي هـذا الـرابـط*`
                            }, { quoted: message });
                        }
                        
                        await sock.sendMessage(chatId, { 
                            react: { text: audioFound ? "✅" : "❌", key: message.key } 
                        });
                        continue;
                    }

                    // ✅ معالجة كل ميديا (فيديو/صورة)
                    for (let mediaIndex = 0; mediaIndex < medias.length; mediaIndex++) {
                        const media = medias[mediaIndex];
                        const isVideo = media.type === "video" || media.url.includes(".mp4");
                        const isAudio = media.type === "audio" || media.url.includes('.mp3') || media.url.includes('.m4a') || media.url.includes('.aac');

                        // ✅ تخطي الصوت لو مش طالبينه
                        if (isAudio) continue;

                        try {
                            // ✅ تحميل الميديا
                            const mediaResponse = await axios.get(media.url, {
                                responseType: 'arraybuffer',
                                headers: { 'User-Agent': 'Mozilla/5.0' },
                                timeout: 60000
                            });
                            let mediaBuffer = Buffer.from(mediaResponse.data);

                            let finalBuffer = mediaBuffer;
                            let wasCompressed = false;

                            // ✅ ضغط الفيديو لو حجمه كبير
                            if (isVideo) {
                                await fs.writeFile(videoFile, mediaBuffer);
                                const stats = await fs.stat(videoFile);
                                let fileSizeMB = stats.size / (1024 * 1024);

                                if (fileSizeMB > 14) {
                                    await sock.sendMessage(chatId, { 
                                        react: { text: "🗜️", key: message.key } 
                                    });
                                    
                                    let crfValue = 26;
                                    let compressedSize = fileSizeMB;
                                    const targetSize = 13;
                                    
                                    while (compressedSize > targetSize && crfValue <= 35) {
                                        await execPromise(`ffmpeg -i "${videoFile}" -vf "scale=1080:-2" -c:v libx264 -crf ${crfValue} -preset fast -c:a aac -b:a 128k "${compressedFile}" -y`);
                                        const compressedStats = await fs.stat(compressedFile);
                                        compressedSize = compressedStats.size / (1024 * 1024);
                                        if (compressedSize > targetSize) {
                                            crfValue += 2;
                                        }
                                    }
                                    
                                    if (compressedSize > targetSize && crfValue <= 40) {
                                        await execPromise(`ffmpeg -i "${videoFile}" -vf "scale=720:-2" -c:v libx264 -crf ${crfValue} -preset fast -c:a aac -b:a 96k "${compressedFile}" -y`);
                                    }
                                    
                                    finalBuffer = await fs.readFile(compressedFile);
                                    wasCompressed = true;
                                    await fs.unlink(compressedFile).catch(() => {});
                                }
                                await fs.unlink(videoFile).catch(() => {});
                            }

                            // ✅ كابتشن SOLO
                            const typeText2 = isVideo ? 'فـيـديـو' : 'صـورة';
                            let soloCaption = `*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*
*┋ تـم الـتـحـمـيـل مـن انـسـتـجـرام*
*┋ (${mediaIndex + 1}/${medias.length}) ${typeText2}*
${wasCompressed ? '*┋ تـم ضـغـط الـفـيـديـو* ✅' : ''}
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                            // ✅ إرسال الميديا
                            if (isVideo) {
                                await sock.sendMessage(chatId, {
                                    video: finalBuffer,
                                    mimetype: "video/mp4",
                                    caption: soloCaption
                                }, { quoted: message });
                            } else {
                                await sock.sendMessage(chatId, {
                                    image: finalBuffer,
                                    caption: soloCaption
                                }, { quoted: message });
                            }

                            if (mediaIndex < medias.length - 1) {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }

                        } catch (mediaError) {
                            console.error(`❌ فشل تحميل الميديا ${mediaIndex + 1}:`, mediaError.message);
                        }
                    }

                    successCount++;
                    await sock.sendMessage(chatId, { 
                        react: { text: "✅", key: message.key } 
                    });

                } catch (error) {
                    console.error(`❌ فشل تحميل الرابط ${index + 1}:`, error.message);
                    failCount++;
                } finally {
                    await fs.unlink(videoFile).catch(() => {});
                    await fs.unlink(compressedFile).catch(() => {});
                    await fs.unlink(audioFile).catch(() => {});
                }

                if (index < links.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            // ✅ تقرير نهائي
            if (links.length > 1) {
                const reportMsg = `*⎔┄┄─ ⊱╎⌯ 📊 ⌯╎⊰─┄┄⎔*
*┋ تـقـريـر الـتـحـمـيـل*

*┋ ✅ نـاجـح : ${successCount}*
*┋ ❌ فـاشـل : ${failCount}*
*┋ 📦 الـمـجـمـوع : ${links.length}*

*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`;
                await reply(reportMsg);
            }

        } catch (error) {
            console.error("❌ Instagram Error:", error);
            await react("❌");
            await reply(`*❌ فـشـل الـتـحـمـيـل*\n\n📌 السـبب:\n${error?.message || 'خطأ غير معروف'}`);
        }
    }
};