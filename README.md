# IPLookup

一个基于静态页面和 Cloudflare Worker 的 IP 查询项目。

## Demo

https://ip.qwq.lu

## 文件

- `index.html`: 前端页面，展示 IPv4、IPv6、User-Agent 和 API 示例。
- `worker.js`: Worker 接口，返回纯文本 IP 或详细 JSON 信息。

## 功能

- 查询当前公网 IPv4 / IPv6 地址
- 展示国家、城市、ASN、协议等信息
- 单独显示 User-Agent，并支持复制
- 提供纯文本和详细 JSON 的 API 调试示例
- 支持浅色、深色和跟随系统三态主题

## 说明

`index.html` 可以直接静态部署，`worker.js` 可部署到 Cloudflare Workers。
