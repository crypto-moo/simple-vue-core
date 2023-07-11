import { createTextVNode, h, ref } from "../../lib/simple-vue.esm.js"


export const App = {
    setup() {
        const number = ref(100)
        const props = ref({
            class: 'red',
            foo: 'foo',
            baz: 'baz'
        })
        return {
            number: number,
            props,
            onChangeValue: () => {
                props.value.class = 'blue'
            },
            onChangeNull: () => {
                props.value.class = null
            },
            onChangeNew: () => {
                props.value = {
                    foo: 'new-foo'
                }
            }
        }
    },
    render() {
        return h('div', {...this.props}, [
            h('p', {}, 'number:' + this.number),
            h('button', {onClick: () => {
                console.log('add click!');
                this.number += 1
                console.log(this.number);
            }}, 'add'),
            h('button', {onClick: this.onChangeValue}, 'changePropsValue'),
            h('button', {onClick: this.onChangeNull}, 'onChangeNull'),
            h('button', {onClick: this.onChangeNew}, 'onChangeNew')
        ])
    }
}