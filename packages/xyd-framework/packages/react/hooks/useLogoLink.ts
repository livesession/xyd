import {pageLink} from "../utils";
import {useSettings} from "../contexts";

export function useLogoLink() {
    const settings = useSettings()

    const logo = settings?.theme?.logo

    if (!logo) {
        return "/"
    }

    let to = "/"

    if (typeof logo === "object" && ("page" in logo || "href" in logo)) {
        return pageLink(logo.href || logo.page || "/")
    }

    return to
}