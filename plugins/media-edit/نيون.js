// plugins/نيون.js
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const execPromise = promisify(exec);
const SOLO_CHANNEL_ID = "120363407767420565@newsletter";

// ═══════════════════════════════════════════════════════════
// 🎨 الألوان المدعومة (rgb multiplier + brightness + contrast)
// ═══════════════════════════════════════════════════════════

const NEON_COLORS = {
    // ─── أحمر 🔴 ───
    'احمر':      { r: 2.0, g: 0.1, b: 0.1, contrast: 1.3, emoji: '🔴', name: 'أحـمـر' },
    'أحمر':      { r: 2.0, g: 0.1, b: 0.1, contrast: 1.3, emoji: '🔴', name: 'أحـمـر' },
    'red':       { r: 2.0, g: 0.1, b: 0.1, contrast: 1.3, emoji: '🔴', name: 'أحـمـر' },

    // ─── أخضر 🟢 ───
    'اخضر':      { r: 0.1, g: 2.0, b: 0.1, contrast: 1.3, emoji: '🟢', name: 'أخـضـر' },
    'أخضر':      { r: 0.1, g: 2.0, b: 0.1, contrast: 1.3, emoji: '🟢', name: 'أخـضـر' },
    'green':     { r: 0.1, g: 2.0, b: 0.1, contrast: 1.3, emoji: '🟢', name: 'أخـضـر' },

    // ─── أزرق 🔵 ───
    'ازرق':      { r: 0.1, g: 0.1, b: 2.0, contrast: 1.3, emoji: '🔵', name: 'أزرق' },
    'أزرق':      { r: 0.1, g: 0.1, b: 2.0, contrast: 1.3, emoji: '🔵', name: 'أزرق' },
    'blue':      { r: 0.1, g: 0.1, b: 2.0, contrast: 1.3, emoji: '🔵', name: 'أزرق' },

    // ─── أصفر 🟡 ───
    'اصفر':      { r: 2.0, g: 2.0, b: 0.1, contrast: 1.3, emoji: '🟡', name: 'أصـفـر' },
    'أصفر':      { r: 2.0, g: 2.0, b: 0.1, contrast: 1.3, emoji: '🟡', name: 'أصـفـر' },
    'yellow':    { r: 2.0, g: 2.0, b: 0.1, contrast: 1.3, emoji: '🟡', name: 'أصـفـر' },

    // ─── بنفسجي 🟣 ───
    'بنفسجي':    { r: 1.5, g: 0.1, b: 2.0, contrast: 1.3, emoji: '🟣', name: 'بـنـفـسـجـي' },
    'purple':    { r: 1.5, g: 0.1, b: 2.0, contrast: 1.3, emoji: '🟣', name: 'بـنـفـسـجـي' },
    'violet':    { r: 1.5, g: 0.1, b: 2.0, contrast: 1.3, emoji: '🟣', name: 'بـنـفـسـجـي' },

    // ─── برتقالي 🟠 ───
    'برتقالي':   { r: 2.0, g: 1.0, b: 0.1, contrast: 1.3, emoji: '🟠', name: 'بـرتـقـالـي' },
    'orange':    { r: 2.0, g: 1.0, b: 0.1, contrast: 1.3, emoji: '🟠', name: 'بـرتـقـالـي' },

    // ─── وردي 🩷 ───
    'وردي':      { r: 2.0, g: 0.5, b: 1.5, contrast: 1.3, emoji: '🩷', name: 'وردي' },
    'pink':      { r: 2.0, g: 0.5, b: 1.5, contrast: 1.3, emoji: '🩷', name: 'وردي' },

    // ─── سماوي 🔷 ───
    'سماوي':     { r: 0.1, g: 1.5, b: 2.0, contrast: 1.3, emoji: '🔷', name: 'سـمـاوي' },
    'cyan':      { r: 0.1, g: 1.5, b: 2.0, contrast: 1.3, emoji: '🔷', name: 'سـمـاوي' },
    'sky':       { r: 0.1, g: 1.5, b: 2.0, contrast: 1.3, emoji: '🔷', name: 'سـمـاوي' },

    // ─── أبيض ⚪ ───
    'ابيض':      { r: 2.0, g: 2.0, b: 2.0, contrast: 1.4, emoji: '⚪', name: 'أبـيـض' },
    'أبيض':      { r: 2.0, g: 2.0, b: 2.0, contrast: 1.4, emoji: '⚪', name: 'أبـيـض' },
    'white':     { r: 2.0, g: 2.0, b: 2.0, contrast: 1.4, emoji: '⚪', name: 'أبـيـض' },

    // ─── ذهبي 🟨 ───
    'ذهبي':      { r: 2.0, g: 1.5, b: 0.3, contrast: 1.3, emoji: '🟨', name: 'ذهـبـي' },
    'gold':      { r: 2.0, g: 1.5, b: 0.3, contrast: 1.3, emoji: '🟨', name: 'ذهـبـي' },

    // ─── ليموني 💚 ───
    'ليموني':    { r: 1.5, g: 2.0, b: 0.1, contrast: 1.3, emoji: '💚', name: 'لـيـمـونـي' },
    'lime':      { r: 1.5, g: 2.0, b: 0.1, contrast: 1.3, emoji: '💚', name: 'لـيـمـونـي' },

    // ─── تركواز 🩵 ───
    'تركواز':    { r: 0.1, g: 2.0, b: 2.0, contrast: 1.3, emoji: '🩵', name: 'تـركـواز' },
    'turquoise': { r: 0.1, g: 2.0, b: 2.0, contrast: 1.3, emoji: '🩵', name: 'تـركـواز' },
};

