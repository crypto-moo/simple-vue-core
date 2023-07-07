import { getCurrentInstance } from "./component";
// provide\inject必须在setup中使用
export function provide(key: string, value: any) {
  const instance = getCurrentInstance();
  if (instance) {
    let { provides } = instance;
    if (provides) {
      const parentProvides = instance.parent?.provides;
      if (provides === parentProvides) {
        // 当前的provides值为父provides重新创建一份，不是改的同一份
        provides = instance.provides = Object.create(parentProvides);
      }
      provides[key] = value;
    }
  }
}

export function inject(key: string, defaultVal: any) {
  const instance = getCurrentInstance();
  if (instance) {
    const provides = instance.parent?.provides
    if (key in provides) {
        return provides[key]
    } else if (defaultVal) {
        if (typeof defaultVal === 'function') {
            return defaultVal()
        }
        return defaultVal
    }
  }
}

