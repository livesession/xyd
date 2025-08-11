import path from "node:path";
import fs from "node:fs/promises";

import { redirect } from "react-router";

const MIME_TYPES: Record<string, string> = {
    '.md': 'text/markdown',
    '.mdx': 'text/markdown',
};

// TODO: !!! FINISH !!!
export async function loader({ params }: any) {
    const filePath = path.join(process.cwd(), "/docs/guides/quickstart.md")
    
    try {
        await fs.access(filePath)
    } catch (e) {
        return redirect("/404")
    }

    const ext = path.extname(filePath).toLowerCase();
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new Response(fileContent, {
        status: 200,
        headers: {
            'Content-Type': contentType,
        },
    });
}