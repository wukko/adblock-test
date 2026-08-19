declare global {
    interface Window {
        adsbygoogle?: { loaded?: boolean };
        googletag?: object;
        s_test_ads?: boolean;
        s_test_pagead?: boolean;
    }
}

type HostData = Record<string, Record<string, string[]>>;

type CosmeticBait = {
    key: string;
    rule: string;
    className?: string;
    id?: string;
    // mounted after initial render, to exercise DOM-watching cosmetic engines
    injected?: boolean;
};

type ScriptBait = {
    key: string;
    path: string;
    // set by the bait script, so still being undefined means it was blocked
    flag: "s_test_ads" | "s_test_pagead";
};

export type RealWorldCheck = {
    key: string;
    name: string;
    kind: "script" | "image" | "iframe";
    url: string;
    // deterministic substitute detection: "tao" endpoints always send
    // Timing-Allow-Origin, "cors" endpoints are CORS-readable and their
    // real body contains marker. A blocker's local stub can produce neither.
    proof?: "tao" | "cors";
    marker?: string;
    // confirms the resource actually initialized, not a neutered stand-in
    verify?: () => boolean;
};

export const DATA: HostData = {
    "Ads": {
        "Amazon": [
            "adtago.s3.amazonaws.com",
            "advice-ads.s3.amazonaws.com",
            "s.amazon-adsystem.com",
            "c.amazon-adsystem.com",
        ],
        "Google Ads": [
            "pagead2.googlesyndication.com",
            "adservice.google.com",
            "pagead2.googleadservices.com",
            "afs.googlesyndication.com",
            "www.googletagservices.com",
        ],
        "Doubleclick.net": [
            "stats.g.doubleclick.net",
            "ad.doubleclick.net",
            "static.doubleclick.net",
            "m.doubleclick.net",
            "mediavisor.doubleclick.net",
            "securepubads.g.doubleclick.net",
            "googleads.g.doubleclick.net",
        ],
        "Adcolony": [
            "ads30.adcolony.com",
            "adc3-launch.adcolony.com",
            "events3alt.adcolony.com",
            "wd.adcolony.com",
        ],
        "Media.net": [
            "static.media.net",
            "media.net",
            "contextual.media.net",
            "hbx.media.net",
        ],
        "Criteo": [
            "static.criteo.net",
            "bidder.criteo.com",
        ],
        "Taboola": [
            "cdn.taboola.com",
        ],
        "Outbrain": [
            "widgets.outbrain.com",
        ],
        "Xandr": [
            "ib.adnxs.com",
        ],
        "Microsoft Ads": [
            "adsdk.microsoft.com",
            "msadsscale.microsoft.com",
            "bat.bing.com",
        ],
        "The Trade Desk": [
            "match.adsrvr.org",
            "js.adsrvr.org",
        ],
        "LiveRamp": [
            "ats.rlcdn.com",
            "idsync.rlcdn.com",
        ],
        "ID5": [
            "id5-sync.com",
        ],
        "LiveIntent": [
            "b-code.liadm.com",
        ],
        "Lotame": [
            "bcp.crwdcntrl.net",
        ],
        "BidSwitch": [
            "x.bidswitch.net",
        ],
        "Sharethrough": [
            "btlr.sharethrough.com",
        ],
        "GumGum": [
            "g2.gumgum.com",
        ],
        "Sonobi": [
            "apex.go.sonobi.com",
        ],
        "Yieldmo": [
            "ads.yieldmo.com",
        ],
        "Adobe Audience Manager": [
            "dpm.demdex.net",
        ],
        "Wunderkind": [
            "tag.bounceexchange.com",
        ],
        "PubMatic": [
            "hbopenbid.pubmatic.com",
        ],
        "Magnite": [
            "fastlane.rubiconproject.com",
            "pixel.rubiconproject.com",
        ],
        "Index Exchange": [
            "htlb.casalemedia.com",
            "js-sec.indexww.com",
        ],
        "OpenX": [
            "us-u.openx.net",
        ],
        "TripleLift": [
            "tlx.3lift.com",
        ],
        "Sovrn": [
            "ap.lijit.com",
        ],
        "Equativ": [
            "prg.smartadserver.com",
        ],
        "Teads": [
            "a.teads.tv",
        ],
        "Adform": [
            "track.adform.net",
        ],
        "AdRoll": [
            "d.adroll.com",
            "s.adroll.com",
        ],
        "Integral Ad Science": [
            "pixel.adsafeprotected.com",
        ],
        "DoubleVerify": [
            "cdn.doubleverify.com",
        ],
        "PopAds": [
            "serve.popads.net",
        ],
        "ExoClick": [
            "main.exoclick.com",
            "syndication.exoclick.com",
        ],
        "MGID": [
            "jsc.mgid.com",
        ],
        "Revcontent": [
            "trends.revcontent.com",
        ],
    },
    "Analytics": {
        "Google Analytics": [
            "analytics.google.com",
            "click.googleanalytics.com",
            "google-analytics.com",
            "ssl.google-analytics.com",
        ],
        "Hotjar": [
            "adm.hotjar.com",
            "identify.hotjar.com",
            "insights.hotjar.com",
            "script.hotjar.com",
            "surveys.hotjar.com",
            "static.hotjar.com",
        ],
        "MouseFlow": [
            "mouseflow.com",
            "cdn.mouseflow.com",
            "api.mouseflow.com",
            "tools.mouseflow.com",
        ],
        "FreshWorks": [
            "freshmarketer.com",
            "claritybt.freshmarketer.com",
            "fwtracks.freshmarketer.com",
        ],
        "Luckyorange": [
            "luckyorange.com",
            "api.luckyorange.com",
            "realtime.luckyorange.com",
            "cdn.luckyorange.com",
            "w1.luckyorange.com",
            "settings.luckyorange.net",
        ],
        "Stats WP Plugin": [
            "stats.wp.com",
        ],
        "Microsoft Clarity": [
            "www.clarity.ms",
            "c.clarity.ms",
        ],
        "Mixpanel": [
            "api.mixpanel.com",
            "cdn.mxpnl.com",
        ],
        "comScore": [
            "sb.scorecardresearch.com",
        ],
        "Quantcast": [
            "secure.quantserve.com",
        ],
        "HubSpot": [
            "track.hubspot.com",
            "js.hs-analytics.net",
        ],
        "Optimizely": [
            "logx.optimizely.com",
        ],
        "AB Tasty": [
            "try.abtasty.com",
        ],
        "Matomo": [
            "cdn.matomo.cloud",
        ],
        "Nielsen": [
            "secure-us.imrworldwide.com",
        ],
        "Branch": [
            "api2.branch.io",
        ],
        "mParticle": [
            "jssdkcdns.mparticle.com",
        ],
        "Tealium": [
            "collect.tealiumiq.com",
        ],
        "Smartlook": [
            "web-sdk.smartlook.com",
            "rec.smartlook.com",
        ],
        "Inspectlet": [
            "cdn.inspectlet.com",
        ],
        "Disqus": [
            "referrer.disqus.com",
        ],
        "Segment": [
            "api.segment.io",
            "cdn.segment.com",
        ],
        "Amplitude": [
            "api.amplitude.com",
            "cdn.amplitude.com",
        ],
        "Heap": [
            "cdn.heapanalytics.com",
        ],
        "FullStory": [
            "edge.fullstory.com",
        ],
        "New Relic": [
            "js-agent.newrelic.com",
            "bam.nr-data.net",
        ],
        "Datadog": [
            "browser-intake-datadoghq.com",
        ],
        "Chartbeat": [
            "static.chartbeat.com",
            "ping.chartbeat.net",
        ],
        "StatCounter": [
            "c.statcounter.com",
        ],
        "Plausible": [
            "plausible.io",
        ],
        "Bugsnag": [
            "notify.bugsnag.com",
            "sessions.bugsnag.com",
            "api.bugsnag.com",
        ],
        "Sentry": [
            "browser.sentry-cdn.com",
        ],
    },
    "Social Media": {
        "Facebook": [
            "pixel.facebook.com",
        ],
        "X (Twitter)": [
            "static.ads-twitter.com",
        ],
        "LinkedIn": [
            "ads.linkedin.com",
            "analytics.pointdrive.linkedin.com",
        ],
        "Pinterest": [
            "ads.pinterest.com",
            "log.pinterest.com",
            "trk.pinterest.com",
        ],
        "Snapchat": [
            "tr.snapchat.com",
        ],
        "Tumblr": [
            "px.srvcs.tumblr.com",
        ],
        "ShareThis": [
            "l.sharethis.com",
            "t.sharethis.com",
        ],
        "Twitch": [
            "edge.ads.twitch.tv",
        ],
        "Reddit": [
            "events.reddit.com",
            "events.redditmedia.com",
        ],
        "YouTube": [
            "ads.youtube.com",
            "fcmatch.youtube.com",
        ],
        "TikTok": [
            "analytics.tiktok.com",
            "analytics-sg.tiktok.com",
            "analytics-ipv6.tiktokw.us",
            "mcs-va.tiktokv.com",
            "mcs-ie.tiktokw.eu",
            "sgali-mcs.byteoversea.com",
        ],
    },
    "Misc": {
        "Yahoo": [
            "ads.yahoo.com",
            "geo.yahoo.com",
            "partnerads.ysm.yahoo.com",
        ],
        "Brave": [
            "analytics.brave.com",
            "search.anonymous.ads.brave.com",
        ],
        "Ecosia": [
            "sp.ecosia.org",
        ],
        "Microsoft": [
            "browser.pipe.aria.microsoft.com",
            "vortex.data.microsoft.com",
            "eu-mobile.events.data.microsoft.com",
        ],
        "OpenAI": [
            "bzr.openai.com",
            "bzrcdn.openai.com",
        ],
        "VK (Mail.ru)": [
            "ad.mail.ru",
            "top-fwz1.mail.ru",
            "rs.mail.ru",
            "xray.mail.ru",
            "1l-hit.mail.ru",
        ],
        "Yandex": [
            "adfox.yandex.ru",
            "mc.yandex.ru",
            "an.yandex.ru",
        ],
        "Samsung": [
            "samsungads.com",
            "smetrics.samsung.com",
            "samsung-com.112.2o7.net",
            "analytics-api.samsunghealthcn.com",
            "config.samsungads.com",
        ],
        "Apple": [
            "metrics.icloud.com",
            "metrics.mzstatic.com",
        ],
    },
};

