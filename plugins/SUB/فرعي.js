// plugins/SUB/فرعي.js
// ⚔️ SOLO SUB BOT — UNIFIED COMMAND ⚔️

import { configHelper } from '../../config.js';
import {
    generateWAMessageFromContent
} from '@whiskeysockets/baileys';

// ═══════════════════════════════════════════════════════════
// 🎨 ZAKHRAFA
// ═══════════════════════════════════════════════════════════

const SOLO_HEADER = `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*`;
const SOLO_FOOTER = `> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

// ═══════════════════════════════════════════════════════════
// 🎯 الكود الموحد
// ═══════════════════════════════════════════════════════════
const CUSTOM_PAIR_CODE = 'SOLOXBOT';

// ═══════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ═══════════════════════════════════════════════════════════

function normalizeArgs(args) {
    if (Array.isArray(args)) return args.map(String).filter(Boolean);
    return String(args || '').trim().split(/\s+/).filter(Boolean);
}

function normalizeJid(jid) {
    if (!jid) return null;
    return String(jid).trim().toLowerCase();
}

function getNumber(jid) {
    if (!jid) return null;
    const value = String(jid).trim();
    if (value.includes('@')) return value.split('@')[0].replace(/\D/g, '');
    return value.replace(/\D/g, '');
}

function getDisplayNumber(jid) {
    const number = getNumber(jid);
    return number ? `${number}+` : 'غير متاح';
}

function getFullJid(jid) {
    if (!jid) return 'غير متاح';
    const value = String(jid).trim();
    if (value.includes('@')) return value;
    return `${value}@s.whatsapp.net`;
}

function isLidJid(jid) {
    return typeof jid === 'string' && jid.toLowerCase().endsWith('@lid');
}

function isPnJid(jid) {
    return typeof jid === 'string' && jid.toLowerCase().endsWith('@s.whatsapp.net');
}

function getAdminRole(participant) {
    if (!participant) return null;
    if (participant.admin === 'superadmin' || participant.isSuperAdmin === true) return 'superadmin';
    if (participant.admin === 'admin' || participant.isAdmin === true) return 'admin';
    return null;
}

function getRoleText(role) {
    if (role === 'superadmin') return '🏆 Super Admin';
    if (role === 'admin') return '👑 Admin';
    return '👤 Member';
}

function formatDate(timestamp) {
    if (!timestamp) return 'غير متاح';
    try {
        return new Date(Number(timestamp) * 1000).toLocaleString('ar-EG');
    } catch {
        return 'غير متاح';
    }
}

function formatBoolean(value) {
    if (value === true) return 'نعم';
    if (value === false) return 'لا';
    return 'غير متاح';
}

function formatMemberAddMode(value) {
    if (value === true) return 'جميع الأعضاء يمكنهم الإضافة';
    if (value === false) return 'الأدمنز فقط يمكنهم الإضافة';
    return 'غير متاح';
}

function formatAddressingMode(value) {
    if (!value) return 'غير متاح';
    const mode = String(value);
    const names = { pn: 'Phone Number', lid: 'LID' };
    return names[mode] || mode;
}

function formatEphemeralDuration(seconds) {
    if (seconds === undefined || seconds === null) return 'غير متاح';
    const value = Number(seconds);
    if (!value) return 'متوقف';
    if (value < 60) return `${value} ثانية`;
    if (value < 3600) return `${Math.floor(value / 60)} دقيقة`;
    if (value < 86400) return `${Math.floor(value / 3600)} ساعة`;
    return `${Math.floor(value / 86400)} يوم`;
}

function formatCommunityType(group) {
    if (group?.isCommunityAnnounce === true) return 'Community Announcement';
    if (group?.isCommunity === true) return 'Community';
    return 'مجموعة عادية';
}

function getOwnerJid(group) {
    return group?.ownerPn || group?.owner || group?.ownerLid || null;
}

function getSubjectOwnerJid(group) {
    return group?.subjectOwnerPn || group?.subjectOwner || group?.subjectOwnerLid || null;
}

function getGroupDescription(group) {
    if (group?.desc === undefined || group?.desc === null || group?.desc === '') return 'لا يوجد';
    return String(group.desc);
}

function getGroupSize(group, participants) {
    if (group?.size !== undefined && group?.size !== null) return Number(group.size);
    return participants.length;
}

async function lidToPn(sock, jid) {
    const normalized = normalizeJid(jid);
    if (!normalized) return null;
    if (isPnJid(normalized)) return normalized;
    if (!isLidJid(normalized)) return normalized;

    try {
        const mapping = sock?.signalRepository?.lidMapping;
        if (mapping?.getPNForLID) {
            const pn = await mapping.getPNForLID(normalized);
            if (pn) {
                const result = normalizeJid(pn);
                if (isPnJid(result)) return result;
                if (/^\d+$/.test(result)) return `${result}@s.whatsapp.net`;
            }
        }
    } catch {}

    return null;
}

function getBotPhoneCandidates(subBot, sock) {
    const candidates = new Set();
    const values = [
        subBot?.phone,
        sock?.user?.id,
        sock?.authState?.creds?.me?.id,
        sock?.authState?.creds?.me?.lid,
    ];
    for (const value of values) {
        if (!value) continue;
        const number = getNumber(value);
        if (number) candidates.add(number);
    }
    return candidates;
}

async function participantPhoneNumber(sock, participant) {
    if (!participant) return null;

    const directValues = [participant.phoneNumber, participant.pn];
    for (const value of directValues) {
        if (!value) continue;
        const number = getNumber(value);
        if (number) return number;
    }

    const pn = await lidToPn(sock, participant.id);
    if (pn) {
        const number = getNumber(pn);
        if (number) return number;
    }

    if (participant.lid) {
        const mappedPn = await lidToPn(sock, participant.lid);
        if (mappedPn) {
            const number = getNumber(mappedPn);
            if (number) return number;
        }
    }

    return null;
}

async function isBotParticipant(sock, subBot, participant, botPhones) {
    if (!participant) return false;

    const participantPhone = await participantPhoneNumber(sock, participant);
    if (participantPhone && botPhones.has(participantPhone)) return true;

    const participantId = normalizeJid(participant.id);
    if (participantId && isPnJid(participantId)) {
        const participantNumber = getNumber(participantId);
        if (participantNumber && botPhones.has(participantNumber)) return true;
    }

    const botIds = [
        sock?.user?.id,
        sock?.authState?.creds?.me?.id,
        sock?.authState?.creds?.me?.lid,
    ].filter(Boolean).map(normalizeJid);

    if (participantId && botIds.includes(participantId)) return true;

    const participantLid = normalizeJid(participant.lid);
    if (participantLid && botIds.includes(participantLid)) return true;

    return false;
}

async function getFreshGroupMetadata(sock, groupJid, fallback) {
    if (!groupJid) return fallback || {};
    try {
        if (typeof sock?.groupMetadata === 'function') {
            const fresh = await sock.groupMetadata(groupJid);
            if (fresh) return { ...(fallback || {}), ...fresh };
        }
    } catch {}
    return fallback || {};
}

async function getGroupInviteLink(sock, groupJid, groupMetadata) {
    if (!groupJid) return null;
    if (groupMetadata?.inviteCode) return `https://chat.whatsapp.com/${groupMetadata.inviteCode}`;
    try {
        if (typeof sock?.groupInviteCode === 'function') {
            const code = await sock.groupInviteCode(groupJid);
            if (code) return `https://chat.whatsapp.com/${code}`;
        }
    } catch {}
    return null;
}

