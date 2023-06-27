import { effect } from "../effect"
import { ref } from "../ref"

describe('ref', () => {
    it('core', () => {
        const refFoo = ref(1)
        expect(refFoo.value).toBe(1)

        let num = 1
        let foo
        effect(() => {
            num++
            foo = refFoo.value  
        })
        expect(num).toBe(2)
        expect(foo).toBe(1)

        refFoo.value++
        expect(num).toBe(3)
        expect(foo).toBe(2)

        refFoo.value = 2
        expect(num).toBe(3)
        expect(foo).toBe(2)
    })

    it('ref is reactive', () => {
        const obj = {foo: 1}
        const refObj = ref(obj)
        let foo
        effect(() => {
            foo = refObj.value.foo
        })
        expect(foo).toBe(1)
        refObj.value.foo = 2
        expect(foo).toBe(2)
        
        refObj.value = obj
        expect(foo).toBe(2)

    })
})