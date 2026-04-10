require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const path = require('path');
const { sequelize } = require('./models');
const routes = require('./routes');
const { startDeadlineChecker } = require('./services/deadlineChecker');
const { initBot } = require('./services/telegramBot');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// WebSocket — подключение клиентов
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('WebSocket connected:', socket.id);

  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} authenticated via WebSocket`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
  });
});

// Делаем io доступным в контроллерах
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Отдача загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Роуты
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Запуск
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL подключён');

      try {
        await sequelize.sync({ alter: true });
        console.log('✅ Модели синхронизированы');
      } catch (syncErr) {
      // Игнорируем ошибку "column already exists" (код 42701 в Postgres), 
      // так как это часто случается при перезапуске alter: true
      if (syncErr.name === 'SequelizeDatabaseError' && syncErr.parent?.code === '42701') {
        console.warn('⚠️  Некоторые колонки уже существуют, пропуск основной синхронизации');
      } else {
        throw syncErr;
      }
    }

    // Проверка дедлайнов (уведомления за 1 день и в день дедлайна)
    startDeadlineChecker();

    // Telegram-бот (запускается только если задан TELEGRAM_BOT_TOKEN)
    initBot();

    server.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Ошибка запуска:', err);
    process.exit(1);
  }
};

start();