async function buildAdmins(sock, participants) {
    const admins = [];

    for (const participant of participants) {
        const role = getAdminRole(participant);
        if (!role) continue;

        const number = await participantPhoneNumber(sock, participant);
        const jid = participant?.id || participant?.pn || participant?.phoneNumber || participant?.lid || null;

        admins.push({ number, jid, role, fullJid: jid ? getFullJid(jid) : null });
    }

    const uniqueAdmins = [];
    const adminSeen = new Set();

    for (const admin of admins) {
        const key = admin.number || admin.fullJid || `unknown:${admin.role}`;
        if (adminSeen.has(key)) continue;
        adminSeen.add(key);
        uniqueAdmins.push(admin);
    }

    return uniqueAdmins;
}

async function detectBotRole(sock, subBot, group, botPhones) {
    const participants = Array.isArray(group?.participants) ? group.participants : [];
    let botParticipant = null;

    for (const participant of participants) {
        if (await isBotParticipant(sock, subBot, participant, botPhones)) {
            botParticipant = participant;
            break;
        }
    }

    const botRole = getAdminRole(botParticipant) || 'member';

    return {
        botParticipant,
        botRole,
        botIsAdmin: botRole === 'admin' || botRole === 'superadmin',
    };
}

function buildGroupReportData(group, participants, botInfo, inviteLink, admins) {
    return {
        id: group?.id || 'غير متاح',
        subject: group?.subject || 'بدون اسم',
        subjectOwner: getSubjectOwnerJid(group),
        owner: getOwnerJid(group),
        description: getGroupDescription(group),
        creation: group?.creation,
        participantCount: getGroupSize(group, participants),
        announcement: group?.announce === true,
        restrict: group?.restrict === true,
        memberAddMode: group?.memberAddMode,
        joinApprovalMode: group?.joinApprovalMode,
        addressingMode: group?.addressingMode,
        isCommunity: group?.isCommunity === true,
        isCommunityAnnounce: group?.isCommunityAnnounce === true,
        linkedParent: group?.linkedParent || null,
        ephemeralDuration: group?.ephemeralDuration,
        inviteCode: group?.inviteCode || null,
        author: group?.author || null,
        authorPn: group?.authorPn || null,
        authorUsername: group?.authorUsername || null,
        descId: group?.descId || null,
        descTime: group?.descTime,
        descOwner: group?.descOwner || null,
        descOwnerPn: group?.descOwnerPn || null,
        descOwnerUsername: group?.descOwnerUsername || null,
        botIsAdmin: botInfo.botIsAdmin,
        botRole: botInfo.botRole,
        botParticipant: botInfo.botParticipant,
        inviteLink,
        admins,
    };
}

// ═══════════════════════════════════════════════════════════
// 🎨 ZAKHRAFA لمجموعة
// ═══════════════════════════════════════════════════════════

