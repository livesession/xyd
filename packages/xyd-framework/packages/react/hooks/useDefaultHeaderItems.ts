import { useHeaderItems } from "./useHeaderItems";

export function useDefaultHeaderItems() {
    const headerItems = useHeaderItems()

    return headerItems.default
}