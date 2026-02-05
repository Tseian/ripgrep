## 目标
- 将仓库改造成一个“元包”+“平台特定包”的分发结构，安装 @tse-ian/ripgrep 时自动拉取与当前 OS/CPU 匹配的 addon 包，并在运行时加载。
- 保留 vendor/ripgrep 下已有的二进制与 .node 文件，不进行编译，仅发布到 npm。
- 添加只负责 npm 发布的 GitHub Action workflow。

## 包结构
- packages/meta → @tse-ian/ripgrep
  - main: index.js（按 OS/CPU 选择并 require 对应平台包）
  - optionalDependencies 指向各平台包，版本对齐
- packages/arm64-darwin → @tse-ian/arm64-darwin-ripgrep
- packages/x64-darwin → @tse-ian/x64-darwin-ripgrep
- packages/arm64-linux → @tse-ian/arm64-linux-ripgrep
- packages/x64-linux → @tse-ian/x64-linux-ripgrep
- packages/x64-win32 → @tse-ian/x64-win32-ripgrep

每个平台包包含：
- package.json：设置 name、version、os/cpu、files 仅包含当前平台目录下的 rg/rg.exe、ripgrep.node、COPYING
- index.js：导出 { addon: require('./ripgrep.node'), rgPath: pathToRg }
- 将 vendor/ripgrep/<platform> 的内容复制到各自包目录下（发布时包内必须自洽）

## index.js 加载逻辑（meta 包）
- 使用 process.platform + process.arch 生成键，映射到对应包名，并直接 require 该包。
- 如未安装到任何平台包（极端情况），抛出明确错误提示。

示例（精简版）：

```js
const { platform, arch } = process;
const map = {
  'darwin-x64': '@tse-ian/x64-darwin-ripgrep',
  'darwin-arm64': '@tse-ian/arm64-darwin-ripgrep',
  'linux-x64': '@tse-ian/x64-linux-ripgrep',
  'linux-arm64': '@tse-ian/arm64-linux-ripgrep',
  'win32-x64': '@tse-ian/x64-win32-ripgrep',
};
const key = `${platform}-${arch}`;
const pkg = map[key];
if (!pkg) throw new Error(`Unsupported platform: ${key}`);
module.exports = require(pkg);
```

## 平台包 index.js 示例

```js
const path = require('path');
const isWin = process.platform === 'win32';
module.exports = {
  addon: require(path.join(__dirname, 'ripgrep.node')),
  rgPath: path.join(__dirname, isWin ? 'rg.exe' : 'rg'),
};
```

## package.json 关键配置
- meta 包（@tse-ian/ripgrep）
  - name: "@tse-ian/ripgrep"
  - main: "index.js"
  - optionalDependencies：
    - "@tse-ian/x64-darwin-ripgrep": "<same-version>"
    - "@tse-ian/arm64-darwin-ripgrep": "<same-version>"
    - "@tse-ian/x64-linux-ripgrep": "<same-version>"
    - "@tse-ian/arm64-linux-ripgrep": "<same-version>"
    - "@tse-ian/x64-win32-ripgrep": "<same-version>"
- 平台包（以 @tse-ian/arm64-darwin-ripgrep 为例）
  - name: "@tse-ian/arm64-darwin-ripgrep"
  - version: 与 meta 包一致
  - main: "index.js"
  - os: ["darwin"], cpu: ["arm64"]（npm 安装时自动跳过不兼容组合）
  - files: ["ripgrep.node", "rg", "COPYING", "index.js"]
  - license/author/repository 与主仓库对齐

## GitHub Action 发布流程
- 文件：.github/workflows/ci.yml
- 触发：推送 tag（例如 v1.0.0）或手动 workflow_dispatch
- Job：
  - 使用 actions/setup-node@v4（node-version: 20）
  - 写入 ~/.npmrc 使用 NPM_TOKEN（在 repo secrets 配置）
  - 依次发布各平台包（working-directory 指向各包目录），命令：
    - npm publish --access public
  - 最后发布 meta 包
- 不执行任何编译命令，不运行构建脚本

## 版本与发布顺序
- 所有包版本保持一致；先发平台包，再发 meta 包（避免 optionalDependencies 版本找不到）。
- README 更新使用指南：
  - 安装：npm i @tse-ian/ripgrep
  - 使用：
    ```js
    const rg = require('@tse-ian/ripgrep');
    // rg.addon / rg.rgPath 可用
    ```

## 验证步骤
- 本地对各包运行 npm pack，检查 tarball 文件仅包含期望文件。
- 在干净环境分别模拟 darwin/x64、linux/arm64、win32/x64 安装，确认仅安装匹配平台包，meta 包能成功 require 并导出 rgPath 与 addon。

确认后我将：
1) 搭建 packages 目录与各平台包；2) 编写 meta/index.js；3) 补充各 package.json；4) 添加 ci.yml；5) 调整 README；6) 用 npm pack 做本地核验并准备发布。