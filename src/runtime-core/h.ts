import { VNode, createVNode } from "./vnode";

export function h(type: string, props: any, children: string | Array<VNode>): VNode {
    return createVNode(type, props, children)
}