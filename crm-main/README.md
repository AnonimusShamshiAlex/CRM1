# CRM Studio — Полная документация

## Обзор проекта

CRM Studio — внутренняя система управления взаимоотношениями с клиентами (CRM) для управления продажами, клиентами, проектами и задачами. Разработана для узбекского рынка с поддержкой валюты UZS (сум).

---

## Стек технологий

### Frontend

| Технология        | Версия | Назначение                   |
| ----------------- | ------ | ---------------------------- |
| React             | 19     | UI фреймворк                 |
| Vite              | 7      | Сборщик и dev-сервер         |
| Zustand           | 5      | Глобальное состояние         |
| React Router      | 7      | Клиентская маршрутизация     |
| Tailwind CSS      | 4      | Утилитарная стилизация       |
| Axios             | latest | HTTP клиент с интерцепторами |
| Socket.io Client  | 4      | WebSocket для уведомлений    |
| React Hook Form   | 7      | Управление формами           |
| @hello-pangea/dnd | 18     | Drag & Drop для канбан       |
| date-fns          | 4      | Работа с датами              |
| lucide-react      | latest | Иконки                       |
| react-hot-toast   | 2      | Toast уведомления            |
| clsx              | 2      | Условные CSS классы          |
| recharts          | 3      | Графики и диаграммы          |

### Backend

| Технология            | Версия | Назначение              |
| --------------------- | ------ | ----------------------- |
| Express               | 5      | Node.js веб-фреймворк   |
| PostgreSQL            | 16     | Реляционная база данных |
| Sequelize             | 6      | ORM                     |
| JWT                   | 9      | Аутентификация          |
| Socket.io             | 4      | WebSocket сервер        |
| PDFKit                | 0.17   | Генерация PDF           |
| ExcelJS               | 4      | Генерация Excel         |
| Multer                | 2      | Загрузка файлов         |
| Nodemailer            | 8      | Email уведомления       |
| node-telegram-bot-api | 0.67   | Telegram бот            |
| bcryptjs              | 3      | Хеширование паролей     |
| express-validator     | 7      | Валидация данных        |
| helmet                | 8      | HTTP безопасность       |
| morgan                | 1      | Логирование запросов    |
| googleapis            | 171    | Google Calendar         |

---

## Структура проекта

