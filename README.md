# IPLookup

一个基于 Vue 3、Vite 和 Cloudflare Worker 的 IP 查询项目。

## Demo

https://ip.qwq.lu

## 项目结构

- `front/`: 前端项目，基于 Vue 3 + Vite 构建。
- `front/src/`: 页面、组件、样式和静态资源。
- `worker.js`: Worker 接口，返回纯文本 IP 或详细 JSON 信息。

## 功能

- 查询当前公网 IPv4 / IPv6 地址
- 展示国家、城市、ASN、协议等信息
- 单独显示 User-Agent，并支持复制
- 提供纯文本和详细 JSON 的 API 调试示例
- 支持浅色、深色和跟随系统三态主题

## 前端开发

```sh
cd front
npm install
npm run dev
```

## 构建

```sh
cd front
npm run build
```

## 部署说明

- `front/` 产物可作为静态站点部署。
- `worker.js` 可部署到 Cloudflare Workers。
