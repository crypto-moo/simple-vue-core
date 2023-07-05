import { isObject } from "../shared/index"
import { createVNode } from "./vnode"

export function renderSlots(slots: {[_: string]: Function}, key: string, props: any) {
    
    const slot = slots[key]
    if (slot && typeof slot === 'function') {
        const slotChildren = slot(props)
        return createVNode('div', {}, isObject(slotChildren) ? Array.isArray(slotChildren) ? slotChildren : [slotChildren] : slotChildren.toString())
    }
    return createVNode('div')
}