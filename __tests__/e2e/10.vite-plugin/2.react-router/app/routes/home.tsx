import { useEffect, useState } from "react";

export default function Home() {
    // data-hydrated proves the host client bundle (in the shared assets/ dir)
    // still loads and hydrates after the docs merge.
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    return (
        <h1 id="host-marker" data-hydrated={hydrated ? "true" : undefined}>
            Host RR App
        </h1>
    );
}
