const { ClientFieldDefinition } = require('../models');

// GET /client-fields
exports.getFields = async (req, res) => {
  try {
    const fields = await ClientFieldDefinition.findAll({ order: [['order', 'ASC']] });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения полей' });
  }
};

// POST /client-fields
exports.createField = async (req, res) => {
  try {
    const { name, fieldType, required, options, order } = req.body;
    if (!name) return res.status(400).json({ error: 'Название поля обязательно' });

    const fieldKey = name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_а-яё]/gi, '')
      + '_' + Date.now();

    const field = await ClientFieldDefinition.create({
      name,
      fieldKey,
      fieldType: fieldType || 'text',
      required: required || false,
      options: options || [],
      order: order || 0,
    });
    res.status(201).json(field);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания поля' });
  }
};

// PUT /client-fields/:id
exports.updateField = async (req, res) => {
  try {
    const field = await ClientFieldDefinition.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: 'Поле не найдено' });
    const { name, fieldType, required, options, order } = req.body;
    await field.update({ name, fieldType, required, options, order });
    res.json(field);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления поля' });
  }
};

// DELETE /client-fields/:id
exports.deleteField = async (req, res) => {
  try {
    const field = await ClientFieldDefinition.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: 'Поле не найдено' });
    await field.destroy();
    res.json({ message: 'Поле удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления поля' });
  }
};
