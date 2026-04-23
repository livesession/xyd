import type { User } from "../types/user";

interface UserProfileProps {
    /** The user object to display */
    user: User;

    /** Show the full address block */
    showAddress?: boolean;

    /** Called when the edit button is clicked */
    onEdit: (userId: number) => void;

    /** Custom CSS class name */
    className?: string;

    /** Maximum number of tags to display */
    maxTags?: number;
}

export function UserProfile({ user, showAddress, onEdit, className, maxTags }: UserProfileProps) {
    const visibleTags = maxTags ? user.tags.slice(0, maxTags) : user.tags;

    return (
        <div className={className}>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <span>{user.role}</span>
            {showAddress && user.address && (
                <address>
                    {user.address.street}, {user.address.city}, {user.address.country}
                    {user.address.zip && ` ${user.address.zip}`}
                </address>
            )}
            <div>
                {visibleTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                ))}
            </div>
            <button type="button" onClick={() => onEdit(user.id)}>Edit</button>
        </div>
    );
}
