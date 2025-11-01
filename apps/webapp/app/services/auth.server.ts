import type { User } from "~/types/database";
import { extractTokenFromCookie, verifyToken } from "~/lib/jwt";
import { userModel } from "~/models/user";

export class AuthServerService {
    private static instance: AuthServerService;

    private constructor() { }

    static getInstance(): AuthServerService {
        if (!AuthServerService.instance) {
            AuthServerService.instance = new AuthServerService();
        }
        return AuthServerService.instance;
    }

    public async getCurentUserFromRequest(request: Request): Promise<User | null> {
        const token = extractTokenFromCookie(request.headers.get('Cookie'));
        if (!token) {
            return null;
        }

        const payload = verifyToken(token);
        if (!payload) {
            return null;
        }

        const user = await userModel.findByEmail(payload.email);
        if (!user) {
            return null;
        }

        return user;
    }
}

export const authServerService = AuthServerService.getInstance();