```
crm-studio/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js              # Подключение PostgreSQL
│   │   │                                # Поддержка DATABASE_URL и отдельных параметров
│   │   │                                # SSL для production, пул соединений
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js        # Регистрация с pending-одобрением
│   │   │   │                            # Первый пользователь = суперадмин
│   │   │   │                            # Уведомления admins при регистрации
│   │   │   ├── clientController.js      # CRUD клиентов
│   │   │   │                            # Проверка дублей по email/телефону
│   │   │   │                            # Взаимодействия с клиентом
│   │   │   ├── projectController.js     # CRUD проектов с участниками
│   │   │   ├── taskController.js        # CRUD задач
│   │   │   │                            # Таймер трекинга времени
│   │   │   │                            # Уведомления при назначении
│   │   │   ├── financeController.js     # Счета с позициями и НДС
│   │   │   │                            # Расходы по категориям
│   │   │   │                            # Финансовые отчёты
│   │   │   ├── dashboardController.js   # Агрегированная статистика
│   │   │   ├── pipelineController.js    # CRUD воронок и этапов
│   │   │   │                            # Reorder этапов (DnD)
│   │   │   │                            # Сортировка через корневой order
│   │   │   ├── clientFieldController.js # Кастомные поля клиентов
│   │   │   ├── telephonyController.js   # IP-телефония и webhook
│   │   │   │                            # Аналитика менеджеров
│   │   │   ├── fileController.js        # Загрузка и удаление файлов
│   │   │   └── exportController.js      # PDF с шрифтом Roboto (кириллица)
│   │   │                                # Excel экспорт
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                  # JWT верификация
│   │   │   │                            # Проверка isActive пользователя
│   │   │   ├── upload.js                # Multer diskStorage
│   │   │   │                            # Фильтр типов файлов
│   │   │   │                            # Лимит 50 МБ
│   │   │   └── logger.js                # ActivityLog действий
│   │   │
│   │   ├── models/
│   │   │   ├── index.js                 # Все связи между моделями
│   │   │   │                            # ProjectMember связующая таблица
│   │   │   ├── User.js                  # + поле isSuperAdmin
│   │   │   │                            # Роли, планы продаж, SIP, Telegram
│   │   │   ├── Client.js                # Лиды и клиенты
│   │   │   │                            # Воронка, кастомные поля, теги
│   │   │   ├── Project.js               # Проекты со стадиями и бюджетом
│   │   │   ├── Task.js                  # Задачи с таймером и чек-листом
│   │   │   ├── Invoice.js               # Счета с позициями и НДС
│   │   │   ├── Expense.js               # Расходы, периодические
│   │   │   ├── Pipeline.js              # Воронки продаж
│   │   │   ├── PipelineStage.js         # Этапы с цветом и порядком
│   │   │   ├── Interaction.js           # История взаимодействий
│   │   │   │                            # Звонки с записью (allowNull: true для authorId)
│   │   │   ├── ClientFieldDefinition.js # Кастомные поля
│   │   │   ├── TimeLog.js               # Логи трекинга времени
│   │   │   ├── Notification.js          # In-app уведомления
│   │   │   └── ActivityLog.js           # Аудит лог
│   │   │
│   │   ├── routes/
│   │   │   └── index.js                 # Все API маршруты
│   │   │                                # asyncHandler для всех handlers
│   │   │                                # /users/pending — ожидающие одобрения
│   │   │                                # /users/:id/approve — одобрить
│   │   │                                # /users/invite — пригласить (сразу активен)
│   │   │                                # reorder ПЕРЕД :stageId (важен порядок!)
│   │   │
│   │   ├── services/
│   │   │   ├── googleCalendar.js        # OAuth2, создание событий
│   │   │   ├── telegramBot.js           # /link, /unlink, уведомления
│   │   │   ├── emailService.js          # SMTP шаблоны
│   │   │   └── deadlineChecker.js       # Cron каждый час
│   │   │                                # JSONB query через literal()
│   │   │
│   │   └── index.js                     # Точка входа
│   │                                    # sync({ alter: true }) только в dev
│   │                                    # Socket.io + connectedUsers Map
│   │
│   ├── fonts/
│   │   ├── Roboto-Regular.ttf           # ОБЯЗАТЕЛЕН для PDF кириллицы
│   │   └── Roboto-Bold.ttf              # ОБЯЗАТЕЛЕН для PDF кириллицы
│   │
│   ├── uploads/                         # Создаётся автоматически
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                 # baseURL, auth интерцептор
│   │   │                                # 401 → редирект на /login
│   │   │                                # getExportUrl() для PDF/Excel
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx        # Sidebar + Header + Outlet
│   │   │   │   ├── Sidebar.jsx          # Навигация с ролевым доступом
│   │   │   │   │                        # Сворачивание (persist в localStorage)
│   │   │   │   └── Header.jsx           # Уведомления (колокольчик)
│   │   │   │                            # Профиль пользователя
│   │   │   │                            # Все 5 ролей в roleLabels
│   │   │   └── ui/
│   │   │       ├── Badge.jsx            # Цветные бейджи статусов
│   │   │       ├── Modal.jsx            # Модалки с блокировкой скролла
│   │   │       └── FileUpload.jsx       # Загрузка с превью и удалением
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx            # + сообщение для pending аккаунтов
│   │   │   ├── RegisterPage.jsx         # + экран ожидания одобрения
│   │   │   │                            # + экран суперадмина (первый юзер)
│   │   │   ├── DashboardPage.jsx        # Виджеты статистики
│   │   │   │
│   │   │   ├── clients/
│   │   │   │   ├── ClientsPage.jsx      # Канбан + список
│   │   │   │   │                        # Droppable для "Без воронки"
│   │   │   │   │                        # handleDragEnd с поиском pipelineId
│   │   │   │   ├── ClientDetailPage.jsx # + загрузка pipelines для формы
│   │   │   │   └── ClientForm.jsx       # onChange через register options
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── ProjectsPage.jsx
│   │   │   │   ├── ProjectDetailPage.jsx
│   │   │   │   └── ProjectForm.jsx
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   ├── TasksPage.jsx        # Канбан + список + календарь
│   │   │   │   ├── TaskDetailPage.jsx   # Таймер, чек-лист, логи времени
│   │   │   │   └── TaskForm.jsx
│   │   │   │
│   │   │   ├── finance/
│   │   │   │   ├── FinancePage.jsx      # Суммы в сумах
│   │   │   │   ├── InvoiceForm.jsx      # Позиции с НДС
│   │   │   │   └── ExpenseForm.jsx
│   │   │   │
│   │   │   ├── team/
│   │   │   │   └── TeamPage.jsx         # Pending пользователи
│   │   │   │                            # Одобрение с выбором роли
│   │   │   │                            # Корона 👑 для суперадмина
│   │   │   │                            # Защита: только суперадмин даёт admin
│   │   │   │                            # /users/invite для приглашения
│   │   │   │
│   │   │   ├── pipelines/
│   │   │   │   ├── PipelinesPage.jsx
│   │   │   │   └── PipelineEditorPage.jsx  # DnD reorder этапов
│   │   │   │
│   │   │   ├── manager/
│   │   │   │   ├── ManagerDashboardPage.jsx  # План-факт в сумах
│   │   │   │   └── ManagersRatingPage.jsx    # Рейтинг в сумах
│   │   │   │
│   │   │   └── settings/
│   │   │       └── ClientFieldsPage.jsx
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.js             # + обработка pending регистрации
│   │   │   ├── uiStore.js               # sidebar persist
│   │   │   └── notificationStore.js     # Счётчик непрочитанных
│   │   │
│   │   └── utils/
│   │       └── constants.js             # formatMoney → узбекские сумы (UZS)
│   │                                    # Все статусы, роли, хелперы
│   │
│   ├── vite.config.js                   # proxy /api → :5000
│   └── package.json
│
├── docker-compose.yml
└── render.yaml
```

