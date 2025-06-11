![en_flag](https://flagcdn.com/w20/gb.png) [English](README.md) | 
![cn_flag](https://flagcdn.com/w20/cn.png) [简体中文](README.zh-CN.md)

> 在Nuxt中使用Elysia应用（多服务、单服务）

[tkesgar/nuxt-elysia]: https://github.com/tkesgar/nuxt-elysia
从 >> [tkesgar/nuxt-elysia][tkesgar/nuxt-elysia] 分叉

## 特性

- **直接在Nuxt中挂载Elysia**
  - 简化开发设置（无需单独运行Elysia应用服务器）
  - 简化部署（仅部署一个服务器）
  - 支持多服务（充分发挥其性能）
- **Eden Treaty集成**
  - 完整的Eden Treaty功能（端到端类型安全，轻量级大小）
  - **同构客户端**：Eden Treaty无需额外配置即可在服务端和客户端工作
  - 将浏览器发送的头信息传递给Elysia应用（头信息列表可配置）
- **同时适用于Node.js和Bun**
  - 在Bun中运行以获得最大性能
  - 在Node.js中运行以获得与某些包更好的兼容性（同时等待Bun完全兼容Node.js）

## 设置

要求：**Node v20+** 或 **Bun v1**

安装包：

```
# Bun
bun add @whispering/nuxt-elysia -D
bun add elysia @elysiajs/eden

# NPM
npm install @whispering/nuxt-elysia --save-dev
npm install elysia @elysiajs/eden
```

> 请参阅下方[在Bun中运行](#在bun中运行应用程序)了解如何在Bun而不是Node.js中运行Nuxt应用。

> `nuxt-elysia`将`elysia`和`@elysiajs/eden`声明为对等依赖，大多数包管理器（Bun、NPM、PNPM）会自动安装它们。
> 但是，通过明确声明对等依赖，您将能够控制要使用的特定Elysia和Eden Treaty版本。

> `nuxt-elysia`应该只作为`devDependency`安装，因为它只在开发和构建过程中需要。在生产环境中不需要它。

在`nuxt.config.ts`中添加到模块列表：

```ts
export default defineNuxtConfig({
  modules: [
    // ...
    "@whispering/nuxt-elysia",
  ],
});
```

在项目根目录创建`api.ts`：

```ts
export default () =>
  new Elysia().get("/hello", () => ({ message: "Hello world!" }));
```

在Vue应用中使用：

```vue
<template>
  <div>
    <p>{{ helloMessage }}</p>
  </div>
</template>
<script setup lang="ts">
const { $api } = useNuxtApp();

const { data: helloMessage } = await useAsyncData(async () => {
  const { data, error } = await $api.hello.get();

  // 由于Eden Treaty的类型安全，您需要处理`error`为真的情况：
  // https://elysiajs.com/eden/treaty/response.html#response
  //
  // 在这里抛出错误将使其在`useAsyncData`错误中可用。
  //
  if (error) {
    throw new Error("调用API失败");
  }

  return data.message;
});
</script>
```

## 模块选项

<!-- 从src/module.ts中的ModuleOptions复制 -->

````ts
export interface ModuleOptions {
  /**
   * 指定导出Elysia应用工厂函数的模块。
   *
   * 默认值`~~/api`是Nuxt对项目根目录中`/api`路径的默认别名。
   * 此别名可能解析为`<root>/api.ts`或`<root>/api/index.ts`。
   *
   * 默认值：`~~/api`
   */
  module: string;
  /**
   * 指定挂载Elysia应用的路径。
   * 
   * Elysia API服务的配置选项支持两种模式：
   * 1. 字符串格式（单一服务），示例：'_api'，描述：将Elysia挂载到Nitro服务器上。
   * 2. 对象格式（多服务，独立），示例：{ host, port, prefix, isStart }，描述：将Elysia作为独立服务运行以充分发挥其性能。
   *
   * 设置为空字符串(`''`)以禁用挂载Elysia应用。
   *
   * 默认值：`/_api`
   */
  path: string | PathOptions;
  /**
   * 是否启用Eden Treaty插件。
   *
   * 默认值：`true`
   */
  treaty: boolean;
  /**
   * 在Bun中挂载Elysia应用时，返回字符串的Elysia处理程序不会有任何`Content-Type`头：
   *
   * ```ts
   * const app = new Elysia()
   *   .get('/plaintext', () => 'Hello world!)
   * ```
   *
   * 此选项添加一个转换以添加`Content-Type: text/plain`。
   *
   * 默认值：`true`
   */
  fixBunPlainTextResponse: boolean;
  /**
   * 提供在服务端请求中发送到Elysia应用的请求头列表。
   *
   * 默认值是`['Cookie']`，这将把浏览器发送的所有cookie传递给Elysia应用。
   * 设置为`false`以禁用传递任何头信息。
   *
   * 默认值：`['Cookie']`
   */
  treatyRequestHeaders: string[] | false;
}

/**
 * 独立API服务的参数：
 */
export interface PathOptions {
  /**
   * API服务主机地址（例如，'http://localhost'）。
   */
  host: string;
  /**
   * API服务端口号（例如，4000）。
   */
  port: number;
  /**
   * API路径前缀（例如，'_api'）。
   */
  prefix: string;
  /**
   * 是否自动启动独立API服务（布尔值）。
   */
  isStart?: boolean;
}
````

## 注意事项

### 已知问题

因为nuxt-elysia将Elysia作为H3应用程序的处理程序挂载，而不是直接处理HTTP请求，所以可能存在一些需要通过额外包装器和转换修复的问题。您可以查看从`server-plugin.template`生成的`server-plugin.ts`，了解当前实现的解决方案列表。

我们的目标是确保挂载Elysia应用和将Elysia应用作为独立服务器运行（直接在Bun中或通过`@elysiajs/node`适配器在Node.js中运行）之间的结果相同。

### `module`选项

您可以在`module`选项中使用Nuxt的任何别名。

`module`的默认值是`~~/api`，这是Nuxt对项目根目录中`<root>/api`路径的默认别名。该路径可能解析为`<root>/api.ts`或`<root>/api/index.ts`。

您可以使用的其他路径：

```ts
export default defineNuxtConfig({
  nuxtElysia: {
    // 自定义别名
    module: "#api",
    // 其他包中的模块
    module: "@my-org/my-package",
    // 绝对路径
    module: "/absolute/path/to/module",
    // 生成的模块（来自其他Nuxt模块）
    module: "~~/.nuxt/my-generated-module",
  },
});
```

### 仅在开发中挂载

要仅在开发中挂载应用，请使用`import.meta.dev`（在构建生产版本时将为`false`）：

```ts
export default defineNuxtConfig({
  nuxtElysia: {
    module: "@my-org/my-server-app",
    path: import.meta.dev ? "/_api" : "",
  },
});
```

```ts
nuxtElysia: {
  path: process.env.NODE_ENV === 'production'
    ? {
        host: 'http://localhost',
        port: 4000,
        prefix: '/_api',
        isStart: true,
      }
    : '/_api',
}
```

如果您只想在开发设置中挂载Elysia应用，并使用反向代理在单独的实例中提供应用服务，这很有用。例如，使用Nginx：

```
location /_api {
  proxy_pass http://my-api-service;
}

location / {
  proxy_pass http://my-nuxt-app;
}
```

### 在Bun中运行应用程序

Elysia应用被挂载为Nitro应用程序堆栈的请求处理程序，因此您可以在没有Bun的情况下使用Nuxt Elysia。

如果您想使用Bun特定的API（`Bun.*`），您需要使用Bun运行Nuxt。Bun[尊重node shebang][bun-bun-flag]，这意味着`nuxt dev`实际上使用Node.js（如果Node.js和Bun都可用）。因此，您需要添加`--bun`标志来覆盖此行为：

```json
{
  "scripts": {
    "dev": "bun --bun dev",
    "build": "bun --bun build",
    "preview": "bun --bun preview"
  }
}
```

> 请注意，只有在同时安装了Node.js和Bun的情况下，才需要这样做。

如果这样做，您还需要使用[Nitro Bun预设][nitro-bun-preset]来构建应用。这是因为默认的`node-server`预设将无法正确打包Elysia，因为Elysia具有Bun特定的导出，默认预设无法正确处理：

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "bun": "./dist/bun/index.js",
      "import": "./dist/index.mjs",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

此外，您还需要在部署中包含根目录的`node_modules`，而不仅仅是`.output`目录。这是因为Bun特定的包将从根目录读取：

```
<root>
├── .output
├── node_modules
├── package.json
└── bun.lock
```

如果您使用Docker容器化您的应用，可以使用此Dockerfile作为参考：

```Dockerfile
# 使用Bun基础镜像
FROM oven/bun:1-slim

# 设置工作目录
WORKDIR /app

# 设置NODE_ENV=production（防止一些包如vue-router产生特定于开发的日志）
ENV NODE_ENV=production

# 复制Nuxt生成的.output目录
# 确保在构建容器镜像前运行`nuxt build`
COPY .output .output

# 复制package.json和bun.lock，然后运行`bun install --production`
# 只安装生产依赖
COPY package.json bun.lock ./
RUN bun install --production

# 设置工作用户
USER bun

# 暴露3000端口（默认Nitro端口）
EXPOSE 3000

# 设置镜像入口点（使用Bun运行生成的服务器模块）
ENTRYPOINT [ "bun", "./.output/server/index.mjs" ]
```

[bun-bun-flag]: https://bun.sh/docs/cli/run#bun
[nitro-bun-preset]: https://nitro.build/deploy/runtimes/bun

### 基准测试

基准测试Nuxt应用可在`test/fixtures/benchmark`中获取。

我们使用`bombardier`在以下机器上运行测试：

``````
                          ./+o+-       tkesgar@tkesgar-ideapad
                  yyyyy- -yyyyyy+      OS: Ubuntu 24.04 noble(on the Windows Subsystem for Linux)
               ://+//////-yyyyyyo      Kernel: x86_64 Linux 5.15.167.4-microsoft-standard-WSL2
           .++ .:/++++++/-.+sss/`      Uptime: 1h 16m
         .:++o:  /++++++++/:--:/-      Packages: 581
        o:+o+:++.`..```.-/oo+++++/     Shell: bash 5.2.21
       .:+o:+o/.          `+sssoo+/    Resolution: No X Server
  .++/+:+oo+o:`             /sssooo.   WM: Not Found
 /+++//+:`oo+o               /::--:.   GTK Theme: Adwaita [GTK3]
 \+/+o+++`o++o               ++////.   Disk: 424G / 1.7T (27%)
  .++.o+++oo+:`             /dddhhh.   CPU: 13th Gen Intel Core i5-1335U @ 12x 2.496GHz
       .+.o+oo:.          `oddhhhh+    RAM: 4426MiB / 7807MiB
        \+.++o+o``-````.:ohdhhhhh+
         `:o+++ `ohhhhhhhhyo++os:
           .o:`.syhhhhhhh/.oo++o`
               /osyyyyyyo++ooo+++/
                   ````` +oo+++o\:
                          `oo++.
``````

结果：

| 名称        | 框架     | 运行时  | 平均请求/秒 | 平均延迟 | 吞吐量 |
| ----------- | -------- | ------- | ----------- | -------- | ------ |
| api-json    | elysia   | bun     | 14704.61    | 8.50     | 3.27   |
| api-json    | elysia   | node    | 7003.07     | 17.92    | 1.88   |
| api-json    | h3       | bun     | 14084.20    | 8.87     | 2.93   |
| api-json    | h3       | node    | 15987.32    | 7.82     | 4.04   |
| api-text    | elysia   | bun     | 13556.04    | 9.22     | 2.57   |
| api-text    | elysia   | node    | 8009.46     | 15.59    | 2.02   |
| api-text    | h3       | bun     | 17536.14    | 7.13     | 3.06   |
| api-text    | h3       | node    | 15498.33    | 8.06     | 3.40   |
| nuxt-render | elysia   | bun     | 1173.03     | 107.59   | 1.90   |
| nuxt-render | elysia   | node    | 665.51      | 186.77   | 1.12   |
| nuxt-render | h3       | bun     | 1019.14     | 123.27   | 1.72   |
| nuxt-render | h3       | node    | 929.24      | 133.59   | 1.63   |

备注：

- 如果可能，最好在Bun而不是Node.js中运行Nuxt应用。
- 在Node.js中使用Elysia而不是H3没有性能优势；实际上，由于原生Response开销（H3直接处理原生HTTP负载），会有明显的性能下降。
- 服务端API客户端（Elysia：Eden Treaty，Nitro：mock ofetch）没有明显的性能问题。

## 贡献

要求：

- Bun
- Node.js

开发步骤：

1. 克隆此仓库
2. 安装依赖：`bun install`
3. 为开发准备模块存根：`bun dev:prepare`
4. 在开发模式下运行playground：`bun dev`
5. 运行lint：`bun lint`
6. 运行类型检查：`bun test:types`
7. 测试：

- 在Node.js中测试：
  1. 在单独的终端中运行`bun dev`
  2. 运行`bun test`
- 在Bun中测试：
  1. 在单独的终端中运行`bun dev:bun`
  2. 运行`bun test`
- 测试构建输出：
  - Node.js：`bun dev:build`
  - Bun：`bun dev:build:bun`
- 运行构建输出：
  - Node.js：`bun dev:start`
  - Bun：`bun dev:start:bun`

## 许可证

[MIT许可证](./LICENSE) 