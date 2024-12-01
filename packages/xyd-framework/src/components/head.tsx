import React from "react"

// TODO: get config from settings
export function FwHead() {
    const config = {
        primaryHue: 200,
        primarySaturation: 200
    }

    const {
        primaryHue: hue,
        primarySaturation: saturation
    } = config;

    const {dark: darkHue, light: lightHue} = {
        dark: hue,
        light: hue
    };

    const {dark: darkSaturation, light: lightSaturation} = {
        dark: saturation,
        light: saturation
    };

    // TODO: move to head sytem?

    return <style>{`
          :root {
            --xyd-primary-hue: ${lightHue}deg;
            --xyd-primary-saturation: ${lightSaturation}%;
            --xyd-navbar-height: 4rem;
            --xyd-menu-height: 3.75rem;
            --xyd-banner-height: 2.5rem;
          }

          .dark {
            --xyd-primary-hue: ${darkHue}deg;
            --xyd-primary-saturation: ${darkSaturation}%;
          }
        `}</style>

}
