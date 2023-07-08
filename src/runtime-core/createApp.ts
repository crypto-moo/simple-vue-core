// import { render } from "./renderer"
import { render } from "../runtime-dom/index"
import { createVNode } from "./vnode"

// 1、createApp，返回值为带有mount方法的对象
export function createApp(rootComponent: object, customRender: Function) {
    return {
        mount(rootContainer: Element) {
            // 2、创建根组件虚拟节点
            const vnode = createVNode(rootComponent)
            // 3、渲染基于根虚拟节点为dom
            if (!!customRender) {
                customRender(vnode, rootContainer)
            } else {
                render(vnode, rootContainer)
            }
        }
    }
}