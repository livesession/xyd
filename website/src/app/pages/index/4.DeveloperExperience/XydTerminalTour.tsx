'use client'

import * as React from 'react';
import {useState, useEffect, useRef, useMemo} from 'react';
import {createPortal} from "react-dom";
import {Pre} from "codehike/code";
import {preload} from "@code-hike/lighter";
import {motion, AnimatePresence} from 'framer-motion';
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {ScopeProvider} from "jotai-scope";
import {TerminalIcon, FileIcon} from '@primer/octicons-react'
import {Stack, Text} from "@primer/react-brand";
import {highlight} from "@xyd-js/components/coder";

import styles from '@/app/components/Terminal.module.css';

// TODO: REFACTOR, ADD TO TOURMAN?
// TODO: refactor to context?

type Step = {
    text: string;
    status: 'pending' | 'complete';
    isCommand?: boolean;
    isSystem?: boolean;
    isServerMessage?: boolean;
    pauseForView?: boolean;
    loader?: {
        isLoading?: boolean;
    }
};

const IntroductionContent = `---
title: Developer quickstart
description: Take your first steps with the API
---

# Overview
This guide will help you
get started with the API.

It covers the basic steps to set up
your environment`

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const steps: Step[] = [
    {text: 'npm i -g xyd-js', status: 'pending', isCommand: true},
    {text: 'Installing xyd-js globally...', status: 'pending', isSystem: true, loader: {}},
    {text: 'cd ~/Code/my-company/my-app-docs', status: 'pending', isCommand: true},
    {text: 'open ./docs/introduction.md', status: 'pending', isCommand: true, pauseForView: true},
    {text: 'xyd', status: 'pending', isCommand: true},
    {text: 'Server is running on http://localhost:3000', status: 'pending', isServerMessage: true},
];

const activeTabAtom = atom<'terminal' | 'introduction'>('terminal');
const finishedStepsAtom = atom<Step[]>([]);
const spinnerFrameAtom = atom<number>(0); // TODO: suppot multiple spinners
const currentStepAtom = atom<number>(0);

export function XydTerminalTour() {
    const [loading, setLoading] = useState(true);

    async function loadDynamicTheme() {
        await preload(["shell", "markdown"], "material-default")
        setLoading(false);
    }

    useEffect(() => {
        loadDynamicTheme()
        setLoading(true);
    }, []);

    if (loading) {
        return null
    }

    return (
        <ScopeProvider atoms={[
            activeTabAtom,
            finishedStepsAtom,
            spinnerFrameAtom,
            currentStepAtom
        ]}>
            <$TerminalImpl/>
        </ScopeProvider>
    );
}

function $TerminalImpl() {
    const activeTab = useAtomValue(activeTabAtom);

    return <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className={styles.Editor}
    >
        <$Tabs/>

        <AnimatePresence mode="wait">
            {activeTab === 'terminal' ? (
                <$TabTerminal/>
            ) : (
                <$TabIntroduction/>
            )}
        </AnimatePresence>
    </motion.div>
}

function $Tabs() {
    return <div className={styles.EditorHeading}>
        {/* @ts-ignore */}
        <$Tab tab="terminal" Icon={TerminalIcon}>Terminal</$Tab>

        {/* @ts-ignore */}
        <$Tab tab="introduction" Icon={FileIcon}>introduction.md</$Tab>
    </div>
}

function $Tab({children, tab, Icon}: {
    children: React.ReactNode,
    tab: "terminal" | "introduction",
    Icon: React.FC<{ size: number }>
}) {
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);

    return <motion.div
        whileTap={{scale: 0.95}}
        onClick={() => setActiveTab(tab)}
        className={activeTab === tab ? styles.Selected : styles.EditorHeadingItem}
    >
        <Stack direction="horizontal" gap={16} flexWrap="wrap" alignItems="center" padding="none">
            <Icon size={14}/>
            <Text size="100">
                {children}
            </Text>
        </Stack>
    </motion.div>
}

