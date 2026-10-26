import fs from "fs";
import path from "path";

const metadataCache = new Map();
const METADATA_CACHE_TIME = 30000;

async function getCachedGroupMetadata(sock, chatId) {
    const botId = sock?.user?.id || sock?.authState?.creds?.me?.id || "unknown";
    const cacheKey = `${botId}:${chatId}`;
    const cached = metadataCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < METADATA_CACHE_TIME) {
        return cached.data;
    }

    const metadata = await sock.groupMetadata(chatId);
    metadataCache.set(cacheKey, { data: metadata, timestamp: Date.now() });
    return metadata;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 👇 دالة غلق الشات
async function closeGroup(sock, chatId) {
    try {
        await sock.groupSettingUpdate(chatId, "announcement");
        console.log("[ZARF] Group closed successfully");
        return true;
    } catch (err) {
        console.error("[ZARF] Close Group Error:", err);
        return false;
    }
}

// 👇 دالة تغيير صورة الجروب
async function changeGroupPicture(sock, chatId, imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            console.error(`[ZARF] Image not found: ${imagePath}`);
            return false;
        }
        
        await sock.updateProfilePicture(chatId, {
            url: imagePath
        });
        
        console.log("[ZARF] Group picture updated successfully");
        return true;
    } catch (err) {
        console.error("[ZARF] Change Picture Error:", err);
        return false;
    }
}

export default {
    name: "زرف",
    aliases: ["Z", "خضوع", "اخضاع"],
    description: "إخضاع كامل للمجموعة تحت سيادة SOLO - سحب إشرافات أولاً.",
    group: true,
    developer: true,

    async run({ sock, m, handler }) {
        const chatId = m.key.remoteJid;
        const audioPath = "./media/fin.mp3";
        const groupPicturePath = "./media/fin.jpg"; // 👈 صورة الجروب باسم fin
        const portalLink = "https://whatsapp.com/channel/0029VbCEhNX7DAWrudaFBs41";

        try {
            // 🚀 1. سحب البيانات بالتوازي (سرعة جبارة)
            const metadata = await getCachedGroupMetadata(sock, chatId);
            const participants = metadata.participants || [];

            const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
            const creator = metadata.owner;

            const finalTemplate = `
*╭─━━━━━━━━━━━━━━━─╮*
      *◈ 𝐒 𝐎 𝐋 𝐎 🍷 𝐀 𝐁 𝐘 𝐒 𝐒 ◈*
*╰─━━━━━━━━━━━━━━━─╯*
*⫷  𝐓𝐇𝐄 𝐆𝐀𝐌𝐄 𝐈𝐒 𝐎𝐕𝐄𝐑  ⫸*

*▫️تـم إخـضـاعـك بـ ࢪعـايـة☜𝑺𝑶𝑳𝑶.*
*▫️انـتهى عـصـࢪك وبـدأ عـصـر☜𝑺𝑶𝑳𝑶.*
*▫️الـقـوانـيـن؟ الـقـانـون هـو☜𝑺𝑶𝑳𝑶.*

*▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰*
    *𝐍𝐎 𝐌𝐄𝐑𝐂𝐘 ◈ 𝐍𝐎 𝐓𝐎𝐋𝐄𝐑𝐀𝐍𝐂𝐄*
*▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰*
*⫷  𝐈𝐓'𝐒 𝐃𝐎𝐍𝐄  ⫸*

   
                 *｢  𝑺 𝑶 𝑳 𝑶  ｣*

> *☞⦓ ${portalLink} ⦔☜*

*▰▰▰▰▰▰▰▰▰▰▰*`.trim();

            // 🚀 2. تجهيز قائمة المشرفين
            const adminsToDemote = participants
                .filter(p =>
                    p.admin &&
                    !handler.isDeveloper(p.id) &&
                    p.id !== botId &&
                    p.id !== creator
                )
                .map(p => p.id);

            // 🚀 3. تنزيل المشرفين + إغلاق الشات (على التوازي)
            const demotePromise = adminsToDemote.length > 0
                ? sock.groupParticipantsUpdate(chatId, adminsToDemote, "demote").catch(err => {
                    console.error("[ZARF] Demote Error:", err);
                })
                : Promise.resolve();

            // 👇 إغلاق الشات بعد تنزيل المشرفين
            const closePromise = demotePromise.then(() => {
                return wait(50).then(() => closeGroup(sock, chatId));
            });

            // 🚀 4. تغيير الاسم والوصف والصورة والمنشن (على التوازي)
            const subjectPromise = sock.groupUpdateSubject(chatId, "ٍُ𝐒 𝐎 ٌٰٖ𝐋 𝐎ٓ┋ٰٖ༒ٰٖ┋ٌمَـزࢪوف").catch(err => {
                console.error("[ZARF] Subject Update Error:", err);
            });

            const descriptionPromise = sock.groupUpdateDescription(chatId, finalTemplate).catch(err => {
                console.error("[ZARF] Description Update Error:", err);
            });

            // 👇 تغيير صورة الجروب
            const picturePromise = changeGroupPicture(sock, chatId, groupPicturePath);

            // استنى الـ demote + close
            await demotePromise;
            await wait(50);
            await closePromise;

            // 🚀 5. استنى الاسم والوصف والصورة (بالتوازي)
            await Promise.all([subjectPromise, descriptionPromise, picturePromise]);

            // 🚀 6. إرسال المنشن + الرسالة النهائية (على التوازي)
            const mentionPromise = sock.sendMessage(chatId, {
                text: `*𝑺 𝑶 𝑳 𝑶◈*`,
                mentions: participants.map(p => p.id)
            }).catch(err => {
                console.error("[ZARF] Mention Message Error:", err);
            });

            const finalMsgPromise = sock.sendMessage(chatId, {
                text: finalTemplate
            }).catch(err => {
                console.error("[ZARF] Final Message Error:", err);
            });

            await Promise.all([mentionPromise, finalMsgPromise]);

            // 🚀 7. إرسال الصوتية
            if (fs.existsSync(audioPath)) {
                await sock.sendMessage(chatId, {
                    audio: { url: audioPath },
                    mimetype: "audio/mp4",
                    ptt: false
                }).catch(err => {
                    console.error("[ZARF] Audio Error:", err);
                });
            }

            // ❌ لا يوجد طرد للأعضاء (الفرق الوحيد عن فنش)

        } catch (err) {
            console.error("Critical Error in Zarf Command:", err);
        }
    }
};