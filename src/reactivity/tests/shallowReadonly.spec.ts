import { isReactive, isReadonly, readonly, shallowReadonly } from "../reactive"

describe('shallowReadonly', () => {
    it('core', () => {
        const obj = {
            foo: {
                num: 1
            }
        }
        const srObj = shallowReadonly(obj)
        const rObj = readonly(obj)
        expect(isReactive(srObj)).toBe(false)
        expect(srObj).not.toBe(rObj)
        expect(isReadonly(srObj)).toBe(true)
        expect(isReadonly(srObj.foo)).toBe(false)
    })
})