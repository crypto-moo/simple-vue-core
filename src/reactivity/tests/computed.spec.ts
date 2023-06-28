import { computed } from "../computed"
import { reactive } from "../reactive"

describe('computed', () =>  {
    it('core', () => {
        const obj = {age: 12}
        const rxObj = reactive(obj)
        const age = computed(() => {
            return rxObj.age
        })
        // computed核心
        expect(age.value).toBe(12)
    })

    it.only('computed lazy', () => {
        const obj = {age: 12}
        const rxObj = reactive(obj)
        const fn = jest.fn(() => {
            return rxObj.age
        })
        const age = computed(fn)
        // 未获取.value不会调用fn
        expect(fn).not.toBeCalled()
        
        // 获取.value调用一次fn
        expect(age.value).toBe(12)
        expect(fn).toBeCalledTimes(1)
        
        // 值未改变，重新获取不会调用
        age.value
        expect(fn).toBeCalledTimes(1)

        // 改变computed依赖的值，fn不会马上执行
        rxObj.age = 22
        expect(fn).toBeCalledTimes(1)
        // 改变依赖的值，重新调用.value才会重新调用fn
        expect(age.value).toBe(22)
        expect(fn).toBeCalledTimes(2)
    })
})