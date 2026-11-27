/* No npm dependencies or process runtime: GameSupport is provided by the host. */
const $ = (id) => document.getElementById(id),
  canvas = $('canvas'),
  ctx = canvas.getContext('2d');
const keys = ['name', 'kind', 'color', 'count', 'fps'];
let playing = true,
  frame = 0,
  last = 0;
const project = () => Object.fromEntries(keys.map((k) => [k, $(k).value]));
function message(text, error = false) {
  $('status').textContent = text;
  $('status').className = error ? 'error' : '';
}
function draw(index) {
  const p = project(),
    t = index / 24,
    n = Number(p.count),
    angle = t * Math.PI * 2;
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = p.color;
  ctx.fillStyle = p.color;
  if (p.kind === 'ring') {
    ctx.globalAlpha = 1 - t;
    ctx.lineWidth = 4 * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(64, 64, 8 + t * 48, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (p.kind === 'orbit' ? angle : 0),
      r = p.kind === 'burst' ? 8 + t * 48 : p.kind === 'orbit' ? 38 : 12 + t * 42;
    ctx.globalAlpha =
      p.kind === 'orbit' ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(angle + i)) : Math.sin(Math.PI * t);
    const radius = p.kind === 'burst' ? 3 * (1 - t) + 1 : 2.5;
    ctx.beginPath();
    ctx.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  $('frame').textContent = String(index + 1).padStart(2, '0') + ' / 24';
  $('scrub').value = String(index);
}
function tick(now) {
  if (playing && now - last >= 1000 / Number($('fps').value)) {
    frame = (frame + 1) % 24;
    draw(frame);
    last = now;
  }
  requestAnimationFrame(tick);
}
$('play').onclick = () => {
  playing = !playing;
  $('play').textContent = playing ? '暂停预览' : '播放预览';
};
$('scrub').oninput = () => {
  playing = false;
  $('play').textContent = '播放预览';
  frame = Number($('scrub').value);
  draw(frame);
};
for (const k of keys)
  $(k).oninput = () => {
    $('countValue').value = $('count').value;
    draw(frame);
  };
async function restore() {
  const p = await GameSupport.call('storage.get');
  if (!p) {
    message('还没有保存工程');
    return;
  }
  for (const k of keys) if (typeof p[k] === 'string') $(k).value = p[k];
  $('countValue').value = $('count').value;
  draw(frame);
  message('工程已读取');
}
$('save').onclick = async () => {
  try {
    await GameSupport.call('storage.set', { value: project() });
    message('工程已保存，下次打开可继续编辑');
  } catch (e) {
    message(e.message, true);
  }
};
$('restore').onclick = () => restore().catch((e) => message(e.message, true));
$('export').onclick = async () => {
  $('export').disabled = true;
  message('正在生成动画…');
  try {
    const frames = [];
    for (let i = 0; i < 24; i++) {
      draw(i);
      const bytes = ctx.getImageData(0, 0, 128, 128).data;
      let binary = '';
      for (let j = 0; j < bytes.length; j += 8192)
        binary += String.fromCharCode(...bytes.subarray(j, j + 8192));
      frames.push(btoa(binary));
    }
    const a = await GameSupport.call('effects.save', {
      name: $('name').value,
      width: 128,
      height: 128,
      fps: Number($('fps').value),
      frames,
    });
    message('已导出“' + a.name + '”，请到动画库查看，并在触发中心添加规则。');
  } catch (e) {
    message(e.message, true);
  } finally {
    $('export').disabled = false;
    draw(frame);
  }
};
draw(0);
requestAnimationFrame(tick);
restore().catch((e) => message(e.message, true));
