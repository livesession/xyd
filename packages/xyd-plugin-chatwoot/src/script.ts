// TODO: in the future better API + more typesafe

export function initChatwoot(
    websiteToken: string,
    baseURL: string,
    chatwootSettings: any
) {
    window.chatwootSettings = chatwootSettings || {};

    (function (d, t) {
        var BASE_URL = baseURL;
        var g = d.createElement(t) as HTMLScriptElement, s = d.getElementsByTagName(t)[0];
        g.src = BASE_URL + "/packs/js/sdk.js";
        g.async = !0;
        s.parentNode?.insertBefore(g, s);
        g.onload = function () {
            window.chatwootSDK.run({ websiteToken: websiteToken, baseUrl: BASE_URL })
        }
    })(document, "script");
}
