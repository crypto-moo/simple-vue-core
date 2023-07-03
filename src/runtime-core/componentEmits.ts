import { camelCase, capitalized, toHandlerKey } from '../shared/index';
import { ComponentInstance } from './component';


export function emit(instance: ComponentInstance, event: string, ...args: any[]) {
    // console.log('emit:', event, instance);
    const { props } = instance

    const handlerKey = toHandlerKey(capitalized(camelCase(event)))
    const handler = props[handlerKey]
    if (handler) {
        handler(...args)
    }

    // console.log(toHandlerKey(capitalized(event)));
    
}