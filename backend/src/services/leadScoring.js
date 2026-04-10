export function scoreLead(lead) {
  let score = 0;
  if (lead.phone) score += 20;
  if (lead.email) score += 20;
  if (lead.budget > 1000) score += 30;
  if (lead.source === 'meta_ads') score += 15;
  if (lead.briefCompleted) score += 15;
  return score;
}