export const SUPPORTED_HTTP_METHODS: string[] = [
    'get',
    'put',
    'patch',
    'post',
    'delete',
    // 'options',
    // 'head',
    // 'trace'
];

export const SUPPORTED_CONTENT_TYPES: {[key: string]: boolean} = {
    "application/json": true,

    "application/x-www-form-urlencoded": true,
}