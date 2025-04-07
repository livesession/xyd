import React from 'react';

import styles from './Cards.module.css';

interface CardData {
    name: string;
    href: string;
    outlineImage: string;
    filledImage: string;
}

interface CardsProps {
    cards: CardData[];
}

export const Cards: React.FC<CardsProps> = ({cards}) => {
    const renderCard = (card: CardData) => (
        <a key={card.href} className={styles.card} href={card.href}>
            <div className={styles.cardContent}>
                <div className={styles.cardImageContainer}>
                    <img
                        className={styles.cardImageOutline}
                        alt=""
                        loading="lazy"
                        width={104}
                        height={42}
                        decoding="async"
                        data-nimg="1"
                        style={{color: 'transparent'}}
                        src={card.outlineImage}
                    />
                    <img
                        className={styles.cardImageFilled}
                        alt=""
                        loading="lazy"
                        width={104}
                        height={42}
                        decoding="async"
                        data-nimg="1"
                        style={{color: 'transparent'}}
                        src={card.filledImage}
                    />
                </div>
                <div className={styles.cardTitle}>
                    {card.name}
                </div>
            </div>
        </a>
    );

    const cardBackgrounds = () => (
        <div className={styles.cardsBackground}>
            <div className={`${styles.verticalLine} ${styles.verticalLineLeft}`}/>
            <div className={`${styles.verticalLine} ${styles.verticalLineRight}`}/>
            <div className={`${styles.verticalLine} ${styles.verticalLineCenter}`}/>
            <div className={`${styles.verticalLine} ${styles.verticalLineTwoThirds}`}/>
        </div>
    );

    return (
        <div className={styles.cardsGrid}>
            {cards.map(renderCard)}
            {cardBackgrounds()}
        </div>
    );
}; 