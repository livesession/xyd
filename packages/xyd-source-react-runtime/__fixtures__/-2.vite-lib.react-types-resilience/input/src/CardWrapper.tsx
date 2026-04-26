import React from "react";

interface CardWrapperProps {
    /** Card title */
    title: string;

    /** Card content — React types that typia cannot resolve */
    children: React.ReactNode;

    /** Optional icon element */
    icon?: React.ReactElement;

    /** Optional footer element */
    footer?: React.ReactNode;

    /** Whether the card has a border */
    bordered?: boolean;
}

export function CardWrapper({ title, children, icon, footer, bordered }: CardWrapperProps) {
    return (
        <div className={`card ${bordered ? "bordered" : ""}`}>
            <div className="card-header">
                {icon && <span className="card-icon">{icon}</span>}
                <h3>{title}</h3>
            </div>
            <div className="card-body">{children}</div>
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
}
