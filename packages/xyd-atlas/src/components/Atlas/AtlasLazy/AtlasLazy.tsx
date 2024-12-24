import React, {useEffect, useRef} from "react";
import {useNavigate} from "react-router";

import {Reference} from "@xyd/uniform";

import {MDXReference} from "@/utils/mdx";
import {ApiRefItem} from "@/components/ApiRef";
import {useScrollRestoration} from "@/components/Atlas/AtlasLazy/hooks";
import {
    $item
} from "./AtlasLazy.styles";

export interface AtlasLazyProps {
    references: MDXReference<Reference>[]
    urlPrefix: string
    slug: string,
    onLoaded?: () => void
}

function pushStateWithEvent(url: string, eventName: string, eventData: any) {
    window.history.pushState(null, "", url);
    const event = new CustomEvent(eventName, {detail: eventData});
    window.dispatchEvent(event);
}

export function AtlasLazy(props: AtlasLazyProps) {
    // TODO: scroll
    const targetRef = useRef(null);
    const targetRefs = useRef<(HTMLDivElement | null)[]>([]);

    const startupLocation = useRef(window.location.pathname);

    const [, setPosition] = useScrollRestoration();

    // Scroll to the 30th component on mount
    useEffect(() => {
        return // TODO: temporary

        // return // TODO: maybe in the future
        // Prevent scrolling
        // document.body.style.overflow = 'hidden';

        if (targetRef?.current) {
            //@ts-ignore
            targetRef?.current?.scrollIntoView?.({block: 'start'});
        }

        // Clean up when component unmounts
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Use Intersection Observer to detect when the 30th component is in view
    useEffect(() => {
        // const observer = new IntersectionObserver(
        //     (entries) => {
        //         entries.forEach(entry => {
        //             if (entry.isIntersecting) {
        //                 const refSlug = entry.target.getAttribute("data-slug");
        //
        //                 console.log('refSlug', refSlug)
        //
        //             }
        //         });
        //     },
        //     {threshold: 0.5}
        // );
        //
        // targetRefs.current.forEach(ref => {
        //     if (ref) observer.observe(ref);
        // });
        //
        // return () => {
        //     observer.disconnect();
        // };
        //
        // return // TODO: temporary

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const refSlug = entry.target.getAttribute("data-slug");
                        window.history.pushState(null, "", `${refSlug}`);
                        const event = new CustomEvent("xyd.history.pushState", {
                            detail: {
                                url: refSlug,
                            }
                        });
                        window.dispatchEvent(event);

                        // if (startupLocation?.current && window.location.pathname.startsWith(startupLocation?.current)) {
                        //     window.history.pushState(null, "", `${refSlug}`);
                        // }
                    }
                });
            },
            {threshold: 0.7}
        );

        targetRefs.current.forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        return // TODO: temporary

        setPosition()
        props.onLoaded?.();
    }, []);

    return props.references.map((reference: any, i: number) => <>
        <div
            key={i}
            // TODO: slug should be passed from reference or somrthing
            // ref={`api-reference/${reference.title}` === slug ? targetRef : null} // Attach ref to the 30th item
            className={`${$item.host} ${i === 0 && $item.$$first}`}
            // TODO: slug prefix props
            data-slug={`${props.urlPrefix}/${reference.canonical?.title}`}
            ref={el => targetRefs.current[i] = el}
        >
            <ItemWrapper
                reference={reference}
                onLoad={i === props.references.length - 1 ? props.onLoaded : null}
            />
        </div>
    </>)
}

function ItemWrapper({reference, onLoad}) {
    useEffect(() => {
        onLoad && onLoad()
    }, []);

    return <>
        <ApiRefItem reference={reference}/>
    </>
}