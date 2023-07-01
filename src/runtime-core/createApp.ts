import { render } from "./renderer"
import { createVNode } from "./vnode"

// 1、createApp，返回值为带有mount方法的对象
export function createApp(rootComponent: object) {
    return {
        mount(rootContainer: Element) {
            // 2、创建根组件虚拟节点
            const vnode = createVNode(rootComponent)
            // 3、渲染基于根虚拟节点为dom
            render(vnode, rootContainer)
        }
    }
}