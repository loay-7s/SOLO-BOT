// plugins/لفيديو.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execPromise = promisify(exec);
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

export default {
    name: "لفيديو",
    aliases: ["فيديو", "mp4", "tomp4"],
    description: "تحويل الملصق المتحرك أو GIF أو الصوت إلى فيديو",
    developer: false,

    async run({ message, reply, handler, sock }) {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo;
            const quotedMessage = quoted?.quotedMessage;

            if (!quotedMessage) {
                return reply(`*⚠️ يـرجـى الـرد عـلـى مـلـصـق مـتـحـرك أو GIF أو فـويـس.*`);
            }

            const stickerMessage = quotedMessage?.stickerMessage;
            const videoMessage = quotedMessage?.videoMessage;
            const audioMessage = quotedMessage?.audioMessage;
            const documentMessage = quotedMessage?.documentMessage;

            if (!stickerMessage && !videoMessage && !audioMessage && !documentMessage) {
                return reply(`*⚠️ يـرجـى الـرد عـلـى مـلـصـق مـتـحـرك أو GIF أو صـوتـيـة.*`);
            }

            if (stickerMessage && stickerMessage.isAnimated === false) {
                return reply(`*⚠️ هـذا الـمـلـصـق ثـابـت، اسـتـخـدم أمـر (.لصورة).*`);
            }

            await sock.sendMessage(message.key.remoteJid, { react: { text: "📥", key: message.key } });

            const fileName = `solo_convert_${Date.now()}`;

            const inputBuffer = await handler.downloadMedia({
                message: quotedMessage
            });

            if (!inputBuffer || inputBuffer.length === 0) {
                return reply(`*❌ فـشـل تـنـزيـل الـمـلـف!*`);
            }

            const isWebp = await isWebpFile(inputBuffer);
            const isGif = videoMessage?.gifPlayback === true;
            const isAudio = !!audioMessage || (documentMessage && documentMessage.mimetype?.startsWith('audio'));

            let inputExt = '.mp4';
            if (isWebp) inputExt = '.webp';
            else if (isAudio) {
                const mime = audioMessage?.mimetype || documentMessage?.mimetype || 'audio/mpeg';
                if (mime.includes('ogg')) inputExt = '.ogg';
                else if (mime.includes('mp4') || mime.includes('m4a')) inputExt = '.m4a';
                else if (mime.includes('wav')) inputExt = '.wav';
                else if (mime.includes('opus')) inputExt = '.opus';
                else inputExt = '.mp3';
            }

            const inputPath = join(tmpdir(), `${fileName}${inputExt}`);
            const outputPath = join(tmpdir(), `${fileName}_out.mp4`);

            await fs.writeFile(inputPath, inputBuffer);

            // ═══════════════════════════════════════════════════════
            // ملصق متحرك (webp → mp4)
            // ═══════════════════════════════════════════════════════
            if (isWebp) {
                try {
                    await execPromise(`magick "${inputPath}" "${outputPath}"`);
                } catch (magickError) {
                    try {
                        await execPromise(`ffmpeg -i "${inputPath}" -pix_fmt yuv420p "${outputPath}" -y`);
                    } catch (ffmpegError) {
                        console.error('WebP→MP4 error:', ffmpegError.message);
                        return reply(`*❌ فـشـل تـحـويـل الـمـلـصـق لـ فـيـديـو*`);
                    }
                }

                try {
                    await fs.access(outputPath);
                } catch {
                    return reply(`*❌ فـشـل تـحـويـل الـمـلـصـق لـ فـيـديـو*`);
                }
            }

            // ═══════════════════════════════════════════════════════
            // GIF (إعادة إرسال)
            // ═══════════════════════════════════════════════════════
            else if (isGif || videoMessage) {
                const videoBuffer = await fs.readFile(inputPath);

                const caption = `*⎔┄┄─ ⊱╎⌯ 🎬 ⌯╎⊰─┄┄⎔*\n*┋ تـم تـحـويـل الـ GIF لـ فـيـديـو*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                await sock.sendMessage(message.key.remoteJid, {
                    video: videoBuffer,
                    caption: caption,
                    mimetype: 'video/mp4',
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

                await sock.sendMessage(message.key.remoteJid, { react: { text: "✅", key: message.key } });
                await fs.unlink(inputPath).catch(() => {});
                return;
            }

            // ═══════════════════════════════════════════════════════
            // 🆕 صوت → فيديو مع موجة صوتية (الإصلاح هنا!)
            // ═══════════════════════════════════════════════════════
            else if (isAudio) {
                let success = false;

                // ─── محاولة 1: مع drawtext + موجة ───
                try {
                    await execPromise(
                        `ffmpeg -f lavfi -i color=c=black:s=720x720:r=25 -i "${inputPath}" ` +
                        `-filter_complex "[1:a]showwaves=s=720x200:mode=cline:rate=25:colors=cyan|magenta|yellow[wave];` +
                        `[0:v]drawtext=text='S O L O':fontsize=48:fontcolor=white@0.3:x=(w-text_w)/2:y=100[bg];` +
                        `[bg][wave]overlay=x=0:y=(H-h)/2[v]" ` +
                        `-map "[v]" -map 1:a ` +
                        `-c:v libx264 -pix_fmt yuv420p -preset veryfast ` +
                        `-c:a aac -b:a 128k -shortest -movflags +faststart "${outputPath}" -y`,
                        { maxBuffer: 10 * 1024 * 1024, timeout: 180000 }
                    );

                    await fs.access(outputPath);
                    success = true;
                    console.log('✅ Audio → video (complex) success');
                } catch (e) {
                    console.log('⚠️ Complex audio filter failed:', e.message.slice(0, 200));
                }

                // ─── محاولة 2: موجة بسيطة بدون drawtext ───
                if (!success) {
                    try {
                        await execPromise(
                            `ffmpeg -f lavfi -i color=c=black:s=720x720:r=25 -i "${inputPath}" ` +
                            `-filter_complex "[1:a]showwaves=s=720x200:mode=cline:rate=25:colors=cyan[wave];` +
                            `[0:v][wave]overlay=x=0:y=(H-h)/2:shortest=1[v]" ` +
                            `-map "[v]" -map 1:a ` +
                            `-c:v libx264 -pix_fmt yuv420p -preset veryfast ` +
                            `-c:a aac -b:a 128k -shortest -movflags +faststart "${outputPath}" -y`,
                            { maxBuffer: 10 * 1024 * 1024, timeout: 180000 }
                        );

                        await fs.access(outputPath);
                        success = true;
                        console.log('✅ Audio → video (simple) success');
                    } catch (e) {
                        console.log('⚠️ Simple audio filter failed:', e.message.slice(0, 200));
                    }
                }

                // ─── محاولة 3: خلفية سوداء بدون موجة (fallback أخير) ───
                if (!success) {
                    try {
                        await execPromise(
                            `ffmpeg -f lavfi -i color=c=black:s=720x720:r=25 -i "${inputPath}" ` +
                            `-c:v libx264 -pix_fmt yuv420p -preset veryfast ` +
                            `-c:a aac -b:a 128k -shortest -movflags +faststart "${outputPath}" -y`,
                            { maxBuffer: 10 * 1024 * 1024, timeout: 180000 }
                        );

                        await fs.access(outputPath);
                        success = true;
                        console.log('✅ Audio → video (plain) success');
                    } catch (e) {
                        console.error('❌ All audio filters failed:', e.message.slice(0, 200));
                    }
                }

                if (!success) {
                    return reply(`*❌ فـشـل تـحـويـل الـصـوت لـ فـيـديـو*\n📌 تـأكـد مـن تـثـبـيـت ffmpeg بـكـامـل`);
                }
            }

            else {
                return reply(`*⚠️ هـذا الـنـوع غـيـر مـدعـوم.*`);
            }

            // ═══════════════════════════════════════════════════════
            // إرسال الناتج
            // ═══════════════════════════════════════════════════════
            const videoBuffer = await fs.readFile(outputPath);

            let typeLabel = 'الـمـلـصـق';
            if (isAudio) typeLabel = 'الـصـوت';

            const caption = `*⎔┄┄─ ⊱╎⌯ 🎬 ⌯╎⊰─┄┄⎔*\n*┋ تـم تـحـويـل ${typeLabel} لـ فـيـديـو*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await sock.sendMessage(message.key.remoteJid, {
                video: videoBuffer,
                caption: caption,
                mimetype: 'video/mp4',
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

            await sock.sendMessage(message.key.remoteJid, { react: { text: "✅", key: message.key } });

            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

        } catch (err) {
            console.error("❌ Convert Error:", err);
            reply(`*❌ حـدث خـطأ أثـنـاء الـتـحـويـل..*\n📌 ${err.message}`);
        }
    }
};

async function isWebpFile(buffer) {
    try {
        const header = buffer.slice(0, 12).toString('hex');
        return header.startsWith('52494646') && header.includes('57454250');
    } catch {
        return false;
    }
}