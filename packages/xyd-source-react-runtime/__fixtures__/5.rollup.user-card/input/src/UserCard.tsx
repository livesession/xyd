interface UserCardProps {
    /** Full name of the user */
    name: string;

    /** Email address of the user */
    email: string;

    /** URL to the user's avatar image */
    avatarUrl?: string;

    /** Role or title of the user */
    role?: "admin" | "editor" | "viewer";

    /** Whether the card is in a loading state */
    loading?: boolean;
}

export function UserCard(props: UserCardProps) {
    return (
        <div>
            {props.avatarUrl && <img src={props.avatarUrl} alt={props.name} />}
            <h3>{props.name}</h3>
            <p>{props.email}</p>
            {props.role && <span>{props.role}</span>}
        </div>
    );
}
