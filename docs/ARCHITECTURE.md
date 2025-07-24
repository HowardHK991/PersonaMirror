# PersonaMirror 项目架构

## 总体架构
```
┌─────────────────────────┐
│        Chrome 插件       │  ← 用户主入口
├────┬──────────┬─────────┤
│CS │BG │Content│SidePanel│
│   │   │Script │         │
└───┴─────  ────┴─────────┘
         ▲(WebScraping)
         │
┌────────┴────────┐
│  PersonaCore    │  ← 浏览器外独立进程 (Rust/WASM/JS)
│  ·TextExtractor │    负责 DOM→Markdown、语义切分、
│  ·Embedder      │    Embedding、Chunking、加密
│  ·Differ        │    与本地 Git 仓 diff & merge
└────────┬────────┘
         │
┌────────┴────────┐
│  StorageLayer   │  ← 本地 IndexedDB + Git 仓
│  ·RawQA         │    raw_qa/yyyy-mm-dd/*.jsonl.zst
│  ·PersonaDelta  │    persona_delta/*.md
│  ·Snapshot      │    snapshot/v1.3.0/persona.json
└────────┬────────┘
         │
┌────────┴────────┐
│  FormatBridge   │  ← 生成多模型可识别的“注入格式”
│  ·KimiMarkdown  │    兼容 Kimi「长文阅读」
│  ·DeepSeekCtx   │    兼容 DeepSeek「用户自定义指令」
│  ·OpenAIPlugin  │    以 Plugin 形式提供
└─────────────────┘
```

## 主要模块说明
- Chrome 插件：用户主入口，负责界面、交互、数据采集
- PersonaCore：核心算法，负责文本提取、嵌入、diff/merge
- StorageLayer：本地存储与版本管理，支持云端 Git 仓库同步
- FormatBridge：多模型注入格式适配

## 数据流
1. 用户与大模型对话，插件自动抓取
2. PersonaCore 处理对话，生成精炼快照
3. 存储于本地 IndexedDB/Git 仓库
4. 需要时同步至云端 Git 仓库
5. 注入到目标大模型

## 关键技术点
- DOM 解析与 Shadow DOM 处理
- 语义压缩与敏感信息识别
- 本地加密与隐私保护
- Git 版本管理与多端同步
- 插件激活自动注入/可手动关闭 