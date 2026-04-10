const { Pipeline, PipelineStage, Client, User } = require('../models');
const { Op } = require('sequelize');

// ─── GET /pipelines ────────────────────────────────────
exports.getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.findAll({
      include: [
        { model: PipelineStage, as: 'stages' },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
      ],
      order: [
        ['createdAt', 'ASC'],
        [{ model: PipelineStage, as: 'stages' }, 'order', 'ASC'],
      ],
    });
    res.json(pipelines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения воронок' });
  }
};

// ─── GET /pipelines/:id ────────────────────────────────
exports.getPipelineById = async (req, res) => {
  try {
    const pipeline = await Pipeline.findByPk(req.params.id, {
      include: [
        { model: PipelineStage, as: 'stages' },
      ],
      order: [
        [{ model: PipelineStage, as: 'stages' }, 'order', 'ASC'],
      ],
    });
    if (!pipeline) return res.status(404).json({ error: 'Воронка не найдена' });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

// ─── POST /pipelines ───────────────────────────────────
exports.createPipeline = async (req, res) => {
  try {
    const { name, description, stages = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Название воронки обязательно' });

    const pipeline = await Pipeline.create({
      name,
      description,
      createdById: req.user.id,
    });

    // Создаём этапы если переданы, иначе — дефолтные
    const stagesData = stages.length > 0 ? stages : [
      { name: 'Новый лид', color: '#6366f1', order: 0 },
      { name: 'Переговоры', color: '#8b5cf6', order: 1 },
      { name: 'КП отправлено', color: '#f59e0b', order: 2 },
      { name: 'Договор подписан', color: '#3b82f6', order: 3 },
      { name: 'В работе', color: '#10b981', order: 4 },
      { name: 'Завершён', color: '#6b7280', order: 5 },
    ];

    for (const s of stagesData) {
      await PipelineStage.create({ ...s, pipelineId: pipeline.id });
    }

    const result = await Pipeline.findByPk(pipeline.id, {
      include: [{ model: PipelineStage, as: 'stages' }],
      order: [[{ model: PipelineStage, as: 'stages' }, 'order', 'ASC']],
    });
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания воронки' });
  }
};

// ─── PUT /pipelines/:id ────────────────────────────────
exports.updatePipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.findByPk(req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Воронка не найдена' });
    const { name, description } = req.body;
    await pipeline.update({ name, description });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления воронки' });
  }
};

// ─── DELETE /pipelines/:id ─────────────────────────────
exports.deletePipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.findByPk(req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Воронка не найдена' });

    // Отвязать клиентов от воронки
    await Client.update(
      { pipelineId: null, pipelineStageId: null },
      { where: { pipelineId: pipeline.id } }
    );

    await PipelineStage.destroy({ where: { pipelineId: pipeline.id } });
    await pipeline.destroy();
    res.json({ message: 'Воронка удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления воронки' });
  }
};

// ─── GET /pipelines/:id/stages ─────────────────────────
exports.getStages = async (req, res) => {
  try {
    const stages = await PipelineStage.findAll({
      where: { pipelineId: req.params.id },
      order: [['order', 'ASC']],
    });
    res.json(stages);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

// ─── POST /pipelines/:id/stages ────────────────────────
exports.createStage = async (req, res) => {
  try {
    const { name, color, order } = req.body;
    const stage = await PipelineStage.create({
      pipelineId: req.params.id,
      name,
      color: color || '#6366f1',
      order: order || 0,
    });
    res.status(201).json(stage);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания этапа' });
  }
};

// ─── PUT /pipelines/:pipelineId/stages/:stageId ────────
exports.updateStage = async (req, res) => {
  try {
    const stage = await PipelineStage.findOne({
      where: { id: req.params.stageId, pipelineId: req.params.pipelineId },
    });
    if (!stage) return res.status(404).json({ error: 'Этап не найден' });
    const { name, color, order } = req.body;
    await stage.update({ name, color, order });
    res.json(stage);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления этапа' });
  }
};

// ─── DELETE /pipelines/:pipelineId/stages/:stageId ─────
exports.deleteStage = async (req, res) => {
  try {
    const stage = await PipelineStage.findOne({
      where: { id: req.params.stageId, pipelineId: req.params.pipelineId },
    });
    if (!stage) return res.status(404).json({ error: 'Этап не найден' });

    // Отвязать клиентов от этого этапа
    await Client.update(
      { pipelineStageId: null },
      { where: { pipelineStageId: stage.id } }
    );

    await stage.destroy();
    res.json({ message: 'Этап удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления этапа' });
  }
};

// ─── PUT /pipelines/:id/stages/reorder ─────────────────
exports.reorderStages = async (req, res) => {
  try {
    const { stageOrders } = req.body;

    // Поддержка обоих форматов: массив объектов или объект
    let orders = stageOrders;
    if (!Array.isArray(orders)) {
      // Возможно пришёл объект или другой формат
      if (stageOrders && typeof stageOrders === 'object') {
        orders = Object.entries(stageOrders).map(([id, order]) => ({ id, order }));
      } else {
        return res.status(400).json({ error: 'Не передан список этапов' });
      }
    }

    if (orders.length === 0) {
      return res.status(400).json({ error: 'Пустой список этапов' });
    }

    for (const item of orders) {
      const id = item.id;
      const order = typeof item.order === 'number' ? item.order : 0;
      if (!id) continue;
      await PipelineStage.update({ order }, { where: { id, pipelineId: req.params.id } });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Reorder error:', err);
    res.status(500).json({ error: 'Ошибка пересортировки' });
  }
};