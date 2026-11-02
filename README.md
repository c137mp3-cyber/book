# Книга для эфира

Проверка в браузере: https://c137mp3-cyber.github.io/book/

## Планшет (Termux)
```
pkg update && pkg install -y git nodejs
git clone https://github.com/c137mp3-cyber/book ~/book
cd ~/book && npm install
./start.sh ник_аккаунта
```
Дальше открыть в Chrome `http://localhost:8081/?clean=1` и нажать «⛶» (на весь экран).
Обновление: просто снова `./start.sh ник_аккаунта` (сам делает git pull).

Параметры адреса: `clean=1` — без кнопок, `demo=1` — вымышленный чат и подарки, `ws=0` — не подключаться к мосту.
