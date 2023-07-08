import { createApp } from '../../lib/simple-vue.esm.js' 
import { App } from './App.js'
import { createRootContainer } from './game.js'
import { render } from './renderer.js'


const dom = document.getElementById('app')
// createApp(App, render).mount(dom)
createApp(App, render).mount(createRootContainer())

