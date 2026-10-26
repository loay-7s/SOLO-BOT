// plugins/تيرا.js
// ⚔️ SOLO TERABOX DOWNLOADER ⚔️

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://engez.a7a.online/api/v1/download/terabox';

// ✅ جلب بيانات الملف
async function fetchTeraboxData(url) {
    try {
        const params = new URLSearchParams({ url });
        const response = await axios.get(`${API_BASE}?${params.toString()}`, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'فشل جلب البيانات');
        }

        return response.data;
    } catch (error) {
        throw new Error(error.message || 'فشل الاتصال');
    }
}

// ✅ تحميل الملف
async function downloadFile(fileUrl, filePath) {
    const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 300000,
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    return Buffer.from(response.data);
}

// ✅ تنسيق الحجم
function formatSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// ✅ تحديد النوع
function getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const videoExts = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];

    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (imageExts.includes(ext)) return 'image';
    if (docExts.includes(ext)) return 'document';
    return 'file';
}

// ✅ الحصول على الميم تايب
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

export default {
    name: "تيرا",
    aliases: ["terabox", "تيرابوكس"],
    description: "تحميل الملفات من تيرا بوكس",
    category: "تحميل",
    developer: false,
    group: false,
    private: false,

    async run({ sock, message, args, reply, react, userJid }) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ').trim();

        // ✅ استمارة الشرح
        if (!text) {
            await react("📦");
            return reply(`*╭─━━━━━━━━━━━━━━━━─╮*
*│ 📦 تـحـمـيـل مـن تـيـرا بـوكـس*
*╰─━━━━━━━━━━━━━━━━─╯*

*📝 أرسل رابط الملف*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.تيرا https://1024terabox.com/s/xxx*

*📌 يدعم الروابط من:*
• 1024terabox.com
• terabox.app
• terabox.com

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ✅ التحقق من الرابط
        if (!text.includes('terabox') && !text.includes('1024terabox')) {
            await react("❌");
            return reply(`*❌ رابـط غـيـر صـالـح*\n📌 يرجى إدخال رابط من تيرا بوكس`);
        }

        await react("⏳");

        try {
            const data = await fetchTeraboxData(text);

            if (!data.files || data.files.length === 0) {
                throw new Error('لا توجد ملفات في هذا الرابط');
            }

            const files = data.files;

            if (files.length === 1) {
                // ✅ ملف واحد
                const file = files[0];
                await reply(`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*
*┋ جـاري تـحـمـيـل: ${file.name}*
*┋ الـحـجـم: ${formatSize(file.size)}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);

                // ✅ تحميل الملف
                const buffer = await downloadFile(file.downloadUrl, file.name);
                const fileType = getFileType(file.name);
                const mimeType = getMimeType(file.name);

                const caption = `*⎔┄┄─ ⊱╎⌯ 📦 ⌯╎⊰─┄┄⎔*
*┋ تـم الـتـحـمـيـل مـن تـيـرا بـوكـس*
*┋ ${file.name}*
*┋ الـحـجـم: ${formatSize(file.size)}*
*┋ الـنـوع: ${fileType}*
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

                // ✅ إرسال الملف حسب النوع
                if (fileType === 'video') {
                    await sock.sendMessage(chatId, {
                        video: buffer,
                        mimetype: mimeType,
                        caption: caption
                    }, { quoted: message });
                } else if (fileType === 'audio') {
                    await sock.sendMessage(chatId, {
                        audio: buffer,
                        mimetype: 'audio/mpeg',
                        caption: caption
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        document: buffer,
                        mimetype: mimeType,
                        fileName: file.name,
                        caption: caption
                    }, { quoted: message });
                }

                await react("✅");

            } else {
                // ✅ عدة ملفات - عرض قائمة
                const sections = [{
                    title: '📁 الملفات',
                    rows: files.map((file, index) => ({
                        title: file.name.substring(0, 40),
                        description: `📊 ${formatSize(file.size)} | 📂 ${file.type || 'غير معروف'}`,
                        id: `.تيرا-تحميل ${index}|${text}`
                    }))
                }];

                const msg = generateWAMessageFromContent(chatId, {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: {
                                body: { text: `*⎔┄┄─ ⊱╎⌯ 📁 ⌯╎⊰─┄┄⎔*\n*┋ ${files.length} مـلـف مـوجـود*\n*┋ اخـتـر الـمـلـف لـلـتـحـمـيـل*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*` },
                                footer: { text: '📦 TeraBox Downloader' },
                                nativeFlowMessage: {
                                    buttons: [{
                                        name: 'single_select',
                                        buttonParamsJson: JSON.stringify({
                                            title: '📋 اختر ملف',
                                            sections
                                        })
                                    }]
                                }
                            }
                        }
                    }
                }, { userJid: sock.user.jid, quoted: message });

                await sock.relayMessage(chatId, msg.message, { messageId: msg.key.id });
                await react("✅");
            }

        } catch (error) {
            console.error("❌ TeraBox Error:", error);
            await react("❌");
            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل تـحـمـيـل الـمـلـف*
*┋ السـبب: ${error.message || 'حـاول مـرة اخـرى'}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};