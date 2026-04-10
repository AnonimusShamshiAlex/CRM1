export const ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  HEAD_OF_SALES: 'head_of_sales',
  MANAGER: 'manager',
  MARKETER: 'marketer',
  DEVELOPER: 'developer',
  CLIENT: 'client',
};

export const canViewFinance = (role) =>
  [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.HEAD_OF_SALES].includes(role);

export const canViewMarketingDashboard = (role) =>
  [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.MARKETER].includes(role);