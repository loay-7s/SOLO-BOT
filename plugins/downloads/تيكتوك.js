// plugins/تيكتوك.js  
// ⚔️ SOLO TIKTOK SEARCH & DOWNLOADER ⚔️  

import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// ═══════════════════════════════════════════════
// 🎬 تـحـديـد مـسـار ffmpeg تلقائياً
// ═══════════════════════════════════════════════
function setupFfmpeg() {
    const paths = [
        '/data/data/com.termux/files/usr/bin/ffmpeg', // Termux
        '/usr/bin/ffmpeg',                              // Linux
        '/usr/local/bin/ffmpeg',                        // Mac/Linux
        'ffmpeg'                                        // PATH default
    ];

    for (const p of paths) {
        try {
            if (p === 'ffmpeg' || fs.existsSync(p)) {
                ffmpeg.setFfmpegPath(p);
                console.log(`✅ FFmpeg found: ${p}`);
                return;
            }
        } catch {}
    }

    console.log('⚠️ FFmpeg not found — compression will fail if needed');
}

setupFfmpeg();

const API_BASE='https://engez.a7a.online/api/v1';

// الحد الذي يبدأ بعده الضغط
const COMPRESS_THRESHOLD = 20 * 1024 * 1024;

// الحجم المستهدف بعد الضغط
const TARGET_SIZE = 18 * 1024 * 1024;

const MAX_DURATION=180;  
const SOLO_CHANNEL_ID="120363407767420565@newsletter";  

const FOOTER=`*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*  
*┋ 𝑩𝒀 𝑺𝑶𝑳𝑶 𝑩𝑶𝑻 🏮*  
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*  
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`;  
  
const HEADERS={  
    'User-Agent':'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',  
    'Accept':'*/*'  
};  
  
function isTikTokUrl(text){  
    return /(?:www\.|vm\.|vt\.)?tiktok\.com/i.test(text);  
}  
  
function formatSize(bytes){  
    return (bytes/(1024*1024)).toFixed(2);  
}  
  
function shuffle(array){  
    return [...array].sort(()=>Math.random()-0.5);  
}  
  
function parseDuration(value){  
    if(value===undefined||value===null||value==='') return null;  
  
    if(typeof value==='number'){  
        if(value<=0) return null;  
        if(value>10000) return Math.floor(value/1000);  
        return Math.floor(value);  
    }  
  
    const text=String(value).trim();  
  
    if(text.includes(':')){  
        const p=text.split(':').map(Number);  
  
        if(p.length===2&&p.every(Number.isFinite)) {
            return p[0]*60+p[1];  
        }
  
        if(p.length===3&&p.every(Number.isFinite)) {
            return p[0]*3600+p[1]*60+p[2];  
        }
    }  
  
    const min=text.match(
        /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/i
    );
  
    const sec=text.match(
        /(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)/i
    );
  
    if(min||sec) {
        return Math.floor(
            (min?Number(min[1]):0)*60+
            (sec?Number(sec[1]):0)
        );
    }
  
    const num=Number(text);  
  
    if(Number.isFinite(num)&&num>0) {
        return num>10000
            ? Math.floor(num/1000)
            : Math.floor(num);
    }
  
    return null;  
}  
  
function isValidDuration(value){  
    const seconds=parseDuration(value);  
    return seconds!==null&&seconds<=MAX_DURATION;  
}  
  
async function downloadBuffer(url,headers={}){  
    if(!url||typeof url!=='string') {
        throw new Error('رابط التحميل غير صالح');
    }
  
    const response=await axios.get(url,{  
        responseType:'arraybuffer',  
        timeout:120000,  
        maxRedirects:5,  
        validateStatus:s=>s>=200&&s<400,  
        headers:{...HEADERS,...headers}  
    });  
  
    const buffer=Buffer.from(response.data);  
  
    if(!buffer||buffer.length<1024) {
        throw new Error('الملف الذي تم تحميله غير صالح');
    }
  
    return buffer;  
}

