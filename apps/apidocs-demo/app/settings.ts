export const SETTINGS = Object.freeze({
    "theme": {
        "name": "picasso",
        "icons": {
            "library": [
                {
                    "name": "lucide",
                    "default": true
                },
                "./icons/iconify.json"
            ]
        }
    },
    "integrations": {
        "search": {
            "orama": true
        },
        "apps": {
            "githubStar": {
                "title": "Star",
                "label": "Show your support! Star us on GitHub ⭐️",
                "href": "https://github.com/livesession/xyd",
                "dataIcon": "octicon-star",
                "dataSize": "large",
                "dataShowCount": true,
                "ariaLabel": "Star livesession/xyd on GitHub"
            }
        }
    },
    "navigation": {
        "header": [],
        "subheader": [],
        "sidebar": [
            {
                "route": "/docs/api",
                "pages": [
                    {
                        "group": "Endpoints",
                        "pages": [

                        ]
                    }
                ]
            }
        ]
    }
})