import { RendererOptions, createRenderer } from "../runtime-core/renderer";
import { isEvent } from "../shared/index";

const options: RendererOptions = {
  createElement(type: string) {
    console.log('createElement!');
    const node = document.createElement(type);
    return node;
  },
  patchProp(node: Element, key: string, val: any) {
    console.log('patchProp');
    if (isEvent(key)) {
      node.addEventListener(key.substring(2).toLocaleLowerCase(), val);
    } else {
      node.setAttribute(key, val);
    }
  },
  insert(node: Element, rootContainer: Element) {
    console.log('insert');
    rootContainer.appendChild(node)
  },
};

export const render = createRenderer(options);
