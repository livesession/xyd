import React from "react";

import { Button } from "../../writer/Button"
import * as cn from "./Footer.styles";

export interface FooterLinkItemsProps {
    label: string;
    href: string;
}

export interface FooterProps {
    footnote: React.ReactNode;

    kind?: "minimal"

    logo?: React.ReactNode;

    socials?: {
        logo: React.ReactNode;
        href: string
    }[]

    links?: {
        header: string;
        items?: FooterLinkItemsProps[]
    }[] | FooterLinkItemsProps[]
}

export function Footer(props: FooterProps) {
    if (props.kind === "minimal") {
        return <Footer.Minimal {...props} />
    }

    return <footer className={cn.Footer}>
        <div part="container">
            <div part="content">
                {
                    props.logo && <div part="first-column">
                        {props.logo}
                    </div>
                }

                {props.links?.length && <div part="columns" data-cols={props.links?.length}>
                    {props.links?.map((link, index) => (
                        <div part="col" key={`${link.header}-${index}`}>
                            <div part="col-items">
                                <p>{link.header}</p>
                                {link.items?.map((item) => (
                                    <a key={`${item.label}-${index}`} target="_blank" href={item.href}>{item.label}</a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>}


                <div part="social-links">
                    {props.socials?.map((social, index) => (
                        <div key={`${social.href}-${index}`}>
                            <a target="_blank" href={social.href}>{social.logo}</a>
                        </div>
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

Footer.Minimal = function MinimalFooter(props: FooterProps) {
    return <footer className={cn.Footer} data-kind="minimal">
        <div part="container">
            <div part="content">
                {
                    props.links?.length && <div part="columns" data-cols={props.links?.length}>
                        <div part="col">
                            <div part="col-items">
                                {props.links?.map((item, index) => (
                                    <Button
                                        key={`${item.label}-${index}`} kind="tertiary" href={item.href}>
                                        {item.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                }

                <div part="social-links">
                    {props.socials?.map((social, index) => (
                        <Button
                            key={`${social.href}-${index}`}
                            kind="tertiary"
                            href={social.href}
                            icon={social.logo}
                        />
                    ))}
                </div>
            </div>
        </div>
    </footer>
}