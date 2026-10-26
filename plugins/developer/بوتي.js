import { configHelper } from '../../config.js';

export default {
    name: "بوتي",
    aliases: ["solo"],
    category: "مطور",

    async run({ reply, userJid }) {
        if (!configHelper.isMaster(userJid)) {
            return reply("*❌ هـذا الأمـر لـلـمـاسـتـر فـقـط*");
        }

        reply("*أوامـࢪك يـا مـاسـتـࢪ🫴🏻🙂‍↕️*");
    }
};