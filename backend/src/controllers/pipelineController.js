// controllers/pipelineController.js
const { Pipeline, PipelineStage, Client } = require('../models');

const getPipelines = async (req, res) => {
  const pipelines = await Pipeline.findAll({
    include: [{ model: PipelineStage, as: 'stages', order: [['order','ASC']] }],
    order: [['order','ASC']],
  });
  res.json(pipelines);
};

const createPipeline = async (req, res) => {
  const pipeline = await Pipeline.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json(pipeline);
};

const updatePipeline = async (req, res) => {
  const p = await Pipeline.findByPk(req.params.id);
  if (!p) return res.status(404).json({ message: 'Воронка не найдена' });
  await p.update(req.body);
  res.json(p);
};

const deletePipeline = async (req, res) => {
  const p = await Pipeline.findByPk(req.params.id);
  if (!p) return res.status(404).json({ message: 'Воронка не найдена' });
  // Проверяем есть ли клиенты в воронке
  const clientsCount = await Client.count({ where: { pipelineId: p.id } });
  if (clientsCount > 0) {
    return res.status(400).json({ message: `Нельзя удалить воронку: в ней ${clientsCount} клиентов` });
  }
  await p.destroy();
  res.json({ message: 'Воронка удалена' });
};

const createStage = async (req, res) => {
  const count = await PipelineStage.count({ where: { pipelineId: req.params.pipelineId } });
  const stage = await PipelineStage.create({
    ...req.body,
    pipelineId: req.params.pipelineId,
    order: count,
  });
  res.status(201).json(stage);
};

const updateStage = async (req, res) => {
  const stage = await PipelineStage.findByPk(req.params.stageId);
  if (!stage) return res.status(404).json({ message: 'Этап не найден' });
  await stage.update(req.body);
  res.json(stage);
};

const deleteStage = async (req, res) => {
  const stage = await PipelineStage.findByPk(req.params.stageId);
  if (!stage) return res.status(404).json({ message: 'Этап не найден' });
  const clientsCount = await Client.count({ where: { pipelineStageId: stage.id } });
  if (clientsCount > 0) {
    return res.status(400).json({ message: `В этапе ${clientsCount} клиентов` });
  }
  await stage.destroy();
  res.json({ message: 'Этап удалён' });
};

// DnD reorder этапов — ВАЖНО: маршрут ПЕРЕД :stageId
const reorderStages = async (req, res) => {
  const { order } = req.body; // [{ id, order }]
  if (!order?.length) return res.status(400).json({ message: 'order обязателен' });

  await Promise.all(order.map(({ id, order: o }) =>
    PipelineStage.update({ order: o }, { where: { id, pipelineId: req.params.pipelineId } })
  ));
  res.json({ message: 'Порядок обновлён' });
};

module.exports = {
  getPipelines, createPipeline, updatePipeline, deletePipeline,
  createStage, updateStage, deleteStage, reorderStages,
};
