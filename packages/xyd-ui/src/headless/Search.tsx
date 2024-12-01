import React, {Fragment, useCallback, useEffect, useRef, useState} from 'react'
import type {CompositionEvent, KeyboardEvent, ReactElement} from 'react'
import {Transition} from '@headlessui/react' // TODO: replace with radix ?
import cn from 'clsx'
// import {useNavigate} from '@remix-run/react'; TODO:
import {InfoCircledIcon as InformationCircleIcon, LoopIcon as SpinnerIcon} from '@radix-ui/react-icons'
import {tv} from "tailwind-variants";

// import {useConfig, useMenu} from '../contexts' TODO:
import {renderComponent, renderString} from '../utils'
import {HAnchor} from './Anchor'
import {HInput} from './Input'
// import {useMounted} from "../hooks";

// TODO: !!! FINISH !!!

function useMounted() {
    return true
}
function useConfig() {
    return {
        search: {
            error: "",
            loading: null,
            emptyResult: null,
            placeholder: "",
            component: null
        }
    }
}

function useMenu() {
    return {
        setMenu(v: boolean){}
    }
}

function useNavigate() {
    return function(route: string) {

    }
}


type SearchProps = {
    className?: string
    overlayClassName?: string
    value: string
    onChange: (newValue: string) => void
    onActive?: (active: boolean) => void
    loading?: boolean
    error?: boolean
    results: any[]
}

const INPUTS = ['input', 'select', 'button', 'textarea']

