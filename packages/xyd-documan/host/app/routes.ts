// we export empty routes because rr7 need this file and we load routes via xyd plugins
import {route} from "@xydjs/react-router-dev/routes";

export const routes = [
    route("/test/*", "./test.tsx")
]

export default routes