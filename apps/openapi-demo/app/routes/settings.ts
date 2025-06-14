export const SETTINGS = Object.freeze({
    "theme": {
        "name": "opener",
        "banner": {
            "content": ":::button{href='https://xyd.dev' size='sm' kind='secondary'}\n **xyd 0.1.0-alpha is coming soon!**\n:::"
        },
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
                "items": [
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