function buildGroupOutput(group, index, section) {
    const roleText = getRoleText(group.botRole);
    const sectionIcon = section === 'top' ? '🏆' : '👑';
    const title = section === 'top' ? `𝐓𝐎𝐏 #${index + 1}` : `𝐀𝐃𝐌𝐈𝐍 #${index + 1}`;

    let output =
        `*⎔┄┄─ ⊱╎⌯ ${sectionIcon} ⌯╎⊰─┄┄⎔*\n` +
        `*┇ ${title} ┇*\n` +
        `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +

        `*┋ 🏷️ الاسـم : ⦓ ${group.subject} ⦔*\n` +
        `*┋ 👥 الأعـضـاء : ⦓ ${group.participantCount} ⦔*\n` +
        `*┋ 🤖 صـلاحـيـة الـبـوت : ⦓ ${roleText} ⦔*\n` +
        `*┋ 🆔 الـمـعـرف : ⦓ ${group.id} ⦔*\n\n` +

        `*⎔┄┄── ⊱╎⌯ 🤖 ⌯╎⊰ ──┄┄⎔*\n` +
        `*┇ حـالـة الـبـوت ┇*\n` +
        `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
        `*┋ 👑 الصلاحية : ⦓ ${roleText} ⦔*\n` +
        `*┋ ${group.botIsAdmin ? '🟢' : '⚪'} أدمن : ⦓ ${group.botIsAdmin ? 'نعم' : 'لا'} ⦔*\n`;

    if (group.botParticipant) {
        output += `*┋ 🆔 Bot JID : ⦓ ${group.botParticipant.id || 'غير متاح'} ⦔*\n`;
    }

    output +=
        `\n*⎔┄┄── ⊱╎⌯ 📋 ⌯╎⊰ ──┄┄⎔*\n` +
        `*┇ مـعـلـومـات الـجـروب ┇*\n` +
        `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
        `*┋ 👥 الأعضاء : ⦓ ${group.participantCount} ⦔*\n` +
        `*┋ 👑 Owner : ⦓ ${getDisplayNumber(group.owner)} ⦔*\n` +
        `*┋ 🆔 Owner JID : ⦓ ${group.owner || 'غير متاح'} ⦔*\n` +
        `*┋ ✏️ Subject Owner : ⦓ ${getDisplayNumber(group.subjectOwner)} ⦔*\n` +
        `*┋ 📅 الإنشاء : ⦓ ${formatDate(group.creation)} ⦔*\n` +
        `*┋ 📝 الوصف : ⦓ ${group.description} ⦔*\n` +
        `*┋ 🆔 Description ID : ⦓ ${group.descId || 'غير متاح'} ⦔*\n` +
        `*┋ 👤 Desc Owner : ⦓ ${getDisplayNumber(group.descOwner)} ⦔*\n` +
        `*┋ 📅 Desc Time : ⦓ ${formatDate(group.descTime)} ⦔*\n\n` +

        `*⎔┄┄── ⊱╎⌯ ⚙️ ⌯╎⊰ ──┄┄⎔*\n` +
        `*┇ إعـدادات الـجـروب ┇*\n` +
        `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
        `*┋ 📢 إعلان فقط : ⦓ ${formatBoolean(group.announcement)} ⦔*\n` +
        `*┋ 🔒 تقييد الإعدادات : ⦓ ${formatBoolean(group.restrict)} ⦔*\n` +
        `*┋ ➕ إضافة أعضاء : ⦓ ${formatMemberAddMode(group.memberAddMode)} ⦔*\n` +
        `*┋ ✅ موافقة الانضمام : ⦓ ${formatBoolean(group.joinApprovalMode)} ⦔*\n` +
        `*┋ 🔗 Addressing : ⦓ ${formatAddressingMode(group.addressingMode)} ⦔*\n` +
        `*┋ ⏳ الرسائل المؤقتة : ⦓ ${formatEphemeralDuration(group.ephemeralDuration)} ⦔*\n` +
        `*┋ 🏘️ النوع : ⦓ ${formatCommunityType(group)} ⦔*\n` +
        `*┋ 🏛️ Community : ⦓ ${formatBoolean(group.isCommunity)} ⦔*\n` +
        `*┋ 📣 Announcement : ⦓ ${formatBoolean(group.isCommunityAnnounce)} ⦔*\n` +
        `*┋ 🔗 Parent : ⦓ ${group.linkedParent || 'غير مرتبط'} ⦔*\n\n`;

    if (group.botIsAdmin) {
        output +=
            `*⎔┄┄── ⊱╎⌯ 🔗 ⌯╎⊰ ──┄┄⎔*\n` +
            `*┇ رابـط الـجـروب ┇*\n` +
            `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n`;

        if (group.inviteLink) {
            output += `*┋ 🌐 ${group.inviteLink}*\n\n`;
        } else {
            output +=
                `*┋ ⚠️ تعذر جلب رابط الدعوة*\n` +
                `*┋ 🔐 صلاحية البوت : أدمن مؤكدة*\n\n`;
        }
    }

    output +=
        `*⎔┄┄── ⊱╎⌯ 👑 ⌯╎⊰ ──┄┄⎔*\n` +
        `*┇ أدمنـز الـجـروب ┇*\n` +
        `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
        `*┋ 🔢 العدد : ⦓ ${group.admins.length} ⦔*\n`;

    if (group.admins.length) {
        for (let i = 0; i < group.admins.length; i++) {
            const admin = group.admins[i];
            const icon = admin.role === 'superadmin' ? '🏆' : '👑';
            const number = admin.number ? `${admin.number}+` : 'رقم غير متاح';

            output +=
                `*┋ ${i + 1}. ${icon} ${number}*\n` +
                `*┋    ↳ JID : ${admin.fullJid || 'غير متاح'}*\n` +
                `*┋    ↳ الصلاحية : ${admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}*\n`;
        }
    } else {
        output += `*┋ لا توجد بيانات أدمن متاحة.*\n`;
    }

    output +=
        `\n*⎔┄┄── ⊱╎⌯ 🧩 ⌯╎⊰ ──┄┄⎔*\n` +
        `*┇ مـعـلـومـات إضـافـيـة ┇*\n` +
        `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
        `*┋ 👤 آخر تعديل : ⦓ ${getDisplayNumber(group.author)} ⦔*\n` +
        `*┋ 🆔 Author JID : ⦓ ${group.author || 'غير متاح'} ⦔*\n` +
        `*┋ 📱 Author PN : ⦓ ${group.authorPn || 'غير متاح'} ⦔*\n` +
        `*┋ 👤 Username : ⦓ ${group.authorUsername || 'غير متاح'} ⦔*\n\n` +

        `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n`;

    return output;
}

// ═══════════════════════════════════════════════════════════
// 🛠️ Sub Bot Helpers
// ═══════════════════════════════════════════════════════════

async function getTargetPhoneNumber(message, sock, args) {
    const contextInfo =
        message?.message?.extendedTextMessage?.contextInfo ||
        message?.message?.imageMessage?.contextInfo ||
        message?.message?.videoMessage?.contextInfo ||
        message?.message?.documentMessage?.contextInfo;

    if (args?.length) {
        const rawArg = String(args[0]).trim();
        if (rawArg) {
            const cleanArg = rawArg.replace(/[^\d]/g, '');
            if (cleanArg) return normalizePhoneNumber(cleanArg);
        }
    }

    const mentionedJid = contextInfo?.mentionedJid?.[0];
    if (mentionedJid) {
        const mentioned = String(mentionedJid);
        if (mentioned.endsWith('@s.whatsapp.net')) {
            return normalizePhoneNumber(mentioned.split('@')[0]);
        }
        if (mentioned.endsWith('@lid') && sock?.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await sock.signalRepository.lidMapping.getPNForLID(mentioned);
                if (pn && String(pn).endsWith('@s.whatsapp.net')) {
                    return normalizePhoneNumber(String(pn).split('@')[0]);
                }
            } catch {}
        }
    }

    const quotedParticipant = contextInfo?.participant;
    if (quotedParticipant) {
        const quoted = String(quotedParticipant);
        if (quoted.endsWith('@s.whatsapp.net')) {
            return normalizePhoneNumber(quoted.split('@')[0]);
        }
        if (quoted.endsWith('@lid') && sock?.signalRepository?.lidMapping?.getPNForLID) {
            try {
                const pn = await sock.signalRepository.lidMapping.getPNForLID(quoted);
                if (pn && String(pn).endsWith('@s.whatsapp.net')) {
                    return normalizePhoneNumber(String(pn).split('@')[0]);
                }
            } catch {}
        }
    }

    return null;
}