// ═══════════════════════════════════════════════
// 🎬 معرفة مدة الفيديو
// ═══════════════════════════════════════════════
async function getVideoDuration(inputPath) {
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(inputPath, (err, data) => {

            if (err) {
                return reject(err);
            }

            const duration = Number(
                data?.format?.duration
            );

            if (!Number.isFinite(duration) || duration <= 0) {
                return reject(
                    new Error('تعذر معرفة مدة الفيديو')
                );
            }

            resolve(duration);
        });

    });
}

// ═══════════════════════════════════════════════
// 🎬 ضـغـط الـفـيـديـو مـع الـحـفـاظ عـلـى الـجـودة
// ═══════════════════════════════════════════════
async function compressVideo(inputBuffer) {
    const tempDir = os.tmpdir();

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const inputPath = path.join(
        tempDir,
        `solo_input_${id}.mp4`
    );

    const outputPath = path.join(
        tempDir,
        `solo_output_${id}.mp4`
    );

    try {
        await fs.promises.writeFile(inputPath, inputBuffer);

        const duration = await new Promise((resolve) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) {
                    console.log("⚠️ تعذر قراءة مدة الفيديو:", err.message);
                    resolve(30);
                    return;
                }

                const d = Number(metadata?.format?.duration);

                resolve(
                    Number.isFinite(d) && d > 0
                        ? d
                        : 30
                );
            });
        });

        const targetSize = 18 * 1024 * 1024;

        const audioBitrate = 96 * 1000;

        const targetVideoBitrate = Math.max(
            800000,
            Math.floor(
                ((targetSize * 8) / duration) - audioBitrate
            )
        );

        console.log("🎬 بدء ضغط الفيديو...");
        console.log("📦 الحجم الأصلي:", formatSize(inputBuffer.length));
        console.log("⏱️ المدة:", duration.toFixed(2), "ثانية");
        console.log(
            "🎯 Video bitrate:",
            Math.floor(targetVideoBitrate / 1000),
            "kbps"
        );

        await new Promise((resolve) => {

            ffmpeg(inputPath)
                .outputOptions([
                    "-acodec", "aac",
                    "-b:a", "96k",

                    "-vcodec", "libx264",
                    "-b:v", `${Math.floor(targetVideoBitrate / 1000)}k`,

                    "-preset", "veryfast",

                    "-movflags", "+faststart",

                    "-pix_fmt", "yuv420p",

                    "-vf",
                    "scale=w=min(iw\\,1280):h=-2"
                ])
                .output(outputPath)

                .on("start", command => {
                    console.log("FFmpeg command:");
                    console.log(command);
                })

                .on("progress", progress => {
                    if (progress.percent) {
                        process.stdout.write(
                            `\r🎬 ضغط الفيديو: ${progress.percent.toFixed(1)}%`
                        );
                    }
                })

                .on("error", err => {
                    console.log(
                        "\n⚠️ FFmpeg أنهى العملية برسالة خطأ:"
                    );

                    console.log(err.message);

                    // مهم:
                    // لا نرفض العملية هنا.
                    // سنفحص ملف الإخراج بعد انتهاء FFmpeg.
                    resolve();
                })

                .on("end", () => {
                    console.log("\n✅ FFmpeg انتهى.");
                    resolve();
                })

                .run();
        });

        // ننتظر لحظة بسيطة للتأكد أن الملف تم إغلاقه وكتابته
        await new Promise(resolve => setTimeout(resolve, 300));

        // ----------------------------------------
        // فحص ملف الإخراج
        // ----------------------------------------

        let outputExists = false;
        let outputSize = 0;

        try {
            const stat = await fs.promises.stat(outputPath);

            outputExists = stat.isFile();
            outputSize = stat.size;

        } catch {
            outputExists = false;
        }

        if (!outputExists || outputSize < 1024) {
            throw new Error(
                "FFmpeg فشل ولم يتم إنشاء ملف إخراج صالح."
            );
        }

        console.log(
            "📦 حجم الناتج:",
            formatSize(outputSize)
        );

        // ----------------------------------------
        // لو الناتج أصغر من الأصلي → استخدمه
        // ----------------------------------------

        if (outputSize < inputBuffer.length) {

            const compressedBuffer =
                await fs.promises.readFile(outputPath);

            console.log(
                "✅ تم ضغط الفيديو بنجاح:",
                formatSize(inputBuffer.length),
                "→",
                formatSize(compressedBuffer.length)
            );

            return compressedBuffer;
        }

        // ----------------------------------------
        // الناتج أكبر من الأصلي
        // ----------------------------------------

        console.log(
            "⚠️ الناتج ليس أصغر من الفيديو الأصلي."
        );

        return inputBuffer;

    } finally {

        // تنظيف الملفات المؤقتة

        try {
            await fs.promises.unlink(inputPath);
        } catch {}

        try {
            await fs.promises.unlink(outputPath);
        } catch {}
    }
}

