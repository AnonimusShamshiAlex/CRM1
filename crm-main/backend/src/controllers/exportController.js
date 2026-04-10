// backend/src/controllers/exportController.js

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { Op, fn, col } = require('sequelize');
const { Client, User, Invoice, Expense, Project } = require('../models');

const FONTS_DIR = path.join(__dirname, '../../fonts');
const REGULAR_FONT_PATH = path.join(FONTS_DIR, 'Roboto-Regular.ttf');
const BOLD_FONT_PATH = path.join(FONTS_DIR, 'Roboto-Bold.ttf');

// Проверяем наличие шрифтов при загрузке модуля
const HAS_REGULAR = fs.existsSync(REGULAR_FONT_PATH);
const HAS_BOLD = fs.existsSync(BOLD_FONT_PATH);

console.log(`[PDF Fonts] Regular: ${HAS_REGULAR ? '✅' : '❌'} ${REGULAR_FONT_PATH}`);
console.log(`[PDF Fonts] Bold: ${HAS_BOLD ? '✅' : '❌'} ${BOLD_FONT_PATH}`);

/**
 * Создаёт PDF документ с зарегистрированными шрифтами и настроенным потоком
 */
function createPdfDoc(res, filename) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  if (HAS_REGULAR) {
    doc.registerFont('Roboto', REGULAR_FONT_PATH);
  }
  if (HAS_BOLD) {
    doc.registerFont('Roboto-Bold', BOLD_FONT_PATH);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  doc.on('error', (err) => {
    console.error('[PDF] Document stream error:', err.message);
  });

  doc.pipe(res);

  // Устанавливаем шрифт по умолчанию
  if (HAS_REGULAR) {
    doc.font('Roboto');
  }

  return doc;
}

/** Переключить на жирный шрифт (безопасно) */
function fontBold(doc) {
  if (HAS_BOLD) {
    doc.font('Roboto-Bold');
  }
  return doc;
}

/** Переключить на обычный шрифт (безопасно) */
function fontRegular(doc) {
  if (HAS_REGULAR) {
    doc.font('Roboto');
  }
  return doc;
}

