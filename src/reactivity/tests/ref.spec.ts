import { effect } from "../effect"
import { reactive } from "../reactive"
import { isRef, proxyRefs, ref, unRef } from "../ref"

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

    it('is ref', () => {
        const refObj = ref(1)
        const rxObj = reactive({name: 'wawa'})
        expect(isRef(refObj)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(rxObj)).toBe(false)
    })

    it('un ref', () => {
        const refObj = ref(1)
        expect(unRef(refObj)).toBe(1)
        const obj = {name: 'wawa'}
        const refObj1 = ref(obj)
        expect(unRef(refObj1)).toBe(obj)
    })

    it.only('proxy refs', () => {
        const obj = {
            user: ref('wawa'),
            age: 20
        }
        const pr = proxyRefs(obj)
        expect(obj.user.value).toBe('wawa')
        expect(pr.user).toBe('wawa')
        expect(pr.age).toBe(20)

        pr.user = 'haha'
        expect(obj.user.value).toBe('haha')
        expect(pr.user).toBe('haha')
        expect(pr.age).toBe(20)

        pr.user = 'gaga'
        pr.age = 30
        expect(obj.user.value).toBe('gaga')
        expect(pr.user).toBe('gaga')
        expect(pr.age).toBe(30)
    })
})