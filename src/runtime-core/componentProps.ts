import { ComponentInstance } from "./component";

export function initProps(instance: ComponentInstance, props?: any) {
    instance.props = props || {}
}