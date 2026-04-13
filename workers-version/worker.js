export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 获取查询参数
    const msg = url.searchParams.get('msg');
    const type = url.searchParams.get('type');
    const loc = url.searchParams.get('loc');
    const key = url.searchParams.get('key');
    
    // 验证访问密钥 (如果设置了环境变量)
    if (env.ACCESS_KEY) {
      if (!key || key !== env.ACCESS_KEY) {
        return new Response(JSON.stringify({
          code: 403,
          message: 'Access denied: invalid or missing key'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 验证企业微信配置
    if (!env.CORPID || !env.SECRET || !env.AGENTID) {
      return new Response(JSON.stringify({
        code: 500,
        message: 'Server configuration error: missing CORPID, SECRET, or AGENTID'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      if (type === 'weather' && loc) {
        // 天气推送
        const weatherData = await getWeather(loc, env);
        const accessToken = await getAccessToken(env.CORPID, env.SECRET);
        const result = await sendWeChatMessage(accessToken, env.AGENTID, weatherData);
        
        return new Response(JSON.stringify({
          code: 0,
          message: 'Weather message sent successfully',
          data: result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (msg) {
        // 普通消息推送
        const accessToken = await getAccessToken(env.CORPID, env.SECRET);
        const result = await sendWeChatMessage(accessToken, env.AGENTID, msg);
        
        return new Response(JSON.stringify({
          code: 0,
          message: 'Message sent successfully',
          data: result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // 返回使用说明
        return new Response(JSON.stringify({
          code: 0,
          message: 'WxWork Push API',
          usage: {
            send_message: '?msg=Your message here&key=YOUR_ACCESS_KEY',
            send_weather: '?type=weather&loc=beijing&key=YOUR_ACCESS_KEY'
          },
          note: env.ACCESS_KEY ? 'Access key required' : 'No access key configured'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        code: 500,
        message: 'Internal server error',
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// 获取 access_token
async function getAccessToken(corpid, secret) {
  const cacheKey = `wxwork_token_${corpid}`;
  const cache = caches.default;
  
  // 尝试从缓存获取
  let cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const tokenData = await cachedResponse.json();
    if (tokenData.expires_at > Date.now()) {
      return tokenData.access_token;
    }
  }
  
  // 请求新的 token
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${secret}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.errcode !== 0) {
    throw new Error(`Failed to get access token: ${data.errmsg}`);
  }
  
  // 缓存 token (有效期 2 小时，这里设置 1.5 小时)
  const tokenData = {
    access_token: data.access_token,
    expires_at: Date.now() + (7200 - 900) * 1000
  };
  
  const cacheResponse = new Response(JSON.stringify(tokenData), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  ctx.waitUntil(cache.put(cacheKey, cacheResponse));
  
  return data.access_token;
}

// 发送企业微信消息
async function sendWeChatMessage(accessToken, agentid, content) {
  // 判断是纯文本还是天气信息
  let messagePayload;
  if (typeof content === 'object') {
    // 天气消息使用文本卡片
    messagePayload = {
      touser: "@all",
      msgtype: "textcard",
      agentid: parseInt(agentid),
      textcard: {
        title: content.title,
        description: content.description,
        url: content.url || "https://github.com",
        btntxt: "更多"
      }
    };
  } else {
    // 普通文本消息
    messagePayload = {
      touser: "@all",
      msgtype: "text",
      agentid: parseInt(agentid),
      text: {
        content: content
      }
    };
  }
  
  const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messagePayload)
  });
  
  const data = await response.json();
  
  if (data.errcode !== 0) {
    throw new Error(`Failed to send message: ${data.errmsg}`);
  }
  
  return data;
}

// 获取天气信息 (使用正则解析，替代 QueryList)
async function getWeather(location, env) {
  const locationEncoded = encodeURIComponent(location);
  const url = `https://tianqi.moji.com/search/${locationEncoded}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const html = await response.text();
  
  // 使用正则提取天气信息
  const cityMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const cityName = cityMatch ? cityMatch[1].trim() : location;
  
  // 提取温度
  const tempMatch = html.match(/class="temp"[^>]*>([^<]+)<\/span>/);
  const temperature = tempMatch ? tempMatch[1].trim() : '未知';
  
  // 提取天气状况
  const weatherMatch = html.match(/class="wea"[^>]*>([^<]+)<\/span>/);
  const weather = weatherMatch ? weatherMatch[1].trim() : '未知';
  
  // 提取风力
  const windMatch = html.match(/class="win"[^>]*>([^<]+)<\/span>/);
  const wind = windMatch ? windMatch[1].trim() : '未知';
  
  // 提取空气质量
  const aqiMatch = html.match(/class="air"(?:[^>]*>){2}([^<]+)<\/span>/);
  const aqi = aqiMatch ? aqiMatch[1].trim() : '未知';
  
  // 提取温馨提示
  const tipsMatch = html.match(/class="tips"[^>]*>([\s\S]*?)<\/div>/);
  let tips = '暂无温馨提示';
  if (tipsMatch) {
    const tipsHtml = tipsMatch[1];
    // 去除 HTML 标签
    tips = tipsHtml.replace(/<[^>]+>/g, '').trim().substring(0, 200);
  }
  
  const description = `🌡️ 温度：${temperature}\n☁️ 天气：${weather}\n💨 风力：${wind}\n🌫️ 空气质量：${aqi}\n\n📝 温馨提示：${tips}`;
  
  return {
    title: `${cityName} 天气预报`,
    description: description,
    url: `https://tianqi.moji.com/search/${locationEncoded}`
  };
}
