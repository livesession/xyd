import { createComponent } from '@lit/react';
import { LitCounter } from './LitCounter';
import React from 'react';

export const LitCounterWrapper = createComponent({
  tagName: 'lit-counter',
  elementClass: LitCounter,
  react: React,
  events: {
    // Add any events you want to handle here
  },
}); 