// ──────────────────────────────────────────────
// ЭКСПОРТ КЛИЕНТОВ В EXCEL
// ──────────────────────────────────────────────
const exportClientsExcel = async (req, res) => {
  try {
    const clients = await Client.findAll({
      include: [{ model: User, as: 'manager', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Клиенты');

    const stageLabels = {
      new: 'Новый лид',
      negotiation: 'Переговоры',
      proposal_sent: 'КП отправлено',
      contract_signed: 'Договор подписан',
      in_progress: 'В работе',
      completed: 'Завершён',
    };

    const sourceLabels = {
      website: 'Сайт',
      referral: 'Рекомендация',
      cold_call: 'Холодный звонок',
      social: 'Соцсети',
      utm: 'UTM-метка',
      other: 'Другое',
    };

    sheet.columns = [
      { header: 'Имя', key: 'name', width: 25 },
      { header: 'Компания', key: 'companyName', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Телефон', key: 'phone', width: 18 },
      { header: 'Telegram', key: 'telegram', width: 18 },
      { header: 'Этап', key: 'stage', width: 18 },
      { header: 'Источник', key: 'source', width: 18 },
      { header: 'Менеджер', key: 'manager', width: 20 },
      { header: 'ИНН', key: 'inn', width: 14 },
      { header: 'Категория', key: 'category', width: 14 },
      { header: 'Дата обращения', key: 'firstContactDate', width: 16 },
    ];

    // Стилизация заголовков
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    clients.forEach((c) => {
      sheet.addRow({
        name: c.name,
        companyName: c.companyName || '',
        email: c.email || '',
        phone: c.phone || '',
        telegram: c.telegram || '',
        stage: stageLabels[c.stage] || c.stage,
        source: sourceLabels[c.source] || c.source || '',
        manager: c.manager?.name || '',
        inn: c.inn || '',
        category: c.category || '',
        firstContactDate: c.firstContactDate || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
};

// ──────────────────────────────────────────────
// ЭКСПОРТ СЧЁТА В PDF
// ──────────────────────────────────────────────
const exportInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Счёт не найден' });
    }

    const doc = createPdfDoc(res, `invoice-${invoice.number}.pdf`);

    // Заголовок
    fontBold(doc);
    doc.fontSize(20).text(`Счёт ${invoice.number}`, { align: 'center' });
    doc.moveDown();

    fontRegular(doc);
    doc.fontSize(10);

    // Информация
    const statusLabels = {
      draft: 'Черновик', sent: 'Выставлен', partial: 'Частично оплачен',
      paid: 'Оплачен', overdue: 'Просрочен',
    };

    doc.text(`Статус: ${statusLabels[invoice.status] || invoice.status}`);
    doc.text(`Дата создания: ${new Date(invoice.createdAt).toLocaleDateString('ru-RU')}`);
    if (invoice.dueDate) {
      doc.text(`Срок оплаты: ${new Date(invoice.dueDate).toLocaleDateString('ru-RU')}`);
    }
    doc.moveDown();

    // Клиент
    fontBold(doc);
    doc.fontSize(12).text('Клиент:');
    fontRegular(doc);
    doc.fontSize(10);
    doc.text(invoice.client?.name || 'Не указан');
    if (invoice.client?.companyName) doc.text(invoice.client.companyName);
    if (invoice.client?.inn) doc.text(`ИНН: ${invoice.client.inn}`);
    if (invoice.client?.email) doc.text(`Email: ${invoice.client.email}`);
    if (invoice.client?.phone) doc.text(`Тел: ${invoice.client.phone}`);
    doc.moveDown();

    if (invoice.project) {
      doc.text(`Проект: ${invoice.project.name}`);
      doc.moveDown();
    }

    // Таблица позиций
    const items = invoice.items || [];
    if (items.length > 0) {
      fontBold(doc);
      doc.fontSize(12).text('Позиции:');
      doc.moveDown(0.5);

      fontRegular(doc);
      doc.fontSize(9);

      const tableTop = doc.y;
      const colX = [50, 280, 340, 410, 480];
      const headers = ['Наименование', 'Кол-во', 'Цена', 'Сумма'];

      // Шапка таблицы
      doc.rect(50, tableTop - 5, 500, 20).fill('#2563EB');
      doc.fillColor('#FFFFFF');
      fontBold(doc);
      headers.forEach((h, i) => {
        doc.text(h, colX[i], tableTop, { width: colX[i + 1] ? colX[i + 1] - colX[i] : 70 });
      });
      doc.fillColor('#000000');
      fontRegular(doc);

      let y = tableTop + 20;
      items.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.rect(50, y - 3, 500, 18).fill('#F3F4F6');
          doc.fillColor('#000000');
        }
        doc.text(item.name || '', colX[0], y, { width: 225 });
        doc.text(String(item.qty || 0), colX[1], y, { width: 55 });
        doc.text(formatNum(item.price), colX[2], y, { width: 65 });
        doc.text(formatNum((item.qty || 0) * (item.price || 0)), colX[3], y, { width: 70 });
        y += 18;
      });

      doc.y = y + 10;
    }

    // Итоги
    doc.moveDown();
    const rightX = 380;
    fontRegular(doc);
    doc.fontSize(10);
    doc.text(`Подитог: ${formatNum(invoice.subtotal)} руб.`, rightX, doc.y, { align: 'right', width: 170 });
    if (parseFloat(invoice.vatPercent) > 0) {
      doc.text(`НДС (${invoice.vatPercent}%): ${formatNum(invoice.vatAmount)} руб.`, rightX, doc.y, { align: 'right', width: 170 });
    }
    fontBold(doc);
    doc.fontSize(12);
    doc.text(`Итого: ${formatNum(invoice.total)} руб.`, rightX, doc.y, { align: 'right', width: 170 });
    fontRegular(doc);

    if (parseFloat(invoice.paidAmount) > 0) {
      doc.fontSize(10);
      doc.text(`Оплачено: ${formatNum(invoice.paidAmount)} руб.`, rightX, doc.y, { align: 'right', width: 170 });
      doc.text(`Остаток: ${formatNum(invoice.total - invoice.paidAmount)} руб.`, rightX, doc.y, { align: 'right', width: 170 });
    }

    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(10).text(`Примечания: ${invoice.notes}`);
    }

    doc.end();
  } catch (err) {
    console.error('PDF Invoice error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка генерации PDF' });
    }
  }
};

// ──────────────────────────────────────────────
// ЭКСПОРТ ФИНАНСОВОГО ОТЧЁТА В EXCEL
// ──────────────────────────────────────────────
const exportReportExcel = async (req, res) => {
  try {
    const { period, year, month } = req.query;
    let dateFrom, dateTo;
    const now = new Date();

    if (period === 'month') {
      const m = parseInt(month) || now.getMonth() + 1;
      const y = parseInt(year) || now.getFullYear();
      dateFrom = new Date(y, m - 1, 1);
      dateTo = new Date(y, m, 0);
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      dateFrom = new Date(now.getFullYear(), q * 3, 1);
      dateTo = new Date(now.getFullYear(), q * 3 + 3, 0);
    } else {
      const y = parseInt(year) || now.getFullYear();
      dateFrom = new Date(y, 0, 1);
      dateTo = new Date(y, 11, 31);
    }

    const fromStr = dateFrom.toISOString().split('T')[0];
    const toStr = dateTo.toISOString().split('T')[0];

    // Данные
    const invoices = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['paid', 'partial'] },
        paidAt: { [Op.between]: [fromStr, toStr] },
      },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'companyName'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
    });

    const expenses = await Expense.findAll({
      where: { date: { [Op.between]: [fromStr, toStr] } },
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
    });

    const receivables = await Invoice.findAll({
      where: { status: { [Op.in]: ['sent', 'partial', 'overdue'] } },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
    });

    const workbook = new ExcelJS.Workbook();

    // Лист "Сводка"
    const summarySheet = workbook.addWorksheet('Сводка');
    const revenue = invoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    summarySheet.columns = [
      { header: 'Показатель', key: 'label', width: 30 },
      { header: 'Значение', key: 'value', width: 20 },
    ];
    summarySheet.getRow(1).font = { bold: true };

    summarySheet.addRow({ label: `Период`, value: `${fromStr} — ${toStr}` });
    summarySheet.addRow({ label: 'Выручка', value: revenue });
    summarySheet.addRow({ label: 'Расходы', value: totalExpenses });
    summarySheet.addRow({ label: 'Прибыль', value: revenue - totalExpenses });
    summarySheet.addRow({ label: 'Дебиторская задолженность', value: receivables.reduce((s, r) => s + parseFloat(r.total) - parseFloat(r.paidAmount), 0) });

    // Лист "Счета"
    const invSheet = workbook.addWorksheet('Оплаченные счета');
    invSheet.columns = [
      { header: 'Номер', key: 'number', width: 18 },
      { header: 'Клиент', key: 'client', width: 25 },
      { header: 'Проект', key: 'project', width: 25 },
      { header: 'Сумма', key: 'total', width: 15 },
      { header: 'Оплачено', key: 'paid', width: 15 },
      { header: 'Дата оплаты', key: 'paidAt', width: 15 },
    ];
    invSheet.getRow(1).font = { bold: true };

    invoices.forEach((i) => {
      invSheet.addRow({
        number: i.number,
        client: i.client?.companyName || i.client?.name || '',
        project: i.project?.name || '',
        total: parseFloat(i.total),
        paid: parseFloat(i.paidAmount),
        paidAt: i.paidAt || '',
      });
    });

    // Лист "Расходы"
    const expSheet = workbook.addWorksheet('Расходы');
    const catLabels = {
      salary: 'Зарплаты', contractor: 'Подрядчики', hosting: 'Хостинг/Домены',
      advertising: 'Реклама', other: 'Прочее',
    };

    expSheet.columns = [
      { header: 'Название', key: 'name', width: 25 },
      { header: 'Категория', key: 'category', width: 18 },
      { header: 'Проект', key: 'project', width: 25 },
      { header: 'Сумма', key: 'amount', width: 15 },
      { header: 'Дата', key: 'date', width: 15 },
    ];
    expSheet.getRow(1).font = { bold: true };

    expenses.forEach((e) => {
      expSheet.addRow({
        name: e.name,
        category: catLabels[e.category] || e.category,
        project: e.project?.name || '',
        amount: parseFloat(e.amount),
        date: e.date,
      });
    });

    // Лист "Дебиторка"
    const debSheet = workbook.addWorksheet('Дебиторская задолженность');
    debSheet.columns = [
      { header: 'Номер счёта', key: 'number', width: 18 },
      { header: 'Клиент', key: 'client', width: 25 },
      { header: 'Сумма', key: 'total', width: 15 },
      { header: 'Оплачено', key: 'paid', width: 15 },
      { header: 'Остаток', key: 'remaining', width: 15 },
      { header: 'Срок', key: 'dueDate', width: 15 },
      { header: 'Статус', key: 'status', width: 15 },
    ];
    debSheet.getRow(1).font = { bold: true };

    const statusLabelsExcel = { sent: 'Выставлен', partial: 'Частично', overdue: 'Просрочен' };
    receivables.forEach((r) => {
      debSheet.addRow({
        number: r.number,
        client: r.client?.name || '',
        total: parseFloat(r.total),
        paid: parseFloat(r.paidAmount),
        remaining: parseFloat(r.total) - parseFloat(r.paidAmount),
        dueDate: r.dueDate || '',
        status: statusLabelsExcel[r.status] || r.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${fromStr}-${toStr}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
};

// ──────────────────────────────────────────────
// ЭКСПОРТ ФИНАНСОВОГО ОТЧЁТА В PDF
// ──────────────────────────────────────────────
const exportReportPdf = async (req, res) => {
  try {
    const { period, year, month } = req.query;
    let dateFrom, dateTo;
    const now = new Date();

    if (period === 'month') {
      const m = parseInt(month) || now.getMonth() + 1;
      const y = parseInt(year) || now.getFullYear();
      dateFrom = new Date(y, m - 1, 1);
      dateTo = new Date(y, m, 0);
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      dateFrom = new Date(now.getFullYear(), q * 3, 1);
      dateTo = new Date(now.getFullYear(), q * 3 + 3, 0);
    } else {
      const y = parseInt(year) || now.getFullYear();
      dateFrom = new Date(y, 0, 1);
      dateTo = new Date(y, 11, 31);
    }

    const fromStr = dateFrom.toISOString().split('T')[0];
    const toStr = dateTo.toISOString().split('T')[0];

    const revenueResult = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['paid', 'partial'] },
        paidAt: { [Op.between]: [fromStr, toStr] },
      },
      attributes: [[fn('SUM', col('paid_amount')), 'total']],
      raw: true,
    });

    const expensesByCategory = await Expense.findAll({
      where: { date: { [Op.between]: [fromStr, toStr] } },
      attributes: ['category', [fn('SUM', col('amount')), 'total']],
      group: ['category'],
      raw: true,
    });

    const receivables = await Invoice.findAll({
      where: { status: { [Op.in]: ['sent', 'partial', 'overdue'] } },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      attributes: ['id', 'number', 'total', 'paidAmount', 'dueDate', 'status'],
    });

    const revenue = parseFloat(revenueResult[0]?.total || 0);
    const totalExpenses = expensesByCategory.reduce((s, e) => s + parseFloat(e.total), 0);

    const doc = createPdfDoc(res, `report-${fromStr}-${toStr}.pdf`);

    // Заголовок
    fontBold(doc);
    doc.fontSize(18).text('Финансовый отчёт', { align: 'center' });
    fontRegular(doc);
    doc.fontSize(11).text(`Период: ${fromStr} — ${toStr}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(11);

    // Сводка
    fontBold(doc);
    doc.text('Сводка:');
    fontRegular(doc);
    doc.text(`Выручка: ${formatNum(revenue)} руб.`);
    doc.text(`Расходы: ${formatNum(totalExpenses)} руб.`);
    doc.text(`Прибыль: ${formatNum(revenue - totalExpenses)} руб.`);
    doc.moveDown();

    // Расходы по категориям
    const catLabels = {
      salary: 'Зарплаты', contractor: 'Подрядчики', hosting: 'Хостинг/Домены',
      advertising: 'Реклама', other: 'Прочее',
    };

    if (expensesByCategory.length > 0) {
      fontBold(doc);
      doc.text('Расходы по категориям:');
      fontRegular(doc);
      expensesByCategory.forEach((c) => {
        doc.text(`  ${catLabels[c.category] || c.category}: ${formatNum(c.total)} руб.`);
      });
      doc.moveDown();
    }

    // Дебиторка
    if (receivables.length > 0) {
      fontBold(doc);
      doc.text('Дебиторская задолженность:');
      fontRegular(doc);
      doc.fontSize(9);
      receivables.forEach((r) => {
        const remaining = parseFloat(r.total) - parseFloat(r.paidAmount);
        doc.text(`  ${r.number} — ${r.client?.name || '?'} — ${formatNum(remaining)} руб. (срок: ${r.dueDate || '?'})`);
      });
    }

    doc.end();
  } catch (err) {
    console.error('PDF Report error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка генерации PDF' });
    }
  }
};

function formatNum(n) {
  return Number(n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

module.exports = {
  exportClientsExcel,
  exportInvoicePdf,
  exportReportExcel,
  exportReportPdf,
};