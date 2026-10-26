import axios from "axios";
import { Innertube, UniversalCache } from "youtubei.js";

let youtubeClient = null;

async function getYouTubeClient() {
    if (youtubeClient) {
        return youtubeClient;
    }

    youtubeClient = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true
    });

    return youtubeClient;
}

function cleanText(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
}

function getArtistName(song) {
    if (!song) return "";

    if (typeof song.artist === "string") {
        return song.artist;
    }

    if (song.artist?.name) {
        return song.artist.name;
    }

    if (Array.isArray(song.artists)) {
        return song.artists
            .map(artist =>
                typeof artist === "string"
                    ? artist
                    : artist?.name
            )
            .filter(Boolean)
            .join(", ");
    }

    return "";
}

function normalize(value) {
    return cleanText(value)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "");
}

function scoreResult(song, query) {
    const title =
        normalize(
            song?.title?.toString?.() ||
            song?.name
        );

    const artist =
        normalize(
            getArtistName(song)
        );

    const search =
        normalize(query);

    let score = 0;

    if (title === search) {
        score += 100;
    }

    if (title.includes(search)) {
        score += 60;
    }

    if (search.includes(title) && title) {
        score += 40;
    }

    const words =
        search
            .split(" ")
            .filter(Boolean);

    for (const word of words) {
        if (title.includes(word)) {
            score += 5;
        }

        if (artist.includes(word)) {
            score += 3;
        }
    }

    return score;
}

