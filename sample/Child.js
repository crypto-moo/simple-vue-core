import { h } from "../lib/simple-vue.esm.js"

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
            }}, 'OtherEmit')
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