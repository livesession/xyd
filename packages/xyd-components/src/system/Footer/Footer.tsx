import React from "react";

import * as cn from "./Footer.styles";

export interface FooterProps {
    logo: React.ReactNode;

    footnote: React.ReactNode;

    socials?: {
        logo: React.ReactNode;
        href: string
    }[]

    links?: {
        header: string;
        items?: {
            label: string;
            href: string;
        }[]
    }[]
}

export function Footer(props: FooterProps) {
    return <footer className={cn.Footer}>
        <div part="container">
            <div part="content">
                <div part="first-column">
                    {props.logo}
                </div>

                {props.links?.length && <div part="columns" data-cols={props.links?.length}>
                    {props.links?.map((link) => (
                        <div part="col">
                            <div part="col-items">
                                <p>{link.header}</p>
                                {link.items?.map((item) => (
                                    <a target="_blank" href={item.href}>{item.label}</a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>}


                <div part="social-links">
                    {props.socials?.map((social) => (
                        <a target="_blank" href={social.href}>{social.logo}</a>
                    ))}
                </div>
            </div>

            {props.footnote && <hr />}

            <div part="footnote">
                {props.footnote}
            </div>
        </div>
    </footer>
}