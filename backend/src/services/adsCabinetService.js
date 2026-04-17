// services/adsCabinetService.js
// ТЗ: Интеграция с рекламными кабинетами Meta Ads, Google Ads, Yandex Direct

const axios = require('axios');
const { AdsAccount } = require('../models');

/* ═══════════════════════════════════════════
   META ADS (Facebook/Instagram)
═══════════════════════════════════════════ */

const fetchMetaAdsCosts = async (accountId, accessToken, dateFrom, dateTo) => {
  try {
    const url = `https://graph.facebook.com/v18.0/act_${accountId}/insights`;
    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        fields: 'spend,impressions,clicks,ctr,cpc,reach,actions',
        time_range: JSON.stringify({
          since: dateFrom || getDefaultDateFrom(),
          until: dateTo || getTodayDate(),
        }),
        level: 'account',
      },
      timeout: 15000,
    });

    const data = response.data?.data?.[0] || {};
    const leads = (data.actions || []).find((a) => a.action_type === 'lead')?.value || 0;

    return {
      source: 'meta_ads',
      spend: Number(data.spend || 0),
      impressions: Number(data.impressions || 0),
      clicks: Number(data.clicks || 0),
      ctr: Number(data.ctr || 0),
      cpc: Number(data.cpc || 0),
      reach: Number(data.reach || 0),
      leads: Number(leads),
      cpl: leads > 0 ? Math.round(Number(data.spend) / Number(leads)) : 0,
    };
  } catch (e) {
    console.error('[Meta Ads] Ошибка:', e.response?.data?.error?.message || e.message);
    throw new Error(`Meta Ads: ${e.response?.data?.error?.message || e.message}`);
  }
};

/* ═══════════════════════════════════════════
   GOOGLE ADS
═══════════════════════════════════════════ */

const fetchGoogleAdsCosts = async (customerId, developerToken, accessToken, dateFrom, dateTo) => {
  try {
    const from = dateFrom || getDefaultDateFrom();
    const to = dateTo || getTodayDate();

    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions
      FROM customer
      WHERE segments.date BETWEEN '${from}' AND '${to}'
    `;

    const response = await axios.post(
      `https://googleads.googleapis.com/v14/customers/${customerId}/googleAds:search`,
      { query },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const row = response.data?.results?.[0]?.metrics || {};
    const spend = (Number(row.costMicros || 0)) / 1_000_000;
    const leads = Number(row.conversions || 0);

    return {
      source: 'google_ads',
      spend: Math.round(spend),
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
      ctr: Number(row.ctr || 0),
      cpc: Number((row.averageCpc || 0)) / 1_000_000,
      leads,
      cpl: leads > 0 ? Math.round(spend / leads) : 0,
    };
  } catch (e) {
    console.error('[Google Ads] Ошибка:', e.response?.data || e.message);
    throw new Error(`Google Ads: ${e.message}`);
  }
};

/* ═══════════════════════════════════════════
   YANDEX DIRECT
═══════════════════════════════════════════ */

const fetchYandexDirectCosts = async (token, dateFrom, dateTo) => {
  try {
    const from = (dateFrom || getDefaultDateFrom()).replace(/-/g, '');
    const to = (dateTo || getTodayDate()).replace(/-/g, '');

    const body = {
      method: 'get',
      params: {
        FieldNames: ['Impressions', 'Clicks', 'Ctr', 'Cost', 'Conversions', 'CostPerConversion'],
        ReportName: `CRM_Report_${Date.now()}`,
        ReportType: 'ACCOUNT_PERFORMANCE_REPORT',
        DateRangeType: 'CUSTOM_DATE',
        DateFrom: from,
        DateTo: to,
        Format: 'TSV',
        IncludeVAT: 'YES',
        IncludeDiscount: 'NO',
      },
    };

    const response = await axios.post(
      'https://api.direct.yandex.com/json/v5/reports',
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Language': 'ru',
          'processingMode': 'auto',
        },
        timeout: 30000,
      }
    );

    // Парсим TSV ответ
    const lines = (response.data || '').split('\n').filter(Boolean);
    const headers = lines[0]?.split('\t') || [];
    const values = lines[1]?.split('\t') || [];

    const row = {};
    headers.forEach((h, i) => { row[h] = values[i]; });

    const spend = Number(row['Cost'] || 0) / 1_000_000;
    const leads = Number(row['Conversions'] || 0);

    return {
      source: 'yandex_direct',
      spend: Math.round(spend),
      impressions: Number(row['Impressions'] || 0),
      clicks: Number(row['Clicks'] || 0),
      ctr: Number(row['Ctr'] || 0),
      leads,
      cpl: leads > 0 ? Math.round(spend / leads) : 0,
    };
  } catch (e) {
    console.error('[Yandex Direct] Ошибка:', e.message);
    throw new Error(`Yandex Direct: ${e.message}`);
  }
};

/* ═══════════════════════════════════════════
   API Endpoints через контроллер
═══════════════════════════════════════════ */

