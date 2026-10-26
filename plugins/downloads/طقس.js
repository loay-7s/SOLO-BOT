// plugins/طقس.js
// ⚔️ SOLO WEATHER SYSTEM ⚔️

import axios from 'axios';

export default {
    name: "طقس",
    aliases: ["weather", "الجو"],
    category: "tools",
    description: "جلب حالة الطقس لأي مدينة",

    async run({ sock, m, args, reply, react, userJid }) {
        const chatId = m.key.remoteJid;
        const city = args.join(" ");

        if (!city) {
            await react("🌤️");
            return reply(`*╭─━━━━━━━━━━━━━━━━━─╮*
*│ 🌤️ حـالـة الـطـقـس*
*╰─━━━━━━━━━━━━━━━━━─╯*

*📝 اكـتـب اسـم الـمـديـنـة*

*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*

📌 *.طقس القاهرة*
📌 *.طقس الرياض*
📌 *.طقس دبي*

⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`);
        }

        await react("☁️");

        try {
            // ✅ 1. البحث عن إحداثيات المدينة
            const geoRes = await axios.get(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ar&format=json`,
                { timeout: 10000 }
            );

            if (!geoRes.data.results || geoRes.data.results.length === 0) {
                await react("❌");
                return reply(`*❌ لـم أجـد بـيـانـات لـهـذه الـمـديـنـة!*\n📌 تـأكـد مـن صـحـة الاسـم`);
            }

            const { latitude, longitude, name, country, timezone } = geoRes.data.results[0];

            // ✅ 2. جلب تفاصيل الطقس
            const weatherRes = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m&timezone=auto`,
                { timeout: 15000 }
            );

            const current = weatherRes.data.current;

            // ✅ 3. تحديد أيقونة الطقس حسب الحالة
            let weatherIcon = "🌤️";
            const weatherCode = current.weather_code || 0;
            if (weatherCode === 0) weatherIcon = "☀️";
            else if (weatherCode === 1 || weatherCode === 2) weatherIcon = "⛅";
            else if (weatherCode === 3) weatherIcon = "☁️";
            else if (weatherCode >= 51 && weatherCode <= 67) weatherIcon = "🌧️";
            else if (weatherCode >= 71 && weatherCode <= 77) weatherIcon = "❄️";
            else if (weatherCode >= 80 && weatherCode <= 99) weatherIcon = "⛈️";

            // ✅ 4. تحديد الوقت (نهار/ليل)
            const isDay = current.is_day === 1 ? "☀️ نـهـار" : "🌙 لـيـل";

            // ✅ 5. تجهيز الرد
            const weatherText = `*⎔┄┄─── ⊱╎⌯ 🌤️ ⌯╎⊰ ───┄┄⎔*

      *🏮┇ حـالـة الـطـقـس ┇🏮*

*⎔┄┄─── ⊱╎⌯ 📍 ⌯╎⊰ ───┄┄⎔*

*┋ الـمـديـنـة : ⦓ ${name} - ${country} ⦔*

*┋ الـتـوقـيـت : ⦓ ${current.time.split('T')[1]} ⦔*

*┋ الـمـنـطـقـة : ⦓ ${timezone} ⦔*

*⎔┄┄─── ⊱╎⌯ 🌡️ ⌯╎⊰ ───┄┄⎔*

*┋ الـحـرارة : ⦓ ${Math.round(current.temperature_2m)}°C ⦔*

*┋ الـحـرارة الـمـحـسـوسـة : ⦓ ${Math.round(current.apparent_temperature)}°C ⦔*

*┋ الـرطـوبـة : ⦓ ${current.relative_humidity_2m}% ⦔*

*┋ غـطـاء الـسـحـب : ⦓ ${current.cloud_cover}% ⦔*

*┋ سـرعـة الـريـاح : ⦓ ${current.wind_speed_10m} km/h ⦔*

*┋ الـضـغـط الـجـوي : ⦓ ${Math.round(current.surface_pressure)} hPa ⦔*

*┋ الـهـطـول : ⦓ ${current.precipitation} mm ⦔*

*┋ الـحـالـة : ⦓ ${weatherIcon} ${isDay} ⦔*

*⎔┄┄─── ⊱╎⌯ 🏮 ⌯╎⊰ ───┄┄⎔*
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;

            await reply(weatherText);
            await react("✅");

        } catch (error) {
            console.error("❌ Weather Error:", error);
            await react("❌");

            let errorMsg = 'حـاول مـرة اخـرى';
            if (error.code === 'ECONNABORTED') {
                errorMsg = 'انـتـهـى وقـت الاتـصـال، حـاول مـرة اخـرى';
            } else if (error.response?.status === 429) {
                errorMsg = 'تـم تـجـاوز حـد الاسـتـخـدام، حـاول بـعـد قـلـيـل';
            }

            await reply(`*⎔┄┄─ ⊱╎⌯ ❌ ⌯╎⊰─┄┄⎔*
*┋ فـشـل جـلـب بـيـانـات الـطـقـس*
*┋ السـبب: ${errorMsg}*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`);
        }
    }
};