// plugins/حذف.js

import { configHelper } from '../../config.js';

export default {
    name: "حذف",
    aliases: ["احذف", "delete"],
    description: "حذف رسالة معينة بالرد عليها.",
    category: "admin",
    usage: ".حذف (بالرد على رسالة)",
    group: true,

    async run({ bot, sock, message, reply, react, handler }) {

        const jid = message.key.remoteJid;

        try {

            // ═══════════════════════════════════════════════════════
            // 1️⃣ التحقق من الرد
            // ═══════════════════════════════════════════════════════

            const contextInfo =
                message.message?.extendedTextMessage?.contextInfo;

            if (!contextInfo?.stanzaId) {
                return reply(
                    "*❌ رد عـلـى الـرسـالـة الـلـي عـايـز تـحـذفـهـا.*"
                );
            }

            const targetId = contextInfo.stanzaId;
            const targetParticipant = contextInfo.participant || "";

            // ═══════════════════════════════════════════════════════
            // 2️⃣ تنظيف الـ JID
            // ═══════════════════════════════════════════════════════

            const cleanJid = (value) => {
                if (!value) return "";
                return String(value)
                    .split(":")[0]
                    .split("/")[0]
                    .split("@")[0];
            };

            const botId = sock.user?.id || "";
            const botLid = sock.user?.lid || null;

            const botNumber = cleanJid(botId);
            const botLidNum = botLid ? cleanJid(botLid) : null;

            const targetNumber = cleanJid(targetParticipant);

            // ✅ التحقق: هل الرسالة من البوت؟ (بكل الصيغ الممكنة)
            const isBotMessage = 
                botNumber === targetNumber ||
                (botLidNum && botLidNum === targetNumber) ||
                targetParticipant === botId ||
                (botLid && targetParticipant === botLid);

            // ═══════════════════════════════════════════════════════
            // 3️⃣ تحديد المنفّذ
            // ═══════════════════════════════════════════════════════

            const senderJid =
                message.key.participant ||
                message.key.remoteJid;

            const senderNumber = cleanJid(senderJid);

            const isSelfDeleting = senderNumber === targetNumber;

            // ═══════════════════════════════════════════════════════
            // 4️⃣ تحديد رتب (المنفّذ + الهدف)
            // ═══════════════════════════════════════════════════════

            const getRank = (jid) => {
                if (!jid) return "member";

                if (configHelper?.isMaster && configHelper.isMaster(jid)) {
                    return "master";
                }

                if (handler?.isDeveloper && handler.isDeveloper(jid)) {
                    return "developer";
                }

                if (configHelper?.isDeveloper && configHelper.isDeveloper(jid)) {
                    return "developer";
                }

                return "member";
            };

            const senderRank = getRank(senderJid);
            const targetRank = getRank(targetParticipant);

            // ═══════════════════════════════════════════════════════
            // 5️⃣ جلب معلومات المجموعة
            // ═══════════════════════════════════════════════════════

            let metadata = null;
            let botIsAdmin = false;
            let senderIsAdmin = false;
            let targetIsAdmin = false;

            try {

                metadata = await sock.groupMetadata(jid);

                const findParticipant = (jid, number, lid = null) => {
                    let found = metadata.participants.find(p => p.id === jid);
                    if (found) return found;

                    found = metadata.participants.find(
                        p => cleanJid(p.id) === number
                    );
                    if (found) return found;

                    if (lid) {
                        const lidNum = cleanJid(lid);
                        found = metadata.participants.find(
                            p => cleanJid(p.id) === lidNum
                        );
                        if (found) return found;
                    }

                    found = metadata.participants.find(p => {
                        if (!p.phoneNumber) return false;
                        return cleanJid(p.phoneNumber) === number;
                    });
                    if (found) return found;

                    if (number && number.length > 5) {
                        found = metadata.participants.find(p =>
                            cleanJid(p.id).includes(number)
                        );
                        if (found) return found;
                    }

                    return null;
                };

                const botInGroup = findParticipant(botId, botNumber, botLid);
                const senderInGroup = findParticipant(senderJid, senderNumber, null);
                const targetInGroup = findParticipant(targetParticipant, targetNumber, null);

                botIsAdmin =
                    botInGroup?.admin === 'admin' ||
                    botInGroup?.admin === 'superadmin';

                senderIsAdmin =
                    senderInGroup?.admin === 'admin' ||
                    senderInGroup?.admin === 'superadmin';

                targetIsAdmin =
                    targetInGroup?.admin === 'admin' ||
                    targetInGroup?.admin === 'superadmin';

            } catch (error) {

                console.error(
                    "❌ FETCH GROUP META ERROR:",
                    error?.message || error
                );

                return reply(
                    "*❌ فـشـل جـلـب مـعـلـومـات الـمـجـمـوعـة.*"
                );
            }

            // ═══════════════════════════════════════════════════════
            // 6️⃣ 🚫 حماية الماستر
            // ═══════════════════════════════════════════════════════

            if (targetRank === "master" && !isSelfDeleting) {
                await react("👑");

                return reply(
                    "*👑 لا يـمـكـنـك حـذف ࢪسـالـة عـمـك الـمـاسـتـࢪ.*"
                );
            }

            // ═══════════════════════════════════════════════════════
            // 7️⃣ 🤖 حذف رسالة البوت (يشتغل حتى لو مش مشرف)
            // ═══════════════════════════════════════════════════════

            if (isBotMessage) {

                let deleted = false;

                // ✅ المحاولة 1: delete عادي مع fromMe: true
                try {
                    await sock.sendMessage(jid, {
                        delete: {
                            remoteJid: jid,
                            fromMe: true,
                            id: targetId
                        }
                    });
                    deleted = true;
                } catch (e) {
                    console.error("❌ Delete attempt 1 failed:", e?.message);
                }

                // ✅ المحاولة 2: لو الأول فشل → أضف participant
                if (!deleted) {
                    try {
                        await sock.sendMessage(jid, {
                            delete: {
                                remoteJid: jid,
                                fromMe: true,
                                id: targetId,
                                participant: botId
                            }
                        });
                        deleted = true;
                    } catch (e2) {
                        console.error("❌ Delete attempt 2 failed:", e2?.message);
                    }
                }

                // ✅ حذف أمر .حذف نفسه
                try {
                    await sock.sendMessage(jid, {
                        delete: {
                            remoteJid: jid,
                            fromMe: false,
                            id: message.key.id,
                            participant:
                                message.key.participant ||
                                message.participant
                        }
                    });
                } catch {}

                return;
            }

            // ═══════════════════════════════════════════════════════
            // 8️⃣ ✅ التحقق من الصلاحية الهرمية
            // ═══════════════════════════════════════════════════════

            let canDelete = false;

            // 👑 الماستر: يقدر يحذف أي حد
            if (senderRank === "master") {
                canDelete = true;
            }

            // ⚔️ المطور: يقدر يحذف أي حد عدا الماستر
            else if (senderRank === "developer") {
                canDelete = true;
            }

            // 🛡️ المشرف: يقدر يحذف عضو عادي + مشرف
            else if (senderIsAdmin) {
                if (isSelfDeleting) {
                    canDelete = true;
                }
                else if (targetRank === "member" && !targetIsAdmin) {
                    canDelete = true;
                }
                else if (targetIsAdmin) {
                    canDelete = true;
                }
                else if (targetRank === "developer") {
                    canDelete = false;
                }
                else {
                    canDelete = false;
                }
            }

            // 👤 عضو عادي: يقدر يحذف نفسه + عضو عادي بس
            else {
                if (isSelfDeleting) {
                    canDelete = true;
                } else if (targetRank === "member" && !targetIsAdmin) {
                    canDelete = true;
                } else {
                    canDelete = false;
                }
            }

            // ═══════════════════════════════════════════════════════
            // 9️⃣ 🚫 لو مايقدرش → رفض
            // ═══════════════════════════════════════════════════════

            if (!canDelete) {

                await react("🚫");

                return reply(
                    "*❌ هـذا الـعـضـو أعـلـى مـنـك، لا يـمـكـنـك حـذف ࢪسـالـتـه.*"
                );
            }

            // ═══════════════════════════════════════════════════════
            // 🔟 🛡️ لو البوت مش مشرف → رفض (مع استثناء حذف النفس)
            // ═══════════════════════════════════════════════════════

            if (!botIsAdmin && !isSelfDeleting) {

                await react("🤖");

                return reply(
                    "*❌ خـلـيـنـي مـشـࢪف الأول.*"
                );
            }

            // ═══════════════════════════════════════════════════════
            // 1️⃣1️⃣ 🗑️ تنفيذ الحذف
            // ═══════════════════════════════════════════════════════

            const targetKey = {
                remoteJid: jid,
                fromMe: false,
                id: targetId,
                participant: targetParticipant
            };

            try {

                await sock.sendMessage(jid, {
                    delete: targetKey
                });

            } catch (error) {

                console.error(
                    "❌ DELETE MEMBER MESSAGE ERROR:",
                    error?.message || error
                );

                return reply(
                    "*❌ فـشـل حـذف رسـالـة الـعـضـو.*"
                );
            }

            // ═══════════════════════════════════════════════════════
            // 1️⃣2️⃣ 🗑️ حذف أمر .حذف نفسه
            // ═══════════════════════════════════════════════════════

            try {

                await sock.sendMessage(jid, {
                    delete: {
                        remoteJid: jid,
                        fromMe: false,
                        id: message.key.id,
                        participant:
                            message.key.participant ||
                            message.participant
                    }
                });

            } catch {}

        } catch (error) {

            console.error(
                "❌ DELETE ERROR:",
                error?.message || error
            );

            return reply(
                `*❌ حـصـل خـطـأ فـي الـحـذف*\n\n${error?.message || "خطأ غير معروف"}`
            );
        }
    }
};