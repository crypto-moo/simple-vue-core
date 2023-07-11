import { createApp } from "../../lib/simple-vue.esm.js";
import { App } from "./App.js";

const dom = document.getElementById('app')
createApp(App).mount(dom)