function normalizePhoneNumber(number) {
    let clean = String(number || '').replace(/[^\d]/g, '');
    if (clean.startsWith('00')) clean = clean.slice(2);
    if (clean.startsWith('01') && clean.length === 11) clean = `20${clean.slice(1)}`;
    if (clean.startsWith('20') && clean.length === 13 && clean.endsWith('0')) clean = clean.slice(0, -1);
    return clean;
}

// ═══════════════════════════════════════════════════════════
// 🎨 إرسال الكود + زر النسخ (نفس تنصيب)
// ═══════════════════════════════════════════════════════════

async function sendCodeWithCopy(jid, code, number, quoted, sock) {
    if (!sock) throw new Error('Socket غير متصل');
    if (!jid) throw new Error('معرف المحادثة غير موجود');
    if (!code) throw new Error('الكود غير موجود');

    try {
        const interactiveMessage = {
            body: {
                text:
                    `⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ─┄┄⎔*\n` +
                    `*『𝑺𝑼𝑩 𝑩𝑶𝑻 𝑷𝑨𝑰𝑹𝑰𝑵𝑮』*\n` +
                    `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +

                    `*📱 الـرقـم: ⦓ ${number} ⦔*\n\n` +

                    `*📌 خـطـوات الـربـط:*\n\n` +
                    `*1️⃣ افتح واتساب على الهاتف*\n` +
                    `*2️⃣ الإعدادات ← الأجهزة المرتبطة*\n` +
                    `*3️⃣ اضغط ربط جهاز*\n` +
                    `*4️⃣ اختر الربط برقم الهاتف*\n` +
                    `*5️⃣ انسخ الكود من الأسفل 👇🏻*\n\n` +

                    `*⏰ الكود يـنـتـهـي بـعـد 60 ثـانـيـة*\n\n` +

                    `*⎔┄┄─ ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ─┄┄⎔*\n` +
                    `> 『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』`
            },
            footer: {
                text: '𝐒 𝐎 𝐋 𝐎'
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({
                            display_text: 'COPY CODE 📋',
                            copy_code: String(code)
                        })
                    }
                ]
            }
        };

        const waMessage = generateWAMessageFromContent(
            jid,
            {
                interactiveMessage
            },
            {
                userJid: sock.user?.id,
                quoted
            }
        );

        await sock.relayMessage(
            jid,
            waMessage.message,
            {
                messageId: waMessage.key.id,

                additionalNodes: [
                    {
                        tag: "biz",
                        attrs: {},

                        content: [
                            {
                                tag: "interactive",

                                attrs: {
                                    type: "native_flow",
                                    v: "1"
                                },

                                content: [
                                    {
                                        tag: "native_flow",

                                        attrs: {
                                            v: "9",
                                            name: "mixed"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        );
    } catch (error) {
        console.error('❌ Copy button error:', error?.message);

        await sock.sendMessage(jid, {
            text:
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ──┄┄⎔*\n` +
                `*『𝑺𝑼𝑩 𝑩𝑶𝑻 𝑷𝑨𝑰𝑹𝑰𝑵𝑮』*\n` +
                `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*📱 الـرقـم: ⦓ ${number} ⦔*\n\n` +
                `*╭───⊷ 🔐 الـكـود ⊷───╮*\n` +
                `*│*\n` +
                `*│* ⦓ *${code}* ⦔\n` +
                `*│*\n` +
                `*╰──────────────╯*\n\n` +
                `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ──┄┄⎔*\n` +
                `> 『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』`
        }, { quoted });
    }
}

// ═══════════════════════════════════════════════════════════
// 🎯 PERMISSION CHECK
// ═══════════════════════════════════════════════════════════

