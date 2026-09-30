import { IntelReport, TargetEntity, ThreatAlert } from '../types/intelligence';

export const INITIAL_INTEL_REPORTS: IntelReport[] = [
  {
    id: 'INTEL-2026-0891',
    codeName: 'OPERATION BLUE TIDE',
    title: '霍尔木兹海峡关键航道水下通信缆线异常电磁脉冲信号截获',
    classification: 'TOP_SECRET',
    category: 'SIGINT',
    threatLevel: 'CRITICAL',
    sourceReliability: 'A1',
    timestamp: '2026-09-30 06:14 UTC',
    locationName: '霍尔木兹海峡海域 (26.56°N, 56.25°E)',
    coordinates: { lat: 26.56, lng: 56.25 },
    summary: '固定声呐监听阵列捕获非标低频加密声学突发信号，伴随一艘无AIS广播的深潜支持船徘徊于第4号海底主干光缆交汇点。',
    content: '截获报告表明，代号为“深海幽灵（GHOST DIVER）”的特种科考改装船在阿曼湾至霍尔木兹咽喉水道连续悬停48小时。卫星合成孔径雷达（SAR）证实其甲板起重装置频繁释放小型深水作业潜器。信号侦测显示该海域高频海底声学中继站通信出现微秒级扰动，极可能正在部署非侵入式感应线圈窃听探头。',
    keyFindings: [
      '目标船只悬挂便利旗，实际登记所有人指向塞浦路斯空壳公司“泰坦航运”',
      '第4号干线光缆承载中东至东亚38%的能源金融结算实时数据流',
      '潜水作业水深约85米，处于商业深潜极限与军事潜水交集区'
    ],
    entities: ['泰坦航运 (Titan Shipping)', '特种科考船GHOST DIVER', '第4号欧亚海底光缆'],
    status: 'ESCALATED',
    priorityAction: '派遣第3巡逻中队P-8A反潜巡逻机实施雷达查证，并通报国际海事安全指挥中心',
    tags: ['海底光缆', '特种潜水', 'SIGINT', '中东航道']
  },
  {
    id: 'INTEL-2026-0892',
    codeName: 'CYBER WATCH-7',
    title: '代号“暗影编织者(APT-44)”针对欧洲跨境电网SCADA调度系统的零日漏洞渗透',
    classification: 'SECRET',
    category: 'CYBER',
    threatLevel: 'HIGH',
    sourceReliability: 'B2',
    timestamp: '2026-09-30 04:30 UTC',
    locationName: '法兰克福数据交换中心节点 (50.11°N, 8.68°E)',
    coordinates: { lat: 50.11, lng: 8.68 },
    summary: '高风险恶意指令尝试通过工控协议漏洞向超高压变电站下发虚假相位调节包，若连锁触发将危及2400万人口电网稳定。',
    content: '网络威胁情报侦测中心捕获针对西欧电网互联调度网关的异常流量。攻击载荷利用了未公开的IEC 60870-5-104工控遥测协议栈溢出缺陷。C2命令控制服务器位于东欧未标记的BGP自治域内，特征码与近年多次攻击关键基础设施的“暗影编织者”高度吻合。',
    keyFindings: [
      '攻击者已完成网络边缘测绘，正探测三条400kV主跨国输电线路的自愈继电保护系统',
      '渗透样本中嵌入了自毁与时间锁逻辑，设定触发窗口为冬季用电高峰前夕',
      '目前已协同国家网络安全响应中心向相关调度中心分发热补丁规则'
    ],
    entities: ['暗影编织者 (APT-44)', '西欧联合电网调度中心', '黑客中继网关AS9411'],
    status: 'INVESTIGATING',
    priorityAction: '强制隔离变电站远程维护VPN通道，启动物理隔离离线调度',
    tags: ['工控安全', 'APT-44', '关键基础设施', '零日漏洞']
  },
  {
    id: 'INTEL-2026-0893',
    codeName: 'NORDIC SENTINEL',
    title: '北极斯瓦尔巴群岛外海非标深海声学浮标密集布放动向',
    classification: 'SECRET',
    category: 'GEOINT',
    threatLevel: 'ELEVATED',
    sourceReliability: 'A2',
    timestamp: '2026-09-29 22:15 UTC',
    locationName: '斯瓦尔巴群岛西南海槽 (76.85°N, 14.20°E)',
    coordinates: { lat: 76.85, lng: 14.20 },
    summary: '光学侦察卫星高分图像确认北极航道咽喉出现12枚带自持水听器的潜标，疑似用于绘制战略核潜艇冰下通道声场拓扑。',
    content: '斯瓦尔巴深水海槽是进出北冰洋冰下巡航的关键咽喉。多光谱卫星分析显示，浮标体表面涂有特种抗附着材料，内置卫星微突发通信天线。分析评估该批浮标属于低频被动相控阵水声侦测阵列，能探测80海里外潜艇的轴频特征。',
    keyFindings: [
      '浮标带有可降解浮力材料，预计持续工作期为180天',
      '收集的数据主要传输至低轨遥感星座，用于训练水下AI声纹识别模型'
    ],
    entities: ['北极水声侦测网', '极地科考船北风之鹰', '斯瓦尔巴卫星测控站'],
    status: 'VERIFIED',
    priorityAction: '安排扫海破冰船打捞浮标样本进行固件逆向工程',
    tags: ['北极航道', 'GEOINT', '反潜水听', '卫星遥感']
  },
  {
    id: 'INTEL-2026-0894',
    codeName: 'SILK HORIZON',
    title: '马六甲海峡东口商船高频电子欺骗(GPS Spoofing)扩散报告',
    classification: 'CONFIDENTIAL',
    category: 'OSINT',
    threatLevel: 'GUARDED',
    sourceReliability: 'B1',
    timestamp: '2026-09-29 18:40 UTC',
    locationName: '新加坡海峡东部锚地 (1.30°N, 104.10°E)',
    coordinates: { lat: 1.30, lng: 104.10 },
    summary: '超过27艘30万吨级油轮及集装箱巨轮报告其电子海图GPS坐标发生同心圆瞬移漂移，疑为沿岸非法电子对抗测试。',
    content: '开源航海雷达社区与国际海事无线电拦截数据证实，新加坡海峡外围连续三晚出现伪造民用L1/L2频段的导航欺骗信号。受影响船只被欺骗至远离实际航道12海里的浅滩预警区，迫使多艘巨轮启动人工天文导航与雷达测距。',
    keyFindings: [
      '干扰源功率估计约为500瓦，疑似部署在沿海机动卡车雷达平台上',
      '扰乱期间周边区域AIS基站接收到大量虚假船舶碰撞报警'
    ],
    entities: ['马六甲海峡交通管制中心', '机动电子对抗发射源DELTA'],
    status: 'INVESTIGATING',
    priorityAction: '协同沿岸国海警联合开展无线电定向侦测',
    tags: ['GPS欺骗', '电子对抗', '航海安全', 'OSINT']
  },
  {
    id: 'INTEL-2026-0895',
    codeName: 'QUANTUM VAULT',
    title: '某跨国防务承包商量子密钥分发(QKD)试验样机技术泄密线索',
    classification: 'TOP_SECRET',
    category: 'HUMINT',
    threatLevel: 'CRITICAL',
    sourceReliability: 'A1',
    timestamp: '2026-09-29 11:20 UTC',
    locationName: '日内瓦某离岸咨询公司 (46.20°N, 6.14°E)',
    coordinates: { lat: 46.20, lng: 6.14 },
    summary: '线人证实核心研发人员与境外空壳科研中介频繁接触，随身携带存储有纠缠光子源校准参数的加密硬件钱包。',
    content: '通过外勤情报网核实，代号“信使-09”的目标人员原为某联合防务实验室光学首席工程师。其于近期在日内瓦开设了未经申报的离岸信托账户，并在非保密网络与境外IP发生过数次分段非对称加密握手。技术文件涉及机载抗干扰量子通信天线阵列的核心图纸。',
    keyFindings: [
      '目标已预订前往非引渡条约国的单程头等舱机票',
      '截获其手提行李X光密度数据，含特种辐射屏蔽固态硬盘'
    ],
    entities: ['信使-09 (核心工程师)', '日内瓦赫尔墨斯咨询', '前沿量子物理实验室'],
    status: 'ESCALATED',
    priorityAction: '协调驻外防务情报武官与边境口岸，依法启动紧急离境拦截预案',
    tags: ['HUMINT', '反间谍', '量子通信', '科技防务']
  },
  {
    id: 'INTEL-2026-0896',
    codeName: 'AERO STRIKE V',
    title: '高超音速滑翔测试区周边空域临时禁航与遥测雷达多频开机',
    classification: 'SECRET',
    category: 'MASINT',
    threatLevel: 'HIGH',
    sourceReliability: 'B1',
    timestamp: '2026-09-28 23:05 UTC',
    locationName: '太平洋远海测试靶区 (18.40°N, 142.10°E)',
    coordinates: { lat: 18.40, lng: 142.10 },
    summary: '红外预警卫星侦测到远洋试验靶区出现高能等离子体尾迹热辐射特征，伴随双波段遥测船只机动就位。',
    content: '战略测量船“远征-8”与两艘大型综合观测浮标在指定靶区形成等腰三角形测控走廊。大气层边缘红外传感器捕获到马赫数大于12的再入滑翔器特征热信号，轨迹呈现大范围横向机动变轨，推测为新一代防空反导突防验证。',
    keyFindings: [
      '遥测信号主频采用扩频跳频调制，抗截获能力极强',
      '靶区禁航通告生效期延长至次周一'
    ],
    entities: ['远征-8号遥测船', '关岛战略雷达预警站', '高超滑翔试验载具HG-4'],
    status: 'VERIFIED',
    priorityAction: '调整低轨光学与雷达卫星过顶过境观测窗口，获取弹着点毫米级测量数据',
    tags: ['MASINT', '高超音速', '导弹防御', '遥测侦搜']
  }
];

