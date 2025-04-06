import {html, css, LitElement, unsafeCSS} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {styleMap} from 'lit/directives/style-map.js';

import styles from './Cards.style.css?raw';

interface CardData {
    name: string;
    href: string;
    outlineImage: string;
    filledImage: string;
}

@customElement('xyd-cards')
export class Cards extends LitElement {
    static styles = css`${unsafeCSS(styles)}`;

    @property({type: Array})
    declare cards: CardData[]

    constructor() {
        super();

        this.cards = [];
    }

    render() {
        return html`
            <div class="cards-grid">
                ${this.cards.map(card => this.renderCard(card))}
                ${this.cardBackgrounds()}
            </div>
        `

        return html`
            <div style=${styleMap({
                display: 'grid',
                gridTemplateColumns: `repeat(2, minmax(0, 1fr))`,
            })}>
                <div>
                    <h1>
                        My Cards
                    </h1>
                </div>
                <div class="cards-grid">
                    ${this.cards.map(card => this.renderCard(card))}
                    ${this.cardBackgrounds()}
                </div>
                <div style=${styleMap({
                    gridRowStart: 1,
                    gridColumnStart: 2,
                })}>
                    <h1>
                        My OOOU
                    </h1>
                </div>
                <div class="cards-grid">
                    ${this.cards.slice(0, 3).map(card => this.renderCard(card))}
                    ${this.cardBackgrounds()}
                </div>
            </div>
        `;
    }

    private renderCard(card: CardData) {
        return html`
            <a part="card" class="card" href=${card.href}>
                <div part="content" class="card-content">
                    <div part="image-container" class="card-image-container">
                        <img
                                part="image-outline"
                                alt=""
                                loading="lazy"
                                width="104"
                                height="42"
                                decoding="async"
                                data-nimg="1"
                                class="card-image-outline"
                                style="color:transparent"
                                src=${card.outlineImage}
                        >
                        <img
                                part="image-filled"
                                alt=""
                                loading="lazy"
                                width="104"
                                height="42"
                                decoding="async"
                                data-nimg="1"
                                class="card-image-filled"
                                style="color:transparent"
                                src=${card.filledImage}
                        >
                    </div>
                    <div part="title" class="card-title">
                        ${card.name}
                    </div>
                </div>
            </a>
        `;
    }

    private cardBackgrounds() {
        return html`
            <div class="cards-background">
                <div class="vertical-line vertical-line-left"></div>
                <div class="vertical-line vertical-line-right"></div>
                <div class="vertical-line vertical-line-center"></div>
                <div class="vertical-line vertical-line-two-thirds"></div>
            </div>
        `;
    }
}
