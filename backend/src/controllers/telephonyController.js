const { User, Client, Interaction } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// ─── POST /calls/initiate ───────────────────────────────
// Инициация исходящего звонка через провайдера (Zadarma / Binotel / Asterisk)
exports.initiateCall = async (req, res) => {
  try {
    const { clientId, phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Номер телефона обязателен' });

    const user = await User.findByPk(req.user.id);
    const client = clientId ? await Client.findByPk(clientId) : null;

    // Создаём запись взаимодействия типа "call" со статусом "в процессе"
    if (!clientId) {
      return res.status(400).json({ error: 'Укажите клиента для звонка' });
    }
    const interaction = await Interaction.create({
      clientId,
      authorId: req.user.id,
      type: 'call',
      content: `Исходящий звонок на ${phone}`,
      date: new Date(),
    });

    // В реальной интеграции здесь вызывается API телефонии:
    // const result = await zadarmaApi.call(user.sipLogin, phone);
    // Возвращаем interactionId чтобы фронт мог обновить запись после завершения звонка

    res.json({
      ok: true,
      interactionId: interaction.id,
      message: 'Звонок инициирован',
      phone,
      // В реальной интеграции здесь будет callId от провайдера
      callId: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка инициации звонка' });
  }
};

// ─── POST /calls/webhook ────────────────────────────────
// Webhook от провайдера телефонии (Zadarma/Binotel)
// Обновляет запись взаимодействия после завершения звонка
exports.callWebhook = async (req, res) => {
  try {
    const { externalCallId, recordingUrl, duration, status, clientPhone } = req.body;

    // Ищем взаимодействие по внешнему ID или по телефону клиента
    let interaction = null;
    if (externalCallId) {
      interaction = await Interaction.findOne({ where: { externalCallId } });
    }

    if (interaction) {
      await interaction.update({
        recordingUrl: recordingUrl || interaction.recordingUrl,
        callDuration: duration || interaction.callDuration,
        callStatus: status || 'completed',
      });
    }

    // Можно также найти клиента по номеру и создать взаимодействие
    if (!interaction && clientPhone) {
      const client = await Client.findOne({ where: { phone: clientPhone } });
      if (client) {
        await Interaction.create({
          clientId: client.id,
          authorId: req.body.userId || client.managerId || null,
          type: 'call',
          content: `Входящий звонок ${clientPhone}`,
          recordingUrl,
          callDuration: duration,
          callStatus: status || 'completed',
          externalCallId,
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обработки webhook' });
  }
};

// ─── PATCH /interactions/:id/recording ─────────────────
// Обновить запись звонка (ссылку на аудио) вручную
exports.updateRecording = async (req, res) => {
  try {
    const { recordingUrl, callDuration, callStatus } = req.body;
    const interaction = await Interaction.findByPk(req.params.id);
    if (!interaction) return res.status(404).json({ error: 'Запись не найдена' });

    await interaction.update({ recordingUrl, callDuration, callStatus });
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления записи' });
  }
};

// ─── GET /analytics/manager-stats ──────────────────────
// Личная статистика менеджера: план-факт, конверсии по этапам
exports.getManagerStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const now = new Date();

    // Границы периодов
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Закрытые сделки (completed)
    const buildFactQuery = (from) => Client.findAll({
      where: {
        managerId: userId,
        stage: 'completed',
        updatedAt: { [Op.gte]: from },
      },
    });

    const [dayClients, weekClients, monthClients, allClients] = await Promise.all([
      buildFactQuery(dayStart),
      buildFactQuery(weekStart),
      buildFactQuery(monthStart),
      Client.findAll({ where: { managerId: userId } }),
    ]);

    const sumDeal = (arr) => arr.reduce((s, c) => s + parseFloat(c.dealAmount || 0), 0);

    // Конверсии по этапам
    const stageMap = {};
    for (const c of allClients) {
      const stage = c.pipelineStageId || c.stage || 'unknown';
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    }

    res.json({
      plans: {
        day: parseFloat(user.salesPlanDay || 0),
        week: parseFloat(user.salesPlanWeek || 0),
        month: parseFloat(user.salesPlanMonth || 0),
      },
      facts: {
        day: sumDeal(dayClients),
        week: sumDeal(weekClients),
        month: sumDeal(monthClients),
      },
      totalClients: allClients.length,
      stageDistribution: stageMap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
};

// ─── GET /analytics/managers-rating ────────────────────
// Рейтинг менеджеров (для head_of_sales, director, admin)
exports.getManagersRating = async (req, res) => {
  try {
    const managers = await User.findAll({
      where: {
        role: { [Op.in]: ['manager', 'head_of_sales'] },
        isActive: true,
      },
      attributes: ['id', 'name', 'avatar', 'role', 'salesPlanMonth', 'salesPlanWeek', 'salesPlanDay'],
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const results = await Promise.all(managers.map(async (m) => {
      const closedClients = await Client.findAll({
        where: {
          managerId: m.id,
          stage: 'completed',
          updatedAt: { [Op.gte]: monthStart },
        },
      });

      const factMonth = closedClients.reduce((s, c) => s + parseFloat(c.dealAmount || 0), 0);
      const planMonth = parseFloat(m.salesPlanMonth || 0);
      const percent = planMonth > 0 ? Math.round((factMonth / planMonth) * 100) : null;

      const totalClients = await Client.count({ where: { managerId: m.id } });

      return {
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        role: m.role,
        planMonth,
        factMonth,
        percentPlan: percent,
        totalClients,
      };
    }));

    // Сортируем по % выполнения плана
    results.sort((a, b) => (b.percentPlan || 0) - (a.percentPlan || 0));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения рейтинга' });
  }
};
