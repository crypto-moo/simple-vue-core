import { ShapeFlags } from "../shared/ShapeFlags"
import { ComponentInstance, createComponentInstance, setupComponent } from "./component"
import { VNode } from "./vnode"

export function render(vnode: VNode, rootContainer: Element) {
    // 3.1 调用patch
    patch(vnode, rootContainer)
}

function patch(vnode: VNode, rootContainer: Element) {
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
        // console.log(vnode);
        processElement(vnode, rootContainer)
    } else if (vnode.shapeFlag & ShapeFlags.STATEFULE_COMPONENT) {
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
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        node.textContent = vnode.children as string
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode.children as VNode[], node)
    }
    if (vnode.props) {
        for (const key in vnode.props) {
            const val = vnode.props[key]
            if (isEvent(key)) {
                node.addEventListener(key.substring(2).toLocaleLowerCase(), val)
            } else {
                node.setAttribute(key, val)
            }
        }
    }
    rootContainer.appendChild(node)
}

function isEvent(key: string) {
    return /^on[A-Z]/.test(key)
}

function mountChildren(children: VNode[], node: HTMLElement) {
    children.forEach((child) => {
        patch(child, node)
    })
}

