import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import IntroductionContent from './introduction.mdx?raw';
import styles from './Terminal.module.css';

type Step = {
  text: string;
  status: 'pending' | 'complete';
  isCommand?: boolean;
  isSystem?: boolean;
};

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function Terminal() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'introduction'>('terminal');
  const [terminalInput, setTerminalInput] = useState('');
  const [showServerMessage, setShowServerMessage] = useState(false);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [introText, setIntroText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { text: 'npm i -g xyd-js', status: 'pending', isCommand: true },
    { text: 'Installing xyd-js globally...', status: 'pending' },
    { text: 'cd ~/Code/my-company/my-app-docs', status: 'pending', isCommand: true },
    { text: 'open ./docs/introduction.mdx', status: 'pending', isCommand: true },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<Step[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const spinnerInterval = useRef<number>();
  const typingInterval = useRef<number>();

  useEffect(() => {
    if (!showServerMessage) {
      return;
    }
    
    const resetTimer = setTimeout(() => {
      setIsResetting(true);
    }, 2000);

    return () => clearTimeout(resetTimer);
  }, [showServerMessage]);

  useEffect(() => {
    if (isResetting) {
      const resetDelay = setTimeout(() => {
        setTerminalInput("");
        setShowServerMessage(false);
        setSpinnerFrame(0);
        setCurrentTypingText("");
        setIsTyping(false);
        setCurrentStep(0);
        setVisibleSteps([]);
        setSteps([
          { text: 'npm i -g xyd-js', status: 'pending', isCommand: true },
          { text: 'Installing xyd-js globally...', status: 'pending' },
          { text: 'cd ~/Code/my-company/my-app-docs', status: 'pending', isCommand: true },
          { text: 'open ./docs/introduction.mdx', status: 'pending', isCommand: true },
        ]);
        setIsResetting(false);
      }, 800);

      return () => clearTimeout(resetDelay);
    }
  }, [isResetting]);
  
  useEffect(() => {
    if (contentRef.current && activeTab === 'terminal') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [activeTab, currentStep, terminalInput, showServerMessage, visibleSteps, currentTypingText]);

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

  const typeIntroText = () => {
    const text = ' edited';
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setIntroText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setTimeout(() => {
            setActiveTab('terminal');
            setTimeout(() => {
              typeCommand();
            }, 800);
          }, 2000);
        }, 1000);
      }
    }, 150);
  };

  useEffect(() => {
    if (currentStep >= steps.length) {
      const timer = setTimeout(() => {
        setActiveTab('introduction');
        typeIntroText();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const currentStepData = steps[currentStep];

    if (currentStepData.isCommand) {
      typeText(currentStepData.text, () => {
        const updatedStep = { ...currentStepData, status: 'complete' };
        setVisibleSteps(prev => [...prev, updatedStep]);
        
        if (currentStep === 0) {
          setCurrentStep(prev => prev + 1);
        } else {
          setTimeout(() => setCurrentStep(prev => prev + 1), 500);
        }
      });
    } else if (currentStep === 1) {
      spinnerInterval.current = window.setInterval(() => {
        setSpinnerFrame(prev => (prev + 1) % spinnerFrames.length);
      }, 80);

      const updatedStep = { ...currentStepData, status: 'pending' };
      setVisibleSteps(prev => [...prev, updatedStep]);

      setTimeout(() => {
        window.clearInterval(spinnerInterval.current);
        setVisibleSteps(prev => 
          prev.map((step, idx) => 
            idx === prev.length - 1 ? { ...step, status: 'complete' } : step
          )
        );
        setCurrentStep(prev => prev + 1);
      }, 3000);
    }

    return () => {
      if (typingInterval.current) window.clearInterval(typingInterval.current);
      if (spinnerInterval.current) window.clearInterval(spinnerInterval.current);
    };
  }, [currentStep, steps.length]);

  const typeCommand = () => {
    const command = 'xyd';
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= command.length) {
        setTerminalInput(command.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setShowServerMessage(true);
        }, 500);
      }
    }, 150);
  };

  const getStepStyle = (step: Step) => {
    if (step.isCommand) return styles.stepWhite;
    if (step.text.startsWith('Server')) return styles.stepGreen;
    if (step.text.startsWith('Installing')) return styles.stepYellow;
    return styles.stepGreen;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.wrapper}
    >
      <div className={styles.header}>
        <div className={styles.windowControls}>
          <div className={styles.dots}>
            <motion.div whileHover={{ scale: 1.2 }} className={`${styles.dot} ${styles.dotRed}`} />
            <motion.div whileHover={{ scale: 1.2 }} className={`${styles.dot} ${styles.dotYellow}`} />
            <motion.div whileHover={{ scale: 1.2 }} className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
        </div>
        <div className={styles.tabs}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('terminal')}
            className={`${styles.tab} ${activeTab === 'terminal' ? styles.tabActive : styles.tabInactive}`}
          >
            <TerminalIcon size={14} />
            <span>Terminal</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('introduction')}
            className={`${styles.tab} ${activeTab === 'introduction' ? styles.tabActive : styles.tabInactive}`}
          >
            <FileText size={14} />
            <span>introduction.mdx</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'terminal' ? (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
            ref={contentRef}
            className={styles.content}
          >
            <div className={styles.stepList}>
              <AnimatePresence>
                {!isResetting && visibleSteps.map((step, idx) => (
                  <motion.div
                    key={`${step.text}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`${styles.step} ${getStepStyle(step)}`}
                  >
                    {currentStep === 1 && idx === visibleSteps.length - 1 && (
                      <span className={styles.spinner}>{spinnerFrames[spinnerFrame]}</span>
                    )}
                    {!step.isCommand && step.status === 'complete' && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={styles.checkmark}
                      >
                        ✓
                      </motion.span>
                    )}
                    <span>{step.isCommand ? '> ' : ''}{step.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isTyping && !isResetting && (
                <div className={`${styles.step} ${styles.stepWhite}`}>
                  <span>{'> '}</span>
                  <span>{currentTypingText}</span>
                  <motion.span
                    animate={{ opacity: [0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                    className={styles.cursor}
                  >
                    ▋
                  </motion.span>
                </div>
              )}
              <AnimatePresence>
                {currentStep >= steps.length && !isResetting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div className={`${styles.step} ${styles.stepWhite}`}>
                      <span>{'> '}</span>
                      <span>{terminalInput}</span>
                      {!showServerMessage && (
                        <motion.span
                          animate={{ opacity: [0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.7 }}
                          className={styles.cursor}
                        >
                          ▋
                        </motion.span>
                      )}
                    </motion.div>
                    {showServerMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className={styles.stepGreen}
                      >
                        Server is running on HTTP://localhost:3000
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="introduction"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className={styles.introduction}
          >
            <pre className={styles.introText}>
              {IntroductionContent}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {introText}
              </motion.span>
              {introText.length < 6 && (
                <motion.span
                  animate={{ opacity: [0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                >
                  ▋
                </motion.span>
              )}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}