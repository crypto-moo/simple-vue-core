import { h, ref } from "../../lib/simple-vue.esm.js"
import { game } from "./game.js"

export const App = {
    setup() {
        return {
            x: 0,
            y: 0
        }
    },
    render() {
        return h('rect', {x: this.x, y: this.y})
    }
}