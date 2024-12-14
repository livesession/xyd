import React, {useRef, useContext} from "react"
import cn from "clsx";
import {tv} from "tailwind-variants";

import {UIAnchor} from "./Anchor";
import {UICollapse} from "./Collapse";
import {UIInternalError} from "./500";

function styled() {
}

styled.aside = tv({
    slots: {
        aside: cn(
            'h-[calc(100vh-var(--xyd-navbar-height))]',
            'pl-[max(env(safe-area-inset-left),1rem)]',
            'xyd-sidebar-container flex flex-col',
            'md:top-16 md:shrink-0 motion-reduce:transform-none',
            'transform-gpu transition-all ease-in-out',
            'print:hidden',
        ),
        scrollbar: cn(
            'h-[calc(100vh-54px))]',
            'overflow-y-auto overflow-x-hidden',
            // 'p-4 grow md:h-[calc(100vh-var(--xyd-navbar-height)-var(--xyd-menu-height))]',
            'p-4 grow md:h-[calc(100vh-54px)]',
            'bg-[#f9f9f9] rounded-lg'
        )
    },

    variants: {
        showSidebar: {
            true: {
                aside: "md:w-60",
                scrollbar: 'xyd-scrollbar'
            },
            false: {
                aside: "md:w-20",
                scrollbar: 'no-scrollbar',
            }
        },
        asPopover: {
            true: {
                aside: "md:hidden",
            },
            false: {
                aside: "md:sticky md:self-start"
            }
        },
        hasMenu: {
            true: {
                aside: "max-md:[transform:translate3d(0,0,0)]"
            },
            false: {
                aside: "max-md:[transform:translate3d(0,-100%,0)]"
            }
        },
    }
})

styled.separator = tv({
    slots: {
        container: cn(
            "[word-break:break-word]",
            "my-4"
        ),
        hr: "mx-2 border-t border-gray-200 dark:border-primary-100/10"
    },

    variants: {
        active: {
            true: {
                container: "mt-5 mb-2 px-2 py-1.5 text-sm font-semibold text-gray-900 first:mt-0 dark:text-gray-100"
            }
        }
    }
})

styled.file = tv({
    slots: {
        list: "flex flex-col gap-1 mx-2",
        link: cn(
            'flex rounded px-2 py-1.5 text-sm transition-colors [word-break:break-word]',
            'cursor-pointer [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] contrast-more:border'
        )
    },
    variants: {
        active: {
            false: {
                list: "",
                link: cn(
                    'text-[#1c1e1e] hover:bg-gray-100 hover:text-gray-900',
                    'dark:text-neutral-400 dark:hover:bg-primary-100/5 dark:hover:text-gray-50',
                    'contrast-more:text-gray-900 contrast-more:dark:text-gray-50',
                    'contrast-more:border-transparent contrast-more:hover:border-gray-900 contrast-more:dark:hover:border-gray-50'
                )
            },
            true: {
                link: cn(
                    // 'bg-primary-100 font-semibold text-primary-800 dark:bg-primary-400/10 dark:text-primary-600',
                    // 'contrast-more:border-primary-500 contrast-more:dark:border-primary-500',
                    'bg-[#fff] rounded-lg text-[#7051d4]'
                )
            }
        }
    }
})

styled.folder = tv({
    slots: {
        container: "flex items-center justify-between gap-2",
        rightIcon: cn(
            "h-[18px] min-w-[18px] rounded-sm p-0.5 hover:bg-gray-800/5 dark:hover:bg-gray-100/5"
        ),
        rightIconPath: cn(
            "origin-center transition-transform rtl:-rotate-180"
        ),
        collapse: cn(
            "ltr:pr-0 rtl:pl-0 pt-1"
        ),
    },
    variants: {
        asButton: {
            true: {
                container: "text-left w-full"
            }
        },
        active: {
            true: {
                container: cn(
                    'bg-primary-100 font-semibold text-primary-800 dark:bg-primary-400/10 dark:text-primary-600',
                    'contrast-more:border-primary-500 contrast-more:dark:border-primary-500',
                    'bg-[#ececf1]'
                )
            },
            false: {
                container: cn(
                    'text-[#1c1e1e] hover:bg-gray-100 hover:text-gray-900',
                    'dark:text-neutral-400 dark:hover:bg-primary-100/5 dark:hover:text-gray-50',
                    'contrast-more:text-gray-900 contrast-more:dark:text-gray-50',
                    'contrast-more:border-transparent contrast-more:hover:border-gray-900 contrast-more:dark:hover:border-gray-50'
                )
            }
        },
        isOpen: {
            true: {
                rightIconPath: "ltr:rotate-90 rtl:rotate-[-270deg]"
            }
        }
    }
})

