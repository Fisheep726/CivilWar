# 电竞选手数据分析面板

一个用于分析英雄联盟电竞选手数据的前端网页应用，支持多场比赛数据综合分析。

## 功能特点

- ✅ 自动加载多个 JSON 数据文件
- ✅ 按位置筛选选手（上单、打野、中单、ADC、辅助）
- ✅ 显示选手场均数据（KDA、击杀、死亡、助攻、伤害、经济）
- ✅ 比赛历程展示
- ✅ 数据可视化图表（伤害对比、经济对比、评分雷达图、KDA 趋势图）
- ✅ 响应式设计，支持多种屏幕尺寸

## 主要修改

- 删除了选手头像显示
- 删除了最佳比赛和最差比赛展示
- 删除了总数据展示
- 新增了场均数据展示（场均击杀、场均死亡、场均助攻、场均伤害、场均经济）

## 部署到 GitHub Pages

### 步骤 1: 创建 GitHub 仓库

1. 访问 https://github.com
2. 创建一个新的公共仓库（例如：`lol-player-stats`）
3. 不要初始化 README（因为我们已经有自己的文件）

### 步骤 2: 上传代码

**方法一：使用 Git 命令行**

```bash
# 进入项目目录
cd D:\Desktop\CivilWar

# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 电竞选手数据分析面板"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送
git push -u origin main
```

**方法二：通过 GitHub 网页上传**

1. 打开你的 GitHub 仓库页面
2. 点击 "Upload files"
3. 将所有文件拖拽到上传区域
4. 填写提交信息并上传

### 步骤 3: 启用 GitHub Pages

1. 在 GitHub 仓库页面，点击 **Settings**
2. 在左侧菜单找到 **Pages**
3. 在 **Source** 下选择 **Deploy from a branch**
4. 在 **Branch** 下选择 **main** (或 master) 分支，文件夹选择 **/(root)**
5. 点击 **Save**

等待几分钟，GitHub 会生成一个 URL，通常是：
```
https://你的用户名.github.io/你的仓库名/
```

### 步骤 4: 访问你的应用

在浏览器中打开生成的 GitHub Pages URL 即可访问你的电竞选手数据分析面板。

## 添加更多比赛数据

要添加新的比赛数据，只需：

1. 将新的 JSON 文件放到 `data` 目录下
2. 程序会自动扫描并加载所有文件
3. 或者在 `data/file-list.json` 中添加文件名（推荐）：

```json
{
  "files": [
    "0311_200317",
    "0311_205642",
    "新的文件名.json"
  ]
}
```

4. 提交并推送到 GitHub：

```bash
git add .
git commit -m "添加新的比赛数据"
git push
```

## 项目结构

```
CivilWar/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js              # JavaScript 逻辑
├── data/               # 数据目录
│   ├── *.json          # 比赛数据文件
│   └── file-list.json  # 文件列表配置（可选）
├── README.md           # 说明文档
└── .gitignore          # Git 忽略文件
```

## 技术栈

- HTML5
- CSS3 (响应式设计)
- JavaScript (ES6+)
- Chart.js (数据可视化)

## 数据说明

JSON 数据文件应包含以下结构：
- `data.wgBattleDetailInfo`: 选手详细数据
- `data.teamDetails`: 队伍详情

每个选手的数据会自动合并计算场均表现。

## 注意事项

1. 由于浏览器的安全策略，建议在本地服务器环境下运行
2. 可以使用 VS Code 的 Live Server 插件或 Python 的 http.server
3. 部署到 GitHub Pages 后可以直接访问

## 开发建议

本地开发时，可以使用以下命令启动本地服务器：

**使用 Python:**
```bash
python -m http.server 8000
```

**使用 Node.js (需要先安装 http-server):**
```bash
npx http-server -p 8000
```

然后在浏览器访问 `http://localhost:8000`

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎在 GitHub 上提 Issue。
