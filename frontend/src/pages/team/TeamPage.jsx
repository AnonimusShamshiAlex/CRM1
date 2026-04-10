import { useEffect, useState } from 'react';
import { UserPlus, Mail, Shield, ShieldCheck, ShieldAlert, UserX, CheckCircle, Clock, Crown } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { EMPLOYEE_TYPES, ROLES, formatDate, formatMoney } from '../../utils/constants';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ salesPlanMonth: 0, salesPlanWeek: 0, salesPlanDay: 0 });
  const [approvingUser, setApprovingUser] = useState(null);
  const [approveRole, setApproveRole] = useState('executor');
  const [pipelines, setPipelines] = useState([]);

  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = ['admin', 'director'].includes(currentUser?.role);
  const isSuperAdmin = currentUser?.isSuperAdmin;

  const roleColors = {
    admin: 'red', director: 'red', head_of_sales: 'purple',
    manager: 'blue', executor: 'green',
  };
  const roleLabels = {
    admin: 'Администратор', director: 'Директор',
    head_of_sales: 'РОП', manager: 'Менеджер', executor: 'Исполнитель',
  };
  const typeLabels = {
    staff: 'Штатный', contractor: 'Подрядчик', freelancer: 'Фрилансер',
  };
  const roleIcons = {
    admin: ShieldAlert, director: ShieldAlert,
    head_of_sales: ShieldCheck, manager: ShieldCheck, executor: Shield,
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/users/pending');
      setPendingUsers(data);
    } catch {
      // не показываем ошибку — у не-admin нет доступа
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPending();
    api.get('/pipelines').then(({ data }) => setPipelines(data)).catch(() => {});
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    // Проверка на фронте: только суперадмин даёт роль admin
    if (newRole === 'admin' && !isSuperAdmin) {
      toast.error('Только суперадминистратор может назначать роль Администратор');
      return;
    }
    try {
      const { data } = await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`Роль изменена на "${roleLabels[newRole]}"`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
      setSelectedUser((prev) => (prev?.id === userId ? { ...prev, ...data } : prev));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось сменить роль');
    }
  };

  const handleApprove = async () => {
    if (!approvingUser) return;
    if (approveRole === 'admin' && !isSuperAdmin) {
      toast.error('Только суперадминистратор может назначать роль Администратор');
      return;
    }
    try {
      await api.patch(`/users/${approvingUser.id}/approve`, { role: approveRole });
      toast.success(`${approvingUser.name} одобрен как ${roleLabels[approveRole]}`);
      setApprovingUser(null);
      fetchUsers();
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка одобрения');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите деактивировать этого пользователя?')) return;
    try {
      await api.patch(`/users/${userId}/deactivate`);
      toast.success('Пользователь деактивирован');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  const handleSavePlan = async () => {
    try {
      await api.patch(`/users/${selectedUser.id}/sales-plan`, planForm);
      toast.success('План сохранён');
      setShowPlanModal(false);
      fetchUsers();
    } catch {
      toast.error('Ошибка сохранения плана');
    }
  };

  const handlePipelineToggle = async (pipelineId) => {
    const current = selectedUser.assignedPipelineIds || [];
    const updated = current.includes(pipelineId)
      ? current.filter(id => id !== pipelineId)
      : [...current, pipelineId];
    try {
      const { data } = await api.patch(`/users/${selectedUser.id}/pipelines`, { pipelineIds: updated });
      setSelectedUser(prev => ({ ...prev, assignedPipelineIds: data.assignedPipelineIds }));
      toast.success('Доступ к воронкам обновлён');
    } catch {
      toast.error('Ошибка');
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
        <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Пригласить
        </button>
      </div>

      {/* Ожидают одобрения — только для admin */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h2 className="font-semibold text-yellow-800">
              Ожидают одобрения ({pendingUsers.length})
            </h2>
          </div>
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-yellow-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  {u.position && <p className="text-xs text-gray-400">{u.position}</p>}
                </div>
                <button
                  onClick={() => { setApprovingUser(u); setApproveRole('executor'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Одобрить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Сводка */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          <p className="text-sm text-gray-500">Всего сотрудников</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {users.filter((u) => u.employeeType === 'staff').length}
          </p>
          <p className="text-sm text-gray-500">Штатные</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {users.filter((u) => u.employeeType !== 'staff').length}
          </p>
          <p className="text-sm text-gray-500">Подрядчики и фрилансеры</p>
        </div>
      </div>

      {/* Карточки сотрудников */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.isSuperAdmin && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center" title="Суперадминистратор">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                  {user.isSuperAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium shrink-0">
                      Суперадмин
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{user.position || 'Не указана'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                  <span className="text-xs text-gray-400">{typeLabels[user.employeeType] || 'Штатный'}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              {user.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  {user.email}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модалка приглашения */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Пригласить сотрудника">
        <InviteForm
          isSuperAdmin={isSuperAdmin}
          onSaved={() => { setShowInvite(false); fetchUsers(); fetchPending(); }}
          onCancel={() => setShowInvite(false)}
        />
      </Modal>

      {/* Модалка одобрения пользователя */}
      <Modal open={!!approvingUser} onClose={() => setApprovingUser(null)} title="Одобрить регистрацию" size="sm">
        {approvingUser && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{approvingUser.name}</p>
              <p className="text-xs text-gray-500">{approvingUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Назначить роль</label>
              <select
                value={approveRole}
                onChange={(e) => setApproveRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ROLES.filter(r => isSuperAdmin || r.value !== 'admin').map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {!isSuperAdmin && (
                <p className="text-xs text-gray-400 mt-1">
                  * Роль "Администратор" может назначить только суперадминистратор
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovingUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
              >
                Одобрить
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Модалка карточки сотрудника */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Карточка сотрудника">
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                {selectedUser.isSuperAdmin && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center" title="Суперадминистратор">
                    <Crown className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                  {selectedUser.isSuperAdmin && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                      Суперадмин
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{selectedUser.position || 'Не указана'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-400">Email</span>
                <p className="text-sm text-gray-700">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Тип</span>
                <p className="text-sm text-gray-700">{typeLabels[selectedUser.employeeType] || 'Штатный'}</p>
              </div>
            </div>

            {/* Управление ролью */}
            <div className="pt-4 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Роль</span>

              {/* Нельзя менять роль суперадмина */}
              {selectedUser.isSuperAdmin ? (
                <div className="mt-2">
                  <Badge variant="red">Администратор</Badge>
                  <span className="ml-2 text-xs text-yellow-600 font-medium">👑 Суперадминистратор</span>
                </div>
              ) : isAdmin && selectedUser.id !== currentUser.id ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const RoleIcon = roleIcons[r.value];
                    const isActive = selectedUser.role === r.value;
                    // Кнопку admin показываем только суперадмину
                    if (r.value === 'admin' && !isSuperAdmin) return null;

                    const activeStyle = {
                      admin: 'bg-red-100 border-red-400 text-red-700 shadow-sm',
                      director: 'bg-red-100 border-red-400 text-red-700 shadow-sm',
                      head_of_sales: 'bg-purple-100 border-purple-400 text-purple-700 shadow-sm',
                      manager: 'bg-blue-100 border-blue-400 text-blue-700 shadow-sm',
                      executor: 'bg-green-100 border-green-400 text-green-700 shadow-sm',
                    };
                    const inactiveStyle = {
                      admin: 'border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600',
                      director: 'border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600',
                      head_of_sales: 'border-gray-200 text-gray-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600',
                      manager: 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600',
                      executor: 'border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50 hover:text-green-600',
                    };

                    return (
                      <button
                        key={r.value}
                        onClick={() => handleRoleChange(selectedUser.id, r.value)}
                        disabled={isActive}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition
                          ${isActive ? activeStyle[r.value] : inactiveStyle[r.value]}
                          ${isActive ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <RoleIcon className="w-3.5 h-3.5" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2">
                  <Badge variant={roleColors[selectedUser.role]}>{roleLabels[selectedUser.role]}</Badge>
                  {selectedUser.id === currentUser.id && (
                    <span className="ml-2 text-xs text-gray-400">(вы)</span>
                  )}
                </div>
              )}
            </div>

            {/* Воронки — только менеджерам */}
            {isAdmin && selectedUser.id !== currentUser.id && selectedUser.role === 'manager' && (
              <div className="pt-4 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Доступ к воронкам</span>
                {pipelines.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-2">Нет воронок продаж</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {pipelines.map(p => {
                      const has = (selectedUser.assignedPipelineIds || []).includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={has}
                            onChange={() => handlePipelineToggle(p.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                          />
                          <span className="text-sm text-gray-700">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* План продаж */}
            {isAdmin && selectedUser.id !== currentUser.id && !selectedUser.isSuperAdmin && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">План продаж</span>
                  <button
                    onClick={() => {
                      setPlanForm({
                        salesPlanMonth: selectedUser.salesPlanMonth || 0,
                        salesPlanWeek: selectedUser.salesPlanWeek || 0,
                        salesPlanDay: selectedUser.salesPlanDay || 0,
                      });
                      setShowPlanModal(true);
                    }}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Изменить
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">День</p>
                    <p className="text-sm font-medium">
                      {selectedUser.salesPlanDay ? formatMoney(selectedUser.salesPlanDay) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">Неделя</p>
                    <p className="text-sm font-medium">
                      {selectedUser.salesPlanWeek ? formatMoney(selectedUser.salesPlanWeek) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">Месяц</p>
                    <p className="text-sm font-medium">
                      {selectedUser.salesPlanMonth ? formatMoney(selectedUser.salesPlanMonth) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Деактивация */}
            {isAdmin && selectedUser.id !== currentUser.id && !selectedUser.isSuperAdmin && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDeactivate(selectedUser.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                >
                  <UserX className="w-4 h-4" />
                  Деактивировать аккаунт
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Модалка плана продаж */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Установить план продаж" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">План на день (сум)</label>
            <input
              type="number"
              value={planForm.salesPlanDay}
              onChange={e => setPlanForm({ ...planForm, salesPlanDay: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">План на неделю (сум)</label>
            <input
              type="number"
              value={planForm.salesPlanWeek}
              onChange={e => setPlanForm({ ...planForm, salesPlanWeek: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">План на месяц (сум)</label>
            <input
              type="number"
              value={planForm.salesPlanMonth}
              onChange={e => setPlanForm({ ...planForm, salesPlanMonth: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowPlanModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Отмена
            </button>
            <button onClick={handleSavePlan} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              Сохранить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InviteForm({ onSaved, onCancel, isSuperAdmin }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'executor', position: '', employeeType: 'staff',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (form.role === 'admin' && !isSuperAdmin) {
    toast.error('Только суперадминистратор может создавать Администраторов');
    return;
  }

  setLoading(true);
  try {
    await api.post('/users/invite', form);
    toast.success('Сотрудник добавлен');
    onSaved();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Ошибка');
  } finally {
    setLoading(false);
  }
};

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Имя *</label>
        <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Email *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Пароль *</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Роль</label>
          <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
            {ROLES.filter(r => isSuperAdmin || r.value !== 'admin').map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {!isSuperAdmin && (
            <p className="text-xs text-gray-400 mt-1">* Роль "Администратор" только для суперадмина</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Тип</label>
          <select name="employeeType" value={form.employeeType} onChange={handleChange} className={inputClass}>
            {EMPLOYEE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Должность</label>
        <input name="position" value={form.position} onChange={handleChange} className={inputClass} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          Отмена
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50">
          {loading ? 'Добавление...' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}