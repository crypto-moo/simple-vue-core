import { isReactive, reactive } from "../reactive"

describe('reactive', () => {
    it('core', () => {
        const obj = {foo: 1}
        const rxObj = reactive(obj)

        expect(obj).not.toBe(rxObj)

        expect(obj.foo).toBe(rxObj.foo)

        expect(isReactive(rxObj)).toBe(true)
        expect(isReactive(obj)).toBe(false)
    })

    it('nested reactive', () => {
        const obj = {
            nested: {
                foo: 1
            },
            array: [1, 2, 3]
        }
        const rxObj = reactive(obj)
        expect(isReactive(rxObj)).toBe(true)
        expect(isReactive(rxObj.nested)).toBe(true)
        expect(isReactive(rxObj.array)).toBe(true)
    })
})