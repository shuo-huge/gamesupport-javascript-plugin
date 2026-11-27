import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(root, '../../../build/animation-editor-plugin');
await mkdir(out, { recursive: true });
const files = {};
for (const name of ['page.html', 'page.js', 'page.css', 'README.md']) {
  await copyFile(path.join(root, name), path.join(out, name));
  files[name] = createHash('sha256')
    .update(await readFile(path.join(root, name)))
    .digest('hex');
}
await writeFile(
  path.join(out, 'manifest.json'),
  JSON.stringify(
    {
      manifest_version: 1,
      id: 'com.gamesupport.animation-editor',
      name: '动画编辑器 · JavaScript 示例',
      version: '1.0.0',
      author: 'GameSupport',
      description: '纯 JavaScript 插件页面示例：编辑、预览、保存工程并导出 GIF 到动画库。',
      type: 'ui',
      runtime: { type: 'web' },
      permissions: [],
      events: [],
      ui: {
        pages: [
          {
            id: 'editor',
            title: '动画编辑器',
            html: 'page.html',
            script: 'page.js',
            style: 'page.css',
          },
        ],
      },
      files,
    },
    null,
    2,
  ),
);
console.log('Built animation editor plugin: ' + out);
