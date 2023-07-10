import { effect } from "../reactivity/effect"
import { ShapeFlags } from "../shared/shapeFlags"
import { ComponentInstance, createComponentInstance, setupComponent } from "./component"
import { createAppApi } from "./createApp"
import { Fragment, Text, VNode } from "./vnode"

export type RendererOptions = {
    createElement: Function
    patchProp: Function
    insert: Function
}

export function createRenderer(options: RendererOptions) {
    const {
        createElement,
        patchProp,
        insert
    } = options

    function render(vnode: VNode, rootContainer: Element) {
        // 3.1 调用patch
        patch(null, vnode, rootContainer, null)
    }
    
    function patch(oldVNode: VNode | null, vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        if (vnode.type === Fragment) {
            processFragment(oldVNode, vnode, rootContainer, parent)
        } else if (vnode.type === Text) {
            processText(oldVNode, vnode, rootContainer)
        } else if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
            // console.log(vnode);
            processElement(oldVNode, vnode, rootContainer, parent)
        } else if (vnode.shapeFlag & ShapeFlags.STATEFULE_COMPONENT) {
            processComponent(oldVNode, vnode, rootContainer, parent)
        }
    }
    
    function processText(oldVNode: VNode | null, vnode: VNode, parent: Element) {
        const el: any = document.createTextNode(vnode.children as string)
        vnode.$el = el
        parent.appendChild(el)
    }
    
    function processFragment(oldVNode: VNode | null, vnode: VNode, el: Element, parent: ComponentInstance | null) {
        mountChildren(oldVNode, vnode.children as VNode[], el, parent)
    }
    
    function processComponent(oldVNode: VNode | null, vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        mountComponent(oldVNode, vnode, rootContainer, parent)
    }
    
    function mountComponent(oldVNode: VNode | null, vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        const instance = createComponentInstance(vnode, parent as ComponentInstance)
    
        setupComponent(instance)
        effect(() => {
            setupRenderEffect(instance, rootContainer)
        })
    }
    
    function setupRenderEffect(instance: ComponentInstance, rootContainer: Element) {
        if (!instance.render) return
        if (instance.isMouted) {
            const subTree = instance.render.call(instance.proxy)
            const prevSubTree = instance.subTree!
            patch(prevSubTree, subTree, rootContainer, instance)
            console.log('prev:', prevSubTree);
            console.log('current:', subTree);
            instance.subTree = subTree
        } else {
            const initVNode = (instance.subTree = instance.render.call(instance.proxy))
            patch(null, initVNode, rootContainer, instance)
            instance.vnode.$el = initVNode.$el
            instance.isMouted = true
        }
    }
    
    function processElement(oldVNode: VNode | null, vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        mountElement(oldVNode, vnode, rootContainer, parent)
    }
    
    function mountElement(oldVNode: VNode | null, vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        // const node = document.createElement(vnode.type as string)
        const node = createElement(vnode.type)
        vnode.$el = node
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            node.textContent = vnode.children as string
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(oldVNode, vnode.children as VNode[], node, parent)
        }
        if (vnode.props) {
            for (const key in vnode.props) {
                const val = vnode.props[key]
                patchProp(node, key, val)
                // if (isEvent(key)) {
                //     node.addEventListener(key.substring(2).toLocaleLowerCase(), val)
                // } else {
                //     node.setAttribute(key, val)
                // }
            }
        }
        // rootContainer.appendChild(node)
        insert(node, rootContainer)
    }
    
    function mountChildren(oldVNode: VNode | null, children: VNode[], node: Element, parent: ComponentInstance | null) {
        children.forEach((child) => {
            patch(oldVNode, child, node, parent)
        })
    }

    return {
        render,
        createApp: createAppApi(render)
    }
}