styled.menu = tv({
    base: "flex flex-col gap-1",
    variants: {
        mobile: {
            true: "xyd-menu-mobile md:hidden",
            false: "xyd-menu-desktop max-md:hidden"
        },
        collapsed: {
            true: cn(
                'relative before:absolute before:inset-y-1',
                'before:w-px before:bg-gray-200 before:content-[""] dark:before:bg-neutral-800',
                'ltr:pl-3 ltr:before:left-0 rtl:pr-3 rtl:before:right-0',
                "ml-3 ltr:ml-3 rtl:mr-3"
            )
        },
    }
})

export interface HAsideProps {
    children: JSX.Element

    className?: string
}

export function UIAside(props: HAsideProps) {
    const {aside, scrollbar} = styled.aside({})

    const sidebarRef = useRef<HTMLDivElement>(null)

    // useEffect(() => { TODO: finish
    //     const activeElement = sidebarRef.current?.querySelector('li.active')
    //
    //     if (activeElement && (window.innerWidth > 767 || menu)) {
    //         const scroll = () => {
    //             scrollIntoView(activeElement, {
    //                 block: 'center',
    //                 inline: 'center',
    //                 scrollMode: 'always',
    //                 boundary: containerRef.current
    //             })
    //         }
    //         if (menu) {
    //             // needs for mobile since menu has transition transform
    //             setTimeout(scroll, 300)
    //         } else {
    //             scroll()
    //         }
    //     }
    // }, [menu])

    // TODO: it's temporary
    return <div
        className={scrollbar()}
        ref={sidebarRef}
    >
        {props.children}
    </div>

    return <aside className={aside({
        class: props.className,
        showSidebar: true,
        asPopover: false,
        hasMenu: false
    })}>
        <div
            className={scrollbar()}
            ref={sidebarRef}
        >
            {props.children}
        </div>
    </aside>
}

export interface HSeparatorProps {
    children?: string | JSX.Element
}

export function UISeparator(props: HSeparatorProps) {
    const {container, hr} = styled.separator()

    return (
        <li
            className={container({active: !!props.children})}
        >
            {props.children || <hr className={hr()}/>}
        </li>
    )
}

export interface HFileProps {
    title: string | JSX.Element

    href: string

    children?: JSX.Element

    active?: boolean
    newWindow?: boolean

    className?: string

    // TODO: any
    onClick?: (data: any) => void
    onFocus?: (data: any) => void
    onBlur?: (data: any) => void

}

export function UIFile(props: HFileProps) {
    const {list, link} = styled.file()

    return (
        <li className={list({active: props.active})}>
            <UIAnchor
                href={props.href}
                newWindow={props.newWindow}
                className={link({
                    active: props.active,
                    class: props.className
                })}
                onClick={props.onClick}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
            >
                {props.title}
            </UIAnchor>
            {props.children}
        </li>
    )
}

// TODO: to implement
export function Anchors() {

}

export interface HFolderProps {
    title: string | JSX.Element

    href?: string

    children: JSX.Element // TODO: children as array of menu

    active?: boolean
    isOpen?: boolean
    asButton?: boolean

    // TODO: any
    onClick?: (v: any) => void
}

export function UIFolder(props: HFolderProps) {
    const ButtonOrAnchor = props.asButton ? 'button' : UIAnchor

    const {container, rightIcon, rightIconPath, collapse} = styled.folder()
    const {link} = styled.file()

    return (
        <ul>
            <ButtonOrAnchor
                href={props.href}
                className={container({
                    active: props.active,
                    asButton: props.asButton,
                    class: link()
                })}
                onClick={props.onClick}
            >
                {props.title}
            </ButtonOrAnchor>
            <UICollapse className={collapse()} isOpen={props.isOpen || false}>
                <div className={styled.menu({collapsed: true})}>
                    {props.children}
                </div>
            </UICollapse>
        </ul>
    )
}

export interface HMenuProps {
    children: JSX.Element | JSX.Element[];

    mobile?: boolean
    collapsed?: boolean
}

export function UIMenu(props: HMenuProps) {
    return <ul className={styled.menu({
        mobile: props.mobile,
        collapsed: props.collapsed
    })}>
        {props.children}
    </ul>
}

