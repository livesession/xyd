import React from "react"
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter"

interface QuickStartOption {
    key: string
    value: string
    defaultChecked?: boolean
}

interface QuickStartProps {
    // code snippet to display e.g curl command
    code: string
    // code language e.g. javascript, typescript, python
    codeLanguage: string

    // title
    title: string

    // subtitle
    subtitle: string

    // time to complete the tutorial
    time?: string

    onOptionChange?: (option: QuickStartOption) => void

    // options to select
    options?: QuickStartOption[]
}

// TODO: another syntax highlighter
// TODO: syntax highlighter config
export function TutorialHeroCard(props: QuickStartProps) {
    return (
        <div
            className="!visible transition-opacity duration-150 bg-background text-foreground !opacity-100"
        >
            <div
                className="rounded-2xl text-card-foreground shadow-sm w-full max-w-5xl bg-[#F9F9F9]"
                data-id={1}
                data-v0-t="card"
            >
                <div className="p-0" data-id={2}>
                    <div className="flex" data-id={3}>
                        <div className="w-1/3 p-12 border-r-INVALID border-border" data-id={4}>
                            <h2 className="text-2xl font-normal mb-4" data-id={5}>
                                {props.title}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4" data-id={6}>
                                {props.subtitle}
                            </p>
                            {
                                props.time ? <div
                                    className="flex items-center space-x-2 text-sm text-muted-foreground"
                                    data-id={7}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width={24}
                                        height={24}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="lucide lucide-clock w-4 h-4"
                                        data-id={8}
                                    >
                                        <circle cx={12} cy={12} r={10}/>
                                        <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    <span data-id={9}>{props.time}</span>
                                </div> : null
                            }
                        </div>

                        <div className="w-2/3 p-12 relative" data-id={10}>
                            <button
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 absolute top-2 right-2"
                                data-id={11}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width={24}
                                    height={24}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-copy h-4 w-4"
                                    data-id={12}
                                >
                                    <rect width={14} height={14} x={8} y={8} rx={2} ry={2}/>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                            </button>

                            {
                                props.options && props.options.length > 0 ? <div className="mb-2">
                                    <select className="bg-inherit cursor-pointer">
                                        {
                                            props.options.map((option, index) => {
                                                return <option
                                                    key={option.key}
                                                    defaultChecked={option.defaultChecked}
                                                    onChange={() => props?.onOptionChange?.(option)}
                                                >
                                                    {option.value}
                                                </option>
                                            })
                                        }
                                    </select>
                                </div> : null
                            }

                            <SyntaxHighlighter
                                language={props.codeLanguage}
                                // style={vscDarkPlus}
                                customStyle={{
                                    margin: 0,
                                    padding: "1rem",
                                    borderRadius: "0.5rem",
                                }}
                            >
                                {props.code}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}