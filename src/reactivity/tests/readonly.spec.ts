import { isReadonly, readonly } from "../reactive"

describe('readonly', () => {
    it('core', () => {
        const obj = {
            num: 1,
            foo: {
                name: 'foo'
            }
        }
        const rxObj = readonly(obj)
        expect(rxObj).not.toBe(obj)
        expect(rxObj.num).toBe(1)

        expect(isReadonly(rxObj)).toBe(true)
        expect(isReadonly(obj)).toBe(false)
        expect(isReadonly(rxObj.foo)).toBe(true)
    })

    it('set warning', () => {
        console.warn = jest.fn()
        const obj = {num: 1}
        const rxObj = readonly(obj)
        rxObj.num = 2
        expect(console.warn).toBeCalled()
    })
})