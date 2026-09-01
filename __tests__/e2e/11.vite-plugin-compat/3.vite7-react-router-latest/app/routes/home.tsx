import { useEffect, useState } from "react";

export default function Home() {
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    return (
        <h1 id="host-marker" data-hydrated={hydrated ? "true" : undefined}>
            Host RR App
        </h1>
    );
}
