import { h } from "../lib/simple-vue.esm.js"

export default {
    render() {
        return h('div', {
            onClick() {

            }
        }, 'I am child, props count:' + this.count)
    },
    setup(props) {
        props.count += 20
    }
}