
import { App } from './App.js'
import { createRootContainer } from './game.js'
import { createApp } from './renderer.js'


const dom = document.getElementById('app')
// createApp(App, render).mount(dom)
createApp(App).mount(createRootContainer())

