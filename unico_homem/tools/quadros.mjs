// Renderiza quadros avulsos (meia resolução por padrão) para revisão:  node tools/quadros.mjs 70 561 1768 [--scale=1]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
const args = process.argv.slice(2);
const scale = Number((args.find((a) => a.startsWith('--scale=')) ?? '--scale=0.5').split('=')[1]);
const frames = args.filter((a) => !a.startsWith('--')).map(Number);
const exe = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'swangle'};
const browser = await openBrowser('chrome', {browserExecutable: exe, chromiumOptions});
const composition = await selectComposition({serveUrl, id: 'Video', puppeteerInstance: browser, chromiumOptions});
for (const f of frames) {
  const t = Date.now();
  await renderStill({composition, serveUrl, frame: f, output: `out/q/q_${String(f).padStart(4, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 88, scale, puppeteerInstance: browser, chromiumOptions,
    onBrowserLog: (l) => { if (l.type === 'error' && !/deprecated|PCFSoft/.test(l.text)) console.log('  [browser]', l.text.slice(0, 300)); }});
  console.log(f, ((Date.now() - t) / 1000).toFixed(1) + 's');
}
await browser.close({silent: true});
