# 项目构建流程

## 项目初始化

> 配置 ts，集成 jest 做单元测试

### 1、初始化命令

```
yarn init -y
```

### 2、项目主目录 src，放置各模块

---| reactivity

### 3、各模块新建 tests 文件夹，为对应模块单元测试文件

### 4、集成 ts

```
npx tsc --init

```

如果报错需要安装 typescript，执行下面命令

```
yarn add typescript --dev
```

### 5、添加 jest、@types/jest

```
yarn add jest @types/jest --dev
```

如果单元测试文件还是报错，需要在 tsconfig.json 配置

```
"types": ["jest"],
```

### 6、添加单元测试脚本

package.json 添加

```
"scripts": {
    "test": "jest"
}
```

### 7、验证单元测试文件引用模块

/src/reactivity/index.ts

```
export function add(a: number, b: number) {
    return a + b
}
```

/src/reactivity/tests/index.spec.ts

```
import { add } from "../index";

it('init ', () => {
    expect(true).toBe(true);
    expect(add(1, 2)).toBe(3);
});
```

运行 yarn test 后报错，

```
SyntaxError: Cannot use import statement outside a module
```

> 报错说明：由于 jest 运行环境是 node.js 环境，node.js 环境模块引入规范是 CommonJS，而 import xxx from xxx 是 ECMA Script Modules（ESM）规范，不兼容导致，需要配置 babel 转化规范

### 8、安装 babel

安装 babel-jest、@babel/core、@babel/preset-env

```
yarn add babel-jest @babel/core @babel/preset-env --dev
```

添加 babel 对于 ts 的支持

```
yarn add @babel/preset-typescript --dev
```

创建 babel.config.js

```
module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "current"
                }
            }
        ],
        "@babel/preset-typescript"
    ]
}
```
### 9、配置rollup
安装rollup以及@rollup/plugin-typescript、tslib
```
yarn add rollup @rollup/plugin-typescript tslib --dev
```
添加rollup.config.js
```
import typescript from "@rollup/plugin-typescript"

export default {
    input: './src/index.ts',
    output: [
        {
            format: 'cjs',
            file: 'lib/simple-vue.cjs.js'
        },
        {
            format: 'es',
            file: 'lib/simple-vue.esm.js'
        }
    ],
    plugins: [typescript()]
}
```
package.json
```
  "scripts": {
    ...
    "build": "rollup -c rollup.config.js"
  },
```
运行 yarn build，报错
```
[!] RollupError: Node tried to load your configuration file as CommonJS even though it is likely an ES module. To resolve this, change the extension of your configuration to ".mjs", set "type": "module" in your package.json file or pass the "--bundleConfigAsCjs" flag.

Original error: Cannot use import statement outside a module
```
> 解决方案：rollup.config.js使用cjs方式，或者降低rollup版本到2.x
```
@rollup/plugin-typescript TS1005: ',' expected.
```
> 如果出现类似以上警告，说明ts版本过低，使用 npm i -g typescript 安装最新版版本ts，tsc -v可查看ts版本

## 项目核心 - reactivity

### 1、实现 reactive、effect、依赖收集、依赖触发

#### 1.1 单元测试

reactive.spec.ts：验证代理功能

```
import { reactive } from "../reactive"

describe('reactive', () => {
    it('core', () => {
        const obj = {foo: 1}
        const rxObj = reactive(obj)

        expect(obj).not.toBe(rxObj)

        expect(obj.foo).toBe(rxObj.foo)
    })
})
```

effect.spec.ts：副作用，依赖收集、依赖触发

```
import { effect } from "../effect"
import { reactive } from "../reactive"

describe('effect', () => {
    it('core', () => {
        const obj = {
            num: 1,
            name: 'abc'
        }
        const rxObj = reactive(obj)

        let num
        effect(() => {
            num = rxObj.num + 1
        })

        expect(num).toBe(2)

        let num1
        effect(() => {
            num1 = rxObj.num + 1
        })
        rxObj.num++
        expect(num).toBe(3)
        expect(num1).toBe(3)
        rxObj.name = 'def'
    })

    it('runner', () => {
        let num = 1
        const runner = effect(() => {
            num++
            return 'effect'
        })

        expect(num).toBe(2)

        const res = runner()
        expect(num).toBe(3)
        expect(res).toBe('effect')
    })
})
```

