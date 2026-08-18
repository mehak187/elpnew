// Client types as specified by the client (Phase 1 requirements)
export const CLIENT_TYPES = [
  "Bank",
  "Finance Company",
  "Insurance Company",
  "Telecom Company",
  "Real Estate Company",
  "Automotive Company",
  "Commercial Company",
  "Other Entities",
  "Individual",
];

// Banks a client can nominate to receive payments.
export const RECEIVING_BANKS = [
  "Bank Muscat",
  "National Bank of Oman",
  "Bank Dhofar",
  "Oman Arab Bank",
  "Sohar International",
  "Ahli Bank",
  "Bank Nizwa",
  "Alizz Islamic Bank",
];

// Standard payment delay periods, in days. "Custom" reveals a free-text field
// so an unusual term can be entered directly.
export const PAYMENT_DELAY_OPTIONS = ["15", "30", "45", "60", "90"];

export const DOCUMENT_TYPES = [
  "Power of Attorney",
  "Commercial Registration",
  "ID Card",
  "Instructions",
  "General Contract",
  "Special Contract",
];

// Document types that carry an expiry date of their own.
export const DOCUMENT_EXPIRY_LABELS = {
  "Power of Attorney": "Power of Attorney Expiry Date",
  "Commercial Registration": "Commercial Registration Expiry Date",
};

export const DOCUMENT_STATUSES = ["Valid", "Expiring Soon", "Expired", "Not Required"];

export const INVOICE_STATUSES = [
  "Paid",
  "Partially Paid",
  "Unpaid",
  "Overdue",
  "Cancelled",
];

export const INVOICE_STATUS_VARIANT = {
  Paid: "success",
  "Partially Paid": "warning",
  Unpaid: "secondary",
  Overdue: "destructive",
  Cancelled: "outline",
};
