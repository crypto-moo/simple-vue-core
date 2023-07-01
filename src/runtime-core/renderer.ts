import { ComponentInstance, createComponentInstance, setupComponent } from "./component"
import { VNode } from "./vnode"

export function render(vnode: VNode, rootContainer: Element) {
    // 3.1 调用patch
    patch(vnode, rootContainer)
}

function patch(vnode: VNode, rootContainer: Element) {
    if (typeof vnode.type === 'string') {
        // console.log(vnode);
        processElement(vnode, rootContainer)
    } else if (typeof vnode.type === 'object') {
        processComponent(vnode, rootContainer)
    }
}

function processComponent(vnode: VNode, rootContainer: Element) {
    mountComponent(vnode, rootContainer)
}

function mountComponent(vnode: VNode, rootContainer: Element) {
    const instance = createComponentInstance(vnode)

    setupComponent(instance)

    setupRenderEffect(instance, rootContainer)
}

function setupRenderEffect(instance: ComponentInstance, rootContainer: Element) {
    if (!instance.render) return
    const initVNode = instance.render.call(instance.proxy)
    patch(initVNode, rootContainer)
    instance.vnode.$el = initVNode.$el
}

function processElement(vnode: VNode, rootContainer: Element) {
    mountElement(vnode, rootContainer)
}

function mountElement(vnode: VNode, rootContainer: Element) {
    const node = document.createElement(vnode.type as string)
    vnode.$el = node
    if (typeof vnode.children === 'string') {
        node.textContent = vnode.children
    } else if (Array.isArray(vnode.children)) {
        mountChildren(vnode.children, node)
    }
    if (vnode.props) {
        for (const key in vnode.props) {
            const val = vnode.props[key]
            node.setAttribute(key, val)
        }
    }
    rootContainer.appendChild(node)
}

function mountChildren(children: VNode[], node: HTMLElement) {
    children.forEach((child) => {
        patch(child, node)
    })
}