#### 1.2 功能实现

reactive.ts

```
import { track, trigger } from "./effect"

export function reactive(obj: any): any {
    return new Proxy(obj, {
        get(target, p, receiver) {
            const result = Reflect.get(target, p, receiver)
            // 访问了该属性，需要收集依赖
            track(target, p)
            return result
        },
        set(target, p, newValue) {
            const result = Reflect.set(target, p, newValue)
            // 设置了该属性，需要触发依赖
            trigger(target, p)
            return result
        }
    })
}
```

> 问题：如果报错找不到 Proxy，需要再 tsconfig.json - compilerOptions 设置"lib": ["DOM", "ES6"]

effect.ts

```
class ReactiveEffect {
    private _fn: Function;

    constructor(fn: Function) {
        this._fn = fn
    }

    run() {
        return this._fn()
    }
}

let dep: ReactiveEffect
export function effect(fn: Function) {
    const _re = new ReactiveEffect(fn)
    dep = _re
    _re.run()
    return _re.run.bind(_re)
}

const targetMap = new Map<any, {[_: string | symbol]: ReactiveEffect[]}>()
export function track(target: any, p: string | symbol) {
    let fnMap = targetMap.get(target)
    if (!fnMap) {
        fnMap = {}
        targetMap.set(target, fnMap)
    }
    let deps = fnMap[p]
    if (!deps) {
        deps = []
        fnMap[p] = deps
    }
    deps.push(dep)
}

export function trigger(target: any, p: string |symbol) {
    const _fnMap = targetMap.get(target)
    if (!_fnMap) return
    const deps = _fnMap[p]
    if (!deps) return
    deps.forEach(dep => dep.run())
}
```

### 2、实现 effect scheduler 功能

> - 通过 effect 的第二个参数给定的 一个 scheduler 的 fn <br>
> - effect 第一次执行的时候 还会执行 fn<br>
> - 当 响应式对象 set update 不会执行 fn 而是执行 scheduler<br>
> - 如果说当执行 runner 的时候，会再次的执行 fn
>  
#### 2.1 单元测试
effect.spec.ts
```
it('scheduler', () => {
    const obj = {num: 1}
    const rxObj = reactive(obj)
    let num
    let run: Function | undefined
    const scheduler = jest.fn(() => {
        run = runner
    })
    const runner = effect(() => {
        num = rxObj.num
    }, {
        scheduler
    })
    expect(num).toBe(1)
    expect(scheduler).not.toHaveBeenCalled()

    rxObj.num++
    expect(num).toBe(1)
    expect(scheduler).toHaveBeenCalledTimes(1)
    if (run) {
        run()
    }
    expect(num).toBe(2)
})
```
#### 2.2 功能实现
effect.ts 添加代码

```
class ReactiveEffect {
    private _fn: Function;
    scheduler: Function | undefined;

    constructor(fn: Function, scheduler?: Function) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        dep = this
        // 执行effect函数，如果该函数调用了响应对象的get方法，则会收集依赖，添加dep到依赖对象
        const res = this._fn()
        // 依赖收集完毕，需要把dep置为undefined，避免每次执行响应对象get方法都重复收集
        dep = undefined
        return res
    }
}

let dep: ReactiveEffect | undefined
export function effect(fn: Function, options: any = {}) {
    const scheduler = options.scheduler
    // 每个effect方法、options回有一个对应的ReactiveEffect对象
    const _re = new ReactiveEffect(fn, scheduler)
    _re.run()
    return _re.run.bind(_re)
}

const targetMap = new Map<any, {[_: string | symbol]: ReactiveEffect[]}>()
export function track(target: any, p: string | symbol) {
    // track触发是每次响应对象（即reactive包裹的对象）执行get会调用
    // 如果dep不为undefined，则为effect执行后的收集，需要收集依赖，反之不是effect对象收集，无需收集
    if (!dep) return
    let fnMap = targetMap.get(target)
    if (!fnMap) {
        fnMap = {}
        targetMap.set(target, fnMap)
    }
    let deps = fnMap[p]
    if (!deps) {
        deps = []
        fnMap[p] = deps
    }
    console.log('收集依赖：', target, p, dep);
    deps.push(dep)
}

export function trigger(target: any, p: string |symbol) {
    const _fnMap = targetMap.get(target)
    if (!_fnMap) return
    const deps = _fnMap[p]
    if (!deps) return
    console.log(deps.length);

    deps.forEach(dep => {
        // 触发依赖，对象有scheduler，则执行scheduler
        if (dep.scheduler) {
            dep.scheduler()
        } else {
            dep.run()
        }
    })
}
```

