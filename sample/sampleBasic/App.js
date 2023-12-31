import {h, createTextVNode, getCurrentInstance} from '../../lib/simple-vue.esm.js'
import Child from './Child.js';

export default {
    render() {
        window.self = this
        return h('div', {}, [
            h(Child, {count: 23, onAdd(a, b) {
                console.log('on add:', a, b);
            }, onAddOther(a, b) {
                console.log('on add other:', a, b);
            }}, {
                header: () => createTextVNode('123')
            }),
            h(Child, {count: 23, onAdd(a, b) {
                console.log('on add:', a, b);
            }, onAddOther(a, b) {
                console.log('on add other:', a, b);
            }}, {
                footer: () => [h('p', {}, 'footer')],
                header: ({age}) => h('p', {}, 'header' + age),
            }),
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
        console.log(getCurrentInstance());
        return {
            msg: 'simple vue-core',
            page: 'i am page'
        }
    }
}