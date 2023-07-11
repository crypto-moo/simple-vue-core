import { createTextVNode, h, ref } from "../../lib/simple-vue.esm.js"
import { ArrayToText } from "./ArrayToText.js"
import { TextToArray } from "./TextToArray.js"
import { TextToText } from "./TextToText.js"


export const App = {
    setup() {
        
    },
    render() {
        return h(ArrayToText)
        return h(TextToArray)
        return h(TextToText)
    }
}