export const COSMETIC_BAITS: CosmeticBait[] = [
    { key: "adsbox", rule: "###adsbox", id: "adsbox" },
    { key: "adbox_upper", rule: "##.ADBox", className: "ADBox" },
    { key: "adbox_wrapper", rule: "##.adbox-wrapper", className: "adbox-wrapper" },
    { key: "ad_space", rule: "##.ad-space", className: "ad-space" },
    { key: "sponsored_ad", rule: "##.sponsored-ad", className: "sponsored-ad" },
    { key: "ad_banner", rule: "###ad_banner", id: "ad_banner" },
    { key: "ad_unit", rule: "##.ad-unit", className: "ad-unit", injected: true },
    {
        key: "ad_placeholder",
        rule: "##.ad-placeholder",
        className: "ad-placeholder",
        injected: true,
    },
    {
        key: "google_ads_frame",
        rule: "###google_ads_frame",
        id: "google_ads_frame",
        injected: true,
    },
];

export const SCRIPT_BAITS: ScriptBait[] = [
    { key: "admanager", path: "/js/admanager.js", flag: "s_test_ads" },
    { key: "adengine", path: "/js/adengine.js", flag: "s_test_pagead" },
];

export const REAL_WORLD_CHECKS: RealWorldCheck[] = [
    {
        key: "adsense",
        name: "adsbygoogle.js (Google AdSense)",
        kind: "script",
        url: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        proof: "tao",
        verify: () => window.adsbygoogle?.loaded === true,
    },
    {
        key: "gpt",
        name: "gpt.js (Google Publisher Tag)",
        kind: "script",
        url: "https://securepubads.g.doubleclick.net/tag/js/gpt.js",
        proof: "tao",
        verify: () => window.googletag !== undefined,
    },
    {
        key: "meta_pixel",
        name: "fbevents.js (Meta Pixel)",
        kind: "script",
        url: "https://connect.facebook.net/en_US/fbevents.js",
        proof: "tao",
    },
    {
        key: "gtag",
        name: "gtag.js (Google tag)",
        kind: "script",
        url: "https://www.googletagmanager.com/gtag/js?id=G-TEST123",
        proof: "cors",
        // present in the real gtag.js, absent from uBO's gtm surrogate
        marker: "google_tag_data",
    },
    {
        key: "ga_pixel",
        name: "Google Analytics pixel",
        kind: "image",
        url: "https://www.google-analytics.com/collect?v=1&t=pageview&tid=UA-000000-1&cid=555",
        proof: "cors",
        marker: "GIF8",
    },
    {
        key: "li_pixel",
        name: "LinkedIn Insight pixel",
        kind: "image",
        url: "https://px.ads.linkedin.com/collect?pid=12345&fmt=gif",
    },
    {
        key: "ad_frame",
        name: "DoubleClick ad frame",
        kind: "iframe",
        url: "https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-0",
        proof: "tao",
    },
];
