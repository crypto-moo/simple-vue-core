import { h, renderSlots } from "../lib/simple-vue.esm.js"

export default {
    render() {
        return h('div', {
            onClick() {

            }
        }, [
            h('p', {}, 'I am child, props count:' + this.count),
            h('button', {onClick: () => {
                this.emitAdd()
            }}, 'AddEmit'),
            h('button', {onClick: () => {
                this.emitAddOther()
            }}, 'OtherEmit'),
            renderSlots(this.$slots, 'header', {age: 20}),
            renderSlots(this.$slots, 'footer')
        ])
    },
    setup(props, {emit}) {
        props.count += 20
        const emitAdd = () => {
            emit('add', 1, 2)
        }
        const emitAddOther = () => {
            emit('add-other', 3, 4)
        }
        return {
            emitAdd,
            emitAddOther
        }
    }
}