import {
    createApp
} from '../../lib/simple-vue.esm.js'
import App from './App.js'

const rootDom = document.querySelector('#app')
createApp(App).mount(rootDom)
