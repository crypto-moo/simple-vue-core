import { h, ref } from "../../lib/simple-vue.esm.js"

export const ArrayToText = {
    setup() {
        const isChanged = ref(false)
        window.isChanged = isChanged
        return {
            isChanged
        }
    },
    render() {
        const children = this.isChanged ? 'I am text!' : [h('p', {}, 'A'), h('p', {}, 'B')]
        return h('div', {}, children)
    }
}