### 3、实现 effect stop 功能

#### 3.1 单元测试
effect.spec.ts
```
it('stop', () => {
    const obj = {num: 1}
    const rxObj = reactive(obj)
    let num
    const runner = effect(() => {
        num = rxObj.num
    })
    // expect(num).toBe(1)
    rxObj.num = 2
    expect(num).toBe(2)
    stop(runner)
    rxObj.num = 3
    expect(num).toBe(2)
    runner()
    expect(num).toBe(3)
})

it('on stop', () => {
    const obj = {foo: 1}
    const rxObj = reactive(obj)
    const onStop = jest.fn(() => {

    })
    let foo
    const runner = effect(() => {
        foo = rxObj.foo
    }, {
        onStop
    })
    stop(runner)
    expect(onStop).toHaveBeenCalledTimes(1)
})
```
#### 3.2 功能实现
effect.ts
```
class ReactiveEffect {
    private _fn: Function;
    private _active = true;
    scheduler: Function | undefined;
    deps: ReactiveEffect[] = [];
    onStop: Function | undefined;

    constructor(fn: Function, scheduler?: Function) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        // dep = this // 如果写在这里，每次runner执行都会触发收集依赖，不合理，所以注释
        // 执行effect函数，如果该函数调用了响应对象的get方法，则会收集依赖，添加dep到依赖对象
        const res = this._fn()
        // 依赖收集完毕，需要把dep置为undefined，避免每次执行响应对象get方法都重复收集
        // dep = undefined
        return res
    }

    stop() {
        if (this._active) {
            this._active = false
            cleanupEffect(this)
        }
    }
}
function cleanupEffect(effect: ReactiveEffect) {
    const index = effect.deps.indexOf(effect)
    if (index > -1)  {
        console.log('清除前deps：', effect.deps.length);
        effect.deps.splice(index, 1)
        console.log('清除后deps：', effect.deps.length);
    }
    if (effect.onStop) {
        effect.onStop()
    }
}

export function effect(fn: Function, options: any = {}) {
    const scheduler = options.scheduler
    // 每个effect方法、options回有一个对应的ReactiveEffect对象
    const _re = new ReactiveEffect(fn, scheduler)
    // 把options属性全部赋值给ReactiveEffect对象
    extend(_re, options)
    // 这里有个改动，把dep赋值与置为undefined移到这里
    dep = _re
    _re.run()
    dep = undefined
    const runner = _re.run.bind(_re)
    runner.effect = _re;
    return runner
}

export function track(target: any, p: string | symbol) {
    ...

    if (!deps) {
        deps = []
        fnMap[p] = deps
        dep.deps = deps
    }
    
    ...
}

...

export function stop(runner: Function) {
    runner.effect.stop()
}
```
### 4、实现 readonly
#### 4.1 单元测试
readonly.spec.ts
```
import { readonly } from "../reactive"

describe('readonly', () => {
    it('core', () => {
        const obj = {num: 1}
        const rxObj = readonly(obj)
        expect(rxObj).not.toBe(obj)
        expect(rxObj.num).toBe(1)
    })

    it('set warning', () => {
        console.warn = jest.fn()
        const obj = {num: 1}
        const rxObj = readonly(obj)
        rxObj.num = 2
        expect(console.warn).toBeCalled()
    })
})
```
#### 4.2 功能实现
新增baseHandlers.ts文件，把代理所需选项抽离到该文件
```
import { track, trigger } from "./effect"

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)

function createGetter(isReadonly: boolean = false) {
    return function(target: any, p: string | symbol, receiver: unknown) {
        // console.log('get', target, p, receiver);
        const result = Reflect.get(target, p, receiver)
        if (!isReadonly) {
            // 访问了该属性，需要收集依赖
            track(target, p)
        }
        return result
    }
}

function createSetter(isReadonly: boolean = false) {
    return function(target: any, p: string | symbol, newValue: any, receiver: any) {
        if (isReadonly) {
            console.warn(`cannot set ${String(p)}, because ${target} is readonly`)
            return true
        }
        // console.log('set', target, p, receiver);
        const result = Reflect.set(target, p, newValue)
        // 设置了该属性，需要触发依赖
        trigger(target, p)
        return result
    }
}

export const mutableHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
}
```
reactive.ts优化
```
import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

export function reactive(raw: any): any {
    return new Proxy(raw, mutableHandlers)
}

export function readonly(raw: any): any {
    return new Proxy(raw, readonlyHandlers)
}
```

