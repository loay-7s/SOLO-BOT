import fs from "fs";
import path from "path";

export default {
    name: "تعديل",
    developer: true,
    async run({ message, reply, args }) {
        try {
            const cmdName = args[0];
            if (!cmdName) return reply("*❌ حـدد اسـم الأمـࢪ الـذي تـࢪيـد تـعـديـلـه.*");

            // خذ المحتوى من الرد على رسالة
            const content = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
            if (!content) return reply("*❌ ࢪُد عـلـى ࢪسـالـة لـيـتـم تـعـديـل الأمـࢪ بـهـا.*");

            // مسار الملف في plugins
            const filePath = path.join("./plugins", `${cmdName}.js`);
            if (!fs.existsSync(filePath)) return reply("*❌ هـذا الأمـࢪ غـيـࢪ مـوجـود*");

            // استبدل محتوى الملف بالكود من الرد
            fs.writeFileSync(filePath, content.trim());
            reply(`*✏️ تـم تـعـديـل الأمـࢪ* .${cmdName}`);
        } catch (err) {
            reply("❌ خطأ: " + err.message);
        }
    }
};