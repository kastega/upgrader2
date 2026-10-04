const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

// База данных (файл upgrader.db создастся автоматически)
const db = new Database('upgrader.db');

// Таблица пользователей: id в Telegram, баланс, инвентарь (в виде текста)
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        telegram_id TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 1000,
        inventory TEXT DEFAULT '[]'
    )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получить данные пользователя (баланс, инвентарь)
app.get('/api/user/:id', (req, res) => {
    const { id } = req.params;

    let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
    if (!user) {
        db.prepare('INSERT INTO users (telegram_id) VALUES (?)').run(id);
        user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
    }

    res.json({
        balance: user.balance,
        inventory: JSON.parse(user.inventory)
    });
});

// Сделать апгрейд: списываем ставку, крутим рулетку, выдаём результат
app.post('/api/upgrade', (req, res) => {
    const { userId, bet, chance } = req.body;

    if (!userId || !bet || !chance) {
        return res.status(400).json({ error: 'Не хватает данных' });
    }

    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.balance < bet) {
        return res.status(400).json({ error: 'Недостаточно монет' });
    }

    // Крутим рулетку
    const win = Math.random() * 100 < chance;
    const winAmount = win ? Math.floor(bet / (chance / 100)) : 0;

    const newBalance = user.balance - bet + winAmount;
    db.prepare('UPDATE users SET balance = ? WHERE telegram_id = ?').run(newBalance, userId);

    res.json({
        win,
        newBalance,
        winAmount
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
