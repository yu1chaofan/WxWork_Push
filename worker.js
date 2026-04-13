/**
 * 企业微信消息推送 - Cloudflare Workers 版本
 * 
 * 配置说明：
 * 1. 在 Cloudflare Dashboard 中设置环境变量：
 *    - CORPID: 企业微信 corpid
 *    - SECRET: 企业微信 secret
 *    - AGENTID: 应用 agentid (数字)
 * 
 * 2. 或者直接在代码下方修改默认配置
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const params = url.searchParams;

    // 获取配置参数（优先使用环境变量）
    const corpid = env.CORPID || "";
    const secret = env.SECRET || "";
    const agentid = env.AGENTID || "1000002";

    // 路由处理
    const type = params.get('type');
    
    if (type === 'weather') {
      return await handleWeather(params, corpid, secret, agentid);
    }

    // 默认处理消息推送
    return await handleMessage(params, corpid, secret, agentid);
  }
};

/**
 * 处理消息推送
 */
async function handleMessage(params, corpid, secret, agentid) {
  try {
    // 获取消息内容
    const content = params.get('msg') || '测试消息';

    // 获取 access_token
    const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${secret}`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return jsonResponse({
        error: true,
        message: '获取 access_token 失败',
        data: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    // 发送消息
    const messageData = {
      touser: '@all',
      msgtype: 'text',
      agentid: parseInt(agentid),
      text: {
        content: content
      }
    };

    const messageUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
    const messageResponse = await fetch(messageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const result = await messageResponse.json();

    return jsonResponse({
      error: false,
      message: '消息发送成功',
      data: result
    });

  } catch (error) {
    return jsonResponse({
      error: true,
      message: error.message,
      data: null
    }, 500);
  }
}

/**
 * 处理天气查询并推送
 */
async function handleWeather(params, corpid, secret, agentid) {
  try {
    const location = params.get('loc') || 'tianhequ'; // 默认天河区

    // 爬取天气数据（使用 m.tianqi.com）
    const weatherUrl = `http://m.tianqi.com/${location}`;
    const weatherResponse = await fetch(weatherUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!weatherResponse.ok) {
      throw new Error('获取天气数据失败');
    }

    const html = await weatherResponse.text();
    
    // 解析 HTML 获取天气信息
    const weatherData = parseWeatherHTML(html);

    // 格式化消息内容
    const content = formatWeatherMessage(weatherData);

    // 获取 access_token
    const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${secret}`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return jsonResponse({
        error: true,
        message: '获取 access_token 失败',
        data: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    // 发送天气消息
    const messageData = {
      touser: '@all',
      msgtype: 'text',
      agentid: parseInt(agentid),
      text: {
        content: content
      }
    };

    const messageUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;
    const messageResponse = await fetch(messageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const result = await messageResponse.json();

    return jsonResponse({
      error: false,
      message: '天气推送成功',
      data: {
        weather: weatherData,
        sendResult: result
      }
    });

  } catch (error) {
    return jsonResponse({
      error: true,
      message: error.message,
      data: null
    }, 500);
  }
}

/**
 * 解析天气 HTML
 */
function parseWeatherHTML(html) {
  const data = {
    location: '',
    date: '',
    temp: '',
    shidu: '',
    today: '',
    wind: '',
    kongqi: ''
  };

  // 简单的正则提取（替代 QueryList）
  
  // 位置
  const locationMatch = html.match(/<div[^>]*class="hhx_index_newHead_l"[^>]*>([^<]*)/);
  if (locationMatch) {
    data.location = locationMatch[1].trim();
  }

  // 当前时间/更新时间
  const dateMatch = html.match(/id="nowHour"[^>]*>([^<]*)/);
  if (dateMatch) {
    data.date = dateMatch[1].trim();
  }

  // 当前温度
  const tempMatch = html.match(/class="now"[^>]*>([^<]*)/);
  if (tempMatch) {
    data.temp = tempMatch[1].trim();
  }

  // 湿度
  const shiduMatch = html.match(/class="b2"[^>]*>([^<]*)/);
  if (shiduMatch) {
    data.shidu = shiduMatch[1].trim();
  }

  // 今日温度
  const todayMatch = html.match(/class="temp"[^>]*>[\s\S]*?class="txt"[^>]*>([^<]*)/);
  if (todayMatch) {
    data.today = todayMatch[1].trim();
  }

  // 风向
  const windMatch = html.match(/class="b3"[^>]*>([^<]*)/);
  if (windMatch) {
    data.wind = windMatch[1].trim();
  }

  // 空气质量
  const kongqiMatch = html.match(/class="b1"[^>]*>([^<]*)/);
  if (kongqiMatch) {
    data.kongqi = kongqiMatch[1].trim();
  }

  return data;
}

/**
 * 格式化天气消息
 */
function formatWeatherMessage(data) {
  const lines = [
    `${data.location} - ${data.temp}`,
    '',
    `更新时间 ${data.date}`,
    '',
    `${data.today}`,
    '',
    `${data.shidu}`,
    '',
    `${data.wind}`,
    '',
    `空气质量${data.kongqi}`
  ];

  return lines.join('\n');
}

/**
 * 返回 JSON 响应
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
