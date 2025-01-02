// we export empty routes because rr7 need this file and we load routes via xyd plugins
import {route} from "@xydjs/react-router-dev/routes";

export const routes = [
    route("", "./home.tsx") // TODO: in the future loaded from theme
]

export default routes