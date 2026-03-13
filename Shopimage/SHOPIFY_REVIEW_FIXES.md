# Shopify App Review - Issues & Fixes

## 审核日期 / Review Date
2026-03-13

## 问题清单 / Issues List

### ✅ 1.2.1 计费问题 / Billing Issue
**问题**: 使用了外部支付（PayPal），必须只使用 Shopify Billing API

**当前状态**:
- ✅ 已实现 Shopify Billing API (`/api/shopify/billing/subscribe`, `/api/shopify/billing/callback`)
- ❌ 仍有 PayPal 代码存在

**需要修复**:
1. 移除所有 PayPal 相关代码
2. 移除 Stripe 相关代码（如果有）
3. 确保只使用 Shopify Billing API

**文件需要检查**:
- `server/paypal.ts` - 删除
- `server/stripeClient.ts` - 删除
- `client/src/components/PayPalButton.tsx` - 删除
- `client/src/components/upgrade-modal.tsx` - 确保只用 Shopify Billing
- `server/routes.ts` - 移除 PayPal/Stripe 路由

---

### ❓ 4.2.1 定价信息 / Pricing Information
**问题**: App Listing 里没有列出免费计划

**需要修复**:
1. 在 Shopify Partner Dashboard 更新 App Listing
2. 添加免费计划信息（5 images free）
3. 列出所有付费计划

**不需要代码修改** - 这是 Partner Dashboard 的配置问题

---

### ❓ 2.1.4 数据同步准确性 / Data Sync Accuracy
**问题**: 优化后的图片 KB 大小不匹配

**需要检查**:
1. 图片优化算法是否准确计算文件大小
2. 同步到 Shopify 后的实际文件大小
3. UI 显示的大小是否与实际一致

**文件需要检查**:
- `server/routes.ts` - `/api/images/:id/fix` 端点
- `server/routes.ts` - `/api/images/:id/sync` 端点
- 图片优化逻辑

---

### ❓ 2.1.2.a Fix 按钮延迟 & Sync 按钮不工作
**问题**: 
- Fix 按钮点击有延迟
- Sync 按钮不工作
- Console 有错误

**需要检查**:
1. 前端按钮事件处理
2. API 响应时间
3. Console 错误日志

**文件需要检查**:
- `client/src/pages/home.tsx` - Fix/Sync 按钮逻辑
- `client/src/components/image-result-card.tsx` - 如果有的话
- `server/routes.ts` - API 端点性能

---

### ❓ 2.1.2.b Scan/Analyze 错误
**问题**: 扫描商店时出错

**需要检查**:
1. `/api/scan` 端点
2. Shopify API 调用
3. 错误处理

**文件需要检查**:
- `server/routes.ts` - `/api/scan` 端点
- Shopify API 权限

---

### ❓ 2.1.2.c 安装后重定向到 Loading 页面
**问题**: 安装后显示 loading 页面，是否是预期行为？

**需要检查**:
1. OAuth 回调流程
2. 安装后的重定向逻辑
3. Loading 状态管理

**文件需要检查**:
- `server/shopify.ts` - OAuth 回调
- `client/src/pages/home.tsx` - Loading 状态

---

### ❓ 客户数据访问权限 / Customer Data Access
**问题**: 需要说明为什么访问客户数据（姓名、邮箱）

**需要回复**:
- 如果不需要客户数据，移除这些权限
- 如果需要，提供详细说明用途

**检查**:
- `shopify.app.toml` - scopes 配置
- 是否真的需要 `read_customers` 权限

---

## 下一步 / Next Steps

1. ✅ 先提交当前的导航栏更新
2. 🔴 **优先**: 移除 PayPal/Stripe 代码（1.2.1）
3. 🟡 修复 UI 错误（2.1.2）
4. 🟡 检查数据同步准确性（2.1.4）
5. 🟢 更新 App Listing 定价信息（4.2.1）
6. 🟢 回复客户数据访问说明

---

## 当前进度 / Current Progress

- [x] 添加导航栏（Chrome Extension + FAQ）
- [ ] 移除外部支付代码
- [ ] 修复 UI 错误
- [ ] 检查数据同步
- [ ] 更新 App Listing
- [ ] 回复客户数据说明