### 5、实现isReactive、isReadonly以及对象对应reactive、readonly嵌套转化
#### 5.1 单元测试
reactive.spec.ts
```
describe('reactive', () => {
    it('core', () => {
        ...

        expect(isReactive(rxObj)).toBe(true)
        expect(isReactive(obj)).toBe(false)
    })

    it('nested reactive', () => {
        const obj = {
            nested: {
                foo: 1
            },
            array: [1, 2, 3]
        }
        const rxObj = reactive(obj)
        expect(isReactive(rxObj)).toBe(true)
        expect(isReactive(rxObj.nested)).toBe(true)
        expect(isReactive(rxObj.array)).toBe(true)
    })
})
```
readonly.spec.ts
```
describe('readonly', () => {
    it('core', () => {
        const obj = {
            num: 1,
            foo: {
                name: 'foo'
            }
        }
        ...
        expect(isReadonly(rxObj)).toBe(true)
        expect(isReadonly(obj)).toBe(false)
        expect(isReadonly(rxObj.foo)).toBe(true)
    })
})
```
#### 5.2 功能实现
reactive.ts
```
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

...

export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY]
}
```
baseHandlers.ts
```
function createGetter(isReadonly: boolean = false) {
    return function(target: any, p: string | symbol, receiver: unknown) {
        if (p === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (p === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        ...
        if (isObject(result)) {
            return isReadonly ? readonly(result) : reactive(result)
        }
        ...
    }
}
```

