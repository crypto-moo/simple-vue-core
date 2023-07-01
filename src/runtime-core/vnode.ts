
export type VNode = {
    type: string | object
    props?: any
    children?: string | Array<VNode>
    $el?: Element
}

export function createVNode(type: string | object, props?: object, children?: string | Array<any>): VNode {
    return {
        type,
        props,
        children
    }
}