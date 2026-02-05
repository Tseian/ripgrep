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
if (!pkg) {
  throw new Error(`Unsupported platform: ${key}`);
}
module.exports = require(pkg);
