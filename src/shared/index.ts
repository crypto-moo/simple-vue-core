
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

 // add-other ---> addOther
 export const camelCase = (str: string) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : ''
    })
}
// 首字母大写
export const capitalized = (str: string) => {
    return str.substring(0, 1).toUpperCase() + str.substring(1)
}
// 添加on
export const toHandlerKey = (capitalizedStr: string) => {
    return capitalizedStr ? 'on' + capitalizedStr : ''
}

export function isEvent(key: string) {
    return /^on[A-Z]/.test(key)
}
