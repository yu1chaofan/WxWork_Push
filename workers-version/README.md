# WxWork Push - Cloudflare Workers 版本

企业微信消息推送工具的 Cloudflare Workers 实现，支持消息推送和天气查询功能。

## ✨ 特性

- 🔒 **访问密钥保护**: 支持通过环境变量设置 `ACCESS_KEY`，防止未授权访问
- 🌍 **全球加速**: 利用 Cloudflare 边缘节点，低延迟高可用
- 💰 **免费额度**: 每天 10 万次请求，完全免费
- 🚀 **零依赖**: 无需安装任何 npm 包，开箱即用
- 📦 **Token 缓存**: 自动缓存 access_token，减少 API 调用
- 🌤️ **天气推送**: 支持实时天气查询和推送

## 🔧 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `CORPID` | ✅ | 企业微信 CorpID |
| `SECRET` | ✅ | 企业微信应用 Secret |
| `AGENTID` | ✅ | 企业微信应用 AgentID |
| `ACCESS_KEY` | ❌ | 访问密钥 (建议设置，增强安全性) |

## 📖 部署方法

### 方法一：使用 Wrangler CLI (推荐)

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **进入项目目录**
   ```bash
   cd workers-version
   ```

4. **部署并设置环境变量**
   ```bash
   wrangler deploy \
     --var CORPID:your_corpid_here \
     --var SECRET:your_secret_here \
     --var AGENTID:your_agentid_here \
     --var ACCESS_KEY:your_secure_access_key
   ```

   > ⚠️ 请将 `your_xxx_here` 替换为你的实际值

5. **获取访问地址**
   部署成功后，你会看到类似这样的输出：
   ```
   Deployed! https://wxwork-push.your-subdomain.workers.dev
   ```

### 方法二：使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. 进入 **Workers & Pages** -> **Create application** -> **Create Worker**

3. 给 Worker 命名，点击 **Deploy**

4. 点击 **Edit code**，将 `worker.js` 的内容复制粘贴进去

5. 点击 **Save and Deploy**

6. 配置环境变量：
   - 进入 **Settings** -> **Variables** -> **Environment Variables**
   - 添加以下变量：
     - `CORPID`: 你的企业微信 CorpID
     - `SECRET`: 你的企业微信应用 Secret
     - `AGENTID`: 你的企业微信应用 AgentID
     - `ACCESS_KEY`: 你的访问密钥 (可选但推荐)
   - 点击 **Save**

7. 重新部署 Worker 使环境变量生效

## 📝 使用方法

### 1. 发送普通消息

```bash
curl "https://your-worker.workers.dev/?msg=Hello World&key=YOUR_ACCESS_KEY"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "Message sent successfully",
  "data": {
    "errcode": 0,
    "errmsg": "ok",
    "invaliduser": "",
    "invalidparty": "",
    "invalidtag": "",
    "unlicenseduser": ""
  }
}
```

### 2. 发送天气消息

```bash
curl "https://your-worker.workers.dev/?type=weather&loc=beijing&key=YOUR_ACCESS_KEY"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "Weather message sent successfully",
  "data": {
    "errcode": 0,
    "errmsg": "ok"
  }
}
```

### 3. 查看 API 使用说明

```bash
curl "https://your-worker.workers.dev/"
```

**响应示例:**
```json
{
  "code": 0,
  "message": "WxWork Push API",
  "usage": {
    "send_message": "?msg=Your message here&key=YOUR_ACCESS_KEY",
    "send_weather": "?type=weather&loc=beijing&key=YOUR_ACCESS_KEY"
  },
  "note": "Access key required"
}
```

## 🔐 安全说明

### 访问密钥 (ACCESS_KEY)

- **强烈建议设置** `ACCESS_KEY` 环境变量
- 设置后，所有请求必须携带 `?key=YOUR_ACCESS_KEY` 参数
- 未携带或密钥错误将返回 `403 Forbidden`
- 密钥应使用强随机字符串，如：`openssl rand -hex 16`

### 企业微信配置

- 不要在代码中硬编码敏感信息
- 使用 Cloudflare 的环境变量功能存储 `CORPID`、`SECRET`、`AGENTID`
- 定期轮换密钥以提高安全性

## 🛠️ 本地开发测试

1. **启动本地开发服务器**
   ```bash
   cd workers-version
   wrangler dev \
     --var CORPID:test_corpid \
     --var SECRET:test_secret \
     --var AGENTID:123456 \
     --var ACCESS_KEY:test_key
   ```

2. **测试接口**
   ```bash
   curl "http://localhost:8787/?msg=Test message&key=test_key"
   ```

## ⚠️ 注意事项

1. **天气解析**: 天气数据来自 moji.com，如果网站结构变化可能需要更新正则表达式
2. **请求限制**: Cloudflare Workers 免费版有每日 10 万次请求限制
3. **超时限制**: Worker 执行时间最长为 10 秒 (免费版)
4. **CORS**: 如需跨域访问，可在 worker.js 中添加 CORS 头

## 📄 文件说明

```
workers-version/
├── worker.js          # Worker 主程序代码
├── wrangler.toml      # Wrangler 配置文件
└── README.md          # 本说明文档
```

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [企业微信 API 文档](https://developer.work.weixin.qq.com/document)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 📝 License

MIT License
