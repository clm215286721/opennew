import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Server API Routes for Intelligence Analysis
app.post('/api/intelligence/analyze', async (req, res) => {
  try {
    const { title, content, classification, source } = req.body;
    if (!content) {
      return res.status(400).json({ error: '情报内容不能为空' });
    }

    const prompt = `你是一位最高指挥中枢的国家级特种战略与防务情报高级研判分析师。
请对以下原始/多源情报信息进行深度研判与结构化提炼：

【情报标题】: ${title || '未命名截获情报'}
【情报来源】: ${source || 'OSINT/SIGINT'}
【密级设定】: ${classification || '机密 (SECRET)'}
【原始电报/文本】:
${content}

请输出严格的 JSON 格式（不要使用代码块标记外的任何冗余说明），JSON 格式包含如下字段：
{
  "summary": "不超过150字的精练研判摘要，直击核心威胁与战略动机",
  "reliabilityRating": "北约/海军情报部综合置信度评级，如 A1, B2, C3 等",
  "threatLevel": "CRITICAL" | "HIGH" | "ELEVATED" | "GUARDED" | "LOW",
  "keyJudgments": ["判断要点1", "判断要点2", "判断要点3"],
  "extractedEntities": [
    { "name": "实体名称", "type": "组织/人物/设施/武器装备/代号/网络节点", "role": "角色描述", "threatScore": 85 }
  ],
  "geopoliticalImpact": "地缘与安全防务影响分析",
  "recommendedAction": "指挥部建议应对行动方案（包括侦搜加权、预警提升或反制手段）",
  "indicatorsAndWarnings": ["预警指标1", "预警指标2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Intelligence analysis error:', error);
    return res.status(500).json({
      error: '研判分析服务暂时无法响应',
      details: error.message,
    });
  }
});

// Scenario Simulation endpoint
app.post('/api/intelligence/simulate-scenario', async (req, res) => {
  try {
    const { scenario, region, timeframe } = req.body;
    if (!scenario) {
      return res.status(400).json({ error: '推演情景不能为空' });
    }

    const prompt = `你是一位军事与地缘政治推演推演官。针对以下情报态势与推演假定，展开多阶段兵棋推演与态势研判：

【情景假定】: ${scenario}
【关注区域】: ${region || '全球重点关注空海域'}
【时间跨度】: ${timeframe || 'T+0 至 T+72小时'}

请以结构化 JSON 输出推演报告：
{
  "scenarioTitle": "推演课题标题",
  "riskIndex": 88, // 0-100 综合危机指数
  "primaryThreatActor": "主要假定敌对/关联方",
  "escalationPhases": [
    {
      "phase": "T+0 至 T+12小时",
      "developments": "事态演化预测",
      "indicators": "关键触发观测信号"
    },
    {
      "phase": "T+12 至 T+36小时",
      "developments": "事态演化预测",
      "indicators": "关键触发观测信号"
    },
    {
      "phase": "T+36 至 T+72小时",
      "developments": "事态演化预测",
      "indicators": "关键触发观测信号"
    }
  ],
  "strategicImplications": ["深远战略影响1", "深远战略影响2", "深远战略影响3"],
  "criticalChokepoints": ["受威胁战略节点1", "受威胁战略节点2"],
  "contingencyResponse": ["指挥部应急处置预案1", "指挥部应急处置预案2", "指挥部应急处置预案3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Simulation error:', error);
    return res.status(500).json({
      error: '战略推演服务异常',
      details: error.message,
    });
  }
});

// Intelligence Q&A / Strategic Query endpoint
app.post('/api/intelligence/query-assistant', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) {
      return res.status(400).json({ error: '提问内容不能为空' });
    }

    const prompt = `你是指挥中心情报系统内置的高级战略情报参谋。
现有情报数据库背景概要:
${context ? JSON.stringify(context, null, 2) : '全局态势数据包含防务、关键基础设施、网络战及空海动态。'}

指挥官提问:
"${question}"

请给出专业、严密、客观的军政/防务情报研判回答，包含：
1. 核心态势结论 (Bottom Line Up Front)
2. 证据链与交叉印证
3. 潜在黑天鹅或意图欺骗风险
4. 建议优先监视方向
语言精炼冷峻，符合军事情报参谋作风。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.25,
      },
    });

    return res.json({ answer: response.text });
  } catch (error: any) {
    console.error('Query assistant error:', error);
    return res.status(500).json({
      error: '情报参谋问答系统故障',
      details: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'nominal', timestamp: new Date().toISOString() });
});

// Setup Vite middlewares in dev, or serve static dist in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Apex Intelligence Hub] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
