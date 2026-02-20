# 幸运咖产品成本计算器

基于微信小程序云开发的产品成本计算器，支持实时计算产品成本和明细查询。

## 功能特性

- ✅ 搜索产品和物料
- ✅ 实时计算产品成本
- ✅ 显示成本明细（原料和包装）
- ✅ 物料单位成本计算
- ✅ 修改物料价格自动影响所有产品

## 技术栈

- 微信小程序
- TypeScript
- 云开发（CloudBase）
- 云数据库
- 云函数

## 项目结构

```
luckycupcost/
├── miniprogram/          # 小程序前端
│   ├── pages/
│   │   ├── index/       # 首页（搜索）
│   │   └── detail/      # 详情页（产品/物料）
│   ├── utils/
│   │   └── calculator.ts # 成本计算工具
│   └── app.ts           # 应用入口
├── cloudfunctions/       # 云函数
│   └── search/         # 搜索云函数
└── docs/                # 设计文档
```

## 数据库设计

### materials 集合（物料表）
- `_id`: 自动生成
- `dk_id`: number - 物料ID
- `name`: string - 物料名称
- `category`: 'material' | 'packaging' - 分类
- `spec_amount`: number - 规格数量
- `spec_unit`: 'g' | 'ml' | 'piece' - 单位
- `spec_price`: number - 规格总价

### products 集合（产品表）
- `_id`: 自动生成
- `name`: string - 产品名称
- `recipe`: Array - 配方数组
  - `material_dk_id`: number - 物料ID
  - `amount`: number - 使用量

## 快速开始

### 1. 配置云开发

1. 在微信开发者工具中开通云开发
2. 创建云环境
3. 在 `miniprogram/app.ts` 中配置云环境（或使用自动获取）

### 2. 创建数据库集合

在云开发控制台创建：
- `materials` 集合
- `products` 集合

设置权限：所有用户可读

### 3. 部署云函数

在微信开发者工具中：
1. 右键 `cloudfunctions/search` 文件夹
2. 选择"上传并部署：云端安装依赖"

### 4. 运行项目

在微信开发者工具中打开项目，编译运行。

## 开发说明

详细开发文档请参考：
- [产品设计图.md](./产品设计图.md)
- [开发流程图.md](./开发流程图.md)
- [界面原型图.md](./界面原型图.md)
- [开发配置说明.md](./开发配置说明.md)

## 核心特性

- **实时计算**：所有成本在前端实时计算，不存储到数据库
- **自动联动**：修改物料价格后，所有产品成本自动更新
- **统一逻辑**：前端和云函数使用相同的计算工具函数
- **类型安全**：使用 TypeScript 确保类型正确

## License

MIT

