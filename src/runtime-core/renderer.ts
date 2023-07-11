import { effect } from "../reactivity/effect"
import { isObject } from "../shared/index"
import { ShapeFlags } from "../shared/shapeFlags"
import { ComponentInstance, createComponentInstance, setupComponent } from "./component"
import { createAppApi } from "./createApp"
import { Fragment, Text, VNode } from "./vnode"

export type RendererOptions = {
    createElement: Function
    patchProp: Function
    insert: Function
    setElementText: Function
    remove: Function
}

export function createRenderer(options: RendererOptions) {
    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
        setElementText: hostSetElementText,
        remove: hostRemove,
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
        mountChildren(vnode.children as VNode[], el, parent)
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
        if (instance.isMounted) {
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
            instance.isMounted = true
        }
    }
    
    function processElement(oldVNode: VNode | null, vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        if (!oldVNode) {
            mountElement(vnode, rootContainer, parent)
        } else {
            updateElement(oldVNode, vnode, rootContainer, parent)
        }
    }

    function updateElement(oldVNode: VNode, vnode: VNode, container: Element, parent: ComponentInstance | null) {
        console.log('update element!', oldVNode.props, vnode.props);
        const oldProps = oldVNode.props
        const newProps = vnode.props

        const el = (vnode.$el = oldVNode.$el)

        patchProps(el!, oldProps, newProps)

        patchChildren(oldVNode, vnode, el!, parent)
    }

    function patchChildren(oldVNode: VNode, vnode: VNode, el: Element, parent: ComponentInstance | null) {
        const { shapeFlag: oldShapeFlag, children: oldC } = oldVNode
        const { shapeFlag, children: c } = vnode

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (c !== oldC) {
                unmountChildren(oldC as VNode[])
                hostSetElementText(el, vnode.children as string)
            }
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(el, '')
                mountChildren(vnode.children as VNode[], el, parent)
            }
        }
    }

    function unmountChildren(children: VNode[]) {
        if (isObject(children)) {
            children.forEach(child => {
                hostRemove(child.$el)
            })
        }
    }

    function patchProps(el: Element, oldProps: any, newProps: any) {
        if (oldProps === newProps) return
        for (const key in newProps) {
            if (Object.prototype.hasOwnProperty.call(newProps, key)) {
                const prop = newProps[key]
                const oldProp = oldProps[key]
                if (prop !== oldProp) {
                    hostPatchProp(el, key, prop)
                }
            }
        }
        for (const key in oldProps) {
            if (Object.prototype.hasOwnProperty.call(oldProps, key)) {
                const prop = oldProps[key];
                if (!(key in newProps)) {
                    hostPatchProp(el, key, null)
                }
            }
        }
    }
    
    function mountElement(vnode: VNode, rootContainer: Element, parent: ComponentInstance | null) {
        // const node = document.createElement(vnode.type as string)
        const node = hostCreateElement(vnode.type)
        vnode.$el = node
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            node.textContent = vnode.children as string
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children as VNode[], node, parent)
        }
        if (vnode.props) {
            for (const key in vnode.props) {
                const val = vnode.props[key]
                hostPatchProp(node, key, val)
                // if (isEvent(key)) {
                //     node.addEventListener(key.substring(2).toLocaleLowerCase(), val)
                // } else {
                //     node.setAttribute(key, val)
                // }
            }
        }
        // rootContainer.appendChild(node)
        hostInsert(node, rootContainer)
    }
    
    function mountChildren(children: VNode[], node: Element, parent: ComponentInstance | null) {
        children.forEach((child) => {
            patch(null, child, node, parent)
        })
    }

    return {
        render,
        createApp: createAppApi(render)
    }
}


