import { useEffect, useState } from 'react';
import { Plus, Receipt, TrendingDown, TrendingUp, BarChart3, Download, FileText } from 'lucide-react';
import api, { API_BASE } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import InvoiceForm from './InvoiceForm';
import ExpenseForm from './ExpenseForm';
import {
  INVOICE_STATUSES, EXPENSE_CATEGORIES, getStatusInfo, formatMoney, formatDate,
} from '../../utils/constants';
import clsx from 'clsx';

export default function FinancePage() {
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const { token } = useAuthStore();

  const handleExport = async (url) => {
    if (!token) {
      alert('Сессия истекла. Войдите заново.');
      window.location.href = '/login';
      return;
    }
    window.location.href = url;
  };

  const fetchData = async () => {
    try {
      const [inv, exp, rep] = await Promise.all([
        api.get('/invoices'),
        api.get('/expenses'),
        api.get('/reports/finance', { params: { period: 'month' } }),
      ]);
      setInvoices(inv.data);
      setExpenses(exp.data);
      setReport(rep.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const recordPayment = async () => {
    if (!paymentAmount || !paymentModal) return;
    try {
      await api.post(`/invoices/${paymentModal.id}/payment`, { amount: parseFloat(paymentAmount) });
      setPaymentModal(null);
      setPaymentAmount('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport(`${API_BASE}/export/reports/excel?period=month&token=${token}`)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => handleExport(`${API_BASE}/export/reports/pdf?period=month&token=${token}`)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Сводные карточки */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success-600" />
              <span className="text-sm text-gray-500">Выручка</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(report.revenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-danger-500" />
              <span className="text-sm text-gray-500">Расходы</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(report.expenses.total)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span className="text-sm text-gray-500">Прибыль</span>
            </div>
            <p className={`text-2xl font-bold ${report.profit >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
              {formatMoney(report.profit)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5 text-warning-600" />
              <span className="text-sm text-gray-500">Дебиторка</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatMoney(report.receivables.reduce((s, r) => s + parseFloat(r.total) - parseFloat(r.paidAmount), 0))}
            </p>
          </div>
        </div>
      )}

      {/* Расходы по категориям */}
      {report?.expenses?.byCategory?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Расходы по категориям</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {report.expenses.byCategory.map((cat) => {
              const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === cat.category);
              return (
                <div key={cat.category} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{catInfo?.label || cat.category}</p>
                  <p className="text-lg font-semibold text-gray-900">{formatMoney(cat.total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Табы */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab('invoices')}
            className={clsx('px-4 py-2 rounded-md text-sm font-medium transition', tab === 'invoices' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}
          >
            Счета
          </button>
          <button
            onClick={() => setTab('expenses')}
            className={clsx('px-4 py-2 rounded-md text-sm font-medium transition', tab === 'expenses' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}
          >
            Расходы
          </button>
        </div>
        <button
          onClick={() => tab === 'invoices' ? setShowInvoiceForm(true) : setShowExpenseForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {tab === 'invoices' ? 'Новый счёт' : 'Новый расход'}
        </button>
      </div>

      {/* Таблица счетов */}
      {tab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Номер</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Клиент</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Проект</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Сумма</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Оплачено</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Статус</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Срок</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                const stInfo = getStatusInfo(INVOICE_STATUSES, inv.status);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inv.client?.companyName || inv.client?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inv.project?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatMoney(inv.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatMoney(inv.paidAmount)}</td>
                    <td className="px-4 py-3"><Badge variant={stInfo.color}>{stInfo.label}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExport(`${API_BASE}/export/invoices/${inv.id}/pdf?token=${token}`)}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                          PDF
                        </button>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => setPaymentModal(inv)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Оплата
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Таблица расходов */}
      {tab === 'expenses' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Название</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Категория</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Проект</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Сумма</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Дата</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Периодический</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((exp) => {
                const catInfo = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                return (
                  <tr key={exp.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{catInfo?.label || exp.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{exp.project?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-danger-500">{formatMoney(exp.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{exp.isPeriodic ? 'Да' : 'Нет'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалки */}
      <Modal open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)} title="Новый счёт" size="lg">
        <InvoiceForm onSaved={() => { setShowInvoiceForm(false); fetchData(); }} onCancel={() => setShowInvoiceForm(false)} />
      </Modal>

      <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Новый расход">
        <ExpenseForm onSaved={() => { setShowExpenseForm(false); fetchData(); }} onCancel={() => setShowExpenseForm(false)} />
      </Modal>

      {/* Модалка оплаты */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Внести оплату" size="sm">
        {paymentModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Счёт: <b>{paymentModal.number}</b><br />
              Сумма: {formatMoney(paymentModal.total)}<br />
              Оплачено: {formatMoney(paymentModal.paidAmount)}<br />
              Остаток: {formatMoney(paymentModal.total - paymentModal.paidAmount)}
            </p>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Сумма оплаты"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setPaymentModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Отмена
              </button>
              <button onClick={recordPayment} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium">
                Внести
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
