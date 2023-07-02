import {h} from '../lib/simple-vue.esm.js'

export default {
    render() {
        window.self = this
        return h('div', {}, [
            h('p', {class: 'red'}, 'red p ' + this.msg),
            h('p', {class: 'red'}, 'red p'),
            h('p', {class: 'blue'}, 'blue p'),
            h('p', {class: 'blue'}, [
                h('p', {class: 'pink'}, 'pink p')
            ]),
            h('p', {class: 'red'}, [
                h('ul', {}, [
                    h('li', {}, 'NO.1 ' + this.msg),
                    h('li', {}, 'NO.2 ' + this.page),
                    h('li', {}, 'NO.3')
                ])
            ]),
            h('p', {
                class: 'blue',
                onClick() {
                    console.log('click!!!');
                }
            }, 'blue p'),
        ])
    },
    setup() {
        return {
            msg: 'simple vue-core',
            page: 'i am page'
        }
    }
}