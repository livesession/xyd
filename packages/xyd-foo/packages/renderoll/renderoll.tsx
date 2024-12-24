import React, {createContext, lazy, useContext, useEffect, useRef, useState, Suspense} from "react";
import type {RefObject} from "react";
import {css} from "@linaria/core";

const styles = {
    loader: {
        host: css`
            width: 100vh;
            height: 100vh;
            background: white;
            z-index: 999999;
            position: absolute;
        `
    },
    serveComponent: {
        host: css`
            opacity: 0;
            position: absolute;
            height: 100%;
            z-index: 999999;
        `
    },
    content: {
        host: css`
            opacity: 0;
            transition: opacity 0.3s;
        `,
        host$$active: css`
            opacity: 1;
        `
    }
}

export interface RenderollOptions {
    decorator?: (props: { children: React.ReactNode }) => React.ReactNode
}

export function renderoll(
    async: () => Promise<any>,
    options?: RenderollOptions
) {
    const [once, setOnce] = useState(false)
    const [inited, setInited] = useState(false)

    useEffect(() => {
        setInited(true)
    }, []);

    const $RenderLazyComponent = $Lazy(async, options)

    return ({children}) => {
        return <$LazyContext.Provider value={{
            onFinish: () => {
                if (once) {
                    return
                }
                setOnce(true)
            }
        }}>
            {
                !once && <div className={inited ? styles.serveComponent.host : ""}>
                    {children}
                </div>
            }

            <Suspense fallback={<$Loader/>}>
                <$RenderLazyComponent>
                    {children}
                </$RenderLazyComponent>
            </Suspense>
        </$LazyContext.Provider>
    }
}

// TODO: better api for `onFinish` because this does not match pixel perferct server component
const $LazyContext = createContext({
    onFinish: () => {
    }
})

function $Loader() {
    return <div className={styles.loader.host}/>
}

function $Lazy(
    async: () => Promise<any>,
    options?: RenderollOptions
) {
    return lazy(async () => {
        const [Prev, Next] = await async()

        return {
            default: ({children}) => {
                const serverContent = useRef<Element>(null);
                const {onFinish} = useContext($LazyContext)

                const [count, setCount] = useState(0)

                function onLoaded() {
                    setCount(count + 1)
                }

                const loaded = !!count

                useEffect(() => {
                    if (serverContent?.current) {
                        // TODO: below mechanism does not match perfect - do we need to compare with server view position?
                        serverContent?.current.scrollIntoView?.();

                        onFinish()
                    }
                }, [serverContent]);

                const tree = <>
                    <Prev onLoaded={onLoaded}/>

                    <div ref={serverContent as RefObject<HTMLDivElement>}>
                        {children}
                    </div>

                    <Next onLoaded={onLoaded}/>
                </>

                const content = options?.decorator
                    ? options?.decorator?.({children: tree})
                    : tree

                return <div
                    className={`
                        ${styles.content.host}
                        ${loaded && styles.content.host$$active}
                    `}>

                    {content}
                </div>
            }
        }
    })
}