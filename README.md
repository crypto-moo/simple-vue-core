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






