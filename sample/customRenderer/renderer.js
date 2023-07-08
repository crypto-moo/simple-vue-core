import {
    createRenderer
} from '../../lib/simple-vue.esm.js'

export const render = createRenderer({
    createElement(type) {
        console.log('custom createElement', type);
        const rect = new PIXI.Graphics();
        rect.beginFill(0xff6600);
        rect.drawRect(100, 100, 300, 300);
        rect.endFill();
        return rect
    },
    patchProp(el, key, val) {
        console.log('custom patchProp');
        el[key] = val
    },
    insert(el, rootEl) {
        console.log('custom insert');

        rootEl.addChild(el)
    }
})