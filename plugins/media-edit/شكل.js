// plugins/شكل.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

export default {
    name: "شكل",
    aliases: ["تغيير_شكل", "قص", "crop"],
    description: "تغيير شكل الصورة (دائري، مربع، معين، نجمة، قلب، مثلث، بيضاوي)",
    category: "تحويل",
    developer: false,

    async run({ sock, message, reply, react, args }) {
        const chatId = message.key.remoteJid;

        // ✅ التحقق من وجود رد على صورة
        const quoted = message.message?.extendedTextMessage?.contextInfo;
        const imageMessage = quoted?.quotedMessage?.imageMessage;

        if (!imageMessage) {
            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🎨 تـغـيـيـر شـكـل الـصـورة*

*───━━━⊱  📋  ⊰━━━───*

*┋ رد على صورة واكتب الأمر*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.شكل دائري*
📌 *.شكل مربع*
📌 *.شكل معين*
📌 *.شكل نجمة*
📌 *.شكل قلب*
📌 *.شكل مثلث*
📌 *.شكل بيضاوي*
📌 *.شكل مستطيل*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ✅ استخراج الشكل المطلوب
        const shape = args[0]?.toLowerCase();

        const shapes = {
            'دائري': 'circle',
            'دائرة': 'circle',
            'مربع': 'square',
            'معين': 'diamond',
            'نجمة': 'star',
            'قلب': 'heart',
            'مثلث': 'triangle',
            'بيضاوي': 'oval',
            'بيضوي': 'oval',
            'مستطيل': 'rectangle'
        };

        const shapeName = shapes[shape] || null;

        if (!shapeName) {
            return reply(`*❌ شـكـل غـيـر مـعـروف*\n📌 استخدم .شكل لعرض الأشكال المتاحة`);
        }

        await react("🎨");

        try {
            // ✅ تنزيل الصورة
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer || buffer.length === 0) {
                return reply(`*❌ فـشـل تـنـزيـل الـصـورة*`);
            }

            // ✅ مسار ملف الـ Mask
            const maskPath = path.join(process.cwd(), 'media', 'masks', `${shapeName}.png`);
            
            // ✅ التحقق من وجود ملف الـ Mask
            let maskExists = false;
            try {
                await fs.access(maskPath);
                maskExists = true;
            } catch {
                // لو مش موجود، نستخدم الطريقة اليدوية
                maskExists = false;
            }

            const fileName = `solo_shape_${Date.now()}`;
            const tempDir = tmpdir();
            const inputPath = join(tempDir, `${fileName}.png`);
            const outputPath = join(tempDir, `${fileName}_${shapeName}.png`);

            await fs.writeFile(inputPath, buffer);

            // ✅ تطبيق الـ Mask
            if (maskExists) {
                // ✅ طريقة الـ Mask (الأفضل والأدق)
                await execPromise(
                    `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( "${maskPath}" -resize 500x500 \\) -alpha off -compose copy_opacity -composite "${outputPath}"`
                );
            } else {
                // ✅ طريقة رسم الأشكال يدوياً (احتياطية)
                let command = '';
                switch (shapeName) {
                    case 'circle':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( +clone -threshold 100% -fill white -draw "ellipse 250,250 250,250 0,360" -alpha off \\) -alpha off -compose copy_opacity -composite "${outputPath}"`;
                        break;
                    case 'square':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 "${outputPath}"`;
                        break;
                    case 'diamond':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( +clone -threshold 100% -fill white -draw "polygon 250,0 500,250 250,500 0,250" -alpha off \\) -alpha off -compose copy_opacity -composite "${outputPath}"`;
                        break;
                    case 'star':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( +clone -threshold 100% -fill white -draw "polygon 250,0 325,175 500,175 375,325 425,500 250,400 75,500 125,325 0,175 175,175" -alpha off \\) -alpha off -compose copy_opacity -composite "${outputPath}"`;
                        break;
                    case 'heart':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( +clone -threshold 100% -fill white -draw "translate 250,250 bezier 0,120 -180,-40 -120,-200 0,-70 120,-200 180,-40 0,120" -alpha off \\) -alpha off -compose copy_opacity -composite "${outputPath}"`;
                        break;
                    case 'triangle':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( +clone -threshold 100% -fill white -draw "polygon 250,0 500,500 0,500" -alpha off \\) -alpha off -compose copy_opacity -composite "${outputPath}"`;
                        break;
                    case 'oval':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( +clone -threshold 100% -fill white -draw "ellipse 250,250 200,150 0,360" -alpha off \\) -alpha off -compose copy_opacity -composite "${outputPath}"`;
                        break;
                    case 'rectangle':
                        command = `magick "${inputPath}" -resize 500x500^ -gravity center -extent 500x500 \\( +clone -threshold 100% -fill white -draw "roundRectangle 30,90 470,410 45,45" -alpha off \\) -alpha off -compose copy_opacity -composite "${outputPath}"`;
                        break;
                    default:
                        return reply(`*❌ شـكـل غـيـر مـعـروف*`);
                }
                await execPromise(command);
            }

            // ✅ التحقق من وجود الملف الناتج
            try {
                await fs.access(outputPath);
            } catch {
                return reply(`*❌ فـشـل تـغـيـيـر شـكـل الـصـورة*`);
            }

            const imageBuffer = await fs.readFile(outputPath);

            // ✅ أسماء الأشكال بالعربي للكابتشن
            const shapeNames = {
                'circle': 'دائري ⭕',
                'square': 'مربع 🔲',
                'diamond': 'معين 💎',
                'star': 'نجمة ⭐',
                'heart': 'قلب ❤️',
                'triangle': 'مثلث 🔺',
                'oval': 'بيضاوي 🥚',
                'rectangle': 'مستطيل 📐'
            };

            const caption = `*⎔┄┄─ ⊱╎⌯ 🎨 ⌯╎⊰─┄┄⎔*\n*┋ تـم تـغـيـيـر شـكـل الـصـورة*\n*┋ الشكل: ${shapeNames[shapeName] || shapeName}*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await sock.sendMessage(chatId, {
                image: imageBuffer,
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

            // ✅ تنظيف الملفات
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});

            await react("✅");

        } catch (err) {
            console.error("❌ Shape Error:", err);
            
            let errorMsg = `*❌ فـشـل تـغـيـيـر شـكـل الـصـورة*`;
            
            if (err.message?.includes('magick')) {
                errorMsg = `*❌ ImageMagick غـيـر مـثـبـت*\n📌 يـرجـى تـثـبـيـت ImageMagick`;
            }
            
            await reply(`${errorMsg}\n\n📌 حـاول مـرة اخـرى`);
            await react("❌");
        }
    }
};