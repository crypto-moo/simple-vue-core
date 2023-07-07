
import { createApp } from '../../lib/simple-vue.esm.js'
import { ProviderOne } from './App.js'

const rootDom = document.querySelector('#app')
createApp(ProviderOne).mount(rootDom)