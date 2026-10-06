const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Список всех скинов в игре
const SKINS = [
    { id: 'glock',  name: 'Glock | Тень',      price: 50,   img: 'glock.png'  },
    { id: 'akr',    name: 'AKR-12 | Дракон',   price: 100,  img: 'akr.png'    },
    { id: 'usp',    name: 'USP | Лёд',         price: 150,  img: 'usp.png'    },
    { id: 'mp5',    name: 'MP5 | Кибер',       price: 300,  img: 'mp5.png'    },
    { id: 'm4a1',   name: 'M4A1 | Вихрь',      price: 500,  img: 'm4a1.png'   },
    { id: 'deagle', name: 'Deagle | Пламя',    price: 800,  img: 'deagle.png' },
    { id: 'awm',    name: 'AWM | Феникс',      price: 2000, img: 'awm.png'    },
    { id: 'ak47',   name: 'AK-47 | Золото',    price: 5000, img: 'ak47.png'   }
];

const db = new Database('upgrader.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        telegram_id TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 1000,
        inventory TEXT DEFAULT '["glock"]'
    )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получить данные пользователя
app.get('/api/user/:id', (req, res) => {
    const { id } = req.params;

    let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
    if (!user) {
        db.prepare('INSERT INTO users (telegram_id, inventory) VALUES (?, ?)').run(id, '["glock"]');
        user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
    }

    res.json({
        balance: user.balance,
        inventory: JSON.parse(user.inventory)
    });
});

// Получить список всех скинов
app.get('/api/skins', (req, res) => {
    res.json(SKINS);
});

// Апгрейд скина
app.post('/api/upgrade', (req, res) => {
    const { userId, fromSkinId, toSkinId } = req.body;

    if (!userId || !fromSkinId || !toSkinId) {
        return res.status(400).json({ error: 'Не хватает данных' });
    }

    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(userId);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const fromSkin = SKINS.find(s => s.id === fromSkinId);
    const toSkin = SKINS.find(s => s.id === toSkinId);
    if (!fromSkin || !toSkin) {
        return res.status(400).json({ error: 'Скин не найден' });
    }

    const inventory = JSON.parse(user.inventory);
    if (!inventory.includes(fromSkinId)) {
        return res.status(400).json({ error: 'У тебя нет этого скина' });
    }

    // Шанс: (цена_отдаю / цена_получаю) * 0.9
    let chance = (fromSkin.price / toSkin.price) * 0.9;
    if (chance > 0.95) chance = 0.95;

    const win = Math.random() < chance;

    let newInventory = inventory.filter(id => id !== fromSkinId);
    if (win) newInventory.push(toSkinId);

    db.prepare('UPDATE users SET inventory = ? WHERE telegram_id = ?')
        .run(JSON.stringify(newInventory), userId);

    const stopAngle = win
        ? Math.random() * chance * 360
        : chance * 360 + Math.random() * (1 - chance) * 360;

    res.json({
        win,
        chance: Math.round(chance * 1000) / 10,
        fromSkin,
        toSkin,
        newInventory,
        stopAngle
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
