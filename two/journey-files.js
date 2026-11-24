import { decodeJourney } from './journey-transfer.js';

const FILE_LIMIT = 8 * 1024 * 1024;

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function showJourneyFiles(body, {game, settings, original, backup, previousRecord, warning, replace, back, createGame}) {
  body.innerHTML = '<p>この端末の旅をファイルに写しておけます。ほかの端末で続きを遊ぶときは、そのファイルを読み込んでください。</p>' +
    '<p role="status"></p><div class="actions"><button class="choice" data-export>今の旅を書き出す</button>' +
    '<button class="choice" data-original>保存元の記録を書き出す</button><button class="choice" data-backup>引き継ぎ・リセット前の控え</button><button class="choice" data-previous>前回の自動保存を書き出す</button></div>' +
    '<p><label>旅の記録を読み込む <input type="file" accept=".json,application/json"></label></p>' +
    '<button class="choice" data-back>手引きに戻る</button>';
  const status = body.querySelector('[role=status]');
  status.textContent = warning;
  const prefs = () => settings();
  const packet = journey => ({format:1, exportedAt:new Date().toISOString(), journey, settings:prefs()});
  body.querySelector('[data-export]').onclick = () => download(JSON.stringify(packet(game.save())), 'もち旅の記録.json');
  for (const [selector, raw, filename] of [['original', original, 'もち旅の保存元.json'], ['backup', backup, 'もち旅の控え.json'], ['previous', previousRecord, 'もち旅の自動保存.json']]) {
    const button = body.querySelector('[data-' + selector + ']');
    button.hidden = raw == null;
    button.onclick = () => download(raw, filename);
  }
  body.querySelector('[data-back]').onclick = back;
  body.querySelector('input').onchange = async event => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    if (file.size > FILE_LIMIT) { status.textContent = '8 MBまでの記録を選んでください。'; return; }
    try {
      const data = JSON.parse(await file.text());
      const incoming = decodeJourney(data?.version ? {format:1, journey:data, settings:prefs()} : data, createGame);
      if (!incoming) throw new Error();
      const count = incoming.game.state.visited.length, recipes = incoming.game.state.livingWorld.recipes.length;
      if (window.confirm('御朱印' + count + '個、餅の配合' + recipes + '件の旅を読み込みますか？ 今の記録は控えに移ります。')) {
        await replace(incoming);
      }
    } catch {
      status.textContent = '読み込めませんでした。記録の形式・版と、ブラウザの保存設定を確認してください。';
    }
  };
}
