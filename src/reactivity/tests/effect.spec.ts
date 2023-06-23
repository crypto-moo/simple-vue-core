import { effect } from "../effect"
import { reactive } from "../reactive"

describe('effect', () => {
    // it('core', () => {
    //     const obj = {
    //         num: 1,
    //         name: 'abc'
    //     }
    //     const rxObj = reactive(obj)

    //     let num
    //     effect(() => {
    //         num = rxObj.num + 1
    //     })

    //     expect(num).toBe(2)

    //     let num1
    //     effect(() => {
    //         num1 = rxObj.num + 1
    //     })
    //     rxObj.num++
    //     expect(num).toBe(3)
    //     expect(num1).toBe(3)
    //     rxObj.name = 'def'
    // })

    // it('runner', () => {
    //     let num = 1
    //     const runner = effect(() => {
    //         num++
    //         return 'effect'
    //     })

    //     expect(num).toBe(2)

    //     const res = runner()
    //     expect(num).toBe(3)
    //     expect(res).toBe('effect')
    // })

    it('scheduler', () => {
        const obj = {num: 1}
        const rxObj = reactive(obj)
        let num
        let run
        const scheduler = jest.fn(() => {
            run = runner
        })
        const runner = effect(() => {
            num = rxObj.num
        }, {
            scheduler
        })
        expect(num).toBe(1)
        expect(scheduler).not.toHaveBeenCalled()

        rxObj.num++
        expect(num).toBe(1)
        expect(scheduler).toHaveBeenCalledTimes(1)

        run()
        expect(num).toBe(2)
    })
})