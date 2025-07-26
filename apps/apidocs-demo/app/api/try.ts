import { toUniform } from "~/utils/toUniform";

import type { Route } from "../+types/root";

const prefix = "/docs/api" // TODO: IN THE FUTURE BETTER cuz should also work without prefix

export async function action({
    request,
}: Route.ClientActionArgs) {
    const formData = await request.formData();
    const example = (formData.get("example") as string || "").trim()
    let type = (formData.get("type") as string || "").trim()
    const value = (formData.get("value") as string || "").trim()
    const currentSettings = formData.get("currentSettings") as string

    let parsedSettings = null;
    if (currentSettings) {
        try {
            parsedSettings = JSON.parse(currentSettings);
        } catch (error) {
            console.error('Error parsing current settings:', error);
        }
    }

    return toUniform(prefix, example, type, value, parsedSettings)
}