---

## Модели базы данных

### User

| Поле                | Тип           | Описание                                              |
| ------------------- | ------------- | ----------------------------------------------------- |
| id                  | UUID          | Первичный ключ                                        |
| name                | STRING(100)   | Имя                                                   |
| email               | STRING(150)   | Email (уникальный)                                    |
| password            | STRING        | Хеш пароля (bcrypt, 12 раундов)                       |
| role                | ENUM          | admin / director / head_of_sales / manager / executor |
| isSuperAdmin        | BOOLEAN       | Только первый зарегистрированный пользователь         |
| isActive            | BOOLEAN       | false = ожидает одобрения или деактивирован           |
| position            | STRING(100)   | Должность                                             |
| phone               | STRING(20)    | Телефон                                               |
| employeeType        | ENUM          | staff / contractor / freelancer                       |
| rateType            | ENUM          | hourly / fixed                                        |
| rate                | DECIMAL(10,2) | Ставка                                                |
| avatar              | STRING        | URL аватара                                           |
| telegramChatId      | STRING        | ID чата Telegram для уведомлений                      |
| googleRefreshToken  | TEXT          | Токен Google Calendar                                 |
| assignedPipelineIds | ARRAY(UUID)   | Воронки доступные менеджеру                           |
| salesPlanMonth      | DECIMAL(12,2) | План продаж на месяц (сум)                            |
| salesPlanWeek       | DECIMAL(12,2) | План продаж на неделю (сум)                           |
| salesPlanDay        | DECIMAL(12,2) | План продаж на день (сум)                             |
| sipLogin            | STRING(100)   | Логин IP-телефонии                                    |
| sipPassword         | STRING(100)   | Пароль IP-телефонии                                   |

### Client