### 6、实现shallowReadonly、isProxy、ref功能
#### 6.1 单元测试
shallowReadonly.spec.ts
```
import { isReactive, isReadonly, readonly, shallowReadonly } from "../reactive"

describe('shallowReadonly', () => {
    it('core', () => {
        const obj = {
            foo: {
                num: 1
            }
        }
        const srObj = shallowReadonly(obj)
        const rObj = readonly(obj)
        expect(isReactive(srObj)).toBe(false)
        expect(srObj).not.toBe(rObj)
        expect(isReadonly(srObj)).toBe(true)
        expect(isReadonly(srObj.foo)).toBe(false)
    })
})
```
ref.spec.ts
```
import { effect } from "../effect"
import { ref } from "../ref"

describe('ref', () => {
    it('core', () => {
        const refFoo = ref(1)
        expect(refFoo.value).toBe(1)

        let num = 1
        let foo
        effect(() => {
            num++
            foo = refFoo.value  
        })
        expect(num).toBe(2)
        expect(foo).toBe(1)

        refFoo.value++
        expect(num).toBe(3)
        expect(foo).toBe(2)

        refFoo.value = 2
        expect(num).toBe(3)
        expect(foo).toBe(2)
    })

    it('ref is reactive', () => {
        const obj = {foo: 1}
        const refObj = ref(obj)
        let foo
        effect(() => {
            foo = refObj.value.foo
        })
        expect(foo).toBe(1)
        refObj.value.foo = 2
        expect(foo).toBe(2)
        
        refObj.value = obj
        expect(foo).toBe(2)

    })
})
```
#### 6.2 功能实现
reactive.ts
```
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

export function creatReactiveObject(raw: any, handlers: ProxyHandler<any>) {
    return new Proxy(raw, handlers)
}

export function reactive(raw: any): any {
    return creatReactiveObject(raw, mutableHandlers)
}

export function readonly(raw: any): any {
    return creatReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any): any {
    return creatReactiveObject(raw, shallowReadonlyHandlers)
}

export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value: any) {
    return isReactive(value) || isReadonly(value)
}
```
ref.ts
```
import { hasChanged, isObject } from "../shared";
import { ReactiveEffect, track, trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _rawValue: any;
    private _value: any
    deps: ReactiveEffect[]

    constructor(value: any) {
        this._changeValue(value)
        this.deps = []
    }

    get value() {
        trackEffect(this.deps)
        return this._value
    }

    set value(newVal) {
        if (!hasChanged(this._rawValue, newVal)) return
        this._changeValue(newVal)
        triggerEffect(this.deps)
    }

    _changeValue(newVal: any) {
        this._rawValue = newVal
        this._value = isObject(newVal) ? reactive(newVal) : newVal
    }
}

export function ref(value: any) {
    return new RefImpl(value)
}
```
effect.ts
```

export function trackEffect(deps: ReactiveEffect[]) {
    if (dep) {
        deps.push(dep)
    }
}

...

export function triggerEffect(deps: ReactiveEffect[]) {
    if (!deps) return
    console.log(deps.length);
    deps.forEach(dep => {
        if (dep.scheduler) {
            dep.scheduler()
        } else {
            dep.run()
        }
    })
}
```
### 7、实现isRef、unRef、proxyRefs
#### 7.1 单元测试
```
describe('ref', () => {
    ...

    it('is ref', () => {
        const refObj = ref(1)
        const rxObj = reactive({name: 'wawa'})
        expect(isRef(refObj)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(rxObj)).toBe(false)
    })

    it.skip('un ref', () => {
        const refObj = ref(1)
        expect(unRef(refObj)).toBe(1)
        const obj = {name: 'wawa'}
        const refObj1 = ref(obj)
        expect(unRef(refObj1)).toBe(obj)
    })

    it.only('proxy refs', () => {
        const obj = {
            user: ref('wawa'),
            age: 20
        }
        const pr = proxyRefs(obj)
        expect(obj.user.value).toBe('wawa')
        expect(pr.user).toBe('wawa')
        expect(pr.age).toBe(20)

        pr.user = 'haha'
        expect(obj.user.value).toBe('haha')
        expect(pr.user).toBe('haha')
        expect(pr.age).toBe(20)

        pr.user = 'gaga'
        pr.age = 30
        expect(obj.user.value).toBe('gaga')
        expect(pr.user).toBe('gaga')
        expect(pr.age).toBe(30)
    })
})
```
#### 7.2 功能实现
```

class RefImpl {
    __v_isRef = true
    
    ...

    get rawValue() {
        return this._rawValue
    }
}

export function isRef(refVal: RefImpl | any) {
    return !!refVal.__v_isRef
}

export function unRef(refVal: RefImpl | any) {
    return isRef(refVal) ? refVal.rawValue : refVal
}

export function proxyRefs(refObj: any) {
    return new Proxy(refObj, {
        get(target, p, receiver) {
            const result = Reflect.get(target, p, receiver)
            return unRef(result)
        },
        set(target, p, val, receiver) {
            if (isRef(target[p]) && !isRef(val)) {
                return target[p].value = val
            }
            return Reflect.set(target, p, val, receiver)
        }
    })
}
```

### 8、实现computed
#### 8.1 单元测试
computed.spec.ts
```
import { computed } from "../computed"
import { reactive } from "../reactive"

describe('computed', () =>  {
    it('core', () => {
        const obj = {age: 12}
        const rxObj = reactive(obj)
        const age = computed(() => {
            return rxObj.age
        })
        // computed核心
        expect(age.value).toBe(12)
    })

    it.only('computed lazy', () => {
        const obj = {age: 12}
        const rxObj = reactive(obj)
        const fn = jest.fn(() => {
            return rxObj.age
        })
        const age = computed(fn)
        // 未获取.value不会调用fn
        expect(fn).not.toBeCalled()
        
        // 获取.value调用一次fn
        expect(age.value).toBe(12)
        expect(fn).toBeCalledTimes(1)
        
        // 值未改变，重新获取不会调用
        age.value
        expect(fn).toBeCalledTimes(1)

        // 改变computed依赖的值，fn不会马上执行
        rxObj.age = 22
        expect(fn).toBeCalledTimes(1)
        // 改变依赖的值，重新调用.value才会重新调用fn
        expect(age.value).toBe(22)
        expect(fn).toBeCalledTimes(2)
    })
})
```
#### 8.2 功能实现
computed.ts
```
import { ReactiveEffect } from "./effect";

// ComputedRefImpl为computed描述对象
class ComputedRefImpl {
    // get value时候是否读取缓存
    private _cache: boolean = false
    // 上次缓存的值
    private _value: any
    // 用于收集依赖
    private _effect: ReactiveEffect;

    constructor(getter: Function) {
        this._effect = new ReactiveEffect(getter, () => {
            // computed函数内部响应式值改变会调用该方法（scheduler），把读取缓存设为false，在get value时会重新计算
            console.log('*** scheduler *** ');
            this._cache = false
        })
    }

    get value() {
        // 不读取缓存重新计算，同时以后读取缓存
        if (!this._cache) {
            this._cache = true
            // effect调用runAndDep会执行runner以及触发收集依赖
            this._value = this._effect.runAndDep()
        }
        return this._value
    }
}

export function computed(getter: Function) {
    return new ComputedRefImpl(getter)
}
```

