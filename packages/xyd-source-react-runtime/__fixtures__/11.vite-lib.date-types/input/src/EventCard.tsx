interface Event {
    title: string;
    startDate: Date;
    endDate: Date;
    attendees: number;
}

interface EventCardProps {
    event: Event;
    createdAt: Date;
    label: string;
}

export function EventCard({ event, createdAt, label }: EventCardProps) {
    return (
        <div>
            <h3>{label}: {event.title}</h3>
            <p>Starts: {event.startDate.toLocaleDateString()}</p>
            <p>Ends: {event.endDate.toLocaleDateString()}</p>
            <p>Created: {createdAt.toLocaleDateString()}</p>
            <p>Attendees: {event.attendees}</p>
        </div>
    );
}