export function HSearch({
                           className,
                           overlayClassName,
                           value,
                           onChange,
                           onActive,
                           loading,
                           error,
                           results
                       }: SearchProps): ReactElement {
    const [show, setShow] = useState(false)
    const config = useConfig()
    const [active, setActive] = useState(0)
    const navigate = useNavigate()
    const {setMenu} = useMenu()
    const input = useRef<HTMLInputElement>(null)
    const ulRef = useRef<HTMLUListElement>(null)
    const [focused, setFocused] = useState(false)
    //  Trigger the search after the Input is complete for languages like Chinese
    const [composition, setComposition] = useState(true)

    useEffect(() => {
        setActive(0)
    }, [value])

    useEffect(() => {
        const down = (e: globalThis.KeyboardEvent): void => {
            const activeElement = document.activeElement as HTMLElement
            const tagName = activeElement?.tagName.toLowerCase()
            if (
                !input.current ||
                !tagName ||
                INPUTS.includes(tagName) ||
                activeElement?.isContentEditable
            )
                return
            if (
                e.key === '/' ||
                (e.key === 'k' &&
                    (e.metaKey /* for Mac */ || /* for non-Mac */ e.ctrlKey))
            ) {
                e.preventDefault()
                // prevent to scroll to top
                input.current.focus({preventScroll: true})
            } else if (e.key === 'Escape') {
                setShow(false)
                input.current.blur()
            }
        }

        window.addEventListener('keydown', down)
        return () => {
            window.removeEventListener('keydown', down)
        }
    }, [])

    const finishSearch = useCallback(() => {
        input.current?.blur()
        onChange('')
        setShow(false)
        setMenu(false)
    }, [onChange, setMenu])

    const handleActive = useCallback(
        (e: { currentTarget: { dataset: DOMStringMap } }) => {
            const {index} = e.currentTarget.dataset
            setActive(Number(index))
        },
        []
    )

    const handleKeyDown = useCallback(
        function <T>(e: KeyboardEvent<T>) {
            switch (e.key) {
                case 'ArrowDown': {
                    if (active + 1 < results.length) {
                        const el = ulRef.current?.querySelector<HTMLAnchorElement>(
                            `li:nth-of-type(${active + 2}) > a`
                        )
                        if (el) {
                            e.preventDefault()
                            handleActive({currentTarget: el})
                            el.focus()
                        }
                    }
                    break
                }
                case 'ArrowUp': {
                    if (active - 1 >= 0) {
                        const el = ulRef.current?.querySelector<HTMLAnchorElement>(
                            `li:nth-of-type(${active}) > a`
                        )
                        if (el) {
                            e.preventDefault()
                            handleActive({currentTarget: el})
                            el.focus()
                        }
                    }
                    break
                }
                case 'Enter': {
                    const result = results[active]
                    if (result && composition) {

                        navigate(result.route)
                        finishSearch()
                    }
                    break
                }
                case 'Escape': {
                    setShow(false)
                    input.current?.blur()
                    break
                }
            }
        },
        [active, results, navigate, finishSearch, handleActive, composition] // TODO: previously it was 'router' instead of 'navigate'
    )

    const mounted = useMounted()
    const renderList = show && Boolean(value)

    const icon = (
        <Transition
            show={mounted && (!show || Boolean(value))}
            as={Fragment}
            enter="transition-opacity"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <kbd
                className={cn(
                    'absolute my-1.5 select-none right-1.5 right-1.5 ltr:right-1.5 rtl:left-1.5',
                    'h-5 rounded bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500',
                    'border dark:border-gray-100/20 dark:bg-dark/50',
                    'contrast-more:border-current contrast-more:text-current contrast-more:dark:border-current',
                    'items-center gap-1 transition-opacity',
                    value
                        ? 'z-20 flex cursor-pointer hover:opacity-70'
                        : 'pointer-events-none hidden sm:flex'
                )}
                title={value ? 'Clear' : undefined}
                onClick={() => {
                    onChange('')
                }}
            >
                {value && focused
                    ? 'ESC'
                    : mounted &&
                    (typeof window != "undefined" && navigator.userAgent.includes('Macintosh') ? (
                        <>
                            <span className="text-xs">⌘</span>K
                        </>
                    ) : (
                        'CTRL K'
                    ))}
            </kbd>
        </Transition>
    )
    const handleComposition = useCallback(
        (e: CompositionEvent<HTMLInputElement>) => {
            setComposition(e.type === 'compositionend')
        },
        []
    )

    return (
        <div className={cn('xyd-search relative md:w-64', className)}>
            {renderList && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShow(false)}
                />
            )}

            <HInput
                ref={input}
                value={value}
                onChange={e => {
                    const {value} = e.target
                    onChange(value)
                    setShow(Boolean(value))
                }}
                onFocus={() => {
                    onActive?.(true)
                    setFocused(true)
                }}
                onBlur={() => {
                    setFocused(false)
                }}
                onCompositionStart={handleComposition}
                onCompositionEnd={handleComposition}
                type="search"
                placeholder={renderString(config.search.placeholder)}
                onKeyDown={handleKeyDown}
                suffix={icon}
            />

            <Transition
                show={renderList}
                // Transition.Child is required here, otherwise popup will be still present in DOM after focus out
                as={Transition.Child}
                leave="transition-opacity duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <ul
                    className={cn(
                        'xyd-scrollbar',
                        // Using bg-white as background-color when the browser didn't support backdrop-filter
                        'border border-gray-200 bg-white text-gray-100 dark:border-neutral-800 dark:bg-neutral-900',
                        'absolute top-full z-20 mt-2 overflow-auto overscroll-contain rounded-xl py-2.5 shadow-xl',
                        'max-h-[min(calc(50vh-11rem-env(safe-area-inset-bottom)),400px)]',
                        'md:max-h-[min(calc(100vh-5rem-env(safe-area-inset-bottom)),400px)]',
                        'inset-x-0 ltr:md:left-auto rtl:md:right-auto',
                        'contrast-more:border contrast-more:border-gray-900 contrast-more:dark:border-gray-50',
                        overlayClassName
                    )}
                    ref={ulRef}
                    style={{
                        transition: 'max-height .2s ease' // don't work with tailwindcss
                    }}
                >
                    {error ? (
                        <span
                            className="flex select-none justify-center gap-2 p-8 text-center text-sm text-red-500">
              <InformationCircleIcon className="h-5 w-5"/>
                            {renderString(config.search.error)}
            </span>
                    ) : loading ? (
                        <span
                            className="flex select-none justify-center gap-2 p-8 text-center text-sm text-gray-400">
              <SpinnerIcon className="h-5 w-5 animate-spin"/>
                            {renderComponent(config.search.loading)}
            </span>
                    ) : results.length > 0 ? (
                        results.map(({route, prefix, children, id}, i) => (
                            <Fragment key={id}>
                                {prefix}
                                <li
                                    className={cn(
                                        'mx-2.5 break-words rounded-md',
                                        'contrast-more:border',
                                        i === active
                                            ? 'bg-primary-500/10 text-primary-600 contrast-more:border-primary-500'
                                            : 'text-gray-800 contrast-more:border-transparent dark:text-gray-300'
                                    )}
                                >
                                    <HAnchor
                                        className="block scroll-m-12 px-2.5 py-2"
                                        href={route}
                                        data-index={i}
                                        onFocus={handleActive}
                                        onMouseMove={handleActive}
                                        onClick={finishSearch}
                                        onKeyDown={handleKeyDown}
                                    >
                                        {children}
                                    </HAnchor>
                                </li>
                            </Fragment>
                        ))
                    ) : (
                        renderComponent(config.search.emptyResult)
                    )}
                </ul>
            </Transition>
        </div>
    )
}
