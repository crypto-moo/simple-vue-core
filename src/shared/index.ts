
export const extend = Object.assign

export const isObject = function(obj: any) {
    return obj !== null && obj !== undefined && typeof obj === 'object'
}