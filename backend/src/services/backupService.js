// services/backupService.js
// ТЗ: Регулярный бэкап базы данных

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 14; // хранить последние 14 дней

/**
 * Создаёт pg_dump бэкап
 */
const createBackup = () => {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `crm_backup_${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // Читаем параметры из env
    const dbUrl = process.env.DATABASE_URL;
    let cmd;

    if (dbUrl) {
      cmd = `pg_dump "${dbUrl}" > "${filePath}"`;
    } else {
      const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
      cmd = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST || 'localhost'} -p ${DB_PORT || 5432} -U ${DB_USER} ${DB_NAME} > "${filePath}"`;
    }

    exec(cmd, async (error) => {
      if (error) {
        console.error('[Backup] Ошибка:', error.message);
        reject(error);
        return;
      }

      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`[Backup] Создан: ${fileName} (${sizeMB} MB)`);

      // Чистим старые бэкапы
      cleanOldBackups();

      resolve({ fileName, filePath, sizeMB });
    });
  });
};

/**
 * Удаляет старые бэкапы, оставляет последние MAX_BACKUPS
 */
const cleanOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Удаляем лишние
    files.slice(MAX_BACKUPS).forEach((f) => {
      fs.unlinkSync(f.path);
      console.log(`[Backup] Удалён старый: ${f.name}`);
    });
  } catch (e) {
    console.error('[Backup] Ошибка чистки:', e.message);
  }
};

/**
 * Список бэкапов
 */
const listBackups = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
};

/**
 * Запускает cron — бэкап каждую ночь в 3:00
 */
const startBackupCron = () => {
  // Каждый день в 03:00
  cron.schedule('0 3 * * *', async () => {
    console.log('[Backup] Запуск ежедневного бэкапа...');
    try {
      const result = await createBackup();
      console.log(`[Backup] Успешно: ${result.fileName}`);
    } catch (e) {
      console.error('[Backup] ОШИБКА бэкапа:', e.message);
      // Уведомляем суперадмина если настроен email
      try {
        const { User } = require('../models');
        const { emailService } = require('./emailService');
        const superAdmin = await User.findOne({ where: { isSuperAdmin: true } });
        if (superAdmin) {
          await emailService.sendBackupError(superAdmin.email, e.message);
        }
      } catch {}
    }
  }, {
    timezone: 'Asia/Tashkent',
  });

  console.log('[Backup] Cron запущен — бэкап каждый день в 03:00 (Ташкент)');
};

module.exports = { createBackup, listBackups, startBackupCron };
