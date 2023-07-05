import { ShapeFlags } from "../shared/ShapeFlags"
import { isObject } from "../shared/index"

export type VNode = {
    type: string | object
    shapeFlag: ShapeFlags
    props?: any
    children?: string | Array<VNode>
    $el?: Element
}

export function createVNode(type: string | object, props?: object, children?: string | Array<any>): VNode {
    return {
        type,
        shapeFlag: getShapeFlag(type, children),
        props,
        children
    }
}

function getShapeFlag(type: string | object, children?: string | Array<any>) {
    let shapeFlag = typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFULE_COMPONENT
    if (typeof children === 'string') {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (Array.isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }

    if (shapeFlag & ShapeFlags.STATEFULE_COMPONENT) {
        if (isObject(children)) {
            shapeFlag |= ShapeFlags.SLOT_CHILDREN
        }
    }
    return shapeFlag
}