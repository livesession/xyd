import { createRoot } from "react-dom/client";

interface NavBarProps {
    /** Application title */
    title: string;
    /** Navigation links */
    links: string[];
    /** Whether to use dark theme */
    dark?: boolean;
}

export function NavBar({ title, links, dark }: NavBarProps) {
    return (
        <nav style={{ background: dark ? "#222" : "#f5f5f5", padding: 8 }}>
            <strong>{title}</strong>
            <ul>
                {links.map((link) => (
                    <li key={link}>{link}</li>
                ))}
            </ul>
        </nav>
    );
}

function App() {
    return (
        <div>
            <NavBar title="Playground" links={["Home", "About"]} />
            <iframe
                src="/sample-app.html"
                style={{ width: "100%", height: 400, border: "none" }}
            />
        </div>
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
