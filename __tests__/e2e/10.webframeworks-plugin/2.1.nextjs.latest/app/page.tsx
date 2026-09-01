const BRAND_PATH = "M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z";

function Icon({ size }: { size: number }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size, fill: "var(--brand)" }}>
            <path d={BRAND_PATH} />
        </svg>
    );
}

export default function Home() {
    return (
        <>
            <header>
                <Icon size={28} />
                <span className="name">Next.js</span>
                <nav><a href="/docs">Docs</a></nav>
            </header>
            <main>
                <div>
                    <Icon size={72} />
                    <h1 id="host-marker" style={{ marginTop: 24 }}>Host Next App</h1>
                    <p className="tag">A Next.js site with xyd docs mounted at /docs — one build, one origin.</p>
                </div>
            </main>
        </>
    );
}
