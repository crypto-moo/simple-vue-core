import { readonly } from "../reactive"

describe('readonly', () => {
    it('core', () => {
        const obj = {num: 1}
        const rxObj = readonly(obj)
        expect(rxObj).not.toBe(obj)
        expect(rxObj.num).toBe(1)
    })

    it('set warning', () => {
        console.warn = jest.fn()
        const obj = {num: 1}
        const rxObj = readonly(obj)
        rxObj.num = 2
        expect(console.warn).toBeCalled()
    })
})