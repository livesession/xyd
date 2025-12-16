import { stdContent } from '@xyd-js/components/content';

try {
    const components = stdContent();
    console.log('Available components:', Object.keys(components));
    console.log('H1 type:', typeof components.H1);
    // Check if it's a valid component we can render (function)
    console.log('Is H1 functional:', typeof components.H1 === 'function');
} catch (e) {
    console.error('Error accessing stdContent:', e);
}
