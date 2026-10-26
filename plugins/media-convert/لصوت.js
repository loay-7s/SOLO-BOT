import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export default {
    name: "لصوت",
  aliases: ["صوت","فويس","صوتية","صوتيه","لفويس"],
    description: "تحويل الفيديو إلى MP3 بحجم صغير وجودة مضبوطة",
    category: "tools",

    async run({ sock, message, reply }) {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            const videoMessage =
                quoted?.videoMessage ||
                quoted?.viewOnceMessageV2?.message?.videoMessage;

            if (!videoMessage) {
                return reply(
                    "*🕷️ ࢪد عـلـى الـفـيـديـو الـذي تـࢪيـد تـحـويـلـه لـصـوتـيـة بـالأمـࢪ.*"
                );
            }

            // 📥 رياكت التحويل
            await sock.sendMessage(message.key.remoteJid, {
                react: {
                    text: "📥",
                    key: message.key
                }
            });

            // تحميل الفيديو
            const stream = await downloadContentFromMessage(
                videoMessage,
                'video'
            );

            const chunks = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            const id = Date.now();

            const tempVideoPath = join(
                tmpdir(),
                `solo_${id}.mp4`
            );

            const tempAudioPath = join(
                tmpdir(),
                `solo_${id}.mp3`
            );

            await writeFile(tempVideoPath, buffer);

            // تحويل الفيديو إلى MP3
            exec(
                `ffmpeg -y -i "${tempVideoPath}" -vn -ar 22050 -ac 1 -b:a 64k "${tempAudioPath}"`,
                async (error) => {

                    await unlink(tempVideoPath).catch(() => {});

                    if (error) {
                        console.error("FFMPEG Error:", error);

                        await sock.sendMessage(message.key.remoteJid, {
                            react: {
                                text: "❌",
                                key: message.key
                            }
                        });

                        return;
                    }

                    try {
                        // 🎵 إرسال الصوت فقط كـ Reply على الفيديو
                        await sock.sendMessage(
                            message.key.remoteJid,
                            {
                                audio: {
                                    url: tempAudioPath
                                },
                                mimetype: 'audio/mpeg',
                                ptt: false,
                                fileName: 'SOLO_AUDIO.mp3'
                            },
                            {
                                quoted: message
                            }
                        );

                        // ✅ رياكت النجاح فقط
                        await sock.sendMessage(message.key.remoteJid, {
                            react: {
                                text: "✅",
                                key: message.key
                            }
                        });

                    } catch (sendError) {
                        console.error("Audio Send Error:", sendError);

                        await sock.sendMessage(message.key.remoteJid, {
                            react: {
                                text: "❌",
                                key: message.key
                            }
                        });

                    } finally {
                        await unlink(tempAudioPath).catch(() => {});
                    }
                }
            );

        } catch (e) {
            console.error("❌ Audio Conversion Error:", e);

            await sock.sendMessage(message.key.remoteJid, {
                react: {
                    text: "❌",
                    key: message.key
                }
            });
        }
    }
};