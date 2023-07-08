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
        patch(vnode, rootContainer, null)
    }
    
    function patch(vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        if (vnode.type === Fragment) {
            processFragment(vnode, rootContainer, parent)
        } else if (vnode.type === Text) {
            processText(vnode, rootContainer)
        } else if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
            // console.log(vnode);
            processElement(vnode, rootContainer, parent)
        } else if (vnode.shapeFlag & ShapeFlags.STATEFULE_COMPONENT) {
            processComponent(vnode, rootContainer, parent)
        }
    }
    
    function processText(vnode: VNode, parent: Element) {
        const el: any = document.createTextNode(vnode.children as string)
        vnode.$el = el
        parent.appendChild(el)
    }
    
    function processFragment(vnode: VNode, el: Element, parent: ComponentInstance | null) {
        mountChildren(vnode.children as VNode[], el, parent)
    }
    
    function processComponent(vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        mountComponent(vnode, rootContainer, parent)
    }
    
    function mountComponent(vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        const instance = createComponentInstance(vnode, parent as ComponentInstance)
    
        setupComponent(instance)
    
        setupRenderEffect(instance, rootContainer)
    }
    
    function setupRenderEffect(instance: ComponentInstance, rootContainer: Element) {
        if (!instance.render) return
        const initVNode = instance.render.call(instance.proxy)
        patch(initVNode, rootContainer, instance)
        instance.vnode.$el = initVNode.$el
    }
    
    function processElement(vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        mountElement(vnode, rootContainer, parent)
    }
    
    function mountElement(vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        // const node = document.createElement(vnode.type as string)
        const node = createElement(vnode.type)
        vnode.$el = node
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            node.textContent = vnode.children as string
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children as VNode[], node, parent)
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
    
    function mountChildren(children: VNode[], node: Element, parent: ComponentInstance | null) {
        children.forEach((child) => {
            patch(child, node, parent)
        })
    }

    return {
        render,
        createApp: createAppApi(render)
    }
}