// ═══════════════════════════════════════════════
// 🎬 تجهيز الفيديو قبل الإرسال
// ═══════════════════════════════════════════════
async function prepareVideo(buffer) {

    // أقل من أو يساوي 20MB
    if (
        buffer.length <=
        COMPRESS_THRESHOLD
    ) {

        return {
            buffer,
            compressed:false
        };

    }

    console.log(
        `⚙️ الفيديو أكبر من 20MB (${formatSize(buffer.length)} MB)`
    );

    // مهم:
    // لا نرجع الفيديو الأصلي لو الضغط فشل.
    // الخطأ سيصل إلى run ويتم إظهاره.
    const compressed =
        await compressVideo(buffer);

    if (
        !compressed ||
        !compressed.length
    ) {

        throw new Error(
            'فشل إنشاء الفيديو المضغوط'
        );

    }

    return {
        buffer:compressed,
        compressed:true
    };
}

// ============================================================  
// 📥 TikTok DOWNLOAD  
// ============================================================  
async function getTikTokData(url){  

    const response=await axios.get(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
        {
            timeout:30000,
            headers:{
                'User-Agent':'Mozilla/5.0'
            }
        }
    );

    if(
        response.data?.code!==0||
        !response.data?.data
    ) {
        throw new Error(
            'فشل الحصول على بيانات الفيديو'
        );
    }

    return response.data.data;
}

// ============================================================  
// 🔎 TikTok SEARCH  
// ============================================================  
async function searchTikTok(query){  

    const params=new URLSearchParams();

    params.append(
        'query',
        query
    );

    params.append(
        'type',
        'videos'
    );

    const response=await axios.get(
        `${API_BASE}/search/tiktok?${params.toString()}`,
        {
            timeout:30000,
            headers:{
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36'
            }
        }
    );

    if(!response.data?.success) {
        throw new Error('فشل البحث');
    }

    return response.data?.response?.results||[];
}

async function findTikTokVideo(query){  

    const results=
        await searchTikTok(query);

    if(
        !Array.isArray(results)||
        !results.length
    ) {
        throw new Error('لا توجد نتائج');
    }

    for(
        const item of
        shuffle(results).slice(0,20)
    ){

        const duration=
            item.video?.duration??
            item.duration??
            item.video_duration;

        if(
            !isValidDuration(duration)
        ) continue;

        const url=
            item.video?.download_url||
            item.video?.downloadUrl||
            item.play||
            item.hdplay||
            item.wmplay;

        if(!url) continue;

        return {

            url,

            title:
                item.desc||
                item.title||
                'بدون عنوان',

            author:
                item.author?.name||
                item.author?.username||
                item.author?.nickname||
                'غير معروف'

        };

    }

    throw new Error(
        'لا توجد نتيجة مناسبة'
    );
}

// ============================================================  
// ▶️ YouTube SEARCH  
// ============================================================  
async function searchYouTube(query){  

    const response=await axios.get(
        `${API_BASE}/search/youtube?q=${encodeURIComponent(query)}`,
        {
            timeout:30000,
            headers:{
                'User-Agent':'Mozilla/5.0'
            }
        }
    );

    if(!response.data?.success) {
        throw new Error('فشل البحث');
    }

    return response.data?.results||
           response.data?.response?.results||
           [];
}

