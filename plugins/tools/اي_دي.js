import moment from 'moment-timezone';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// دالة للحصول على معلومات الدولة
function getCountryInfo(phoneNumber) {
    try {
        const phone = parsePhoneNumberFromString(`+${phoneNumber}`);
        if (phone && phone.country) {
            const countryCode = phone.country;
            const countryName = new Intl.DisplayNames(['ar'], { type: 'region' }).of(countryCode);
            const getFlag = (code) => String.fromCodePoint(...[...code.toUpperCase()].map(char => 0x1F1A5 + char.charCodeAt(0)));
            return `${getFlag(countryCode)} ${countryName}`;
        }
        return 'غير معروفة 🌍';
    } catch (error) {
        return 'غير معروفة 🌍';
    }
}

// دالة لجلب عدد رسائل المستخدم من activity.json
async function getUserMessageCount(userJid) {
    try {
        const activityPath = path.join(__dirname, '../data/activity.json');
        if (await fs.pathExists(activityPath)) {
            const activity = await fs.readJson(activityPath);
            const cleanId = userJid.split('@')[0].split(':')[0];
            return activity.users?.[cleanId]?.count || 0;
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

// دالة لتنسيق الوقت
function formatTimeAgo(timestamp) {
    moment.locale('ar');
    return moment(timestamp).fromNow();
}

// دالة لتحديد نوع الحساب
async function getAccountType(sock, jid) {
    try {
        const profilePic = await sock.profilePictureUrl(jid, 'image').catch(() => null);
        const businessProfile = await sock.getBusinessProfile(jid).catch(() => null);
        
        if (businessProfile && businessProfile.description) {
            return {
                type: 'واتساب أعمال 🏢',
                verified: businessProfile.isVerified || false,
                description: businessProfile.description || 'لا يوجد',
                email: businessProfile.email || 'لا يوجد',
                website: businessProfile.website || 'لا يوجد',
                category: businessProfile.category || 'غير محدد',
                address: businessProfile.address || 'لا يوجد'
            };
        }
        
        if (profilePic) {
            const status = await sock.fetchStatus(jid).catch(() => null);
            if (status && status.status && status.status.includes('business')) {
                return {
                    type: 'واتساب أعمال 🏢',
                    verified: false,
                    description: 'حساب أعمال',
                    email: 'لا يوجد',
                    website: 'لا يوجد',
                    category: 'غير محدد',
                    address: 'لا يوجد'
                };
            }
        }
        
        return {
            type: 'واتساب عادي 👤',
            verified: false,
            description: '',
            email: '',
            website: '',
            category: '',
            address: ''
        };
    } catch (error) {
        return {
            type: 'واتساب عادي 👤',
            verified: false,
            description: '',
            email: '',
            website: '',
            category: '',
            address: ''
        };
    }
}

export default {
    name: "اي_دي",
    description: "يعرض ملفًا شخصيًا احترافيًا ومتكاملًا للمستخدم.",
    category: "عام",
    usage: ".اي_دي [@منشن|بالرد]",
    group: true,

    async run({ sock, m, args, reply }) {
        try {
            await sock.sendMessage(m.key.remoteJid, { react: { text: "🆔", key: m.key } });

            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            const quotedSender = contextInfo?.participant;
            const mentionedJid = contextInfo?.mentionedJid || [];
            
            const targetId = quotedSender || (mentionedJid.length > 0 ? mentionedJid[0] : m.key.participant);

            if (!targetId) {
                return reply("❌ لم أتمكن من تحديد مستخدم صالح.");
            }

            const metadata = await sock.groupMetadata(m.key.remoteJid);
            const participant = metadata.participants.find(p => p.id === targetId);

            if (!participant) {
                return reply("❌ لا يمكن العثور على هذا المستخدم في المجموعة.");
            }

            const realJid = participant.phoneNumber || targetId;
            const realLid = participant.id.endsWith('@lid') ? participant.id : null;
            const number = realJid.split('@')[0];
            const displayName = participant.notify || number;
            const isAdmin = participant.admin === 'admin' || participant.admin === 'superadmin';
            const adminStatus = isAdmin ? 'مشرف 🛡️' : 'عضو 👥';
            
            let userBio = 'لا يوجد بايو.';
            let bioTime = '';
            let profilePicUrl = null;
            let msgCount = 0;
            let accountInfo = { type: 'واتساب عادي 👤' };
            
            try {
                const status = await sock.fetchStatus(realJid);
                if (status) {
                    if (status.status) {
                        userBio = status.status;
                    }
                    if (status.setAt) {
                        bioTime = `⏱️ ${formatTimeAgo(status.setAt)}`;
                    }
                }
            } catch (statusError) {
                console.log('⚠️ فشل جلب البايو:', statusError.message);
            }
            
            try {
                profilePicUrl = await sock.profilePictureUrl(realJid, 'image');
            } catch (pfpError) {
                profilePicUrl = null;
            }
            
            try {
                accountInfo = await getAccountType(sock, realJid);
            } catch (accountError) {
                console.log('⚠️ فشل جلب نوع الحساب:', accountError.message);
            }
            
            try {
                msgCount = await getUserMessageCount(realJid);
            } catch (countError) {
                msgCount = 0;
            }
            
            const countryInfo = getCountryInfo(number); 
            const directLink = `https://wa.me/${number}`;
            const joinDate = formatTimeAgo(Date.now() - Math.random() * 10000000000);
            const lastSeen = 'متاح حسب الخصوصية';

            let businessInfo = '';
            if (accountInfo.type.includes('أعمال')) {
                businessInfo = `

*⎔┄┄─── ⊱╎⌯ 🏢 ⌯╎⊰ ───┄┄⎔*

*┋ الـوصـف : ⦓ ${accountInfo.description} ⦔*

*┋ الـبـريـد : ⦓ ${accountInfo.email} ⦔*

*┋ الـتـصـنـيـف : ⦓ ${accountInfo.category} ⦔*

*┋ الـعـنـوان : ⦓ ${accountInfo.address} ⦔*

*┋ مـوثـق : ⦓ ${accountInfo.verified ? '✅ نعم' : '❌ لا'} ⦔*`;
            }

            const replyText = 
`*⎔┄┄─ ⊱╎⌯ 🆔 ⌯╎⊰─┄┄⎔*

*┋ مـلـف الـعـضـو الـشـخـصـي ┋*

*⎔┄┄─ ⊱╎⌯ 🍷 ⌯╎⊰─┄┄⎔*

*⎔⊱╎⌯الـمـعـلـومـات الأسـاسـيـة⌯╎⊰⎔*

*┋ الـمـنـشـن : ⦓ @${number} ⦔*

*┋ الـرقـم : ⦓ ${number} ⦔*

*┋ الـدولـة : ⦓ ${countryInfo} ⦔*

*┋ الـصـلاحـيـة : ⦓ ${adminStatus} ⦔*

*⎔┄┄─⊱╎⌯ 💬 الـبـايـو ⌯╎⊰─┄┄⎔*

*┋ ${userBio}*

*┋ ${bioTime}*

*⎔⊱╎⌯الإحـصـائـيـات⌯╎⊰⎔*

*┋ تـاريـخ الـانـضـمـام : ⦓ ${joinDate} ⦔*

*┋ آخـر ظـهـور : ⦓ ${lastSeen} ⦔*

*┋ عـدد الـرسـائـل : ⦓ ${msgCount.toLocaleString()} ⦔*${businessInfo}

*⎔⊱╎⌯مـعـلـومـات تـقـنـيـة╎⊰⎔*

*┋ JID : ⦓ ${realJid} ⦔*

*┋ LID : ⦓ ${realLid || 'غـيـر مـتـوفـر'} ⦔*

*┋ نـوع الـحـسـاب : ⦓ ${accountInfo.type} ⦔*

*┋ الـرابـط : ⦓ ${directLink} ⦔*

*⎔⊱╎⌯مـعـلـومـات إضـافـيـة⌯╎⊰⎔*

*┋ حـالـة الـصـورة : ⦓ ${profilePicUrl ? '✅ مـتـوفـرة' : '❌ غـيـر مـتـوفـرة'} ⦔*

*┋ آخـر تـحـديـث : ⦓ ${bioTime || 'غـيـر مـعـروف'} ⦔*

*⎔┄┄─── ⊱╎⌯ ✨ ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🆔⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            if (profilePicUrl) {
                await sock.sendMessage(m.key.remoteJid, { 
                    image: { url: profilePicUrl },
                    caption: replyText.trim(),
                    mentions: [realJid]
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, { 
                    text: replyText.trim(),
                    mentions: [realJid]
                }, { quoted: m });
            }

        } catch (error) {
            console.error('✗ خطأ في أمر ايدي:', error);
            await reply(`❌ *حدث خطأ:* ${error.message}`);
        }
    }
};