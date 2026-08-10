# IncomeHub

![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2-409EFF?logo=element&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-4-F7D336?logo=pinia&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chartdotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)
![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-Enabled-000000?logo=githubcopilot&logoColor=white)

個人收入記錄與視覺化分析的單頁網頁應用程式（SPA），使用 Supabase 作為後端服務，支援帳號登入與雲端資料同步。

## 功能概覽

### 帳號與設定
- Email / 密碼登入，路由層級身分驗證保護
- 個人資訊查看、修改密碼
- 設定每年 / 每月收入目標金額

### 新增收入
- 透過表單快速記錄每筆收入，支援以下分類：
  - 薪水、月獎金、年獎金、年終、節日禮金、股票利息
- 填寫日期、分類與金額後即可儲存

### 每日明細列表
- 依日期瀏覽所有收入紀錄
- 支援新增、查看當日各筆收入

### 統計圖表
多種圖表協助分析收入趨勢與結構：

| 圖表 | 說明 |
|------|------|
| 年度長條圖 | 各年度收入總覽，依收入類型堆疊顯示 |
| 全年度比較圖 | 跨年度收入對比 |
| 月份圓餅圖 | 單月收入來源佔比 |
| 年度圓餅圖 | 單年收入來源佔比 |
| 季度圖 | 各季度收入分布 |
| 月份區間折線圖 | 自訂月份區間的收入走勢 |
| 雙年對比折線圖 | 任意兩年逐月收入對比 |
| 獎金趨勢圖 | 歷年獎金項目變化趨勢 |
| 類型趨勢圖 | 各收入類型的長期走勢 |
| 年度累計圖 | 當年度收入逐月累計進度 |
| 年度累計比較圖 | 跨年度累計進度對比 |
| 日曆熱力圖 | 以日曆形式呈現每日收入密度 |

## 技術棧

- **框架**：Vue 3 + TypeScript（`<script setup>` SFC）
- **建置工具**：Vite
- **路由**：Vue Router（Hash History）
- **UI 元件庫**：Element Plus
- **狀態管理**：Pinia
- **後端 / 資料庫**：Supabase（Authentication + PostgreSQL）
- **圖表**：Chart.js + vue-chartjs
- **日期處理**：dayjs
- **樣式**：SCSS（Glassmorphism 風格）
- **套件管理**：pnpm

## 環境設定

複製 `.env.example` 並填入 Supabase 專案資訊：

```bash
cp .env.example .env
```

```env
VITE_APP_BASE=/
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 本地開發

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器（可區域網路存取）
pnpm dev --host

# 建置正式版本
pnpm build
```
