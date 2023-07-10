import { createTextVNode, h, ref } from "../../lib/simple-vue.esm.js"


export const App = {
    setup() {
        
        const number = ref(100)
        return {
            number: number
        }
    },
    render() {
        return h('div', {}, [
            h('p', {}, 'number:' + this.number),
            h('button', {onClick: () => {
                console.log('add click!');
                this.number += 1
                console.log(this.number);
            }}, 'add')
        ])
    }
}