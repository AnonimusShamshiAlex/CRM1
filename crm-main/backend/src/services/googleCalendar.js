const { google } = require('googleapis');

/**
 * Google Calendar интеграция
 * Требует GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI в .env
 * Каждый пользователь авторизуется через OAuth2 и получает свой refresh_token
 */

const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Генерация URL для авторизации пользователя
 */
const getAuthUrl = (userId) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: userId,
    prompt: 'consent',
  });
};

/**
 * Обмен кода на токены
 */
const getTokensFromCode = async (code) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Получить авторизованный клиент по refresh_token пользователя
 */
const getAuthorizedClient = (refreshToken) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client || !refreshToken) return null;

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
};

/**
 * Создать событие в Google Calendar из задачи
 */
const createCalendarEvent = async (refreshToken, task) => {
  const auth = getAuthorizedClient(refreshToken);
  if (!auth) return null;

  const calendar = google.calendar({ version: 'v3', auth });

  const deadlineDate = new Date(task.deadline);
  const startTime = new Date(deadlineDate);
  startTime.setHours(9, 0, 0);
  const endTime = new Date(deadlineDate);
  endTime.setHours(10, 0, 0);

  const event = {
    summary: `[CRM] ${task.title}`,
    description: task.description || '',
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Europe/Moscow',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Europe/Moscow',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 },
      ],
    },
  };

  const result = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return result.data;
};

/**
 * Обновить событие в Google Calendar
 */
const updateCalendarEvent = async (refreshToken, eventId, task) => {
  const auth = getAuthorizedClient(refreshToken);
  if (!auth || !eventId) return null;

  const calendar = google.calendar({ version: 'v3', auth });

  const deadlineDate = new Date(task.deadline);
  const startTime = new Date(deadlineDate);
  startTime.setHours(9, 0, 0);
  const endTime = new Date(deadlineDate);
  endTime.setHours(10, 0, 0);

  const event = {
    summary: `[CRM] ${task.title}`,
    description: task.description || '',
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Europe/Moscow',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Europe/Moscow',
    },
  };

  const result = await calendar.events.update({
    calendarId: 'primary',
    eventId,
    resource: event,
  });

  return result.data;
};

/**
 * Удалить событие из Google Calendar
 */
const deleteCalendarEvent = async (refreshToken, eventId) => {
  const auth = getAuthorizedClient(refreshToken);
  if (!auth || !eventId) return null;

  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
};

module.exports = {
  getOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getAuthorizedClient,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
