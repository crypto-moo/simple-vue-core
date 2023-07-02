
export const extend = Object.assign

export const isObject = function(obj: any) {
    return obj !== null && obj !== undefined && typeof obj === 'object'
}

export const hasChanged = function(val: any, val1: any) {
    return !Object.is(val, val1)
}

export const hasOwn = function(obj: any, key: PropertyKey) {
    return Object.prototype.hasOwnProperty.call(obj, key)
}