## 项目核心 - runtime-core
### 1、初始化Component主流程，包含处理Component以及Element
#### 1.1 createApp
```
import { render } from "./renderer"
import { createVNode } from "./vnode"

// 1、createApp，返回值为带有mount方法的对象
export function createApp(rootComponent: object) {
    return {
        mount(rootContainer: Element) {
            // 2、创建根组件虚拟节点
            const vnode = createVNode(rootComponent)
            // 3、渲染基于根虚拟节点为dom
            render(vnode, rootContainer)
        }
    }
}
```
#### 1.2 vnode、h
```
// vnode.ts
export type VNode = {
    type: string | object
    props?: any
    children?: string | Array<VNode>
}

export function createVNode(type: string | object, props?: object, children?: string | Array<any>): VNode {
    return {
        type,
        props,
        children
    }
}

// h.ts
import { VNode, createVNode } from "./vnode";

export function h(type: string, props: any, children: string | Array<VNode>): VNode {
    return createVNode(type, props, children)
}
```
#### 1.3 renderer
```
import { ComponentInstance, createComponentInstance, setupComponent } from "./component"
import { VNode } from "./vnode"

export function render(vnode: VNode, rootContainer: Element) {
    // 3.1 调用patch
    patch(vnode, rootContainer)
}

function patch(vnode: VNode, rootContainer: Element) {
    if (typeof vnode.type === 'string') {
        // console.log(vnode);
        
        processElement(vnode, rootContainer)
    } else if (typeof vnode.type === 'object') {
        // 3.1.1 处理Component
        processComponent(vnode, rootContainer)
    }
}

function processComponent(vnode: VNode, rootContainer: Element) {
    // 3.1.2 挂载Component
    mountComponent(vnode, rootContainer)
}

function mountComponent(vnode: VNode, rootContainer: Element) {
    // 3.1.3 创建组件实例对象
    const instance = createComponentInstance(vnode)
    // 3.1.4 设置组件相关配置
    setupComponent(instance)
    // 3.1.5 设置渲染相关配置，界面展示相关处理
    setupRenderEffect(instance, vnode, rootContainer)
}

function setupRenderEffect(instance: ComponentInstance, vnode: VNode, rootContainer: Element) {
    if (!instance.render) return
    const treeNode = instance.render()
    // 3.2 获取到根vnode对象，接下来调用patch处理Element
    patch(treeNode, rootContainer)
}

function processElement(vnode: VNode, rootContainer: Element) {
    mountElement(vnode, rootContainer)
}

function mountElement(vnode: VNode, rootContainer: Element) {
    const node = document.createElement(vnode.type as string)
    if (typeof vnode.children === 'string') {
        node.textContent = vnode.children
    } else if (Array.isArray(vnode.children)) {
        mountChildren(vnode.children, node)
    }
    if (vnode.props) {
        for (const key in vnode.props) {
            const val = vnode.props[key]
            node.setAttribute(key, val)
        }
    }
    rootContainer.appendChild(node)
}



function mountChildren(children: VNode[], node: HTMLElement) {
    children.forEach((child) => {
        patch(child, node)
    })
}
```

#### 1.4 component
```
import { VNode } from "./vnode";

export type ComponentInstance = {
    vnode: VNode
    type: any
    setupState?: any
    render?: Function
}

export function createComponentInstance(vnode: VNode): ComponentInstance {
    return {
        vnode,
        type: vnode.type as any
    }
}

export function setupComponent(instance: ComponentInstance) {
    // TODO: initProps
    // TODO: initSlots
    
    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: ComponentInstance) {
    const Component = instance.type

    const {
        setup,
        render
    } = Component
    if (setup) {
        const setupResult = setup()
        handleSetupResult(instance, setupResult)
    }
    if (render) {
        instance.render = render
    }
}


function handleSetupResult(instance: ComponentInstance, setupResult: any) {
    if (typeof setupResult === 'function') {
        // TODO:
    } else if (typeof setupResult === 'object') {
        instance.setupState = setupResult
    }
}
```

