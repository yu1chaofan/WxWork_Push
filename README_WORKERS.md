# 企业微信消息推送 - Cloudflare Workers 版本

这是原 PHP 项目的 Cloudflare Workers JavaScript 重构版本，功能完全一致。

## 功能特性

- ✅ 文本消息推送
- ✅ 天气查询并推送
- ✅ 支持环境变量配置
- ✅ 无需服务器，部署在 Cloudflare 边缘网络
- ✅ 免费额度充足（每天 10 万次请求）

## 部署步骤

### 方法一：使用 Wrangler CLI（推荐）

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **初始化项目**
   ```bash
   wrangler init wxwork-push
   cd wxwork-push
   ```

4. **替换 worker.js 内容**
   将本仓库的 `worker.js` 内容复制到 `src/index.js`

5. **配置 wrangler.toml**
   ```toml
   name = "wxwork-push"
   main = "src/index.js"
   compatibility_date = "2024-01-01"

   [vars]
   CORPID = "你的 corpid"
   SECRET = "你的 secret"
   AGENTID = "1000002"
   ```

6. **部署**
   ```bash
   wrangler deploy
   ```

### 方法二：Cloudflare Dashboard 手动部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 点击 "Create application" → "Create Worker"
4. 输入 Worker 名称，点击 "Deploy"
5. 点击 "Edit code"，粘贴 `worker.js` 全部内容
6. 点击 "Save and Deploy"
7. 在 "Settings" → "Variables" 中添加环境变量：
   - `CORPID`: 企业微信 corpid
   - `SECRET`: 企业微信 secret
   - `AGENTID`: 应用 agentid

## 使用方法

### 1. 发送文本消息

```
https://your-worker.your-subdomain.workers.dev/?msg=Hello+World
```

### 2. 发送天气消息

```
https://your-worker.your-subdomain.workers.dev/?type=weather&loc=tianhequ
```

参数说明：
- `type=weather`: 触发天气推送
- `loc`: 地区代码（默认 tianhequ），如 beijing、shanghai 等

### 3. 兼容原 PHP 版本参数

完全兼容原 PHP 版本的调用方式：
- `?msg=消息内容` - 发送文本消息
- `?type=weather&loc=地区` - 发送天气消息

## 配置说明

### 企业微信参数获取

1. **CORPID**: 企业微信管理后台 → 我的企业 → 企业信息
2. **SECRET**: 应用管理 → 自建应用 → Agent Secret
3. **AGENTID**: 应用管理 → 自建应用 → AgentId

### 环境变量（可选）

可以在 `wrangler.toml` 或 Dashboard 中设置：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| CORPID | 企业 ID | 空 |
| SECRET | 应用密钥 | 空 |
| AGENTID | 应用 ID | 1000002 |

## 与原 PHP 版本的区别

| 特性 | PHP 版本 | Workers 版本 |
|------|----------|--------------|
| 运行环境 | PHP 服务器 | Cloudflare 边缘网络 |
| 依赖 | curl, QueryList | 无外部依赖 |
| HTML 解析 | QueryList | 正则表达式 |
| 成本 | 需要服务器 | 免费额度内免费 |
| 性能 | 受服务器限制 | 全球边缘节点加速 |

## 注意事项

1. **HTML 解析稳定性**: 天气数据使用正则解析，如果目标网站结构变化可能需要更新正则表达式
2. **HTTP 请求**: 天气网站使用 HTTP，Workers 支持混合内容请求
3. **频率限制**: 企业微信 API 有调用频率限制，请注意合理使用
4. **CORS**: 已启用跨域支持，可直接从浏览器调用

## 故障排查

### 获取 access_token 失败
- 检查 CORPID 和 SECRET 是否正确
- 确认企业微信应用状态正常

### 天气数据为空
- 检查 loc 参数是否正确
- 目标网站可能更新了 HTML 结构，需要更新正则表达式

### 消息未收到
- 检查 agentid 是否正确
- 确认用户已在企业微信中关注该应用

## License

MIT
