import { isObject } from "../shared/index"
import { Fragment, createVNode } from "./vnode"

export function renderSlots(slots: {[_: string]: Function}, key: string, props: any) {
    
    const slot = slots[key]
    if (slot && typeof slot === 'function') {
        const slotChildren = slot(props)
        return createVNode(Fragment, {}, Array.isArray(slotChildren) ? slotChildren : [slotChildren])
    }
    return createVNode('div')
}