export const INITIAL_ENTITIES: TargetEntity[] = [
  {
    id: 'ENT-01',
    name: '暗影编织者',
    codeName: 'APT-44 SILENT WEAVER',
    type: 'CYBER_ACTOR',
    threatLevel: 'CRITICAL',
    affiliation: '未公开跨国黑客集团 / 疑受某国军事情报局资助',
    lastSeen: '2026-09-30 04:30 UTC',
    coordinates: { lat: 50.11, lng: 8.68 },
    linkedEntityIds: [
      { targetId: 'ENT-03', relation: '渗透攻击目标' },
      { targetId: 'ENT-06', relation: '暗网加密资金往来' }
    ],
    details: '专门针对关键能源电网、水处理及卫星上行链路的具备国家级背景的高级持续性威胁组织。擅长潜伏与工控协议零日漏洞利用。',
    threatScore: 94,
    status: 'ACTIVE'
  },
  {
    id: 'ENT-02',
    name: '泰坦航运集团',
    codeName: 'TITAN SHIPPING LLC',
    type: 'ORGANIZATION',
    threatLevel: 'HIGH',
    affiliation: '塞浦路斯注册 / 疑似影子船队运营方',
    lastSeen: '2026-09-30 06:14 UTC',
    coordinates: { lat: 26.56, lng: 56.25 },
    linkedEntityIds: [
      { targetId: 'ENT-04', relation: '实际控股与调度' },
      { targetId: 'ENT-05', relation: '洗钱资金支持' }
    ],
    details: '拥有9艘改装水下科考船与油轮，表面从事深水海底资源调查与水文测绘，多次被指控为军事潜水活动提供水面平台。',
    threatScore: 82,
    status: 'SURVEILLED'
  },
  {
    id: 'ENT-03',
    name: '西欧联合电网调度中心',
    codeName: 'GRID-EU CORE NODES',
    type: 'INFRASTRUCTURE',
    threatLevel: 'CRITICAL',
    affiliation: '欧洲多国联合电网委员会',
    lastSeen: '2026-09-30 05:00 UTC',
    coordinates: { lat: 50.11, lng: 8.68 },
    linkedEntityIds: [
      { targetId: 'ENT-01', relation: '被渗透与预警对象' }
    ],
    details: '西欧超高压同步电网核心大脑，管理跨国电力互济与调峰调度。受到APT-44深度侦测。',
    threatScore: 88,
    status: 'ACTIVE'
  },
  {
    id: 'ENT-04',
    name: '特种科考改装船 GHOST DIVER',
    codeName: 'GHOST DIVER VESSEL',
    type: 'VESSEL',
    threatLevel: 'CRITICAL',
    affiliation: '泰坦航运 / 悬挂帕劳便利旗',
    lastSeen: '2026-09-30 06:14 UTC',
    coordinates: { lat: 26.56, lng: 56.25 },
    linkedEntityIds: [
      { targetId: 'ENT-02', relation: '母公司船舶' },
      { targetId: 'ENT-07', relation: '作业干线光缆' }
    ],
    details: '排水量4200吨，装备全回转动力定位系统与动态补偿A型架起重机，内置有潜水减压舱与微型遥控潜水器(ROV)。',
    threatScore: 91,
    status: 'ACTIVE'
  },
  {
    id: 'ENT-05',
    name: '赫尔墨斯离岸信托',
    codeName: 'HERMES TRUST GENEVA',
    type: 'ORGANIZATION',
    threatLevel: 'HIGH',
    affiliation: '瑞士日内瓦离岸金融网络',
    lastSeen: '2026-09-29 11:20 UTC',
    coordinates: { lat: 46.20, lng: 6.14 },
    linkedEntityIds: [
      { targetId: 'ENT-08', relation: '涉嫌资金支付' },
      { targetId: 'ENT-02', relation: '影子持股通道' }
    ],
    details: '管理多个匿名信托基金，经多级加密货币混币器清洗资金，多次向涉嫌防务技术窃密的人员汇出大额款项。',
    threatScore: 78,
    status: 'SURVEILLED'
  },
  {
    id: 'ENT-06',
    name: '暗网金融中介“海妖网络”',
    codeName: 'KRAKEN OTC PROTOCOL',
    type: 'CYBER_ACTOR',
    threatLevel: 'HIGH',
    affiliation: '去中心化匿名洗钱链条',
    lastSeen: '2026-09-30 01:10 UTC',
    coordinates: { lat: 52.37, lng: 4.89 },
    linkedEntityIds: [
      { targetId: 'ENT-01', relation: '零日漏洞悬赏结算' }
    ],
    details: '提供门罗币(XMR)与链上防追踪混币服务，专门承接军工与工业间谍资料的暗网匿名拍卖。',
    threatScore: 85,
    status: 'ACTIVE'
  },
  {
    id: 'ENT-07',
    name: '第4号欧亚海底光缆主交汇点',
    codeName: 'TRANS-EURASIA CABLE-4',
    type: 'INFRASTRUCTURE',
    threatLevel: 'CRITICAL',
    affiliation: '国际电信联合体',
    lastSeen: '2026-09-30 06:14 UTC',
    coordinates: { lat: 26.56, lng: 56.25 },
    linkedEntityIds: [
      { targetId: 'ENT-04', relation: '遭到潜水搭接侦测' }
    ],
    details: '连接欧洲、中东与亚太的国际高容量主干光缆系统，日均传输数万亿美元国际银行结算数据。',
    threatScore: 90,
    status: 'ACTIVE'
  },
  {
    id: 'ENT-08',
    name: '代号“信使-09”',
    codeName: 'COURIER-09 / DR. Z',
    type: 'INDIVIDUAL',
    threatLevel: 'CRITICAL',
    affiliation: '前沿量子物理防务实验室',
    lastSeen: '2026-09-29 11:20 UTC',
    coordinates: { lat: 46.20, lng: 6.14 },
    linkedEntityIds: [
      { targetId: 'ENT-05', relation: '非法报酬接收人' }
    ],
    details: '高级光学雷达科学家，掌握高抗扰量子纠缠态光子源工程化参数。正处于叛逃与技术交易关键窗口。',
    threatScore: 89,
    status: 'ACTIVE'
  }
];