async function findYouTubeVideo(query){  

    const results=
        await searchYouTube(query);

    if(
        !Array.isArray(results)||
        !results.length
    ) {
        throw new Error('لا توجد نتائج');
    }

    for(
        const item of
        shuffle(results).slice(0,20)
    ){

        const duration=
            item.duration??
            item.durationText??
            item.length??
            item.lengthText??
            item.time;

        if(
            !isValidDuration(duration)
        ) continue;

        const id=
            item.id||
            item.videoId;

        if(!id) continue;

        return {

            url:
                `https://www.youtube.com/watch?v=${id}`,

            title:
                item.title||
                'بدون عنوان',

            author:
                item.author||
                item.channel||
                item.channelTitle||
                'غير معروف'

        };

    }

    throw new Error(
        'لا توجد نتيجة مناسبة'
    );
}

async function downloadYouTube(url){  

    const endpoints=[

        `${API_BASE}/download/youtubev2`,

        `${API_BASE}/download/ytdl`,

        `${API_BASE}/download/youtube`

    ];

    let lastError;

    for(
        const endpoint of endpoints
    ){

        try{

            const response=
                await axios.get(
                    endpoint,
                    {
                        params:{
                            url,
                            type:'video'
                        },

                        timeout:120000,

                        headers:{
                            'User-Agent':
                                'Mozilla/5.0'
                        }
                    }
                );

            if(
                !response.data?.success
            ) {
                throw new Error(
                    'فشل التحميل'
                );
            }

            const data=
                response.data?.response||
                response.data?.data||
                {};

            const downloadUrl=
                data.download_url||
                data.downloadUrl||
                data.url;

            if(!downloadUrl) {
                throw new Error(
                    'رابط التحميل غير متوفر'
                );
            }

            return {

                url:downloadUrl,

                title:
                    data.title||
                    null

            };

        }catch(error){

            lastError=error;

            console.error(
                'Video download source failed:',
                error.message
            );

        }

    }

    throw (
        lastError||
        new Error(
            'فشل تحميل الفيديو'
        )
    );
}

// ============================================================  
// 📌 Pinterest SEARCH  
// ============================================================  
async function searchPinterest(query){  

    const url=
        `${API_BASE}/search/pinterest?action=${encodeURIComponent('بحث')}&q=${encodeURIComponent(query)}`;

    const response=
        await axios.get(
            url,
            {
                timeout:30000,
                headers:{
                    'User-Agent':
                        'Mozilla/5.0'
                }
            }
        );

    if(
        response.data?.success!==true
    ) {
        throw new Error('فشل البحث');
    }

    return response.data?.response?.results||[];
}

async function findPinterestVideo(query){  

    const results=
        await searchPinterest(query);

    if(
        !Array.isArray(results)||
        !results.length
    ) {
        throw new Error('لا توجد نتائج');
    }

    for(
        const pin of
        shuffle(results).slice(0,20)
    ){

        const duration=
            pin.duration??
            pin.duration_seconds??
            pin.video_duration??
            pin.length;

        if(
            duration!==undefined&&
            duration!==null&&
            duration!==''&&
            !isValidDuration(duration)
        ) continue;

        let downloadUrl=
            pin.video_url||
            pin.videoUrl;

        if(!downloadUrl){

            if(!pin.pin_url) continue;

            const params=
                new URLSearchParams({
                    action:'تحميل',
                    pinUrl:pin.pin_url
                });

            if(pin.video_url) {
                params.set(
                    'videoUrl',
                    pin.video_url
                );
            }

            if(pin.hls_url) {
                params.set(
                    'hlsUrl',
                    pin.hls_url
                );
            }

            if(pin.video_signature) {
                params.set(
                    'videoSignature',
                    pin.video_signature
                );
            }

            try{

                const response=
                    await axios.get(
                        `${API_BASE}/search/pinterest?${params.toString()}`,
                        {
                            timeout:30000
                        }
                    );

                downloadUrl=
                    response.data?.response?.downloadUrl;

            }catch{

                continue;

            }

        }

        if(!downloadUrl) continue;

        return {

            url:downloadUrl,

            title:
                pin.title||
                'بدون عنوان',

            author:
                'غير معروف'

        };

    }

    throw new Error(
        'لا توجد نتيجة مناسبة'
    );
}

