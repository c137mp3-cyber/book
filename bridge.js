// Мост «Книга для эфира»: отдаёт страницу книги и озвучку по http://localhost:8081
// и пересылает ей настоящий чат и подарки TikTok LIVE по WebSocket.
// Запуск: node bridge.js ник_аккаунта   (ник — без @)
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const L = require('tiktok-live-connector');
const NICK = (process.argv[2] || '').replace(/^@/, '');
const PORT = +process.env.PORT || 8081;
const ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.css': 'text/css', '.svg': 'image/svg+xml' };

const srv = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const f = path.normalize(path.join(ROOT, u));
  if (!f.startsWith(ROOT + path.sep) || /node_modules|\.git|bridge\.js|package/.test(u)) { res.writeHead(403); return res.end('no'); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end('нет файла'); }
    const h = { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-cache' };
    if (req.method === 'HEAD') { res.writeHead(200, h); return res.end(); }
    // поддержка перемотки аудио (Range)
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const a = m[1] ? +m[1] : 0, b = m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      res.writeHead(206, { ...h, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': b - a + 1, 'Accept-Ranges': 'bytes' });
      return fs.createReadStream(f, { start: a, end: b }).pipe(res);
    }
    res.writeHead(200, { ...h, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(f).pipe(res);
  });
});
const wss = new WebSocketServer({ server: srv });
const send = o => { const m = JSON.stringify(o); wss.clients.forEach(c => c.readyState === 1 && c.send(m)); };
srv.listen(PORT, () => console.log('книга: http://localhost:' + PORT + '/?clean=1'));

if (!NICK) { console.log('Ник не указан — книга работает без чата и подарков. Чтобы подключить эфир: node bridge.js ник'); return; }
const who = d => d.nickname || (d.user && (d.user.nickname || d.user.uniqueId)) || d.uniqueId || 'Зритель';
function go() {
  const C = new (L.WebcastPushConnection || L.TikTokLiveConnection)(NICK, {});
  C.on('chat', d => { const text = d.comment || ''; if (!text) return; console.log('чат', who(d) + ':', text); send({ type: 'chat', user: who(d), text }); });
  C.on('gift', d => {
    const g = d.giftDetails || {}, t = d.giftType ?? g.giftType;
    const name = g.giftName || d.giftName || 'Подарок', count = d.repeatCount || 1;
    const streak = t === 1 && !d.repeatEnd;           // серия подарков ещё идёт: строка на доске обновляется (×2, ×3 …)
    console.log('подарок', who(d), name, '×' + count, streak ? '(серия идёт)' : '');
    send({ type: 'gift', user: who(d), name, count, streak, final: t === 1 && !!d.repeatEnd });
  });
  C.on('disconnected', () => { console.log('эфир отключился, пробую снова…'); setTimeout(go, 5000); });
  C.connect().then(() => console.log('эфир подключён: @' + NICK)).catch(e => { console.log('не удалось подключиться:', e.message || e, '— повтор через 10 с'); setTimeout(go, 10000); });
}
go();