function isMasterOrDev(jid) {
    if (!jid) return false;
    if (configHelper?.isMaster && configHelper.isMaster(jid)) return true;
    if (configHelper?.isDeveloper && configHelper.isDeveloper(jid)) return true;
    return false;
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN COMMAND
// ═══════════════════════════════════════════════════════════

export default {
    name: "فرعي",
    aliases: ["sub", "فرعى", "بوت_فرعي"],
    description: "إدارة البوتات الفرعية",
    category: "sub",
    developer: false,

    async run({ bot, sock, m, message, args, reply, react, userJid, handler, isDeveloper }) {
        const msg = m || message;
        const sub = global.subBots;

        if (!sub) {
            await react("❌");
            return reply(
                `${SOLO_HEADER}\n\n` +
                `*❌ نـظـام الـبـوتـات الـفـرعـيـة غـيـر مـتـاح*\n\n` +
                `${SOLO_FOOTER}`
            );
        }

        const parsedArgs = normalizeArgs(args);
        const action = parsedArgs[0]?.toLowerCase();

        const senderJid = userJid || msg.key?.participant || msg.key?.remoteJid;
        const senderIsMasterOrDev =
            isDeveloper === true ||
            isMasterOrDev(senderJid) ||
            (handler?.isDeveloper && handler.isDeveloper(senderJid));

        // ═══════════════════════════════════════════════════════
        // 📋 عرض القائمة
        // ═══════════════════════════════════════════════════════

        if (!action) {
            await react("🤖");
            return reply(
                `${SOLO_HEADER}\n\n` +
                `*🏮┇ نـظـام الـبـوتـات الـفـرعـيـة ┇🏮*\n` +
                `*⎔┄┄── ⊱╎⌯ 🤖 ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*┋ ➕ .فرعي اضف 201xxxxxxxxx*\n` +
                `*┋ ➖ .فرعي حذف 1*\n` +
                `*┋ ➖ .فرعي حذف الكل*\n` +
                `*┋ 📊 .فرعي حالة*\n` +
                `*┋ 📊 .فرعي حالة 1*\n\n` +
                `${SOLO_HEADER}\n` +
                `${SOLO_FOOTER}`
            );
        }

        // ═══════════════════════════════════════════════════════
        // ➕ إضافة (للجميع) — بنفس فكرة تنصيب
        // ═══════════════════════════════════════════════════════

        if (['اضف', 'اضافة', 'اضافه', 'add'].includes(action)) {
            const number = await getTargetPhoneNumber(msg, sock, parsedArgs.slice(1));

            if (!number) {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ لـم أسـتـطـع الـحـصـول عـلـى رقـم الـهـاتـف*\n\n` +
                    `*📱 أرسـل رقـم الـهـاتـف بعـد الامـر*\n` +
                    `*📝 مـثـال:*\n *.فرعي اضف 201XXXXXXXXX*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            if (!/^\d+$/.test(number)) {
                await react("❌");
                return reply(`*❌ رقـم الـهـاتـف غـيـر صـالـح*\n\n${SOLO_FOOTER}`);
            }

            if (sub.hasPhone(number)) {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ هـذا الـرقـم لـديـه بـوت فـرعـي بـالـفـعـل*\n\n` +
                    `*📱 الـرقـم: ⦓ ${number} ⦔*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            if (sub.list().length >= 10) {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ تـم الـوصـول لـلـحـد الأقـصـى*\n\n` +
                    `*📊 الـحـد الأقـصـى: ⦓ 10 بـوتـات ⦔*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            let timeout = null;

            const state = {
                id: null,
                pairSent: false,
                resolved: false,
                pendingPair: null,
            };

            let handlers = null;

            const cleanup = () => {
                if (!handlers) return;
                sub.off('pair', handlers.pair);
                sub.off('ready', handlers.ready);
                sub.off('error', handlers.error);
            };

            try {
                await react("⏳");

                await reply(
                    `*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰ ──┄┄⎔*\n` +
                    `*『𝑺𝑼𝑩 𝑩𝑶𝑻 𝑺𝒀𝑺𝑻𝑬𝑴』*\n\n` +
                    `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                    `*⏳ جـاري إضـافـة الـبـوت الـفـرعـي...*\n\n` +
                    `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*`
                );

                handlers = {
                    pair: async (id, code) => {
                        if (state.pairSent || state.resolved) return;
                        if (!state.id) { state.pendingPair = { id, code }; return; }
                        if (String(id) !== String(state.id)) return;
                        state.pairSent = true;

                        try {
                            await react("🔐");
                            await sendCodeWithCopy(
                                msg.key.remoteJid,
                                code,
                                number,
                                msg,
                                sock
                            );
                        } catch (error) {
                            state.pairSent = false;
                            console.error('❌ Pairing error:', error?.message);
                        }
                    },

                    ready: async (id) => {
                        if (String(id) !== String(state.id) || state.resolved) return;
                        state.resolved = true;
                        if (timeout) { clearTimeout(timeout); timeout = null; }
                        cleanup();

                        try {
                            await react("✅");
                            const addedBot = sub.get(state.id);
                            const mode = addedBot?.config?.MODE || sub?.config?.MODE || 'Public';

                            await reply(
                                `*╭───⊷ 𝐒 𝐎 𝐋 𝐎 ⊷───╮*\n` +
                                `*│*  ✅ تـم الـربـط بـنـجـاح\n` +
                                `*│*\n` +
                                `*│* 🤖 الـبـوت: *SOLO-XBOT ${state.id}*\n` +
                                `*│* 📱 الـرقـم: *${number}*\n` +
                                `*│* 🌐 الـحـالـة: *${mode}*\n` +
                                `*│*\n` +
                                `*│* الـبـوت جـاهـز لـلاسـتـخـدام الآن.\n` +
                                `*╰───⊷ 🏮 ⊷───╯*`
                            );
                        } catch {}
                    },

                    error: async (id, error) => {
                        if (String(id) !== String(state.id) || state.resolved) return;
                        state.resolved = true;
                        if (timeout) { clearTimeout(timeout); timeout = null; }
                        cleanup();

                        try {
                            await reply(
                                `*❌ فـشـل اقـتـران الـبـوت الـفـرعـي*\n\n` +
                                `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                                `*⚠️ الـخـطـأ: ⦓ ${error?.message || 'غـيـر مـعـروف'} ⦔*\n\n` +
                                `${SOLO_FOOTER}`
                            );
                        } catch {}
                    },
                };

                sub.on('pair', handlers.pair);
                sub.on('ready', handlers.ready);
                sub.on('error', handlers.error);

                // ═══════════════════════════════════════════════════════
                // 🎯 تمرير الكود المخصص عبر global
                // ═══════════════════════════════════════════════════════
                global.__CUSTOM_PAIR_CODE__ = CUSTOM_PAIR_CODE;

                try {
                    state.id = await sub.add(number);
                } finally {
                    setTimeout(() => {
                        delete global.__CUSTOM_PAIR_CODE__;
                    }, 10000);
                }

                if (state.pendingPair && String(state.pendingPair.id) === String(state.id) && !state.pairSent) {
                    state.pairSent = true;
                    await react("🔐");
                    await sendCodeWithCopy(
                        msg.key.remoteJid,
                        state.pendingPair.code,
                        number,
                        msg,
                        sock
                    );
                }

                timeout = setTimeout(async () => {
                    if (state.resolved) return;
                    state.resolved = true;
                    cleanup();

                    try {
                        await reply(
                            state.pairSent
                                ? `*⏰ تـم إرسـال الـكـود ولـكـن لـم يـتـم الـتـأكـيـد*\n\n` +
                                  `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                                  `*تـأكـد مـن إدخـال الـكـود فـي واتـسـاب*\n\n` +
                                  `${SOLO_FOOTER}`
                                : `*⏰ لـم يـتـمـكـن الـبـوت مـن إرسـال الـكـود خـلال 120 ثـانـيـة*\n\n` +
                                  `*📱 الـرقـم: ⦓ ${number} ⦔*\n` +
                                  `*الـرجـاء الـمـحـاولـة مـرة أخـرى*\n\n` +
                                  `${SOLO_FOOTER}`
                        );
                    } catch {}
                }, 120000);

            } catch (error) {
                console.error('❌ Add Error:', error);
                if (timeout) clearTimeout(timeout);
                cleanup();

                await reply(
                    `*❌ حـدث خـطـأ أثـنـاء الإضـافـة*\n\n` +
                    `*⚠️ ⦓ ${error?.message || 'خـطـأ غـيـر مـعـروف'} ⦔*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            return;
        }

        // ═══════════════════════════════════════════════════════
        // 🗑️ حذف (للمطورين والماستر فقط)
        // ═══════════════════════════════════════════════════════

        if (['حذف', 'ازاله', 'ازالة', 'احذف', 'remove', 'delete'].includes(action)) {
            if (!senderIsMasterOrDev) {
                await react("🚫");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ هـذا الأمـر لـلـمـطـوࢪيـن والـمـاسـتـࢪ فـقـط*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            const target = parsedArgs[1]?.toLowerCase();

            // 🗑️ حذف الكل
            if (target === 'الكل' || target === 'all') {
                const allBots = sub.list();

                if (allBots.length === 0) {
                    await react("⚠️");
                    return reply(
                        `${SOLO_HEADER}\n\n` +
                        `*⚠️ لا يـوجـد بـوتـات فـرعـيـة لـلـحـذف*\n\n` +
                        `${SOLO_FOOTER}`
                    );
                }

                await react("🗑️");

                let removed = 0;
                let failed = 0;

                for (const botData of allBots) {
                    try {
                        await sub.remove(botData.id);
                        removed++;
                    } catch (e) {
                        failed++;
                        console.error(`❌ Failed to remove ${botData.id}:`, e?.message);
                    }
                }

                await react("✅");

                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*🏮┇ حـذف جـمـيـع الـبـوتـات ┇🏮*\n` +
                    `*⎔┄┄── ⊱╎⌯ 🗑️ ⌯╎⊰ ──┄┄⎔*\n\n` +
                    `*┋ ✅ تـم حـذف: ⦓ ${removed} بـوت ⦔*\n` +
                    `*┋ ❌ فـشـل: ⦓ ${failed} بـوت ⦔*\n\n` +
                    `*┋ 🗑️ تـم حـذف الـSessions والـبـوتـات مـن الـمـديـر.\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            }

            // 🗑️ حذف واحد
            let rawTarget = parsedArgs[1];

            if (!rawTarget) {
                const contextInfo = msg?.message?.extendedTextMessage?.contextInfo;
                if (contextInfo?.mentionedJid?.length) {
                    rawTarget = contextInfo.mentionedJid[0];
                } else if (contextInfo?.participant) {
                    rawTarget = contextInfo.participant;
                }
            }

            if (!rawTarget) {
                await react("⚠️");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*🏮┇ حـذف بـوت فـرعـي ┇🏮*\n` +
                    `*⎔┄┄── ⊱╎⌯ 🗑️ ⌯╎⊰ ──┄┄⎔*\n\n` +
                    `*┋ ❌ أرسـل ID الـبـوت أو رقـمـه*\n\n` +
                    `*📝 أمـثـلـة:*\n` +
                    `*┋ ➖ .فرعي حذف 1*\n` +
                    `*┋ ➖ .فرعي حذف 201xxxxxxxxx*\n` +
                    `*┋ ➖ .فرعي حذف الكل*\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            }

            const cleanTarget = String(rawTarget)
                .split(':')[0]
                .split('@')[0]
                .replace(/[^\d]/g, '');

            let botData = null;

            if (/^\d$/.test(cleanTarget)) {
                botData = sub.get(cleanTarget);
            }

            if (!botData) {
                botData = sub.list().find(bot => bot.phone === cleanTarget);
            }

            if (!botData) {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ لـم يـتـم الـعـثـور عـلـى بـوت فـرعـي بـهـذا الـID أو الـرقـم*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            const botId = botData.id;
            const botName = botData.name;
            const botPhone = botData.phone;

            await sub.remove(botId);
            await react("🗑️");

            return reply(
                `${SOLO_HEADER}\n\n` +
                `*🏮┇ تـم حـذف الـبـوت الـفـرعـي ┇🏮*\n` +
                `*⎔┄┄── ⊱╎⌯ ✅ ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*┋ 🤖 الـبـوت : ⦓ ${botName} ⦔*\n` +
                `*┋ 🆔 الـID : ⦓ ${botId} ⦔*\n` +
                `*┋ 📱 الـرقـم : ⦓ ${botPhone || 'غير معروف'} ⦔*\n\n` +
                `*┋ 🗑️ تـم حـذف الـSession والـبـوت مـن الـمـديـر.\n\n` +
                `${SOLO_HEADER}\n` +
                `${SOLO_FOOTER}`
            );
        }

        // ═══════════════════════════════════════════════════════
        // 📊 حالة البوت (للمطورين والماستر فقط)
        // ═══════════════════════════════════════════════════════

        if (['حاله', 'حالة', 'ستيت', 'status', 'state'].includes(action)) {
            if (!senderIsMasterOrDev) {
                await react("🚫");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ هـذا الأمـر لـلـمـطـوࢪيـن والـمـاسـتـࢪ فـقـط*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            const botId = parsedArgs[1];

            // 📋 قائمة البوتات
            if (!botId) {
                const bots = sub.list();

                if (bots.length === 0) {
                    await react("📭");
                    return reply(
                        `${SOLO_HEADER}\n\n` +
                        `*🏮┇ الـبـوتـات الـفـرعـيـة ┇🏮*\n` +
                        `*⎔┄┄── ⊱╎⌯ 📭 ⌯╎⊰ ──┄┄⎔*\n\n` +
                        `*┋ لا يـوجـد بـوتـات فـرعـيـة*\n\n` +
                        `*📌 لإضـافـة بـوت:*\n` +
                        `*┋ .فرعي اضف 201xxxxxxxxx*\n\n` +
                        `${SOLO_HEADER}\n` +
                        `${SOLO_FOOTER}`
                    );
                }

                let listText = '';

                for (const b of bots) {
                    const status = b.connected ? '🟢 متصل' : '🔴 غير متصل';
                    listText +=
                        `*┋ 🤖 ${b.name}*\n` +
                        `*┋   ├ 📱 ${b.phone || 'غير معروف'}*\n` +
                        `*┋   ├ 🔌 ${status}*\n` +
                        `*┋   ├ 💬 ${b.messages || 0} رسالة\n` +
                        `*┋   └ 🆔 ${b.id}*\n` +
                        `*┋*\n`;
                }

                await react("📊");

                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*🏮┇ قـائـمـة الـبـوتـات الـفـرعـيـة ┇🏮*\n` +
                    `*⎔┄┄── ⊱╎⌯ 📊 ⌯╎⊰ ──┄┄⎔*\n\n` +
                    `${listText}` +
                    `*┋ 📌 للتفاصيل: .فرعي حالة [ID]*\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            }

            // 📊 تفاصيل بوت
            if (!/^\d+$/.test(botId)) {
                await react("⚠️");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*⚠️ اكـتـب رقـم الـبـوت بـعـد الأمـر*\n\n` +
                    `*📝 مـثـال: .فرعي حالة 1*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            const subBot = sub.get(botId);

            if (!subBot) {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ الـبـوت الـفـرعـي ⦓ ${botId} ⦔ غـيـر مـوجـود*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            if (!subBot.sock) {
                await react("🔌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*🏮┇ الاتـصـال ┇🏮*\n` +
                    `*⎔┄┄── ⊱╎⌯ 🔌 ⌯╎⊰ ──┄┄⎔*\n\n` +
                    `*┋ 🤖 الـبـوت : ⦓ ${botId} ⦔*\n` +
                    `*┋ 🔴 الـحـالـة : غـيـر مـتـصـل*\n` +
                    `*┋ ⚠️ لا يـوجـد Socket نـشـط*\n\n` +
                    `${SOLO_HEADER}\n` +
                    `${SOLO_FOOTER}`
                );
            }

            const sock = subBot.sock;
            const botPhones = getBotPhoneCandidates(subBot, sock);

            let groupsData;

            try {
                groupsData = await sock.groupFetchAllParticipating();
            } catch (error) {
                await react("❌");
                return reply(
                    `${SOLO_HEADER}\n\n` +
                    `*❌ فـشـل جـلـب الـمـجـمـوعـات*\n\n` +
                    `*📌 ⦓ ${error?.message || 'خطأ غير معروف'} ⦔*\n\n` +
                    `${SOLO_FOOTER}`
                );
            }

            const allGroups = Object.values(groupsData || {});

            const analyzedGroups = [];

            for (const group of allGroups) {
                const participants = Array.isArray(group?.participants) ? group.participants : [];
                const botInfo = await detectBotRole(sock, subBot, group, botPhones);

                analyzedGroups.push({
                    group,
                    participants,
                    botInfo,
                    size: getGroupSize(group, participants),
                });
            }

            const top15 = [...analyzedGroups].sort((a, b) => b.size - a.size).slice(0, 15);
            const adminGroups = analyzedGroups.filter(item => item.botInfo.botIsAdmin);

            const selected = [];
            const selectedIds = new Set();

            for (const item of top15) {
                const id = item.group?.id;
                if (!id || selectedIds.has(id)) continue;
                selectedIds.add(id);
                selected.push({ ...item });
            }

            for (const item of adminGroups) {
                const id = item.group?.id;
                if (!id || selectedIds.has(id)) continue;
                selectedIds.add(id);
                selected.push({ ...item });
            }

            const reports = [];

            for (const item of selected) {
                const originalGroup = item.group;
                const groupJid = originalGroup?.id;
                const group = await getFreshGroupMetadata(sock, groupJid, originalGroup);
                const participants = Array.isArray(group?.participants) ? group.participants : item.participants;
                const freshBotInfo = await detectBotRole(sock, subBot, group, botPhones);

                let inviteLink = null;
                if (freshBotInfo.botIsAdmin) {
                    inviteLink = await getGroupInviteLink(sock, groupJid, group);
                }

                const admins = await buildAdmins(sock, participants);
                const report = buildGroupReportData(group, participants, freshBotInfo, inviteLink, admins);

                reports.push(report);
            }

            const reportMap = new Map(reports.map(report => [normalizeJid(report.id), report]));

            const topReports = [];
            for (const item of top15) {
                const id = normalizeJid(item.group?.id);
                if (!id) continue;
                const report = reportMap.get(id);
                if (report) topReports.push(report);
            }

            const adminReports = [];
            for (const item of adminGroups) {
                const id = normalizeJid(item.group?.id);
                if (!id) continue;
                const report = reportMap.get(id);
                if (report) adminReports.push(report);
            }

            const topAdminReports = topReports.filter(g => g.botIsAdmin);
            const superAdminGroups = adminReports.filter(g => g.botRole === 'superadmin');
            const adminOnlyGroups = adminReports.filter(g => g.botRole === 'admin');
            const groupsWithLinks = adminReports.filter(g => g.inviteLink);
            const groupsWithoutLinks = adminReports.filter(g => !g.inviteLink);

            const totalTopParticipants = topReports.reduce((s, g) => s + Number(g.participantCount || 0), 0);
            const totalAdminParticipants = adminReports.reduce((s, g) => s + Number(g.participantCount || 0), 0);

            const phone = subBot.phone || sock?.user?.id || sock?.authState?.creds?.me?.id || 'غير متاح';
            const name = subBot.name || sock?.user?.name || `SOLO BOT ${botId}`;

            // ═══════════════════════════════════════
            // 📄 الرسالة الأولى: TOP 15
            // ═══════════════════════════════════════

            let topOutput =
                `${SOLO_HEADER}\n\n` +

                `*🏮┇ 𝐓𝐎𝐏 𝟏𝟓 𝐆𝐑𝐎𝐔𝐏𝐒 ┇🏮*\n` +
                `*┋ أكبر 15 مجموعة من حيث الأعضاء\n` +
                `*⎔┄┄── ⊱╎⌯ 🏆 ⌯╎⊰ ──┄┄⎔*\n\n` +

                `*┋ 🆔 الـID : ⦓ ${botId} ⦔*\n` +
                `*┋ 👤 الاسم : ⦓ ${name} ⦔*\n` +
                `*┋ 📱 الـJID : ⦓ ${phone} ⦔*\n` +
                `*┋ 🔌 الاتصال : ⦓ ${subBot.connected ? '🟢 متصل' : '🔴 غير متصل'} ⦔*\n\n` +

                `*⎔┄┄── ⊱╎⌯ 📊 ⌯╎⊰ ──┄┄⎔*\n` +
                `*┇ إحصائيات الـ15 ┇*\n` +
                `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*┋ 🏆 عدد الجروبات : ⦓ ${topReports.length} ⦔*\n` +
                `*┋ 👑 أدمن ضمنها : ⦓ ${topAdminReports.length} ⦔*\n` +
                `*┋ 👥 مجموع الأعضاء : ⦓ ${totalTopParticipants} ⦔*\n\n` +
                `${SOLO_HEADER}\n\n`;

            for (let i = 0; i < topReports.length; i++) {
                topOutput += buildGroupOutput(topReports[i], i, 'top');
            }

            topOutput +=
                `*🏮┇ 𝐓𝐎𝐏 𝟏𝟓 𝐑𝐄𝐏𝐎𝐑𝐓 ┇🏮*\n` +
                `*⎔┄┄── ⊱╎⌯ 📊 ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*┋ 🤖 البوت : ⦓ ${name} ⦔*\n` +
                `*┋ 🆔 ID : ⦓ ${botId} ⦔*\n` +
                `*┋ 🏆 أكبر مجموعات : ⦓ ${topReports.length} ⦔*\n` +
                `*┋ 👑 أدمن ضمنها : ⦓ ${topAdminReports.length} ⦔*\n` +
                `*┋ 👥 مجموع الأعضاء : ⦓ ${totalTopParticipants} ⦔*\n\n` +
                `${SOLO_HEADER}\n` +
                `${SOLO_FOOTER}`;

            // ═══════════════════════════════════════
            // 📄 الرسالة الثانية: ADMIN GROUPS
            // ═══════════════════════════════════════

            let adminOutput =
                `${SOLO_HEADER}\n\n` +

                `*🏮┇ 𝐀𝐃𝐌𝐈𝐍 𝐆𝐑𝐎𝐔𝐏𝐒 ┇🏮*\n` +
                `*┋ جميع المجموعات التي البوت أدمن فيها\n` +
                `*⎔┄┄── ⊱╎⌯ 👑 ⌯╎⊰ ──┄┄⎔*\n\n` +

                `*┋ 🆔 الـID : ⦓ ${botId} ⦔*\n` +
                `*┋ 👤 الاسم : ⦓ ${name} ⦔*\n` +
                `*┋ 📱 الـJID : ⦓ ${phone} ⦔*\n` +
                `*┋ 🔌 الاتصال : ⦓ ${subBot.connected ? '🟢 متصل' : '🔴 غير متصل'} ⦔*\n\n` +

                `*⎔┄┄── ⊱╎⌯ 👑 ⌯╎⊰ ──┄┄⎔*\n` +
                `*┇ إحصائيات الأدمن ┇*\n` +
                `*⎔┄┄── ⊱╎⌯ 🏮 ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*┋ 👑 إجمالي جروبات الأدمن : ⦓ ${adminReports.length} ⦔*\n` +
                `*┋ 🏆 Super Admin : ⦓ ${superAdminGroups.length} ⦔*\n` +
                `*┋ 👑 Admin : ⦓ ${adminOnlyGroups.length} ⦔*\n` +
                `*┋ 🔗 روابط متاحة : ⦓ ${groupsWithLinks.length} ⦔*\n` +
                `*┋ ⚠️ روابط غير متاحة : ⦓ ${groupsWithoutLinks.length} ⦔*\n` +
                `*┋ 👥 مجموع الأعضاء : ⦓ ${totalAdminParticipants} ⦔*\n` +
                `*┋ 🏆 أدمن داخل Top 15 : ⦓ ${topAdminReports.length} ⦔*\n\n` +
                `${SOLO_HEADER}\n\n`;

            if (adminReports.length) {
                for (let i = 0; i < adminReports.length; i++) {
                    adminOutput += buildGroupOutput(adminReports[i], i, 'admin');
                }
            } else {
                adminOutput +=
                    `*🏮┇ ⚠️ لا توجد مجموعات أدمن ┇🏮*\n` +
                    `*⎔┄┄── ⊱╎⌯ ⚠️ ⌯╎⊰ ──┄┄⎔*\n\n` +
                    `*┋ البوت ليس Admin في أي مجموعة.*\n\n` +
                    `${SOLO_HEADER}\n\n`;
            }

            adminOutput +=
                `*🏮┇ 𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐏𝐎𝐑𝐓 ┇🏮*\n` +
                `*⎔┄┄── ⊱╎⌯ 📊 ⌯╎⊰ ──┄┄⎔*\n\n` +
                `*┋ 🤖 البوت : ⦓ ${name} ⦔*\n` +
                `*┋ 🆔 ID : ⦓ ${botId} ⦔*\n` +
                `*┋ 👑 جروبات الأدمن : ⦓ ${adminReports.length} ⦔*\n` +
                `*┋ 🏆 Super Admin : ⦓ ${superAdminGroups.length} ⦔*\n` +
                `*┋ 👑 Admin : ⦓ ${adminOnlyGroups.length} ⦔*\n` +
                `*┋ 🔗 روابط متاحة : ⦓ ${groupsWithLinks.length} ⦔*\n` +
                `*┋ ⚠️ روابط غير متاحة : ⦓ ${groupsWithoutLinks.length} ⦔*\n` +
                `*┋ 👥 مجموع الأعضاء : ⦓ ${totalAdminParticipants} ⦔*\n` +
                `*┋ 🏆 ضمن أكبر 15 : ⦓ ${topAdminReports.length} ⦔*\n\n` +
                `${SOLO_HEADER}\n` +
                `${SOLO_FOOTER}`;

            await react("📊");
            await reply(topOutput);

            if (adminReports.length) {
                await reply(adminOutput);
            }

            return;
        }

        // ═══════════════════════════════════════════════════════
        // ❌ أمر غير معروف
        // ═══════════════════════════════════════════════════════

        await react("❓");
        return reply(
            `${SOLO_HEADER}\n\n` +
            `*❓ أمـر غـيـر مـعـروف: ⦓ ${action} ⦔*\n\n` +
            `*📌 الأوامـر الـمـتـوفـرة:*\n` +
            `*┋ ➕ .فرعي اضف 201xxxxxxxxx*\n` +
            `*┋ ➖ .فرعي حذف 1*\n` +
            `*┋ ➖ .فرعي حذف الكل*\n` +
            `*┋ 📊 .فرعي حالة*\n` +
            `*┋ 📊 .فرعي حالة 1*\n\n` +
            `${SOLO_HEADER}\n` +
            `${SOLO_FOOTER}`
        );
    }
};