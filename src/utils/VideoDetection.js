// ===== Video Detection Utils =====

const SUPPORTED_PLATFORMS = ['www.youtube.com', 'www.netflix.com', 'www.primevideo.com', 'www.disneyplus.com', 'www.instagram.com', 'www.coursera.org', 'zeteo.com'];

const firstHandlingCheckers = [youtube, netflix, disneyplus, coursera, zeteo];
const secondHandlingCheckers = [primevideo];

/**
 * Check if the URL is a video player URL
 * @param {string} url - The URL to check
 * @returns {number} - 0: no video player, 1: first handling platform, 2: second handling platform, 3: tiktok (special handling), 4: instagram reels (special handling), 5: instagram feed (special handling), -1: iframe
 */
export function isVideoPlayerURL(url) {
    
    if (firstHandlingCheckers.some(checker => checker(url))) return 1;
    
    if (secondHandlingCheckers.some(checker => checker(url))) return 2;
    
    // Special case for TikTok
    if (tiktokNoFeed(url)) return 3;
    
    // Special case for Instagram Reels
    if (instagramReels(url)) return 4;
    
    // get domain name
    url = url.split('/')[2];

    // Special case for Instagram Feed
    if (instagramFeed(url)) return 5;

    // Special case for TikTok Feed
    if (tiktokFeed(url)) return 6;

    console.log(url);
    return SUPPORTED_PLATFORMS.includes(url) ? 0 : -1; // If the domain is in the supported platforms, return 0 (no video player), else return -1 (iframe)
}


function youtube(url) {
    return url.includes('youtube.com/watch') || url.includes('youtube.com/shorts');
}

function netflix(url) {
    return url.includes('netflix.com/watch');
}

function disneyplus(url) {
    return url.includes('disneyplus.com') && url.includes('play');
}

function coursera(url) {
    return url.includes('coursera.org') && url.includes('lecture');
}

function zeteo(url) {
    return url.includes('zeteo.com/p');
}

function tiktokNoFeed(url) {
    return url.includes('tiktok.com/@');
}

function primevideo(url) {
    return url.includes('primevideo.com') && url.includes('detail');
}

function instagramReels(url) {
    return url.includes('instagram.com/reels');
}

function instagramFeed(url) {
    return url === 'www.instagram.com';
}

function tiktokFeed(url) {
    return url === 'www.tiktok.com';
}