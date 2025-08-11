import * as React from 'react';

import * as cn from './Baseline.styles';

export interface BaselineTool {
    tool: 'bun' | 'node' | 'npm' | 'pnpm' | string
    supported: boolean;
    label?: React.ReactNode;
}

export interface BaselineProps extends React.HTMLAttributes<HTMLDetailsElement> {
    title: string;
    toolGroups: BaselineTool[][];
}

export function Baseline({ title, toolGroups, ...props }: BaselineProps) {
    return (
        <details className={cn.BaselineHost} {...props}>
            <summary>
                <span part="icon" />
                <div part="title">{title}</div>
                <div part="compatibility">
                    {toolGroups.map((group, i) => (
                        <span part="tools" key={i}>
                            {group.map((tool, j) => (
                                <span
                                    key={tool.tool + (tool.label ?? '') + j}
                                    data-tool={tool.tool}
                                    data-supported={tool.supported ? true : undefined}
                                >
                                    {tool.label ? tool.label : null}
                                </span>
                            ))}
                        </span>
                    ))}
                </div>
            </summary>
        </details>
    );
}