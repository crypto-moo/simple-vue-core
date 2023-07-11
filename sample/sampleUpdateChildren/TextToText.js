import { h, ref } from "../../lib/simple-vue.esm.js"

export const TextToText = {
    setup() {
        const isChanged = ref(false)
        window.isChanged = isChanged
        return {
            isChanged
        }
    },
    render() {
        const children = this.isChanged ? 'I am changed!' : 'I am origin!'
        return h('div', {}, children)
    }
}