export default {
    name: "كلمات",
    aliases: ["كلمات_اغنية", "كلمات_اغنيه"],
    category: "tools",
    description: "البحث عن كلمات الأغاني",

    async run({ m, reply, text }) {
        if (!text?.trim()) {
            return reply(
                "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n" +
                "*╭───⊷ 🎵 كـلـمـات أغـنـيـة*\n" +
                "*┋*\n" +
                "*┋ 🎧 مثال: .كلمات Into It*\n" +
                "*┋ 🎧 مثال: .كلمات Shiloh Again*\n" +
                "*┋*\n" +
                "*╰───⊷*\n\n" +
                "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*"
            );
        }

        try {
            const query = text.trim();

            const yt =
                await getYouTubeClient();

            const search =
                await yt.music.search(
                    query,
                    {
                        type: "song"
                    }
                );

            const songs =
                search?.songs?.contents ||
                [];

            if (!songs.length) {
                return reply(
                    "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n" +
                    "*╭───⊷ ❌ نـتـيـجـة الـبـحـث*\n" +
                    "*┋*\n" +
                    "*┋ لـم يـتـم الـعـثـور عـلـى الأغـنـيـة فـي YouTube Music.*\n" +
                    "*┋*\n" +
                    "*╰───⊷*\n\n" +
                    "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*"
                );
            }

            const sortedSongs =
                [...songs].sort(
                    (a, b) =>
                        scoreResult(b, query) -
                        scoreResult(a, query)
                );

            const song =
                sortedSongs[0];

            const trackName =
                cleanText(
                    song?.title?.toString?.() ||
                    song?.name ||
                    query
                );

            const artistName =
                cleanText(
                    getArtistName(song)
                );

            const lyricsQuery =
                artistName
                    ? `${trackName} ${artistName}`
                    : trackName;

            const response =
                await axios.get(
                    "https://lrclib.net/api/search",
                    {
                        params: {
                            q: lyricsQuery
                        },
                        timeout: 15000,
                        headers: {
                            "User-Agent":
                                "SOLO-BOT/1.0"
                        }
                    }
                );

            const results =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            if (!results.length) {
                return reply(
                    "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n" +
                    "*╭───⊷ 📝 كـلـمـات الأغـنـيـة*\n" +
                    "*┋*\n" +
                    `*┋ 🎵 ${trackName}*\n` +
                    (artistName
                        ? `*┋ 👤 ${artistName}*\n`
                        : "") +
                    "*┋*\n" +
                    "*┋ ❌ لـم يـتـم الـعـثـور عـلـى الـكـلـمـات.*\n" +
                    "*┋*\n" +
                    "*╰───⊷*\n\n" +
                    "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*"
                );
            }

            const wantedTitle =
                normalize(trackName);

            const wantedArtist =
                normalize(artistName);

            const matched =
                results
                    .map(item => {
                        const title =
                            normalize(
                                item?.trackName
                            );

                        const artist =
                            normalize(
                                item?.artistName
                            );

                        let score = 0;

                        if (
                            title ===
                            wantedTitle
                        ) {
                            score += 100;
                        } else if (
                            title.includes(
                                wantedTitle
                            ) ||
                            wantedTitle.includes(
                                title
                            )
                        ) {
                            score += 60;
                        }

                        if (
                            wantedArtist &&
                            artist
                        ) {
                            if (
                                artist ===
                                wantedArtist
                            ) {
                                score += 80;
                            } else if (
                                artist.includes(
                                    wantedArtist
                                ) ||
                                wantedArtist.includes(
                                    artist
                                )
                            ) {
                                score += 40;
                            }
                        }

                        if (
                            item?.plainLyrics
                        ) {
                            score += 20;
                        }

                        return {
                            item,
                            score
                        };
                    })
                    .sort(
                        (a, b) =>
                            b.score -
                            a.score
                    )
                    .find(
                        result =>
                            result.item
                                ?.plainLyrics ||
                            result.item
                                ?.syncedLyrics
                    );

            const data =
                matched?.item;

            if (!data) {
                return reply(
                    "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n" +
                    "*╭───⊷ 📝 كـلـمـات الأغـنـيـة*\n" +
                    "*┋*\n" +
                    `*┋ 🎵 ${trackName}*\n` +
                    (artistName
                        ? `*┋ 👤 ${artistName}*\n`
                        : "") +
                    "*┋*\n" +
                    "*┋ ❌ الـكـلـمـات غـيـر مـتـاحـة.*\n" +
                    "*┋*\n" +
                    "*╰───⊷*\n\n" +
                    "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*"
                );
            }

            const lyrics =
                data.plainLyrics ||
                data.syncedLyrics;

            let result =
                "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n";

            result +=
                "*╭───⊷ 🎵 مـعـلـومـات الأغـنـيـة*\n";

            result +=
                "*┋*\n";

            result +=
                `*┋ 🎵 الأغـنـيـة : ${data.trackName || trackName}*\n`;

            result +=
                `*┋ 👤 الـفـنـان : ${data.artistName || artistName || "غير معروف"}*\n`;

            if (data.albumName) {
                result +=
                    `*┋ 💿 الألـبـوم : ${data.albumName}*\n`;
            }

            if (data.duration) {
                const duration =
                    Number(data.duration);

                const minutes =
                    Math.floor(
                        duration / 60
                    );

                const seconds =
                    String(
                        Math.floor(
                            duration % 60
                        )
                    ).padStart(2, "0");

                result +=
                    `*┋ ⏱️ الـمـدة : ${minutes}:${seconds}*\n`;
            }

            result +=
                "*┋*\n";

            result +=
                "*╰───⊷*\n\n";

            result +=
                "*╭───⊷ 📝 كـلـمـات الأغـنـيـة*\n";

            result +=
                "*┋*\n\n";

            result +=
                lyrics;

            result +=
                "\n\n*┋*\n" +
                "*╰───⊷*\n\n";

            result +=
                "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n" +
                "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*";

            return reply(result);

        } catch (error) {
            console.error(
                "❌ Lyrics Error:",
                error?.response?.data ||
                error?.stack ||
                error?.message ||
                error
            );

            return reply(
                "*⎔┄┄── ⊱╎⌯ 𝐒 𝐎 𝐋 𝐎 ⌯╎⊰─┄┄⎔*\n\n" +
                "*╭───⊷ ❌ خـطـأ*\n" +
                "*┋*\n" +
                "*┋ حـدث خـطـأ أثـنـاء الـبـحـث عـن الأغـنـيـة أو كـلـمـاتـهـا.*\n" +
                "*┋*\n" +
                "*╰───⊷*\n\n" +
                "> ~*『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』*~*"
            );
        }
    }
};