(function () {
    (window.requestAnimationFrame ?? window.setTimeout)(() => {
        if (typeof window === "undefined") {
            return
        }

        const bannerHeight = document.querySelector("xyd-banner")?.clientHeight ?? 0;
        if (!bannerHeight) {
            return
        }

        document.documentElement.style.setProperty("--xyd-banner-height-dynamic", `${String(bannerHeight)}px`)
    })
})()