| Поле            | Тип           | Описание                        |
| --------------- | ------------- | ------------------------------- |
| id              | UUID          | Первичный ключ                  |
| name            | STRING(200)   | Имя контакта                    |
| companyName     | STRING(200)   | Название компании               |
| email           | STRING(150)   | Email                           |
| phone           | STRING(20)    | Телефон                         |
| telegram        | STRING(100)   | Telegram                        |
| whatsapp        | STRING(20)    | WhatsApp                        |
| inn             | STRING(12)    | ИНН                             |
| legalName       | STRING(200)   | Юридическое название            |
| legalAddress    | TEXT          | Юридический адрес               |
| type            | ENUM          | lead / client                   |
| stage           | STRING(50)    | Устаревший этап (совместимость) |
| pipelineId      | UUID          | FK → Pipeline                   |
| pipelineStageId | UUID          | FK → PipelineStage              |
| stageOrder      | INTEGER       | Порядок в колонке канбана       |
| managerId       | UUID          | FK → User                       |
| source          | STRING(100)   | Источник лида                   |
| utmSource       | STRING(100)   | UTM метка                       |
| leadTags        | ARRAY(STRING) | Теги (#inst, #fb, #olx...)      |
| tags            | ARRAY(STRING) | Обычные теги                    |
| category        | STRING(50)    | Категория клиента               |
| notes           | TEXT          | Заметки                         |
| customFields    | JSONB         | Кастомные поля                  |
| dealAmount      | DECIMAL(12,2) | Сумма сделки (сум)              |
| files           | JSONB         | Прикреплённые файлы             |

### Project

| Поле          | Тип           | Описание                                                     |
| ------------- | ------------- | ------------------------------------------------------------ |
| id            | UUID          | Первичный ключ                                               |
| name          | STRING(200)   | Название                                                     |
| description   | TEXT          | Описание                                                     |
| clientId      | UUID          | FK → Client                                                  |
| managerId     | UUID          | FK → User                                                    |
| status        | ENUM          | new / in_progress / on_pause / review / completed / archived |
| startDate     | DATEONLY      | Дата начала                                                  |
| deadline      | DATEONLY      | Дедлайн                                                      |
| budgetPlan    | DECIMAL(12,2) | Бюджет план (сум)                                            |
| budgetFact    | DECIMAL(12,2) | Бюджет факт (сум)                                            |
| repoUrl       | STRING        | Репозиторий                                                  |
| stagingUrl    | STRING        | Тестовый сервер                                              |
| productionUrl | STRING        | Боевой сервер                                                |
| figmaUrl      | STRING        | Figma                                                        |
| stages        | JSONB         | Чек-лист этапов проекта                                      |
| files         | JSONB         | Файлы                                                        |

### Task

| Поле           | Тип          | Описание                                                 |
| -------------- | ------------ | -------------------------------------------------------- |
| id             | UUID         | Первичный ключ                                           |
| title          | STRING(300)  | Название                                                 |
| description    | TEXT         | Описание                                                 |
| projectId      | UUID         | FK → Project                                             |
| parentId       | UUID         | FK → Task (подзадача)                                    |
| assigneeId     | UUID         | FK → User (исполнитель)                                  |
| createdById    | UUID         | FK → User (создатель)                                    |
| status         | ENUM         | open / in_progress / on_pause / review / done / rejected |
| priority       | ENUM         | low / medium / high / critical                           |
| deadline       | DATEONLY     | Дедлайн                                                  |
| estimatedHours | DECIMAL(6,2) | Оценка в часах                                           |
| trackedSeconds | INTEGER      | Отслеженное время (секунды)                              |
| timerStartedAt | DATE         | Момент запуска таймера                                   |
| checklist      | JSONB        | Чек-лист [{text, done}]                                  |
| order          | INTEGER      | Порядок в канбане                                        |
| files          | JSONB        | Файлы                                                    |
| googleEventId  | STRING       | ID события Google Calendar                               |

### Invoice

| Поле       | Тип           | Описание                                |
| ---------- | ------------- | --------------------------------------- |
| id         | UUID          | Первичный ключ                          |
| number     | STRING(50)    | Номер (INV-2024-0001)                   |
| clientId   | UUID          | FK → Client                             |
| projectId  | UUID          | FK → Project                            |
| status     | ENUM          | draft / sent / partial / paid / overdue |
| items      | JSONB         | Позиции [{name, qty, price, total}]     |
| subtotal   | DECIMAL(12,2) | Подитог (сум)                           |
| vatPercent | DECIMAL(5,2)  | НДС %                                   |
| vatAmount  | DECIMAL(12,2) | Сумма НДС (сум)                         |
| total      | DECIMAL(12,2) | Итого (сум)                             |
| paidAmount | DECIMAL(12,2) | Оплачено (сум)                          |
| dueDate    | DATEONLY      | Срок оплаты                             |
| paidAt     | DATEONLY      | Дата оплаты                             |
| notes      | TEXT          | Примечания                              |

### Expense

| Поле        | Тип           | Описание                                            |
| ----------- | ------------- | --------------------------------------------------- |
| id          | UUID          | Первичный ключ                                      |
| name        | STRING(200)   | Название                                            |
| amount      | DECIMAL(12,2) | Сумма (сум)                                         |
| category    | ENUM          | salary / contractor / hosting / advertising / other |
| projectId   | UUID          | FK → Project                                        |
| date        | DATEONLY      | Дата                                                |
| isPeriodic  | BOOLEAN       | Периодический расход                                |
| periodicity | ENUM          | monthly / yearly                                    |
| notes       | TEXT          | Примечания                                          |

### Pipeline

| Поле        | Тип         | Описание             |
| ----------- | ----------- | -------------------- |
| id          | UUID        | Первичный ключ       |
| name        | STRING(200) | Название воронки     |
| description | TEXT        | Описание             |
| isDefault   | BOOLEAN     | Воронка по умолчанию |
| createdById | UUID        | FK → User            |

### PipelineStage

| Поле       | Тип         | Описание            |
| ---------- | ----------- | ------------------- |
| id         | UUID        | Первичный ключ      |
| pipelineId | UUID        | FK → Pipeline       |
| name       | STRING(100) | Название этапа      |
| color      | STRING(20)  | HEX цвет (#6366f1)  |
| order      | INTEGER     | Порядок отображения |
| isDefault  | BOOLEAN     | Этап по умолчанию   |

### Interaction

| Поле           | Тип         | Описание                                  |
| -------------- | ----------- | ----------------------------------------- |
| id             | UUID        | Первичный ключ                            |
| clientId       | UUID        | FK → Client (allowNull: false)            |
| authorId       | UUID        | FK → User (allowNull: true — для webhook) |
| type           | ENUM        | call / meeting / email / comment          |
| content        | TEXT        | Содержание                                |
| files          | JSONB       | Файлы                                     |
| date           | DATE        | Дата и время                              |
| recordingUrl   | STRING      | URL записи звонка                         |
| callDuration   | INTEGER     | Длительность (секунды)                    |
| callStatus     | ENUM        | completed / missed / busy / no_answer     |
| externalCallId | STRING(100) | ID звонка от провайдера                   |

---

## Роли пользователей

| Роль                 | Описание                  | Ключевые права                           |
| -------------------- | ------------------------- | ---------------------------------------- |
| `admin` (суперадмин) | Первый зарегистрированный | Всё + может давать роль admin другим     |
| `admin`              | Обычный администратор     | Всё кроме назначения роли admin          |
| `director`           | Директор                  | Финансы, пользователи, рейтинг, воронки  |
| `head_of_sales`      | Руководитель продаж       | Все клиенты, рейтинг менеджеров, воронки |
| `manager`            | Менеджер                  | Свои клиенты и воронки, проекты, задачи  |
| `executor`           | Исполнитель               | Только назначенные задачи                |

### Логика суперадмина

- Первый зарегистрированный пользователь получает `isSuperAdmin: true`
- Только суперадмин может назначать роль `admin` другим
- Роль суперадмина нельзя изменить или снять
- Суперадмина нельзя деактивировать
- Суперадмин помечен короной 👑 в интерфейсе

### Логика регистрации

```
Первый пользователь:
  → isActive: true, role: admin, isSuperAdmin: true
  → Сразу входит в систему

Все остальные:
  → isActive: false (pending)
  → Все admins получают уведомление
  → Admin одобряет с выбором роли → isActive: true
  → Суперадмин приглашает через /team → сразу isActive: true
```

---

## API Endpoints

### Аутентификация

| Метод | URL                         | Auth | Описание                                              |
| ----- | --------------------------- | ---- | ----------------------------------------------------- |
| POST  | `/api/auth/register`        | —    | Регистрация. Первый = суперадмин. Остальные = pending |
| POST  | `/api/auth/login`           | —    | Вход. Возвращает 403 если pending                     |
| GET   | `/api/auth/me`              | ✓    | Данные текущего пользователя + isSuperAdmin           |
| POST  | `/api/auth/change-password` | ✓    | Смена пароля                                          |

### Пользователи

| Метод | URL                         | Доступ                         | Описание                               |
| ----- | --------------------------- | ------------------------------ | -------------------------------------- |
| GET   | `/api/users`                | Все                            | Активные пользователи + isSuperAdmin   |
| GET   | `/api/users/pending`        | admin                          | Пользователи ожидающие одобрения       |
| POST  | `/api/users/invite`         | admin, director                | Пригласить сотрудника (сразу активен)  |
| POST  | `/api/users/promote-admin`  | Все                            | Стать admin если нет ни одного         |
| PUT   | `/api/users/:id`            | Все                            | Обновить профиль                       |
| PATCH | `/api/users/:id/role`       | admin, director                | Сменить роль (admin только суперадмин) |
| PATCH | `/api/users/:id/approve`    | admin                          | Одобрить pending пользователя          |
| PATCH | `/api/users/:id/pipelines`  | admin, director, head_of_sales | Назначить воронки                      |
| PATCH | `/api/users/:id/sales-plan` | admin, director, head_of_sales | План продаж                            |
| PATCH | `/api/users/:id/deactivate` | admin                          | Деактивировать                         |

### Клиенты

| Метод  | URL                               | Доступ          | Описание                                               |
| ------ | --------------------------------- | --------------- | ------------------------------------------------------ |
| GET    | `/api/clients`                    | Все             | Список с поиском, фильтрами, пагинацией                |
| GET    | `/api/clients/:id`                | Все             | Карточка с взаимодействиями                            |
| POST   | `/api/clients`                    | admin, manager  | Создать (проверка дублей)                              |
| PUT    | `/api/clients/:id`                | admin, manager  | Обновить                                               |
| PATCH  | `/api/clients/:id/pipeline-stage` | Все             | DnD между этапами. Автоматически определяет pipelineId |
| PATCH  | `/api/clients/:id/stage`          | Все             | Устаревший endpoint                                    |
| DELETE | `/api/clients/:id`                | admin, director | Удалить                                                |
| POST   | `/api/clients/:id/interactions`   | Все             | Добавить взаимодействие                                |

### Воронки

| Метод  | URL                                 | Доступ          | Описание                                           |
| ------ | ----------------------------------- | --------------- | -------------------------------------------------- |
| GET    | `/api/pipelines`                    | Все             | Список с этапами (сортировка через корневой order) |
| GET    | `/api/pipelines/:id`                | Все             | Детали воронки                                     |
| POST   | `/api/pipelines`                    | admin, director | Создать (6 дефолтных этапов)                       |
| PUT    | `/api/pipelines/:id`                | admin, director | Обновить                                           |
| DELETE | `/api/pipelines/:id`                | admin, director | Удалить (клиенты отвязываются)                     |
| GET    | `/api/pipelines/:id/stages`         | Все             | Этапы воронки                                      |
| POST   | `/api/pipelines/:id/stages`         | admin, director | Добавить этап                                      |
| PUT    | `/api/pipelines/:id/stages/reorder` | admin, director | ⚠️ Должен быть ДО /:stageId                        |
| PUT    | `/api/pipelines/:pid/stages/:sid`   | admin, director | Обновить этап                                      |
| DELETE | `/api/pipelines/:pid/stages/:sid`   | admin, director | Удалить этап                                       |

### Проекты

| Метод  | URL                 | Доступ         | Описание                     |
| ------ | ------------------- | -------------- | ---------------------------- |
| GET    | `/api/projects`     | Все            | Список с фильтрами           |
| GET    | `/api/projects/:id` | Все            | Детали с задачами и командой |
| POST   | `/api/projects`     | admin, manager | Создать                      |
| PUT    | `/api/projects/:id` | admin, manager | Обновить                     |
| DELETE | `/api/projects/:id` | admin          | Архивировать                 |

### Задачи

| Метод  | URL                          | Доступ | Описание                      |
| ------ | ---------------------------- | ------ | ----------------------------- |
| GET    | `/api/tasks`                 | Все    | executor видит только свои    |
| GET    | `/api/tasks/:id`             | Все    | Детали с чек-листом и логами  |
| POST   | `/api/tasks`                 | Все    | Создать                       |
| PUT    | `/api/tasks/:id`             | Все    | Обновить                      |
| DELETE | `/api/tasks/:id`             | Все    | Удалить                       |
| POST   | `/api/tasks/:id/timer/start` | Все    | Запустить таймер              |
| POST   | `/api/tasks/:id/timer/stop`  | Все    | Остановить, сохранить TimeLog |
| POST   | `/api/tasks/:id/time`        | Все    | Добавить время вручную        |

### Финансы

| Метод | URL                         | Доступ         | Описание                     |
| ----- | --------------------------- | -------------- | ---------------------------- |
| GET   | `/api/invoices`             | admin, manager | Список счетов                |
| POST  | `/api/invoices`             | admin, manager | Создать (номер генерируется) |
| PUT   | `/api/invoices/:id`         | admin, manager | Обновить                     |
| POST  | `/api/invoices/:id/payment` | admin, manager | Записать оплату              |
| GET   | `/api/expenses`             | admin, manager | Список расходов              |
| POST  | `/api/expenses`             | admin, manager | Создать расход               |
| GET   | `/api/reports/finance`      | admin, manager | Отчёт за период              |

### Остальные

| Метод  | URL                               | Доступ                         | Описание                               |
| ------ | --------------------------------- | ------------------------------ | -------------------------------------- |
| GET    | `/api/notifications`              | ✓                              | Последние 30 уведомлений               |
| PATCH  | `/api/notifications/:id/read`     | ✓                              | Прочитать                              |
| PATCH  | `/api/notifications/read-all`     | ✓                              | Прочитать все                          |
| GET    | `/api/client-fields`              | ✓                              | Кастомные поля                         |
| POST   | `/api/client-fields`              | admin, director                | Создать поле                           |
| PUT    | `/api/client-fields/:id`          | admin, director                | Обновить                               |
| DELETE | `/api/client-fields/:id`          | admin, director                | Удалить                                |
| GET    | `/api/dashboard`                  | ✓                              | Статистика дашборда                    |
| GET    | `/api/analytics/manager-stats`    | ✓                              | Личная статистика                      |
| GET    | `/api/analytics/managers-rating`  | admin, director, head_of_sales | Рейтинг                                |
| POST   | `/api/calls/initiate`             | ✓                              | Исходящий звонок (clientId обязателен) |
| POST   | `/api/calls/webhook`              | —                              | Webhook провайдера (без auth)          |
| PATCH  | `/api/interactions/:id/recording` | ✓                              | Обновить запись звонка                 |
| GET    | `/api/export/clients`             | admin, manager                 | Excel клиентов                         |
| GET    | `/api/export/invoices/:id/pdf`    | admin, manager                 | PDF счёта                              |
| GET    | `/api/export/reports/pdf`         | admin, manager                 | PDF отчёта                             |
| GET    | `/api/export/reports/excel`       | admin, manager                 | Excel отчёта                           |
| POST   | `/api/files/:entity/:entityId`    | ✓                              | Загрузить файлы (до 10 шт, 50МБ)       |
| DELETE | `/api/files/:entity/:filename`    | ✓                              | Удалить файл                           |
| GET    | `/api/google/auth`                | ✓                              | URL авторизации Google                 |
| GET    | `/api/google/callback`            | —                              | OAuth2 callback                        |
| DELETE | `/api/google/disconnect`          | ✓                              | Отвязать Google Calendar               |
| POST   | `/api/tasks/:id/google-calendar`  | ✓                              | Создать событие                        |

---

## Аутентификация

```
JWT токен в заголовке:
Authorization: Bearer <token>

Для PDF/Excel (открываются напрямую):
/api/export/reports/pdf?token=<token>
/api/export/invoices/:id/pdf?token=<token>
/api/export/clients?token=<token>
```

Токен хранится в `localStorage`. При 401 — автоматический редирект на `/login`.

---

## Переменные окружения

### Backend `.env`

```env
# Сервер
PORT=5000
NODE_ENV=development

# База данных (один из вариантов)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# ИЛИ:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_studio
DB_USER=crm_user
DB_PASSWORD=crm_password

# JWT
JWT_SECRET=минимум_32_символа_случайная_строка
JWT_EXPIRES_IN=7d

# Frontend (CORS и редиректы)
FRONTEND_URL=http://localhost:3000

# Email (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app_password
SMTP_FROM=CRM Studio <your@email.com>

# Telegram бот (опционально)
TELEGRAM_BOT_TOKEN=bot_token_from_botfather

# Google Calendar (опционально)
GOOGLE_CLIENT_ID=client_id
GOOGLE_CLIENT_SECRET=client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Запуск

### Локально

```bash
# PostgreSQL через Docker
docker-compose up -d postgres

# Backend
cd backend
cp .env.example .env    # настроить переменные
npm install
npm run dev             # :5000

# Frontend
cd frontend
npm install
npm run dev             # :3000, proxy → :5000
```

### Docker (всё)

```bash
docker-compose up -d
# Backend:    http://localhost:5000
# Frontend:   http://localhost:3000
# PostgreSQL: localhost:5432
```

### Render.com

```
Backend:  https://crm-studio-backend.onrender.com
Frontend: https://crm-studio-frontend.onrender.com
```

**Важно для Render:**

- Шрифты должны быть в git: `backend/fonts/Roboto-Regular.ttf` и `Roboto-Bold.ttf`
- `NODE_ENV=production` → `sequelize.sync()` без alter
- Колонка `is_super_admin` добавляется через `alter: true` при первом деплое

---

## Известные особенности и решения

### Суперадмин

**Логика:** Первый зарегистрированный пользователь получает `isSuperAdmin: true`. Только он может назначать роль `admin`. Нельзя изменить роль суперадмина и деактивировать его.

### Регистрация с одобрением

**Логика:** Все новые пользователи создаются с `isActive: false`. Admins получают уведомление. Admin одобряет через раздел Команда. Пригласить через `/users/invite` — сразу активен.

### PDF кириллица

**Причина:** PDFKit использует Helvetica без кириллицы.
**Решение:** `Roboto-Regular.ttf` и `Roboto-Bold.ttf` в `backend/fonts/`. Логируется при старте:

```
[PDF Fonts] Regular: ✅ /path/Roboto-Regular.ttf
[PDF Fonts] Bold: ✅ /path/Roboto-Bold.ttf
```

### Reorder этапов воронки

**Причина:** Express матчил `reorder` как `:stageId`.
**Решение:** Роут `/stages/reorder` зарегистрирован **до** `/stages/:stageId`.

### Сортировка этапов в API

**Причина:** Sequelize игнорирует `order` внутри `include`.
**Решение:**

```js
order: [[{ model: PipelineStage, as: "stages" }, "order", "ASC"]];
```

### DnD клиентов из вкладки "Все"

**Причина:** Не передавался `pipelineId` → ошибка FK в БД.
**Решение:** Frontend определяет `pipelineId` по `stageId` из всех воронок. Backend подтягивает через `PipelineStage.findByPk`.

### ERR_STREAM_WRITE_AFTER_END в PDF

**Причина:** При ошибке пытался отправить JSON после начала стрима.
**Решение:** `if (!res.headersSent)` в catch блоке.

### Колонка is_super_admin не существует

**Причина:** `sequelize.sync()` в production не добавляет новые колонки.
**Решение:** Временно включить `alter: true`, задеплоить, вернуть обратно.

### Валюта

**Решение:** `formatMoney` использует `Intl.NumberFormat` с выводом в узбекских сумах:

```js
export const formatMoney = (amount) => {
  return (
    new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount || 0) + " сум"
  );
};
```

### Async handlers в Express 5

**Решение:** Все inline handlers обёрнуты в `asyncHandler`:

```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```
