import path from "node:path";
import fs from "node:fs/promises";

import { redirect } from "react-router";

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
};

export async function loader({ params }: any) {
    const filePath = path.join(process.cwd(), "public", params["*"])
    try {
        await fs.access(filePath)
    } catch (e) {
        return redirect("/404")
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new Response(fileContent, {
        status: 200,
        headers: {
            'Content-Type': contentType,
        },
    });
}