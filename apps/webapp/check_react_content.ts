import { Heading } from '@xyd-js/components/writer';
console.log('Heading type:', typeof Heading);
console.log('Heading:', Heading);
if (typeof Heading === 'function') {
    console.log('Heading prototype:', Heading.prototype);
}