export const INITIAL_ALERTS: ThreatAlert[] = [
  {
    id: 'ALT-901',
    severity: 'CRITICAL',
    title: '霍尔木兹海峡海底光缆节点水下微脉冲异常激活',
    timestamp: '12分钟前',
    source: '第8水声侦听站 (SIGINT)',
    region: '中东/波斯湾',
    acknowledged: false,
    intelId: 'INTEL-2026-0891'
  },
  {
    id: 'ALT-902',
    severity: 'CRITICAL',
    title: '欧洲主电网SCADA工控协议出现非法溢出攻击包',
    timestamp: '42分钟前',
    source: '网络空间防御联合指挥中心',
    region: '西欧枢纽',
    acknowledged: false,
    intelId: 'INTEL-2026-0892'
  },
  {
    id: 'ALT-903',
    severity: 'WARNING',
    title: '日内瓦涉嫌技术外泄人员预定单程国际航班',
    timestamp: '2小时前',
    source: '海外反间谍专责小组 (HUMINT)',
    region: '欧洲/中欧',
    acknowledged: false,
    intelId: 'INTEL-2026-0895'
  },
  {
    id: 'ALT-904',
    severity: 'WARNING',
    title: '马六甲海峡多艘超级油轮报告GPS同心圆漂移',
    timestamp: '5小时前',
    source: '国际海事无线电监测网 (OSINT)',
    region: '东南亚',
    acknowledged: true,
    intelId: 'INTEL-2026-0894'
  },
  {
    id: 'ALT-905',
    severity: 'ADVISORY',
    title: '北极斯瓦尔巴航道布设声学浮标阵列参数已入库',
    timestamp: '8小时前',
    source: '天基遥感综合判读所 (GEOINT)',
    region: '北极圈',
    acknowledged: true,
    intelId: 'INTEL-2026-0893'
  }
];
