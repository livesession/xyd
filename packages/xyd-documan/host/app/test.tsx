import React from "react";

function getPathname(url: string) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.replace(/^\//, '');
}

export async function loader({request}: { request: any }) {
    const slug = getPathname(request.url)

    return {
        slug
    }
}
export default function App({loaderData}: any) {
    return <>
        Hello
        slug: {loaderData?.slug}
        <button onClick={() => alert(5)}>
            Click me
        </button>
    </>
}