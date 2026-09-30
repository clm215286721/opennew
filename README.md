# 天玑战略防务情报研判系统 (Apex Intelligence Hub)

> **国家级与防务级多源战略情报综合态势感知、知识图谱穿透与 AI 兵棋推演中枢**
> 
> *Apex Defense & Strategic Multi-Source Intelligence Platform*

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.8_Flash-4285f4?logo=google&logoColor=white)](https://ai.google.dev/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-f9a03c?logo=d3.js&logoColor=white)](https://d3js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📖 平台简介 (Overview)

**天玑战略情报研判系统 (Apex Intelligence Hub)** 是一套面向国家安全、海空走廊、关键基础设施及跨国网络空间的防务级多源情报分析与态势感知平台。系统融合了 **信号情报 (SIGINT)**、**网络空间 (CYBER)**、**空天遥感 (GEOINT)**、**人力情报 (HUMINT)**、**开源情报 (OSINT)** 与 **测量特征情报 (MASINT)**，通过现代化全栈架构与最新 **Google Gemini 3.8 Flash** 战略大模型，为联合指挥部与参谋席位提供全方位的实时情报感知、实体关系图谱追踪、情报时序推演与战术日报生成能力。

---

## 🎯 核心功能模块 (Key Features)

### 1. 全球态势感知地图 (`SituationMap`)
- **高精等距投影战术底图**：支持全域视窗拖拽、高精度缩放、经纬网格线与战区快速定向。
- **关键海上咽喉要道标绘**：重点标定霍尔木兹海峡、马六甲海峡、曼德海峡、博斯普鲁斯海峡等关键战略水道及航行通告。
- **基于 D3.js 的 AI 24小时威胁热力预测 (`AIThreatPredictorHeatmap`)**：
  - 基于已录入多源情报经纬度坐标，采用高斯核密度估计（KDE，`d3.contourDensity`）实时绘制未来 24 小时威胁扩散等值面。
  - **预测演化时序轴**：支持 $T+0\text{h} \sim T+24\text{h}$ 无级滑动与自动播放推演。
  - **多模型扩散算法**：全域复合扩散、海上咽喉断绝、工控网络外溢。
  - **外溢矢量漂移弧**：动态标绘关键航道向周边深水及电网互联节点的穿透路径。
- **30天战区威胁态势走势图 (`RegionalTrendChart`)**：折线堆叠图呈现各主要战区的风险演化。

### 2. 情报解密与案卷简报中心 (`BriefingCenter`)
- **北约/海军部评级规范 (Admiralty Code)**：完整实现 A~F 来源可靠度与 1~6 内容真实度矩阵。
- **自动化 24小时综合防务情报日报 (`Daily Intelligence Brief`)**：
  - 由 **Gemini 3.8 Flash** 自动归并近 24 小时全域接收的多源电报。
  - 结构化生成：**BLUF 执行综述**、**DEFCON 战备定级**、**重点战区战略要情**、**海空/水下/工控跨域评估**、**高危实体名录**及**指挥部战备指令**。
  - 支持一键导出官方 TXT 防务电报、打印/PDF 归档副本及同步至 AI 推演席位。
- **多条件过滤与检索**：支持密级（TOP SECRET / SECRET / CONFIDENTIAL）、情报源及全文检索。

### 3. 涉案目标实体与关系拓扑图谱 (`EntityNetwork`)
- **跨域实体知识网络**：组织（如影子船队运营方）、个人（核心线人/科学家）、关键设施（跨国电网、海底光缆）、网络威胁行为体（APT-44）、特种船舶（水下科考船 GHOST DIVER）。
- **实体威胁指数与动态监测**：实时计算威胁评分（0-100）、活动状态（ACTIVE / SURVEILLED / DORMANT）与最后侦测位置。
- **拓扑关系传导链**：展示实际控股、暗网洗钱通道、零日漏洞悬赏与渗透攻击目标等深层关系。

### 4. AI 智能研判与兵棋推演室 (`AIAnalystLab`)
- **多源电报结构化深度研判**：自动抽取实体、评定北约信度、评估地缘影响并推荐指挥部处置方案。
- **基于实体关联的“情报相关度”时序演化 (`EntityRelevanceTimeline`)**：
  - 依据一阶涉案实体直接重合与二阶图谱拓扑穿透计算情报关联度（0~100%）。
  - 按时序聚合展示关联历史案卷，动态呈现实体传导链条（如 `[实体A] ──【资金/控股】──> [实体B]`）。
- **战略态势兵棋推演 (Wargame Simulation)**：针对特定地缘突发事态进行多阶段演化推演与次生危机推演。
- **高级情报参谋质询**：面向全球防务态势与暗网资金流的高级军事情报参谋交互问答。

### 5. 全域防务威胁矩阵 (`ThreatMatrix`)
- 实时态势警报雷达流，覆盖 CYBER、SIGINT、MARITIME、SPACE 等领域。
- 警报快速确认、密级过滤及关联情报电报溯源穿透。

---

## 🛠️ 技术技术栈 (Tech Stack)

| 领域 | 核心技术 | 简要说明 |
| :--- | :--- | :--- |
| **前端框架** | React 19 + TypeScript | 最新函数式组件与 Hooks 架构 |
| **构建工具** | Vite 8 + ESBuild | 极速冷启动与模块热更新 |
| **样式体系** | Tailwind CSS v4 | 军工暗黑战术设计风格（HUD / Cyan / Amber / Crimson） |
| **态势可视化**| D3.js v7 + Recharts | 高斯密度估计、等值线热力图投影、走势图表 |
| **大模型引擎**| `@google/genai` (Gemini 3.8 Flash) | 服务端 Proxy 架构，深度结构化分析与推演 |
| **后端服务** | Node.js + Express (TSX) | 全栈服务，承载 Gemini API 代理与中间件集成 |
| **图标与动效**| Lucide React + Motion | 战术矢量标绘与微交互动画 |

---

## 📂 目录结构 (Repository Structure)

```bash
├── server.ts                       # Express 服务端入口 (含 Gemini 研判/推演/日报生成 API)
├── src/
│   ├── App.tsx                     # 顶层布局、全局模态框与标签页调度
│   ├── main.tsx                    # React 入口文件
│   ├── index.css                   # 全局样式与 Tailwind CSS 4 导入
│   ├── types/
│   │   └── intelligence.ts         # 情报、实体、威胁矩阵与研判分析核心 TypeScript 类型
│   ├── data/
│   │   └── mockIntelligence.ts    # 高仿真全球多源电报、实体知识库与初始警报数据
│   └── components/
│       ├── TopBar.tsx              # 顶栏指挥导航、DEFCON 状态、全局搜索与紧急录入入口
│       ├── SituationMap.tsx        # 全球态势感知地图主视图 (含战术 HUD 与趋势图)
│       ├── AIThreatPredictorHeatmap.tsx     # D3.js 24小时威胁扩散核密度估计热力图
│       ├── AIThreatPredictorControlPanel.tsx # AI 预测时序与扩散模型浮动控制面板
│       ├── BriefingCenter.tsx      # 情报案卷与电报批阅中心
│       ├── DailyIntelBriefModal.tsx# 24小时综合防务情报日报展示与导出模态框
│       ├── EntityNetwork.tsx       # 实体关系拓扑与重点监控档案
│       ├── AIAnalystLab.tsx        # AI 智能研判推演室与战略参谋质询
│       ├── EntityRelevanceTimeline.tsx # 基于实体关联的情报相关度时序演化
│       ├── ThreatMatrix.tsx        # 威胁矩阵与预警事件管理
│       └── GlobalSearchModal.tsx   # 全局深度全文与实体跨库搜索
├── metadata.json                   # AI Studio 项目配置元数据
├── package.json                    # 项目依赖与运行脚本
├── tsconfig.json                   # TypeScript 配置
└── vite.config.ts                  # Vite 构建配置
```

---

## 🚀 快速启动 (Getting Started)

### 1. 克隆代码仓库
```bash
git clone https://github.com/your-username/apex-intelligence-system.git
cd apex-intelligence-system
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录下创建 `.env` 文件，填入 Google Gemini API Key：
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 4. 启动开发服务器
```bash
npm run dev
```
启动成功后，在浏览器中访问：`http://localhost:3000`

### 5. 生产构建
```bash
npm run build
npm start
```

---

## 🛡️ 安全与合规说明 (Security & Disclaimer)

- **无机密数据披露**：本系统内包含的地缘政治事件、航道截获电报、实体代号及坐标信息均为用于防务推演的**模拟脱敏数据 (Simulated / Synthetic Data)**。
- **服务端密钥隔离**：所有大模型推理调用均通过 `server.ts` 代理执行，客户端不暴露任何 API 密钥。
- **北约/海军部标准化**：情报可信度与来源信度矩阵严格遵循标准情报研判体系规范。

---

## 📄 开源许可证 (License)

本项目遵循 [MIT License](LICENSE) 开源协议。
