import { Text } from '@primer/react-brand';
import {
    DatabaseIcon,
    CodeIcon,
    GearIcon,
    ServerIcon,
    MarkGithubIcon,
    MarkdownIcon,
} from '@primer/octicons-react';
import styles from './Ecosystem.module.css';

export function Ecosystem() {
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.mainGrid}>
                    {/* Input Section */}
                    <div className={styles.inputSection}>
                        <div className={`${styles.leftSideItem} ${styles.languageBox}`}>
                            <div className={styles.languageHeader}>
                                <CodeIcon className={styles.icon} />
                                <Text>
                                    Docs content
                                </Text>
                            </div>
                            <div className={styles.iconContainer}>
                                <i className="devicon-markdown-original"></i>
                                <i className="devicon-mdx-original"></i>
                                <MarkdownIcon />
                            </div>
                        </div>
                        <div className={styles.leftSideItem}>
                            <div className={styles.header}>
                                <div className={styles.leftContent}>
                                    <DatabaseIcon className={styles.icon} />
                                    <Text>
                                        API & Reference
                                    </Text>
                                </div>
                            </div>
                            <div className={styles.rightContent}>
                                <img src="/graphql-filled.svg" alt="GraphQL" />
                                <img src="/openapi-filled.svg" alt="OpenAPI" />
                                <img src="/typedoc-filled.svg" alt="Typedoc" />
                            </div>
                        </div>
                    </div>

                    {/* Central System */}
                    <div className={styles.centralSection}>
                        {/* AI Box */}
                        <div className={styles.aiBox}>
                            <div className={styles.aiTitle}>
                                <Text>AI</Text>
                            </div>
                            <div className={styles.aiContent}>
                                <Text>LLM.txt</Text>
                            </div>
                        </div>

                        <div className={styles.systemBox}>
                            <div className={styles.systemTitle}>
                                <Text>SYSTEM OF RECORD</Text>
                            </div>
                            <div className={styles.systemGrid}>
                                <div className={styles.systemSection}>
                                    <Text>WORKBENCH</Text>
                                </div>
                                <div className={styles.systemCog}>
                                    <GearIcon className={styles.cogIcon} />
                                </div>
                                <div className={styles.systemSection}>
                                    <Text>MLOPS</Text>
                                </div>
                            </div>
                            <div className={styles.systemSection}>
                                <Text>INFRASTRUCTURE ORCHESTRATION</Text>
                            </div>
                        </div>

                        {/* Data Platforms */}
                        <div className={styles.platformBox}>
                            <div className={styles.platformTitle}>
                                <Text>
                                    Plugins
                                </Text>
                            </div>
                            <div className={styles.iconContainer}>
                                <DatabaseIcon />
                                <ServerIcon />
                                <MarkGithubIcon />
                            </div>
                        </div>

                        {/* Infrastructure */}
                        {/* <div className={styles.platformBox}>
              <div className={styles.platformTitle}>INFRASTRUCTURE</div>
              <div className={styles.iconContainer}>
                <CloudIcon />
                <ServerIcon />
                <ToolsIcon />
              </div>
            </div> */}
                    </div>

                    {/* Output Section */}
                    <div className={styles.outputSection}>
                        <div className={styles.rightSideItem}>
                            <Text>DOCS</Text>
                        </div>
                        <div className={styles.rightSideItem}>
                            <Text>SDKs</Text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
