export const INSTRUMENT_CATEGORIES = {
  "Weighing Scale": { reverificationMonths: 24 },
  "Capacity Measure": { reverificationMonths: 24 },
  "Length Measure / Tape": { reverificationMonths: 24 },
  "Beam Scale": { reverificationMonths: 24 },
  "Counter Machine": { reverificationMonths: 24 },
  "Tank Lorry / Other": { reverificationMonths: 12 },
};

export const PENALTY_TEXT =
  "Use of an unverified instrument attracts a fine of ₹2,000–₹10,000 under Section 33 of the Legal Metrology Act, 2009.";

export function calculateExpiryDate(issueDate, instrumentType) {
  const months = INSTRUMENT_CATEGORIES[instrumentType]?.reverificationMonths || 12;
  const expiry = new Date(issueDate);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}
