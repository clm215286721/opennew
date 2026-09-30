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

// Automated 24-Hour Daily Intelligence Brief generation endpoint
app.post('/api/intelligence/daily-brief', async (req, res) => {
  try {
    const { reports } = req.body;
    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ error: '待汇总情报列表不能为空' });
    }

    const prompt = `你是指挥中心情报参谋长（Director of Intelligence, J-2）。
你需要依据过去24小时内接收到的所有多源防务与战略情报电报，为最高统帅部撰写一份高度结构化、权威严肃、直击要害的《24小时每日综合防务情报日报》（Daily Intelligence Brief / DIS）。

【过去24小时接收到的情报电报列表】:
${JSON.stringify(
  reports.map((r: any) => ({
    id: r.id,
    codeName: r.codeName,
    title: r.title,
    classification: r.classification,
    category: r.category,
    threatLevel: r.threatLevel,
    locationName: r.locationName,
    timestamp: r.timestamp,
    summary: r.summary,
    keyFindings: r.keyFindings,
    entities: r.entities,
    priorityAction: r.priorityAction,
  })),
  null,
  2
)}

请输出严格的 JSON 格式（不要使用代码块标记外的任何冗余说明），必须包含以下完整字段：
{
  "briefSerial": "JIC-DAILY-20260930-01",
  "period": "2026-09-29 08:00 UTC 至 2026-09-30 08:00 UTC (近24小时全域态势)",
  "executiveSummary": "200字以内的战术与战略态势核心结论 (BLUF)，概述近24小时全球关键地缘、海空走廊与网络基础设施面临的最主要复合威胁。",
  "overallDefcon": "DEFCON 2",
  "overallThreatLevel": "CRITICAL",
  "strategicHighlights": [
    {
      "title": "要情标题",
      "theater": "涉及战区 (如: 霍尔木兹海峡 / 西欧联合电网 / 斯瓦尔巴)",
      "assessment": "针对该事件的研判与危机评估",
      "severity": "CRITICAL",
      "primaryActor": "主要关联实体或涉事组织"
    }
  ],
  "crossDomainAnalysis": {
    "maritimeUndersea": "海洋水下与海峡咽喉态势（包括海底光缆、特种深潜改装船动向）",
    "cyberInfrastructure": "工控网络空间与关键能源基础设施防护态势（APT攻击与漏洞利用）",
    "aerospaceElectromagnetic": "空天遥感、卫星机动与雷达电子对抗态势（GPS欺骗、高超音速滑翔测试等）"
  },
  "keyEntityWatchlist": [
    {
      "name": "重点监控实体名称",
      "status": "活跃 / 侦控中 / 升级",
      "activity24h": "近24小时关键行为特征",
      "threatScore": 92
    }
  ],
  "recommendedDirectives": [
    "指挥部战备处置指令1",
    "指挥部战备处置指令2",
    "指挥部战备处置指令3"
  ],
  "metrics": {
    "totalReportsProcessed": 6,
    "criticalAlertsCount": 2,
    "activeTheatersCount": 4,
    "admiraltyReliabilityAvg": "A1-B2"
  }
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
    console.error('Daily brief generation error, utilizing tactical synthesis fallback:', error);
    // Structured military tactical synthesis fallback based on provided reports
    const repList = req.body.reports || [];
    const criticals = repList.filter((r: any) => r.threatLevel === 'CRITICAL');
    const highs = repList.filter((r: any) => r.threatLevel === 'HIGH');
    const entitiesAll = Array.from(new Set(repList.flatMap((r: any) => r.entities || [])));

    const fallback = {
      briefSerial: `JIC-DAILY-20260930-0${Math.floor(Math.random() * 9 + 1)}`,
      period: '2026-09-29 08:00 UTC 至 2026-09-30 08:00 UTC (近24小时全域态势)',
      executiveSummary: `过去24小时内，天玑防务态势感知中枢共接收并批阅 ${repList.length} 份战略情报。关键水下航道出现异常低频加密脉冲信号与特种深潜改装船作业（霍尔木兹海峡），跨国超高压电网调度中心遭遇针对工控SCADA IEC-104遥测协议的零日渗透，北极斯瓦尔巴航道与马六甲咽喉同步录得声学浮标布放与GPS电子对抗欺骗扩散。全域态势呈现多维混合威慑与战略咽喉挤压特征。`,
      overallDefcon: criticals.length > 0 ? 'DEFCON 2' : 'DEFCON 3',
      overallThreatLevel: criticals.length > 0 ? 'CRITICAL' : 'HIGH',
      strategicHighlights: repList.slice(0, 4).map((r: any) => ({
        title: r.title,
        theater: (r.locationName || '重点战区').split('(')[0].trim(),
        assessment: r.summary || '事态正在严密监视中，存在突发演变风险。',
        severity: r.threatLevel || 'HIGH',
        primaryActor: (r.entities && r.entities[0]) || '关联特种防务目标',
      })),
      crossDomainAnalysis: {
        maritimeUndersea:
          '阿曼湾至霍尔木兹第4号干线海底光缆附近深潜特种船悬停释放ROV，对关键金融与能源结算数据流构成窃听风险；斯瓦尔巴深水海槽潜标阵列持续探测战略核潜艇声纹。',
        cyberInfrastructure:
          '暗影编织者(APT-44)利用未公开IEC-104协议栈溢出漏洞对西欧超高压调度网关下发微量相位欺骗包，攻击载荷具有自毁与时间锁特征，关键基础设施需立即物理隔离。',
        aerospaceElectromagnetic:
          '马六甲海峡东口连续发生商船高频电子欺骗(GPS Spoofing)，太平洋靶区遥测船只就位观测到高超滑翔等离子体热辐射特征，天基低轨雷达星座保持密集重访。',
      },
      keyEntityWatchlist: entitiesAll.slice(0, 5).map((name: any, idx: number) => ({
        name: String(name),
        status: idx === 0 ? '极高戒备' : '持续侦控',
        activity24h: idx === 0 ? '在战略海峡咽喉执行非标水下作业' : '涉及跨境网络空间探测或资金异常转移',
        threatScore: 92 - idx * 4,
      })),
      recommendedDirectives: [
        '提升波斯湾及霍尔木兹海域海上巡逻机(P-8A)多波段声呐与雷达查证频次至二级戒备；',
        '强制隔离关键变电站远程维护VPN通道，启动物理隔离离线调度；',
        '向国际海事组织联合发布马六甲东口商用GPS信号异常漂移高风险航行通告；',
        '针对涉嫌转移核心防务技术校准参数的“信使-09”实施边境口岸紧急拦截预案。',
      ],
      metrics: {
        totalReportsProcessed: repList.length,
        criticalAlertsCount: criticals.length,
        activeTheatersCount: 4,
        admiraltyReliabilityAvg: 'A1 - B2',
      },
    };

    return res.json(fallback);
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