// ═══════════════════════════════════════════════════════════
// 🛠️ دالة: تنظيف اسم اللون
// ═══════════════════════════════════════════════════════════

function normalizeColor(str) {
    return String(str || '')
        .trim()
        .toLowerCase()
        .replace(/[أإآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[_\s-]+/g, '');
}

function findColor(input) {
    const clean = normalizeColor(input);

    // مر على الألوان
    for (const [key, value] of Object.entries(NEON_COLORS)) {
        if (normalizeColor(key) === clean) {
            return { key, ...value };
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════
// ⚔️ COMMAND
// ═══════════════════════════════════════════════════════════

export default {
    name: "نيون",
    aliases: ["neon", "نـيـون"],
    description: "تأثيرات نيون مبهرة (10+ ألوان)",
    category: "تحويل",

    async run({ sock, message, args, reply, react }) {
        // ─── استخراج اللون ───
        const colorInput = args?.[0];

        // ─── لو مفيش لون → عرض القائمة ───
        if (!colorInput) {
            let colorsList = '';
            const seen = new Set();

            for (const [key, val] of Object.entries(NEON_COLORS)) {
                if (seen.has(val.name)) continue;
                seen.add(val.name);

                colorsList += `*┋ ${val.emoji} .نيون ${key}*\n`;
            }

            return reply(`*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*

*🎨 تـأثـيـرات الـنـيـون*

*───━━━⊱  🌈  ⊰━━━───*

*📌 الأوامـر الـمـتـوفـرة:*

${colorsList}
*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

*📝 الـطـريـقـة:*
*.نيون [الـلـون]*
*(رداً على صورة أو فيديو)*

*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        // ─── تحديد اللون ───
        const color = findColor(colorInput);

        if (!color) {
            return reply(`*❌ لـون غـيـر مـدعـوم: \`${colorInput}\`*\n\n📌 اكـتـب \`.نيون\` لـعـرض الألـوان الـمـتـاحـة`);
        }

        // ─── استخراج الميديا ───
        let mediaMessage = null;
        let isVideo = false;

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
            return reply(`*⚠️ رد عـلـى صـورة أو فـيـديـو بـالأمـر*\n\n📌 مـثـال: \`.نيون ${colorInput}\``);
        }

        await react(color.emoji);

        const tempPath = path.join(process.cwd(), 'temp');
        fs.ensureDirSync(tempPath);
        const ext = isVideo ? 'mp4' : 'jpg';
        const inputFile = path.join(tempPath, `in_${Date.now()}.${ext}`);
        const outputFile = path.join(tempPath, `out_${Date.now()}.${ext}`);

        try {
            // ─── تنزيل الميديا ───
            const stream = await downloadContentFromMessage(
                mediaMessage,
                isVideo ? 'video' : 'image'
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await fs.writeFile(inputFile, buffer);

            // ─── بناء فلتر colorchannelmixer ───
            const { r, g, b, contrast } = color;

            // colorchannelmixer: rr,rg,rb,gr,gg,gb,br,bg,bb
            const mixer = `colorchannelmixer=rr=${r}:rg=0:rb=0:gr=0:gg=${g}:gb=0:br=0:bg=0:bb=${b}`;

            const filter = `${mixer},eq=contrast=${contrast}`;

            // ─── ffmpeg ───
            if (isVideo) {
                await execPromise(
                    `ffmpeg -i "${inputFile}" ` +
                    `-vf "${filter}" ` +
                    `-c:v libx264 -pix_fmt yuv420p -movflags +faststart ` +
                    `-c:a aac -b:a 128k "${outputFile}" -y`,
                    { maxBuffer: 50 * 1024 * 1024, timeout: 180000 }
                );
            } else {
                await execPromise(
                    `ffmpeg -i "${inputFile}" -vf "${filter}" "${outputFile}" -y`,
                    { maxBuffer: 50 * 1024 * 1024, timeout: 60000 }
                );
            }

            // ─── تحقق من الناتج ───
            try {
                await fs.access(outputFile);
            } catch {
                return reply(`*❌ فـشـل مـعـالـجـة الـمـيـديـا*`);
            }

            // ─── إرسال النتيجة ───
            const caption = `*⎔┄┄─ ⊱╎⌯ ${color.emoji} ⌯╎⊰─┄┄⎔*\n*┋ تـم تـحـويـل الـ${isVideo ? 'فـيـديـو' : 'صـورة'} لـ ${color.name} نـيـون*\n*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*\n*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*\n> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            if (isVideo) {
                await sock.sendMessage(message.key.remoteJid, {
                    video: { url: outputFile },
                    mimetype: 'video/mp4',
                    caption,
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
                    caption,
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

            // ─── تنظيف ───
            await fs.unlink(inputFile).catch(() => {});
            await fs.unlink(outputFile).catch(() => {});

            await react("✅");

        } catch (error) {
            console.error("❌ Neon Error:", error);
            await react("❌");

            let errorMsg = `*❌ فـشـل مـعـالـجـة الـمـيـديـا*`;

            if (error.message?.includes('ffmpeg')) {
                errorMsg = `*❌ ffmpeg غـيـر مـثـبـت*\n📌 يـرجـى تـثـبـيـت ffmpeg`;
            }

            await reply(`${errorMsg}\n\n📌 حـاول مـرة اخـرى`);
        }
    }
};