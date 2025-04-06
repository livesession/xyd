import {createComponent} from '@lit/react';
import {Cards} from './Cards.ts';
import React from 'react';

export const CardsElement = createComponent({
    tagName: 'xyd-cards',
    elementClass: Cards,
    react: React,
    events: {
        // Add any events you want to handle here
    },
});