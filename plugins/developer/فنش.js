import fs from "fs";

const metadataCache = new Map();
const METADATA_CACHE_TIME = 30000;

const FINISH_DATA_PATH = "./data/finish.json";

function loadFinishData() {
    try {
        if (!fs.existsSync(FINISH_DATA_PATH)) {
            const initialData = { totalKicked: 0 };
            fs.writeFileSync(
                FINISH_DATA_PATH,
                JSON.stringify(initialData, null, 2),
                "utf8"
            );
            return initialData;
        }

        const data = JSON.parse(
            fs.readFileSync(FINISH_DATA_PATH, "utf8")
        );

        return {
            totalKicked: Number(data?.totalKicked) || 0
        };
    } catch (error) {
        console.error("[FINISH DATA] Failed to read finish.json:", error);
        return { totalKicked: 0 };
    }
}

function saveFinishData(data) {
    try {
        fs.writeFileSync(
            FINISH_DATA_PATH,
            JSON.stringify(data, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error("[FINISH DATA] Failed to save finish.json:", error);
    }
}

function addKickedCount(count) {
    if (!count || count <= 0) {
        return loadFinishData();
    }
    const data = loadFinishData();
    data.totalKicked += Number(count);
    saveFinishData(data);
    return data;
}

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
        console.log("[FINISH] Group closed successfully");
        return true;
    } catch (err) {
        console.error("[FINISH] Close Group Error:", err);
        return false;
    }
}

// 👇 دالة تغيير صورة الجروب
async function changeGroupPicture(sock, chatId, imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            console.error(`[FINISH] Image not found: ${imagePath}`);
            return false;
        }
        
        await sock.updateProfilePicture(chatId, {
            url: imagePath
        });
        
        console.log("[FINISH] Group picture updated successfully");
        return true;
    } catch (err) {
        console.error("[FINISH] Change Picture Error:", err);
        return false;
    }
}

export default {
    name: "فنش",
    aliases: ["F", "FINISH", "انكح", "نيكهم"],
    description: "تطهير شامل تحت سيادة SOLO - سرعة جبارة مع ترتيب دقيق.",
    group: true,
    developer: true,

    async run({ sock, m, handler }) {
        const chatId = m.key.remoteJid;
        const audioPath = "./media/fin.mp3";
        const groupPicturePath = "./media/fin.jpg";
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

*▫️تـم تـدمـيـࢪك بـ ࢪعـايـة☜𝑺𝑶𝑳𝑶.*
*▫️انـتهى عـصـࢪك وبـدأ عـصـر☜𝑺𝑶𝑳𝑶.*
*▫️الـقـوانـين؟ الـقـانـون هـو☜𝑺𝑶𝑳𝑶.*

*▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰*
    *𝐍𝐎 𝐌𝐄𝐑𝐂𝐘 ◈ 𝐍𝐎 𝐓𝐎𝐋𝐄𝐑𝐀𝐍𝐂𝐄*
*▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰*
*⫷  𝐈𝐓'𝐒 𝐃𝐎𝐍𝐄  ⫸*

   
                 *｢  𝑺 𝑶 𝑳 𝑶  ｣*

> *☞⦓ ${portalLink} ⦔☜*

*▰▰▰▰▰▰▰▰▰▰▰*`.trim();

            // 🚀 2. تجهيز قائمة الأعضاء للطرد
            const membersToRemove = participants
                .filter(p =>
                    !handler.isDeveloper(p.id) &&
                    p.id !== botId &&
                    p.id !== creator
                )
                .map(p => p.id);

            // 🚀 3. إغلاق الشات مباشرة (بدون تنزيل مشرفين)
            const closePromise = wait(50).then(() => closeGroup(sock, chatId));

            // 🚀 4. تغيير الاسم والوصف والصورة (على التوازي)
            const subjectPromise = sock.groupUpdateSubject(chatId, "ٍُ𝐒 𝐎 ٌٰٖ𝐋 𝐎ٓ┋ٰٖ༒ٰٖ┋ٌمَـزࢪوف").catch(err => {
                console.error("[FINISH] Subject Update Error:", err);
            });

            const descriptionPromise = sock.groupUpdateDescription(chatId, finalTemplate).catch(err => {
                console.error("[FINISH] Description Update Error:", err);
            });

            // 👇 تغيير صورة الجروب
            const picturePromise = changeGroupPicture(sock, chatId, groupPicturePath);

            // استنى غلق الشات
            await closePromise;

            // 🚀 5. استنى الاسم والوصف والصورة (بالتوازي)
            await Promise.all([subjectPromise, descriptionPromise, picturePromise]);

            // 🚀 6. إرسال المنشن + الرسالة النهائية (على التوازي)
            const mentionPromise = sock.sendMessage(chatId, {
                text: `*𝑺 𝑶 𝑳 𝑶◈*`,
                mentions: participants.map(p => p.id)
            }).catch(err => {
                console.error("[FINISH] Mention Message Error:", err);
            });

            const finalMsgPromise = sock.sendMessage(chatId, {
                text: finalTemplate
            }).catch(err => {
                console.error("[FINISH] Final Message Error:", err);
            });

            await Promise.all([mentionPromise, finalMsgPromise]);

            // 🚀 7. إرسال الصوتية
            if (fs.existsSync(audioPath)) {
                await sock.sendMessage(chatId, {
                    audio: { url: audioPath },
                    mimetype: "audio/mp4",
                    ptt: false
                }).catch(err => {
                    console.error("[FINISH] Audio Error:", err);
                });
            }

            // 🚀 8. الطرد النهائي
            if (membersToRemove.length > 0) {
                await sock.groupParticipantsUpdate(chatId, membersToRemove, "remove")
                    .then(() => {
                        const finishData = addKickedCount(membersToRemove.length);
                        console.log(`[FINISH] Kicked: ${membersToRemove.length} | Total: ${finishData.totalKicked}`);
                    })
                    .catch(err => {
                        console.error("[FINISH] Remove Members Error:", err);
                    });
            }

        } catch (err) {
            console.error("Critical Error in Solo Finish:", err);
        }
    }
};