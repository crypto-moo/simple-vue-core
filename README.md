# 项目构建流程

## 项目初始化
> 配置ts，集成jest做单元测试
### 1、初始化命令
```
yarn init -y
```
### 2、项目主目录src，放置各模块
---| reactivity

### 3、各模块新建tests文件夹，为对应模块单元测试文件

### 4、集成ts
```
npx tsc --init

```
如果报错需要安装typescript，执行下面命令
```
yarn add typescript --dev
```
### 5、添加jest、@types/jest
```
yarn add jest @types/jest --dev
```
如果单元测试文件还是报错，需要在tsconfig.json配置
```
"types": ["jest"], 
```
### 6、添加单元测试脚本
package.json添加
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
运行yarn test后报错，
```
SyntaxError: Cannot use import statement outside a module
```
>报错说明：由于jest运行环境是node.js环境，node.js环境模块引入规范是CommonJS，而import xxx from xxx是ECMA Script Modules（ESM）规范，不兼容导致，需要配置babel转化规范

### 8、安装babel
安装babel-jest、@babel/core、@babel/preset-env
```
yarn add babel-jest @babel/core @babel/preset-env --dev
```
添加babel对于ts的支持
```
yarn add @babel/preset-typescript --dev
```
创建babel.config.js
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

## 项目核心 - reactivity
### 1、实现reactive、effect、依赖收集、依赖触发
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
> 问题：如果报错找不到Proxy，需要再tsconfig.json - compilerOptions 设置"lib": ["DOM", "ES6"]

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

### 2、实现scheduler功能
> * 通过 effect 的第二个参数给定的 一个 scheduler 的 fn <br>
> * effect 第一次执行的时候 还会执行 fn<br>
> * 当 响应式对象 set update 不会执行 fn 而是执行 scheduler<br>
> * 如果说当执行 runner 的时候，会再次的执行 fn

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