### 2、实现组件代理对象
component.ts
```
function handleSetupResult(instance: ComponentInstance, setupResult: any) {
    if (typeof setupResult === 'function') {
        ...
    } else if (typeof setupResult === 'object') {
        ...
        instance.proxy = new Proxy({_: instance}, ComponentPublicInstanceProxyHandlers)
    }
}
```
componentPublicProperties.ts
```
import { ComponentInstance } from './component';

const publicPropertiesMap: {[p: string | symbol]: (i: ComponentInstance) => any} = {
    $el(i: ComponentInstance) {
        return i.vnode.$el
    }
}

export const ComponentPublicInstanceProxyHandlers = {
    get({_: instance}: {_: ComponentInstance}, p: string | symbol, receiver: unknown) {
        if (instance.setupState) {
            const val = instance.setupState[p]
            if (val) return val
        }

        const publicGetter = publicPropertiesMap[p]
        if (publicGetter) {
            return publicGetter(instance)
        }
    }

```
renderer.ts
```
function setupRenderEffect(instance: ComponentInstance, rootContainer: Element) {
    ...
    const initVNode = instance.render.call(instance.proxy)
    ...
}

```

### 3、实现shapeFlags
/src/shared/shapeFlags.ts
```
export const enum ShapeFlags {
    ELEMENT = 1,
    STATEFULE_COMPONENT = 1 << 1,
    TEXT_CHILDREN = 1 << 2,
    ARRAY_CHILDREN = 1 << 3
}
```
vnode.ts
```
import { ShapeFlags } from "../shared/ShapeFlags"

export type VNode = {
    ...
    shapeFlag: ShapeFlags
}

export function createVNode(type: string | object, props?: object, children?: string | Array<any>): VNode {
    return {
        ...
        shapeFlag: getShapeFlag(type, children),
    }
}

function getShapeFlag(type: string | object, children?: string | Array<any>) {
    let shapeFlag = typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFULE_COMPONENT
    if (typeof children === 'string') {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (Array.isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
    return shapeFlag
}
```
renderer.ts
```
typeof vnode.type === 'string' ---> vnode.shapeFlag & ShapeFlags.ELEMENT
typeof vnode.type === 'object' ---> vnode.shapeFlag & ShapeFlags.STATEFULE_COMPONENT
typeof vnode.children === 'string' ---> vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN
Array.isArray(vnode.children) ---> vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN
```

### 4、实现事件绑定
renderer.ts
```
function mountElement(vnode: VNode, rootContainer: Element) {
    ...
    if (vnode.props) {
        for (const key in vnode.props) {
            const val = vnode.props[key]
            if (isEvent(key)) {
                node.addEventListener(key.substring(2).toLocaleLowerCase(), val)
            } else {
                node.setAttribute(key, val)
            }
        }
    }
    ...
}

function isEvent(key: string) {
    return /^on[A-Z]/.test(key)
}
```
### 5、实现组件props
新增文件：componentProps.ts
```
import { ComponentInstance } from "./component";

export function initProps(instance: ComponentInstance, props?: any) {
    instance.props = props || {}
}
```
component.ts
```
...
import { shallowReadonly } from "../reactivity/reactive";
import { initProps } from "./componentProps";

export type ComponentInstance = {
    ...
    props?: any
}
...
export function setupComponent(instance: ComponentInstance) {
    initProps(instance, instance.vnode.props)
    ...
}

function setupStatefulComponent(instance: ComponentInstance) {
    ...
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props)) || {}
        ...
    }
    ...
}
```
componentPublicInstance.ts
```
import { hasOwn } from '../shared/index';
...
export const ComponentPublicInstanceProxyHandlers = {
    get({_: instance}: {_: ComponentInstance}, p: string | symbol, receiver: unknown) {
        if (hasOwn(instance.setupState, p)) {
            return instance.setupState[p]
        } else if (hasOwn(instance.props, p)) {
            return instance.props[p]
        }
        ...
    }
}
```
shared/index.ts
```
...
export const hasOwn = function(obj: any, key: PropertyKey) {
    return Object.prototype.hasOwnProperty.call(obj, key)
}
```




