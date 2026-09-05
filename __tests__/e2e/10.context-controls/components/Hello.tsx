export default function Hello({ who }: { who: string }) {
    return <button data-testid="custom-control">Hello {who}</button>;
}