function $TabTerminal() {
    const [currentTypingText, setCurrentTypingText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const spinnerInterval = useRef<number | undefined>(undefined);
    const typingInterval = useRef<number | undefined>(undefined);

    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const [finishedSteps, setFinishedSteps] = useAtom(finishedStepsAtom);
    const setSpinnerFrame = useSetAtom(spinnerFrameAtom);
    const [currentStep, setCurrentStep] = useAtom(currentStepAtom);

    useEffect(() => {
        if (contentRef.current && activeTab === 'terminal') {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [activeTab, currentStep, finishedSteps, currentTypingText]);

    // TODO: useType?
    const typeText = (text: string, onComplete: () => void) => {
        let currentIndex = 0;
        setIsTyping(true);
        setCurrentTypingText('');

        typingInterval.current = window.setInterval(() => {
            if (currentIndex <= text.length) {
                setCurrentTypingText(text.slice(0, currentIndex));
                currentIndex++;
            } else {
                window.clearInterval(typingInterval.current);
                setIsTyping(false);
                setCurrentTypingText('');
                onComplete();
            }
        }, 100);
    };

    useEffect(() => {
        if (currentStep >= steps.length) {
            // Reset after 1 second when all steps are complete
            setTimeout(() => {
                resetTerminal();
            }, 1000);
            return;
        }

        const currentStepData = steps[currentStep];

        if (currentStepData.isCommand) {
            typeText(currentStepData.text, () => {
                const updatedStep: Step = {...currentStepData, status: 'complete'};
                setFinishedSteps(prev => [...prev, updatedStep]);

                const pauseStep = currentStepData.pauseForView

                if (pauseStep) {
                    setTimeout(() => {
                        setActiveTab('introduction');
                        setCurrentStep(prev => prev + 1);
                    }, 1000);
                } else if (currentStep === 0) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    setTimeout(() => setCurrentStep(prev => prev + 1), 500);
                }
            });
        } else if (currentStepData.loader) {
            spinnerInterval.current = window.setInterval(() => {
                setSpinnerFrame(prev => (prev + 1) % spinnerFrames.length);
            }, 80);

            const updatedStep: Step = {
                ...currentStepData,
                status: 'pending',
                loader: {
                    ...currentStepData.loader,
                    isLoading: true
                }
            };
            setFinishedSteps(prev => [...prev, updatedStep]);

            setTimeout(() => {
                window.clearInterval(spinnerInterval.current);
                setFinishedSteps(prev =>
                    prev.map((step, idx) =>
                        idx === prev.length - 1 ? {
                            ...step,
                            status: 'complete',
                            loader: {
                                ...step.loader,
                                isLoading: false
                            }
                        } : step
                    )
                );
                setCurrentStep(prev => prev + 1);
            }, 3000);
        } else if (currentStepData.isServerMessage) {
            const updatedStep: Step = {...currentStepData, status: 'complete'};
            setFinishedSteps(prev => [...prev, updatedStep]);
            setTimeout(() => setCurrentStep(prev => prev + 1), 2000);
        } else {
            const updatedStep: Step = {...currentStepData, status: 'complete'};
            setFinishedSteps(prev => [...prev, updatedStep]);
            setTimeout(() => setCurrentStep(prev => prev + 1), 500);
        }

        return () => {
            if (typingInterval.current) window.clearInterval(typingInterval.current);
            if (spinnerInterval.current) window.clearInterval(spinnerInterval.current);
        };
    }, [currentStep, steps.length]);

    function resetTerminal() {
        window.clearInterval(typingInterval.current);
        window.clearInterval(spinnerInterval.current);

        setCurrentTypingText("")
        setIsTyping(false);

        setFinishedSteps([]);
        setSpinnerFrame(0)
        setCurrentStep(0)
    }

    return <motion.div
        key="terminal"
        initial={{opacity: 0, x: -20}}
        animate={{opacity: 1, x: 0}}
        exit={{opacity: 0, x: 20}}
        transition={{duration: 0.4}}
        className={styles.EditorContent}
        ref={contentRef}
    >
        <div className={styles.StepList}>
            <AnimatePresence>
                <$FinishedSteps steps={finishedSteps}/>
            </AnimatePresence>

            {isTyping && (
                <$Typing content={currentTypingText} lang="shell"/>
            )}
        </div>
    </motion.div>
}

function $TabIntroduction() {
    const [introText, setIntroText] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const setActiveTab = useSetAtom(activeTabAtom);

    const cursor = useCursor({ref})

    useEffect(() => { // TODO: use typing?
        const text = ' and make your first API call.'; // TODO: configurable
        let currentIndex = 0;

        const typingInterval = setInterval(() => {
            if (currentIndex <= text.length) {
                setIntroText(text.slice(0, currentIndex));
                currentIndex++;

                return
            }
            // on complete

            clearInterval(typingInterval);

            setTimeout(() => {
                setActiveTab('terminal');
            }, 1000);
        }, 150);
    }, []);

    return <motion.div
        key="introduction"
        initial={{opacity: 0, x: 20}}
        animate={{opacity: 1, x: 0}}
        exit={{opacity: 0, x: -20}}
        transition={{duration: 0.4}}
        className={styles.EditorContent}
    >

        <div ref={ref}>
            <$Highlighted
                content={IntroductionContent + introText}
                lang="md"
            />
            {cursor}
        </div>
    </motion.div>
}

function $FinishedSteps({steps}: { steps: Step[] }) {
    function getStepStyle(step: Step) {
        if (step.isSystem) {
            return styles.StepGreen;
        }
        if (step.isServerMessage) {
            return styles.StepGreen;
        }
        return styles.StepWhite;
    };

    return <>
        {steps.map((step, idx) => (
            <motion.div
                key={`${step.text}-${idx}`}
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -10}}
                transition={{duration: 0.3}}
                className={styles.StepContainer}
            >
                <div className={styles.CommandLine}>
                    <$PromptPrefix step={step}/>

                    {step.isCommand ? <$Highlighted content={step.text} lang="shell"/> : (
                        <span className={getStepStyle(step)}>{step.text}</span>
                    )}
                </div>
            </motion.div>
        ))}
    </>
}

