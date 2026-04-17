// controllers/exportController.js
const { Client, Project } = require('../models');

const exportClients = async (req, res) => {
  const { format = 'xlsx', projectId } = req.query;
  const where = projectId ? { projectId } : {};
  const clients = await Client.findAll({ where, include: [{ model: Project, as: 'project', attributes: ['name'] }] });

  if (format === 'xlsx') {
    const xlsx = require('xlsx');
    const data = clients.map((c) => ({
      'Имя':      c.name,
      'Email':    c.email || '',
      'Телефон':  c.phone || '',
      'Компания': c.company || '',
      'Статус':   c.status,
      'Проект':   c.project?.name || '',
      'Дата':     c.createdAt?.toLocaleDateString('ru-RU') || '',
    }));
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Клиенты');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  }

  // CSV
  const lines = ['Имя,Email,Телефон,Компания,Статус,Проект'];
  clients.forEach((c) => {
    lines.push(`"${c.name}","${c.email||''}","${c.phone||''}","${c.company||''}","${c.status}","${c.project?.name||''}"`);
  });
  res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send('\uFEFF' + lines.join('\n'));
};

module.exports = { exportClients };
