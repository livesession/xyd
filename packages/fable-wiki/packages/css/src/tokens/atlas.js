import {xtokens} from "@xyd-js/xtokens";

const tokens = xtokens("atlas");

tokens.ref({
    "palette": {
        "white100": "#fff",

        "dark100": "#000",
        "dark60": "#201d1d",

        "grey60": "#6e6e80",
        "grey40": "#ececf1",

        "purple60": "#7051d4",

        "blue60": "#60a5fa",
        "blue20": "#eef2ff",
    },
});

tokens.sys({
    "color": {
        "primary.text": "ref.palette.dark60",
        "secondary.text": "ref.palette.grey60",
        "tertiary.text": "ref.palette.purple60",

        "primary.border": "ref.palette.grey40",

        "primary.background": "ref.palette.grey40",
    },
});

tokens.comp({
    "apiref": {
        "item": {
            "border.color": "sys.color.primary.border",
            "navbar.color": "sys.color.secondary.text",
        },
        "properties": {
            "border.color": "sys.color.primary.border",
            "description.color": "sys.color.secondary.text",

            "prop-name.color": "ref.palette.dark100",
            "prop-type.color": "sys.color.secondary.text",

            "color--active": "sys.color.tertiary.text",
        },
    },
    "code": {
        "sample-buttons": {
            "color": "sys.color.secondary.text",
            "container.background": "sys.color.primary.background",

            "color--active": "sys.color.primary.text",
            "background--active": "ref.palette.white100",
        },
        "copy": {
            "background--active": "sys.color.primary.background",
        },
        "sample": {
            "background": "sys.color.primary.background",
            "color": "sys.color.primary.text",
            "border.color": "sys.color.primary.background",

            "color--active": "sys.color.tertiary.text",

            "mark": {
                "border--active": "ref.palette.blue60",
                "background--active": "ref.palette.blue20",
            },
        },
    },
});

export function generateCSS() {
    return tokens.generateCSS();
}