// ============================================================  
// 🔥 البحث الداخلي  
// ============================================================  
async function findSearchVideo(query){  

    const sources=[

        async()=>{

            const r=
                await findTikTokVideo(query);

            return r;

        },

        async()=>{

            const r=
                await findYouTubeVideo(query);

            const d=
                await downloadYouTube(r.url);

            return {

                url:d.url,

                title:
                    d.title||
                    r.title,

                author:
                    r.author

            };

        },

        async()=>{

            return await findPinterestVideo(
                query
            );

        }

    ];

    let lastError;

    for(
        const source of
        shuffle(sources)
    ){

        try{

            const result=
                await source();

            if(!result?.url) continue;

            const buffer=
                await downloadBuffer(
                    result.url
                );

            return {
                ...result,
                buffer
            };

        }catch(error){

            lastError=error;

            console.error(
                'Search attempt failed:',
                error.message
            );

        }

    }

    throw (
        lastError||
        new Error(
            'لم يتم العثور على فيديو مناسب'
        )
    );
}

// ============================================================  
// ⚔️ MAIN  
// ============================================================  
export default {  

    name:"تيكتوك",

    aliases:[
        "tiktok",
        "tt",
        "تيك",
        "تيكو"
    ],

    category:"تحميل",

    desc:"بحث وتحميل فيديوهات",

    async run({
        sock,
        message,
        args,
        react,
        reply
    }){

        const chatId=
            message.key.remoteJid;

        const input=
            args.join(' ').trim();

        if(!input){

            await react("🎵");

            return reply(
`*╭─━━━━━━━━━━━━━━━━━─╮*  
*│           🎵 تـيـك تـوك*  
*╰─━━━━━━━━━━━━━━━━━─╯*  
*📌 ارسـل رابـط أو كـلـمـة بـحـث*  
*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*  
📌 *.تيكتوك ناروتو*  
📌 *.تيكتوك محمد صلاح*  
📌 *.تيكتوك One Piece Edit*  
📌 *.تيكتوك https://tiktok.com/xxx*  
📌 *.تيكتوك صوت https://tiktok.com/xxx*  
*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*  
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`
            );

        }

        // ============================================================
        // 📥 رابط TikTok / صوت TikTok
        // ============================================================

        const audioMode=
            /^(صوت|audio)\s+/i.test(
                input
            );

        const cleanInput=
            audioMode
                ? input
                    .replace(
                        /^(صوت|audio)\s+/i,
                        ''
                    )
                    .trim()
                : input;

        if(
            isTikTokUrl(cleanInput)
        ){

            await react("📥");

            await reply(
`*⎔┄┄─ ⊱╎⌯ ⏳ ⌯╎⊰─┄┄⎔*  
*┋ جـاري ${audioMode?'تـحـمـيـل الـصـوت':'تـحـمـيـل الـفـيـديـو'}...*  
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
            );

            try{

                const videoData=
                    await getTikTokData(
                        cleanInput
                    );

                const videoTitle=
                    videoData.title||
                    'بدون عنوان';

                const authorName=
                    videoData.author?.unique_id||
                    'Unknown';

                // ====================================================
                // 🎵 AUDIO
                // ====================================================

                if(audioMode){

                    if(!videoData.music) {
                        throw new Error(
                            'رابط الصوت غير متوفر'
                        );
                    }

                    const audioResponse=
                        await axios.get(
                            videoData.music,
                            {
                                responseType:
                                    'arraybuffer',

                                timeout:60000,

                                maxRedirects:5,

                                headers:{
                                    'User-Agent':
                                        'Mozilla/5.0'
                                }
                            }
                        );

                    const audioBuffer=
                        Buffer.from(
                            audioResponse.data
                        );

                    if(
                        !audioBuffer||
                        audioBuffer.length<1024
                    ) {
                        throw new Error(
                            'ملف الصوت غير صالح'
                        );
                    }

                    const audioSize=
                        formatSize(
                            audioBuffer.length
                        );

                    await sock.sendMessage(
                        chatId,
                        {
                            audio:audioBuffer,

                            mimetype:
                                'audio/mpeg',

                            fileName:
                                `${videoTitle.replace(/[\\/:*?"<>|]/g,'_')}.mp3`,

                            caption:
`*⎔┄┄─ ⊱╎⌯ 🎵 ⌯╎⊰─┄┄⎔*  
*┋ ${videoTitle.substring(0,60)}*  
*┋ ${authorName}*  
*┋ الـحـجـم : ${audioSize} MB*  
${FOOTER}`,

                            contextInfo:{
                                forwardingScore:999,

                                isForwarded:false,

                                forwardedNewsletterMessageInfo:{
                                    newsletterJid:
                                        SOLO_CHANNEL_ID,

                                    serverMessageId:1,

                                    newsletterName:
                                        '𝑺𝑶𝑳𝑶'
                                }
                            }

                        },
                        {
                            quoted:message
                        }
                    );

                    await react("✅");

                    return;
                }

                // ====================================================
                // 🎥 VIDEO
                // ====================================================

                const videoUrl=
                    videoData.play||
                    videoData.hdplay||
                    videoData.wmplay;

                if(!videoUrl) {
                    throw new Error(
                        'رابط الفيديو غير متوفر'
                    );
                }

                const videoResponse=
                    await axios.get(
                        videoUrl,
                        {
                            responseType:
                                'arraybuffer',

                            headers:{
                                'User-Agent':
                                    'Mozilla/5.0'
                            },

                            timeout:120000,

                            maxRedirects:5
                        }
                    );

                const rawVideoBuffer=
                    Buffer.from(
                        videoResponse.data
                    );

                if(
                    !rawVideoBuffer||
                    rawVideoBuffer.length<1024
                ) {
                    throw new Error(
                        'ملف الفيديو غير صالح'
                    );
                }

                const rawSizeMB=
                    formatSize(
                        rawVideoBuffer.length
                    );

                // ═══════════════════════════════════════
                // 🎬 ضغط تلقائي لو الفيديو أكبر من 20MB
                // ═══════════════════════════════════════

                let videoBuffer=
                    rawVideoBuffer;

                let wasCompressed=false;

                if(
                    rawVideoBuffer.length>
                    COMPRESS_THRESHOLD
                ){

                    await reply(
`*⎔┄┄─ ⊱╎⌯ ⚙️ ⌯╎⊰─┄┄⎔*
*┋ جـاري ضـغـط الـفـيـديـو...* 🎬
*┋ الـحـجـم الأصـلـي : ${rawSizeMB} MB*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                    );

                    const prepared=
                        await prepareVideo(
                            rawVideoBuffer
                        );

                    videoBuffer=
                        prepared.buffer;

                    wasCompressed=
                        prepared.compressed;
                }

                const fileSizeMB=
                    formatSize(
                        videoBuffer.length
                    );

                await sock.sendMessage(
                    chatId,
                    {

                        video:
                            videoBuffer,

                        mimetype:
                            'video/mp4',

                        caption:
`*⎔┄┄─ ⊱╎⌯ 📥 ⌯╎⊰─┄┄⎔*  
*┋ تـم الـتـحـمـيـل مـن تـيـك تـوك*  
*┋ ${videoTitle.substring(0,40)}${videoTitle.length>40?'...':''}*  
*┋ ${authorName}*  
*┋ الـحـجـم : ${fileSizeMB} MB${wasCompressed?' ✨':''}*
${wasCompressed?`*┋ ${rawSizeMB} MB ← ${fileSizeMB} MB (مضغوط)*\n`:''}${FOOTER}`,

                        contextInfo:{
                            forwardingScore:999,

                            isForwarded:false,

                            forwardedNewsletterMessageInfo:{
                                newsletterJid:
                                    SOLO_CHANNEL_ID,

                                serverMessageId:1,

                                newsletterName:
                                    '𝑺𝑶𝑳𝑶'
                            }
                        }

                    },
                    {
                        quoted:message
                    }
                );

                await react("✅");

            }catch(error){

                console.error(
                    "❌ TikTok Download Error:",
                    error
                );

                await react("❌");

                await reply(
`*❌ فـشـل تـحـمـيـل الـ${audioMode?'صـوت':'فـيـديـو'}*  
📌 ${error?.message||'حـاول مـرة اخـرى'}`
                );

            }

            return;
        }

        // ============================================================
        // 🔍 SEARCH
        // ============================================================

        await react("🔍");

        await reply(
`*⎔┄┄─ ⊱╎⌯ 🔍 ⌯╎⊰─┄┄⎔*  
*🔍 جـاري الـبـحـث عـن:* ⦓ ${input} ⦔  
*⎔┄┄─ ⊱╎⌯ 🔍 ⌯╎⊰─┄┄⎔*`
        );

        try{

            const query=
                `${input} Edit`;

            const result=
                await findSearchVideo(
                    query
                );

            if(!result?.buffer) {
                throw new Error(
                    'فشل تحميل النتيجة'
                );
            }

            const rawSizeMB=
                formatSize(
                    result.buffer.length
                );

            let videoBuffer=
                result.buffer;

            let wasCompressed=false;

            // ═══════════════════════════════════════
            // 🎬 ضغط تلقائي لو الفيديو أكبر من 20MB
            // ═══════════════════════════════════════

            if(
                result.buffer.length>
                COMPRESS_THRESHOLD
            ){

                await reply(
`*⎔┄┄─ ⊱╎⌯ ⚙️ ⌯╎⊰─┄┄⎔*
*┋ جـاري ضـغـط الـفـيـديـو...* 🎬
*┋ الـحـجـم الأصـلـي : ${rawSizeMB} MB*
*⎔┄┄─ ⊱╎⌯ 🏮 ⌯╎⊰─┄┄⎔*`
                );

                const prepared=
                    await prepareVideo(
                        result.buffer
                    );

                videoBuffer=
                    prepared.buffer;

                wasCompressed=
                    prepared.compressed;
            }

            const fileSizeMB=
                formatSize(
                    videoBuffer.length
                );

            await sock.sendMessage(
                chatId,
                {

                    video:
                        videoBuffer,

                    mimetype:
                        'video/mp4',

                    caption:
`*⎔┄┄─ ⊱╎⌯ 🎥 ⌯╎⊰─┄┄⎔*  
*┋ تـم الـعـثـور عـلـى فـيـديـو ┋*  
*⎔┄┄── ⊱╎⌯ 📊 ⌯╎⊰ ──┄┄⎔*  
*┋🖋 الـعـنـوان : ⦓ ${(result.title||'بدون عنوان').substring(0,80)} ⦔*  
*┋👤 الـنـاشـر : ⦓ ${result.author||'غير معروف'} ⦔*  
*┋ الـحـجـم : ${fileSizeMB} MB${wasCompressed?' ✨':''}*
${wasCompressed?`*┋ ${rawSizeMB} MB ← ${fileSizeMB} MB (مضغوط)*\n`:''}*⎔┄┄─── ⊱╎⌯ 💽 ⌯╎⊰ ───┄┄⎔*  
> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~`,

                    contextInfo:{
                        forwardingScore:999,

                        isForwarded:false,

                        forwardedNewsletterMessageInfo:{
                            newsletterJid:
                                SOLO_CHANNEL_ID,

                            serverMessageId:1,

                            newsletterName:
                                '𝑺𝑶𝑳𝑶'
                        }
                    }

                },
                {
                    quoted:message
                }
            );

            await react("✅");

        }catch(error){

            console.error(
                "❌ Search Error:",
                error
            );

            await react("❌");

            let errorMsg=
`*❌ لـم يـتـم الـعـثـور عـلـى فـيـديـو مـنـاسـب*  
📌 جـرب كـلـمـة بـحـث اخـرى`;

            if(
                error.code==='ECONNABORTED'||
                error.message?.includes('timeout')
            ){

                errorMsg=
`*❌ الـ API مـشـغـول*  
📌 حـاول بـعـد شـويـة`;

            }else if(
                error.response?.status===429
            ){

                errorMsg=
`*❌ كـثـرة الـطـلـبـات*  
📌 اسـتـنـا شـويـة`;

            }

            await reply(
                errorMsg
            );

        }

    }

};