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

export const BUILT_IN_PROPERTIES: { [key: string]: boolean } = {
    "__internal_getRefPath": true,
}