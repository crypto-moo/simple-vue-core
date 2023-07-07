import { createTextVNode, h, inject, provide } from "../../lib/simple-vue.esm.js"


export const ProviderOne = {
    render() {
        return h(ProviderTwo)
    },
    setup() {
        provide('header', 'one header')
        provide('footer', 'one footer')
    }
}

const ProviderTwo = {
    render() {
        return h('div', {}, [
            createTextVNode('Provider Two, Inject header:' + this.header + ' footer:' + this.footer),
            h(Injecter)
        ])
    },
    setup() {
        const footer = inject('footer')
        provide('center', 'two center')
        provide('header', 'two header')
        const header = inject('header')
        return {
            header,
            footer
        }
    }
}

const Injecter = {
    render() {
        return h('div', {}, `header: ${this.header} - center: ${this.center} - footer: ${this.footer}`)
    },
    setup() {
        const header = inject('header')
        const footer = inject('footer')
        const center = inject('center')
        return {
            header,
            footer,
            center
        }
    }
}