import type { Auth } from "../../openapi/v1/src/generated/models/all/platform-api";
import { login } from "./login";
import { logout } from "./logout";
import { me } from "./me";
import { register } from "./register";

/** `/auth` — email+password register/login/logout + current-user lookup. */
export const auth: Auth = { register, login, logout, me };
