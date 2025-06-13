import { Outlet } from "react-router";

export async function action({
    request,
}: Route.ClientActionArgs) {
    return {
        ok: 1
    }
}

export default function Url() {
    return <div>
        Hello World
        <Outlet/>
    </div>
}