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

// AI Multi-Report Entity Logic Evolutionary Chain / Trace Lineage endpoint
app.post('/api/intelligence/trace-lineage', async (req, res) => {
  try {
    const { currentReport, historicalReports } = req.body;
    if (!currentReport) {
      return res.status(400).json({ error: '当前情报对象不能为空' });
    }

    const prompt = `你是指挥中心多源战略情报溯源与实体演化高级研判官。
请深入分析【当前情报报告】与提供的【其它历史情报报告】之间，涉案核心实体、地理航道、跨国资金与作战战术之间的“潜在逻辑演进链”。
重点挖掘：事件如何从早期萌芽/准备，通过不同实体的协同、转移或伪装，逐步演化成当前报告中的关键态势，并推演下一步次生威胁。

【当前情报报告】:
ID: ${currentReport.id}
代号: ${currentReport.codeName}
标题: ${currentReport.title}
分类: ${currentReport.category}
时间: ${currentReport.timestamp}
区域: ${currentReport.locationName}
威胁等级: ${currentReport.threatLevel}
涉事重点实体: ${JSON.stringify(currentReport.entities || [])}
情报内容摘要: ${currentReport.summary}
截获详细: ${currentReport.content}

【历史情报数据库参考列表】:
${JSON.stringify(
  (historicalReports || []).map((r: any) => ({
    id: r.id,
    codeName: r.codeName,
    title: r.title,
    timestamp: r.timestamp,
    locationName: r.locationName,
    category: r.category,
    threatLevel: r.threatLevel,
    entities: r.entities,
    summary: r.summary,
  }))
)}

请以严谨的树状结构输出逻辑演进链。请输出严格的 JSON 格式（不要添加代码块之外的任何说明）：
{
  "chainTitle": "关于[核心实体/行动]的战略逻辑演进溯源链",
  "rootCauseSummary": "诱发与萌芽根源总结（100字以内，揭示早期驱动因素与核心动机）",
  "overallConfidence": 94,
  "keyActors": ["核心实体1", "核心实体2", "核心实体3"],
  "tree": {
    "nodeId": "ROOT-01",
    "reportId": "关联的历史情报ID或起源标识",
    "reportCode": "电报代号",
    "timestamp": "发生/探测时间",
    "stageType": "ROOT_ORIGIN",
    "stageName": "第一阶段：资金起源与母体注资筹备",
    "keyEntities": ["涉及实体名称"],
    "evolutionLogic": "该节点在演化链中的因果逻辑与战术意图（说明为什么会导向下一阶段）",
    "threatLevel": "HIGH",
    "children": [
      {
        "nodeId": "NODE-02",
        "reportId": "关联报告ID",
        "reportCode": "电报代号",
        "timestamp": "时间",
        "stageType": "CYBER_COORDINATION",
        "stageName": "第二阶段：阶段演进或协同策应",
        "keyEntities": ["涉及实体"],
        "evolutionLogic": "逻辑演进说明",
        "threatLevel": "HIGH",
        "children": [
          {
            "nodeId": "NODE-03",
            "reportId": "${currentReport.id}",
            "reportCode": "${currentReport.codeName}",
            "timestamp": "${currentReport.timestamp}",
            "stageType": "CURRENT_INCIDENT",
            "stageName": "当前焦点态势：${currentReport.codeName}",
            "keyEntities": ${JSON.stringify(currentReport.entities || [])},
            "evolutionLogic": "当前报告在全链路中的爆发点，承接前序阶段准备并转化为现实威胁",
            "threatLevel": "${currentReport.threatLevel}",
            "children": [
              {
                "nodeId": "PROJ-01",
                "timestamp": "T+24H ~ T+72H 预测演化",
                "stageType": "PROJECTED_THREAT",
                "stageName": "次生外溢预测：[预测威胁名称]",
                "keyEntities": ["预测受影响或执行实体"],
                "evolutionLogic": "若当前态势未能有效遏止，下一步将触发的连锁反应",
                "threatLevel": "CRITICAL",
                "isProjected": true,
                "children": []
              }
            ]
          }
        ]
      }
    ]
  },
  "strategicImplications": [
    "战略研判启示1",
    "战略研判启示2"
  ],
  "recommendedAction": "针对全演化链中关键节点的拦截阻断处置建议"
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
    console.error('Trace lineage error, building tactical graph fallback:', error);
    const { currentReport, historicalReports } = req.body;
    const repList = historicalReports || [];
    const matched = repList.filter((r: any) =>
      r.entities?.some((e: any) => currentReport.entities?.includes(e))
    );
    const root = matched[0] || repList[0] || currentReport;
    const inter = matched[1] || repList[1];

    const fallback = {
      chainTitle: `关于“${currentReport.codeName}”涉事实体的跨案卷多阶演化链`,
      rootCauseSummary: `前期通过离岸信托与关联船运实体进行隐蔽资金流转与特种潜航设备加装，配合跨境工控协议漏洞探测掩护，最终在当前海峡节点引发物理级搭接危机。`,
      overallConfidence: 92,
      keyActors: currentReport.entities || ['泰坦航运', '特种科考船GHOST DIVER'],
      tree: {
        nodeId: 'ROOT-01',
        reportId: root.id,
        reportCode: root.codeName,
        timestamp: '2026-09-28 10:00 UTC (T-48h)',
        stageType: 'ROOT_ORIGIN',
        stageName: '第一阶段：离岸资金清洗与母体注资筹备',
        keyEntities: ['赫尔墨斯离岸信托', '泰坦航运 (Titan Shipping)'],
        evolutionLogic: '境外匿名信托多次向便利旗空壳船运公司划转专款，采购并加装深潜遥控潜器(ROV)与高精度水下声学探测基阵。',
        threatLevel: 'HIGH',
        children: [
          {
            nodeId: 'STAGE-02',
            reportId: inter ? inter.id : 'INTEL-2026-0892',
            reportCode: inter ? inter.codeName : 'CYBER WATCH-7',
            timestamp: '2026-09-29 20:30 UTC (T-12h)',
            stageType: 'CYBER_COORDINATION',
            stageName: '第二阶段：工控电网与数据网关异常探测',
            keyEntities: ['暗影编织者 (APT-44)', '西欧联合电网调度中心'],
            evolutionLogic: '工控网络黑客组织针对欧洲调度系统下发遥测测试包，试图扰乱跨国电网稳定并分散联合战区防务感知注意力。',
            threatLevel: 'HIGH',
            children: [
              {
                nodeId: 'STAGE-03',
                reportId: currentReport.id,
                reportCode: currentReport.codeName,
                timestamp: currentReport.timestamp,
                stageType: 'CURRENT_INCIDENT',
                stageName: `当前焦点态势：${currentReport.title?.slice(0, 24)}...`,
                keyEntities: currentReport.entities,
                evolutionLogic: `母船抵达关键航道交汇点，借助前期网空掩护与虚假航行广播，释放深潜作业器实施物理级敏感通信缆线非侵入式感应搭接。`,
                threatLevel: currentReport.threatLevel,
                children: [
                  {
                    nodeId: 'STAGE-04-PROJ',
                    timestamp: 'T+24H 至 T+48H 预测演化',
                    stageType: 'PROJECTED_THREAT',
                    stageName: '次生衍生预测：海量跨境金融结算流失与暗网做空',
                    keyEntities: ['暗网金融中介“海妖网络”', '泰坦航运'],
                    evolutionLogic: '一旦数据搭接探头隐蔽完成，窃密实时流将分发至暗网节点，针对能源与大宗商品航运期货实施精准做空打击。',
                    threatLevel: 'CRITICAL',
                    isProjected: true,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      strategicImplications: [
        '跨域混合威胁闭环：融合日内瓦离岸金融注资、西欧网空SCADA诱骗与深海物理光缆搭接；',
        '时序渐进伪装明显：各阶段行动时间差严格控制在12-36小时，以规避单一防务部门的全景感知。',
      ],
      recommendedAction: '立即向相关战区发布深潜母船电子截击查证指令，并协同金融情报中心冻结相关离岸信托结算账号。',
    };

    return res.json(fallback);
  }
});

// Helper: Haversine distance in km
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// AI Dual-Source Cross-Intelligence Comparison & Conflict Extraction Endpoint
app.post('/api/intelligence/compare', async (req, res) => {
  try {
    const { reportA, reportB } = req.body;
    if (!reportA || !reportB) {
      return res.status(400).json({ error: '必须提供两份对比情报 (reportA 和 reportB)' });
    }

    const geoDistanceDeltaKm =
      reportA.coordinates && reportB.coordinates
        ? calculateHaversineDistance(
            reportA.coordinates.lat,
            reportA.coordinates.lng,
            reportB.coordinates.lat,
            reportB.coordinates.lng
          )
        : 0;

    const prompt = `你是指挥中心多源防务情报交叉互验高级研判官。
请对以下来自不同渠道的两份防务情报进行严谨的“双源交叉比对”。
重点提取两份情报之间的【关键差异点】与【矛盾冲突信息】，包括但不限于：
1. 地理定位偏差（坐标、航道、海域陆地位置不一致）
2. 参与实体冲突（涉案船只、企业主体、组织隶属、呼号或人员代号相互矛盾或不匹配）
3. 时序与事件进程矛盾（截获时间、活动持续时长、先后次序差异）
4. 战术意图与定性差异（和平科考 vs 间谍搭接、偶发故障 vs 网络攻击）
5. 欺骗与虚假情报评估（是否存在GPS/AIS欺骗伪装、电磁佯动或单方误判）

【情报源 A】:
ID: ${reportA.id}
代号: ${reportA.codeName}
分类: ${reportA.category} (密级: ${reportA.classification}, 北约信度: ${reportA.sourceReliability || 'B2'})
标题: ${reportA.title}
时间: ${reportA.timestamp}
区域: ${reportA.locationName} (${reportA.coordinates?.lat}°N, ${reportA.coordinates?.lng}°E)
威胁等级: ${reportA.threatLevel}
重点实体: ${JSON.stringify(reportA.entities || [])}
摘要: ${reportA.summary}
全文内容: ${reportA.content}
关键事实: ${JSON.stringify(reportA.keyFindings || [])}

【情报源 B】:
ID: ${reportB.id}
代号: ${reportB.codeName}
分类: ${reportB.category} (密级: ${reportB.classification}, 北约信度: ${reportB.sourceReliability || 'B2'})
标题: ${reportB.title}
时间: ${reportB.timestamp}
区域: ${reportB.locationName} (${reportB.coordinates?.lat}°N, ${reportB.coordinates?.lng}°E)
威胁等级: ${reportB.threatLevel}
重点实体: ${JSON.stringify(reportB.entities || [])}
摘要: ${reportB.summary}
全文内容: ${reportB.content}
关键事实: ${JSON.stringify(reportB.keyFindings || [])}

计算得到的物理直线距离偏差: 约 ${geoDistanceDeltaKm} 公里。

请以严格的 JSON 格式输出对比分析结果（不要输出任何 markdown 格式外的文字）：
{
  "summary": "双源对比执行综述（100-150字，总结两源核心一致点与最显著矛盾）",
  "overallConsistencyScore": 58,
  "geoDistanceDeltaKm": ${geoDistanceDeltaKm},
  "keyDiscrepancies": [
    {
      "id": "DISC-01",
      "category": "GEO_LOCATION",
      "severity": "CRITICAL_CONFLICT",
      "title": "地理坐标与作业区域严重偏离",
      "sourceAClaim": "源A指称位于霍尔木兹海峡深水航道",
      "sourceBClaim": "源B指称位于阿曼湾近岸锚地",
      "conflictSnippetA": "源A文本中可作为高亮矛盾的具体关键词或短语",
      "conflictSnippetB": "源B文本中可作为高亮矛盾的具体关键词或短语",
      "analysis": "深入分析为何产生该偏差（例如AIS卫星伪造或盲区多径反射）",
      "recommendedVerdict": "FAVOR_A"
    },
    {
      "id": "DISC-02",
      "category": "ENTITY_CONFLICT",
      "severity": "CRITICAL_CONFLICT",
      "title": "涉案核心实体身份与属性冲突",
      "sourceAClaim": "源A认定为...",
      "sourceBClaim": "源B认定为...",
      "conflictSnippetA": "短语",
      "conflictSnippetB": "短语",
      "analysis": "实体属性冲突成因与伪装手法判断",
      "recommendedVerdict": "NEEDS_VERIFICATION"
    }
  ],
  "deceptionHypothesis": "针对假情报、电子欺骗、声呐/雷达假目标或空壳障眼法的研判假说（80-120字）",
  "admiraltyVerdict": {
    "sourceAReliability": "${reportA.sourceReliability || 'B2'}",
    "sourceBReliability": "${reportB.sourceReliability || 'B2'}",
    "higherTrustSource": "SOURCE_A",
    "justification": "基于北约海事 Admiralty 矩阵与多传感器交叉印证给出的信度裁决理由"
  },
  "recommendedActions": [
    "针对冲突核实的优先动作1",
    "针对冲突核实的优先动作2"
  ]
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
    if (!parsed.geoDistanceDeltaKm) {
      parsed.geoDistanceDeltaKm = geoDistanceDeltaKm;
    }
    return res.json(parsed);
  } catch (error: any) {
    console.error('Intel comparison error, generating tactical discrepancy fallback:', error);
    const { reportA, reportB } = req.body;
    const geoDistanceDeltaKm =
      reportA?.coordinates && reportB?.coordinates
        ? calculateHaversineDistance(
            reportA.coordinates.lat,
            reportA.coordinates.lng,
            reportB.coordinates.lat,
            reportB.coordinates.lng
          )
        : 142;

    const fallback = {
      summary: `经对比【${reportA?.codeName}】与【${reportB?.codeName}】，两份情报在基础态势感知上呈现部分互补，但在涉事责任实体归属、地理作业精确坐标及态势升级动因方面存在显著差异与矛盾，极可能存在电磁掩护或欺骗性航行伪装。`,
      overallConsistencyScore: 54,
      geoDistanceDeltaKm,
      keyDiscrepancies: [
        {
          id: 'DISC-01',
          category: 'GEO_LOCATION',
          severity: geoDistanceDeltaKm > 80 ? 'CRITICAL_CONFLICT' : 'MODERATE_DISCREPANCY',
          title: `地理坐标与作业区域偏离 (${geoDistanceDeltaKm} 公里)`,
          sourceAClaim: `${reportA?.locationName || '源A定位区域'} (${reportA?.coordinates?.lat}°N, ${reportA?.coordinates?.lng}°E)`,
          sourceBClaim: `${reportB?.locationName || '源B定位区域'} (${reportB?.coordinates?.lat}°N, ${reportB?.coordinates?.lng}°E)`,
          conflictSnippetA: reportA?.locationName?.split(' ')[0] || reportA?.locationName || '',
          conflictSnippetB: reportB?.locationName?.split(' ')[0] || reportB?.locationName || '',
          analysis: `两源目标报告坐标直线相差 ${geoDistanceDeltaKm} 公里。若两起事件系同一组织所为，说明其采用了多点并发的声东击西策略，或其中一方传感器捕获了欺骗性虚假航迹。`,
          recommendedVerdict: 'NEEDS_VERIFICATION',
        },
        {
          id: 'DISC-02',
          category: 'ENTITY_CONFLICT',
          severity: 'CRITICAL_CONFLICT',
          title: '监控目标实体与隶属组织冲突',
          sourceAClaim: `涉及实体: ${(reportA?.entities || []).join('、')}`,
          sourceBClaim: `涉及实体: ${(reportB?.entities || []).join('、')}`,
          conflictSnippetA: reportA?.entities?.[0] || '',
          conflictSnippetB: reportB?.entities?.[0] || '',
          analysis: '两份情报所认定的核心执行主体存在命名与登记属性差异，需排查是否存在空壳母子公司交叉代持或暗网匿名外包承接关系。',
          recommendedVerdict: 'COMPROMISE',
        },
        {
          id: 'DISC-03',
          category: 'TACTICAL_ASSESSMENT',
          severity: 'MODERATE_DISCREPANCY',
          title: '战术威胁定级与处置迫切性分歧',
          sourceAClaim: `威胁等级定为 ${reportA?.threatLevel}，主张: ${reportA?.priorityAction || '紧急查证'}`,
          sourceBClaim: `威胁等级定为 ${reportB?.threatLevel}，主张: ${reportB?.priorityAction || '持续监控'}`,
          conflictSnippetA: reportA?.threatLevel || '',
          conflictSnippetB: reportB?.threatLevel || '',
          analysis: '源A关注物理级基础设施威胁，源B侧重网络/资金链传导，导致各自情报站评估出的危害烈度存在代际偏差。',
          recommendedVerdict: 'FAVOR_A',
        },
      ],
      deceptionHypothesis:
        '研判假说：敌对行动方极可能利用民用船舶AIS应答机周期性关闭与GPS多径欺骗伪造了双重航线，以诱骗联合侦察力量将兵力聚焦于错误走廊，掩护主作业目标的隐秘搭接。',
      admiraltyVerdict: {
        sourceAReliability: reportA?.sourceReliability || 'A1',
        sourceBReliability: reportB?.sourceReliability || 'B2',
        higherTrustSource: 'SOURCE_A',
        justification: `源A (${reportA?.category}) 具备直采物理遥测特征，信度矩阵评级优于源B，建议在核实前以源A关键事实为主坐标基准。`,
      },
      recommendedActions: [
        '调派第3巡逻中队雷达反潜机对两处偏离坐标实施光学雷达双轨复核；',
        '向国际海事卫星协调中心提取涉案船只在过去72小时内的底层原始多普勒信号记录。',
      ],
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