function $Typing({content, lang}: { content: string, lang: string }) {
    return <motion.div className={styles.CommandLine}>
        <span className={styles.Prompt}>{'>'}</span>
        <$Highlighted content={content} lang={lang}/>

        <$Cursor/>
    </motion.div>
}

function $PromptPrefix({step}: { step: Step }) {
    const loadingFrame = useAtomValue(spinnerFrameAtom);

    let prefix = <></>

    if (step.loader?.isLoading) {
        prefix = <span className={styles.Spinner}>{spinnerFrames[loadingFrame]}</span>
    } else if (step.isCommand) {
        prefix = <>{">"}</>
    } else if (step.status === 'complete') {
        prefix = <$Chekmark/>
    }

    return <span className={styles.Prompt}>
        {prefix}
    </span>
}

function $Chekmark() {
    return <motion.span
        initial={{scale: 0}}
        animate={{scale: 1}}
        className={styles.Checkmark}
    >
        ✓
    </motion.span>
}

function $Cursor() {
    return <motion.span
        animate={{opacity: [0, 1]}}
        transition={{repeat: Infinity, duration: 0.7}}
        className={styles.Cursor}
    >
        ▋
    </motion.span>
}

function $Highlighted({content, lang}: { content: string, lang: string }) {
    const highlighted = highlightCode(content, lang);

    return (
        <Pre
            code={highlighted}
        />
    );
}

function highlightCode(code: string, lang: string = "shell") {
    return highlight(
        {
            meta: lang,
            lang: lang,
            value: code,
        },
        "material-default",
        lang
    );
}

function useCursor({ref}: { ref?: React.RefObject<HTMLDivElement | null> }) {
    const cursorPlace = useMemo(() => {
        if (!ref?.current) {
            return
        }
        const pre = ref.current?.querySelector("pre") // TODO: get ref by <Pre> ?
        if (!pre) {
            console.warn("Pre not found")
            return
        }
        const rootDif = pre.querySelector("div")

        if (!rootDif) {
            console.warn("Root div not found")
            return
        }

        const lastChild = rootDif.childNodes[rootDif.childNodes.length - 1]

        if (!lastChild) {
            console.warn("Last child not found")
            return
        }

        return lastChild as HTMLElement
    }, [ref?.current])

    return cursorPlace ? createPortal(
        <$Cursor/>,
        cursorPlace
    ) : null
}


