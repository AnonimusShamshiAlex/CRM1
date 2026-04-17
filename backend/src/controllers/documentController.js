// controllers/documentController.js
// ТЗ: Конструктор документов — автогенерация договоров и счетов

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Client, Project, User, DocumentTemplate, Document } = require('../models');

/**
 * GET /api/document-templates
 */
const getTemplates = async (req, res) => {
  const templates = await DocumentTemplate.findAll({
    order: [['createdAt', 'DESC']],
  });
  res.json(templates);
};

/**
 * POST /api/document-templates
 */
const createTemplate = async (req, res) => {
  const { name, type, description, body } = req.body;
  if (!name || !body) return res.status(400).json({ message: 'Название и текст шаблона обязательны' });

  const template = await DocumentTemplate.create({
    name, type, description, body,
    createdBy: req.user.id,
  });
  res.status(201).json(template);
};

/**
 * PUT /api/document-templates/:id
 */
const updateTemplate = async (req, res) => {
  const template = await DocumentTemplate.findByPk(req.params.id);
  if (!template) return res.status(404).json({ message: 'Шаблон не найден' });
  await template.update(req.body);
  res.json(template);
};

/**
 * DELETE /api/document-templates/:id
 */
const deleteTemplate = async (req, res) => {
  const template = await DocumentTemplate.findByPk(req.params.id);
  if (!template) return res.status(404).json({ message: 'Шаблон не найден' });
  await template.destroy();
  res.json({ message: 'Шаблон удалён' });
};

/**
 * POST /api/documents/generate
 * Генерирует PDF из шаблона с данными клиента
 */
const generateDocument = async (req, res) => {
  const { templateId, clientId, projectId, variables } = req.body;

  if (!templateId || !clientId) {
    return res.status(400).json({ message: 'templateId и clientId обязательны' });
  }

  const [template, client, project, manager] = await Promise.all([
    DocumentTemplate.findByPk(templateId),
    Client.findByPk(clientId),
    projectId ? Project.findByPk(projectId) : Promise.resolve(null),
    User.findByPk(req.user.id),
  ]);

  if (!template) return res.status(404).json({ message: 'Шаблон не найден' });
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });

  // Собираем переменные для подстановки
  const today = new Date();
  const vars = {
    client_name: client.name || '',
    client_email: client.email || '',
    client_phone: client.phone || '',
    client_company: client.company || '',
    project_name: project?.name || '',
    project_budget: project?.budget ? formatMoney(project.budget) : '',
    date_today: today.toLocaleDateString('ru-RU'),
    contract_number: variables?.contract_number || generateDocNumber(),
    manager_name: manager?.name || '',
    service_name: variables?.service_name || '',
    amount: variables?.amount ? formatMoney(Number(variables.amount)) : '',
    vat: variables?.amount ? formatMoney(Number(variables.amount) * 0.12) : '',
    total: variables?.amount ? formatMoney(Number(variables.amount) * 1.12) : '',
    ...variables,
  };

  // Подставляем переменные в текст шаблона
  let content = template.body;
  Object.entries(vars).forEach(([key, val]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    content = content.replace(regex, val || '');
  });

  // Генерируем PDF
  const docName = `${template.name}_${client.name}_${today.toISOString().slice(0, 10)}`;
  const fileName = `${docName.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_')}.pdf`;
  const filePath = path.join(__dirname, '../../uploads/documents', fileName);

  // Создаём папку если нет
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const stream = fs.createWriteStream(filePath);

    // Подключаем шрифт Roboto для кириллицы
    const fontPath = path.join(__dirname, '../../fonts/Roboto-Regular.ttf');
    const boldPath = path.join(__dirname, '../../fonts/Roboto-Bold.ttf');

    if (fs.existsSync(fontPath)) {
      doc.registerFont('Roboto', fontPath);
      doc.registerFont('Roboto-Bold', boldPath);
      doc.font('Roboto');
    }

    doc.pipe(stream);

    // Заголовок
    doc.fontSize(16).font('Roboto-Bold').text(template.name, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).font('Roboto');

    // Контент — разбиваем по строкам
    const lines = content.split('\n');
    lines.forEach((line) => {
      if (line.startsWith('##')) {
        doc.moveDown(0.5).fontSize(13).font('Roboto-Bold').text(line.replace(/^##\s*/, ''));
        doc.fontSize(12).font('Roboto');
      } else if (line.startsWith('#')) {
        doc.moveDown(0.5).fontSize(14).font('Roboto-Bold').text(line.replace(/^#\s*/, ''));
        doc.fontSize(12).font('Roboto');
      } else if (line.trim() === '') {
        doc.moveDown(0.4);
      } else {
        doc.text(line, { lineGap: 4 });
      }
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Сохраняем запись в БД
  const document = await Document.create({
    name: docName,
    type: template.type,
    fileName,
    filePath: `/uploads/documents/${fileName}`,
    templateId,
    clientId,
    projectId: projectId || null,
    createdBy: req.user.id,
  });

  res.status(201).json({
    ...document.toJSON(),
    downloadUrl: `/api/documents/${document.id}/download`,
  });
};

/**
 * GET /api/documents
 */
const getDocuments = async (req, res) => {
  const { limit = 50, page = 1, clientId } = req.query;
  const where = clientId ? { clientId } : {};

  const { count, rows } = await Document.findAndCountAll({
    where,
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.json({
    documents: rows.map((d) => ({
      ...d.toJSON(),
      downloadUrl: `/api/documents/${d.id}/download`,
    })),
    total: count,
  });
};

/**
 * GET /api/documents/:id/download
 */
const downloadDocument = async (req, res) => {
  const document = await Document.findByPk(req.params.id);
  if (!document) return res.status(404).json({ message: 'Документ не найден' });

  const filePath = path.join(__dirname, '../../uploads/documents', document.fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Файл не найден на сервере' });
  }

  res.download(filePath, document.fileName);
};

// Helpers
const formatMoney = (n) =>
  new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' UZS';

const generateDocNumber = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateDocument,
  getDocuments,
  downloadDocument,
};