/**
 * GET /api/ads/accounts
 * Список подключённых рекламных кабинетов
 */
const getAdsAccounts = async (req, res) => {
  const accounts = await AdsAccount.findAll({
    where: { createdBy: req.user.id },
    attributes: { exclude: ['accessToken', 'developerToken'] }, // не отдаём токены
  });
  res.json(accounts);
};

/**
 * POST /api/ads/accounts
 * Подключить рекламный кабинет
 */
const connectAdsAccount = async (req, res) => {
  const { platform, accountId, accessToken, developerToken, name } = req.body;

  const PLATFORMS = ['meta_ads', 'google_ads', 'yandex_direct'];
  if (!PLATFORMS.includes(platform)) {
    return res.status(400).json({ message: `Платформа должна быть одной из: ${PLATFORMS.join(', ')}` });
  }

  if (!accountId || !accessToken) {
    return res.status(400).json({ message: 'accountId и accessToken обязательны' });
  }

  const account = await AdsAccount.create({
    platform, accountId, accessToken,
    developerToken: developerToken || null,
    name: name || platform,
    createdBy: req.user.id,
    active: true,
  });

  res.status(201).json({
    id: account.id,
    platform: account.platform,
    name: account.name,
    accountId: account.accountId,
    active: account.active,
  });
};

/**
 * GET /api/ads/stats?platform=meta_ads&dateFrom=2024-01-01&dateTo=2024-01-31
 * Получить статистику из рекламного кабинета
 */
const getAdsStats = async (req, res) => {
  const { platform, accountId, dateFrom, dateTo } = req.query;

  if (!platform) return res.status(400).json({ message: 'platform обязателен' });

  // Ищем подключённый аккаунт
  const account = await AdsAccount.findOne({
    where: {
      platform,
      ...(accountId ? { accountId } : {}),
      createdBy: req.user.id,
      active: true,
    },
  });

  if (!account) {
    return res.status(404).json({ message: `Кабинет ${platform} не подключён. Добавьте в настройках.` });
  }

  try {
    let stats;
    switch (platform) {
      case 'meta_ads':
        stats = await fetchMetaAdsCosts(account.accountId, account.accessToken, dateFrom, dateTo);
        break;
      case 'google_ads':
        stats = await fetchGoogleAdsCosts(account.accountId, account.developerToken, account.accessToken, dateFrom, dateTo);
        break;
      case 'yandex_direct':
        stats = await fetchYandexDirectCosts(account.accessToken, dateFrom, dateTo);
        break;
      default:
        return res.status(400).json({ message: 'Неизвестная платформа' });
    }

    res.json(stats);
  } catch (e) {
    res.status(502).json({ message: e.message });
  }
};

/**
 * GET /api/ads/stats/all
 * Статистика со всех подключённых кабинетов сразу
 */
const getAllAdsStats = async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  const accounts = await AdsAccount.findAll({
    where: { createdBy: req.user.id, active: true },
  });

  if (!accounts.length) {
    return res.json({ accounts: [], total: { spend: 0, clicks: 0, leads: 0, cpl: 0 } });
  }

  const results = await Promise.allSettled(
    accounts.map(async (acc) => {
      try {
        let stats;
        switch (acc.platform) {
          case 'meta_ads':
            stats = await fetchMetaAdsCosts(acc.accountId, acc.accessToken, dateFrom, dateTo);
            break;
          case 'google_ads':
            stats = await fetchGoogleAdsCosts(acc.accountId, acc.developerToken, acc.accessToken, dateFrom, dateTo);
            break;
          case 'yandex_direct':
            stats = await fetchYandexDirectCosts(acc.accessToken, dateFrom, dateTo);
            break;
        }
        return { ...stats, name: acc.name, accountId: acc.accountId };
      } catch (e) {
        return { source: acc.platform, name: acc.name, error: e.message, spend: 0, leads: 0, clicks: 0 };
      }
    })
  );

  const accounts_data = results.map((r) => r.value || r.reason);

  // Суммарные данные
  const total = accounts_data.reduce((acc, s) => ({
    spend: acc.spend + (s.spend || 0),
    clicks: acc.clicks + (s.clicks || 0),
    leads: acc.leads + (s.leads || 0),
  }), { spend: 0, clicks: 0, leads: 0 });

  total.cpl = total.leads > 0 ? Math.round(total.spend / total.leads) : 0;

  res.json({ accounts: accounts_data, total });
};

/**
 * DELETE /api/ads/accounts/:id
 */
const disconnectAdsAccount = async (req, res) => {
  const account = await AdsAccount.findByPk(req.params.id);
  if (!account) return res.status(404).json({ message: 'Кабинет не найден' });
  await account.destroy();
  res.json({ message: 'Кабинет отключён' });
};

// Helpers
const getDefaultDateFrom = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};
const getTodayDate = () => new Date().toISOString().slice(0, 10);

module.exports = {
  getAdsAccounts,
  connectAdsAccount,
  getAdsStats,
  getAllAdsStats,
  disconnectAdsAccount,
};
