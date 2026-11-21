import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw Error('Build with Windows x64 Node.js.');
}
const source = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(source, '../../../build/javascript-example');
fs.mkdirSync(path.join(output, 'bin'), { recursive: true });
const result = spawnSync(
  'go',
  [
    'build',
    '-trimpath',
    '-ldflags=-s -w',
    '-o',
    path.join(output, 'bin/launcher.exe'),
    path.join(source, 'launcher.go'),
  ],
  { stdio: 'inherit', env: { ...process.env, GOOS: 'windows', GOARCH: 'amd64', CGO_ENABLED: '0' } },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
fs.copyFileSync(process.execPath, path.join(output, 'bin/node.exe'));
fs.copyFileSync(
  path.join(path.dirname(process.execPath), 'LICENSE'),
  path.join(output, 'NODE-LICENSE.txt'),
);
fs.copyFileSync(path.join(source, 'plugin.cjs'), path.join(output, 'plugin.cjs'));
const manifest = {
  manifest_version: 1,
  id: 'com.gamesupport.javascript-example',
  name: 'JavaScript 简易插件',
  version: '1.0.0',
  author: 'GameSupport',
  description: 'JavaScript 入门模板：手动发送 example.pulse，不包含游戏识别。',
  type: 'event_provider',
  runtime: {
    type: 'native',
    os: ['windows'],
    arch: ['x86_64'],
    executable: 'bin/launcher.exe',
    protocol: 'gs-ipc/1.0',
  },
  permissions: ['events.emit'],
  events: [{ id: 'example.pulse', name: '示例脉冲' }],
  files: {},
};
for (const name of ['bin/launcher.exe', 'bin/node.exe', 'plugin.cjs', 'NODE-LICENSE.txt']) {
  manifest.files[name] = createHash('sha256')
    .update(fs.readFileSync(path.join(output, name)))
    .digest('hex');
}
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Install this folder in GameSupport: ${output}`);
