import { isObject } from "../shared/index";
import { ComponentInstance } from "./component";
import { VNode, createVNode } from "./vnode";


export function initSlots(instance: ComponentInstance, slots?: any) {
    // if (isObject(slots)) {
    //     instance.$slots = Array.isArray(slots) ? slots : [slots as VNode]
    // } else {
    //     instance.$slots = [createVNode('div', {}, slots?.toString())]
    // }
    instance.slots = slots
}