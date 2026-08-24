// Mock data for the dashboard. Dates are generated relative to today so the
// "today" and "days remaining" sections stay correct whenever the demo is run.

import { withRial } from "@/components/shared/money";

const DAY = 24 * 60 * 60 * 1000;

const iso = (date) => date.toISOString().slice(0, 10);

export const today = new Date();
today.setHours(0, 0, 0, 0);

export const dayOffset = (days) => iso(new Date(today.getTime() + days * DAY));

export const daysUntil = (dateStr) =>
  Math.round((new Date(dateStr).setHours(0, 0, 0, 0) - today.getTime()) / DAY);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const money = (amount) =>
  withRial(Math.round(amount).toLocaleString("en-GB"));

export { changePercent } from "@/lib/metrics";

export const CURRENT_USER = { name: "Mohammed Al Yahyaei", role: "admin" };

/* ---------------------------------------------------------------- summary */

export const summaryStats = {
  activeCases: { value: 248, previous: 231, to: "/litigation?status=Active" },
  totalClients: { value: 156, previous: 144, to: "/clients" },
  casesReceivedThisMonth: { value: 185, previous: 165, to: "/litigation?newWithin=30" },
  newCasesThisMonth: { value: 42, previous: 51, to: "/litigation?newWithin=30&stage=Registration" },
  pendingInvoices: { value: 23, previous: 19, to: "/finance?status=Pending" },
  outstandingAmount: { value: 128450, previous: 141200, to: "/finance?status=Pending" },
};

export const bottomSummary = {
  hearingsThisMonth: { value: 64, to: "/litigation?stage=Under Litigation" },
  judgmentsIssued: { value: 11, to: "/litigation?stage=Judgment Issued" },
  openExecutionFiles: { value: 37, to: "/litigation?stage=Execution" },
  overdueTasks: { value: 7, to: "/profile/tasks?overdue=1" },
};

/* --------------------------------------------------------------- hearings */

export const hearings = [
  { id: 1, date: dayOffset(0), time: "09:00", caseNo: "1234/2026", client: "ABC Holdings LLC", court: "Muscat Primary Court", caseType: "Commercial", lawyer: "Mohammed Al Yahyaei", status: "Scheduled" },
  { id: 2, date: dayOffset(0), time: "10:30", caseNo: "1187/2026", client: "Gulf Construction Co", court: "Muscat Primary Court", caseType: "Civil", lawyer: "Salim Al Rawahi", status: "Scheduled" },
  { id: 3, date: dayOffset(0), time: "12:00", caseNo: "0988/2026", client: "Al Madina Trading", court: "Court of Appeal", caseType: "Commercial", lawyer: "Mohammed Al Yahyaei", status: "Postponed" },
  { id: 4, date: dayOffset(0), time: "14:00", caseNo: "1301/2026", client: "Nizwa Cement Factory", court: "Labour Court", caseType: "Labour", lawyer: "Layla Al Balushi", status: "Attended" },
  { id: 5, date: dayOffset(1), time: "09:30", caseNo: "1156/2026", client: "Salalah Port Services", court: "Salalah Primary Court", caseType: "Commercial", lawyer: "Salim Al Rawahi", status: "Scheduled" },
  { id: 6, date: dayOffset(2), time: "11:00", caseNo: "1240/2026", client: "Muscat Finance LLC", court: "Muscat Primary Court", caseType: "Civil", lawyer: "Mohammed Al Yahyaei", status: "Scheduled" },
  { id: 7, date: dayOffset(4), time: "08:45", caseNo: "1099/2026", client: "XYZ Investments", court: "Court of Appeal", caseType: "Commercial", lawyer: "Layla Al Balushi", status: "Scheduled" },
  { id: 8, date: dayOffset(6), time: "10:00", caseNo: "1312/2026", client: "Fatima Rashid", court: "Family Court", caseType: "Personal Status", lawyer: "Salim Al Rawahi", status: "Scheduled" },
  { id: 9, date: dayOffset(9), time: "09:00", caseNo: "1278/2026", client: "ABC Holdings LLC", court: "Supreme Court", caseType: "Commercial", lawyer: "Mohammed Al Yahyaei", status: "Scheduled" },
  { id: 10, date: dayOffset(12), time: "13:15", caseNo: "1044/2026", client: "Ahmed Al Lawati", court: "Muscat Primary Court", caseType: "Civil", lawyer: "Layla Al Balushi", status: "Scheduled" },
];

export const todaysHearings = hearings.filter((h) => h.date === dayOffset(0));

export const upcomingHearings = hearings
  .filter((h) => h.date > dayOffset(0) && daysUntil(h.date) <= 14)
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

/* -------------------------------------------------------------- deadlines */

export const deadlines = [
  { id: 1, type: "Appeal Deadline", caseNo: "1234/2026", client: "ABC Holdings LLC", dueDate: dayOffset(3), lawyer: "Mohammed Al Yahyaei", isAppeal: true },
  { id: 2, type: "Memorandum Submission", caseNo: "1187/2026", client: "Gulf Construction Co", dueDate: dayOffset(5), lawyer: "Salim Al Rawahi", isAppeal: false },
  { id: 3, type: "Appeal Deadline", caseNo: "0988/2026", client: "Al Madina Trading", dueDate: dayOffset(8), lawyer: "Mohammed Al Yahyaei", isAppeal: true },
  { id: 4, type: "Objection Deadline", caseNo: "1301/2026", client: "Nizwa Cement Factory", dueDate: dayOffset(1), lawyer: "Layla Al Balushi", isAppeal: false },
  { id: 5, type: "Court Fee Deadline", caseNo: "1156/2026", client: "Salalah Port Services", dueDate: dayOffset(11), lawyer: "Salim Al Rawahi", isAppeal: false },
  { id: 6, type: "Response Deadline", caseNo: "1240/2026", client: "Muscat Finance LLC", dueDate: dayOffset(14), lawyer: "Mohammed Al Yahyaei", isAppeal: false },
  { id: 7, type: "Document Submission Deadline", caseNo: "1099/2026", client: "XYZ Investments", dueDate: dayOffset(6), lawyer: "Layla Al Balushi", isAppeal: false },
];

export const appealDeadlines = deadlines
  .filter((d) => d.isAppeal)
  .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

/* ------------------------------------------------------------------ tasks */

export const tasks = [
  { id: 1, task: "Prepare memorandum for hearing", caseNo: "1234/2026", assignee: "Mohammed Al Yahyaei", dueDate: dayOffset(0), priority: "High", status: "In Progress" },
  { id: 2, task: "Collect signed power of attorney", caseNo: "1187/2026", assignee: "Mohammed Al Yahyaei", dueDate: dayOffset(2), priority: "Medium", status: "Pending" },
  { id: 3, task: "Review opponent submission", caseNo: "0988/2026", assignee: "Mohammed Al Yahyaei", dueDate: dayOffset(-3), priority: "High", status: "Pending" },
  { id: 4, task: "File execution request", caseNo: "1301/2026", assignee: "Salim Al Rawahi", dueDate: dayOffset(-1), priority: "High", status: "Pending" },
  { id: 5, task: "Translate contract annexes", caseNo: "1156/2026", assignee: "Layla Al Balushi", dueDate: dayOffset(4), priority: "Low", status: "Pending" },
  { id: 6, task: "Client update call", caseNo: "1240/2026", assignee: "Mohammed Al Yahyaei", dueDate: dayOffset(1), priority: "Medium", status: "Pending" },
  { id: 7, task: "Pay court fee", caseNo: "1099/2026", assignee: "Salim Al Rawahi", dueDate: dayOffset(-6), priority: "High", status: "Pending" },
  { id: 8, task: "Upload judgment copy", caseNo: "1312/2026", assignee: "Layla Al Balushi", dueDate: dayOffset(-2), priority: "Medium", status: "In Progress" },
  { id: 9, task: "Draft settlement proposal", caseNo: "1278/2026", assignee: "Mohammed Al Yahyaei", dueDate: dayOffset(5), priority: "Medium", status: "Pending" },
  { id: 10, task: "Archive closed file", caseNo: "1044/2026", assignee: "Mohammed Al Yahyaei", dueDate: dayOffset(-4), priority: "Low", status: "Completed" },
];

// A task is overdue when its due date has passed and it is not yet complete.
export const overdueTasks = tasks
  .filter((t) => t.status !== "Completed" && daysUntil(t.dueDate) < 0)
  .map((t) => ({ ...t, daysOverdue: Math.abs(daysUntil(t.dueDate)) }))
  .sort((a, b) => b.daysOverdue - a.daysOverdue);

/* ----------------------------------------------------------------- alerts */

export const urgentActions = [
  { id: 1, action: "Submit Memorandum", caseNo: "1234/2026", client: "ABC Holdings LLC", due: dayOffset(0), priority: "High" },
  { id: 2, action: "File Appeal", caseNo: "0988/2026", client: "Al Madina Trading", due: dayOffset(8), priority: "High" },
  { id: 3, action: "Pay Court Fee", caseNo: "1099/2026", client: "XYZ Investments", due: dayOffset(-6), priority: "High" },
  { id: 4, action: "Request Travel Ban", caseNo: "1301/2026", client: "Nizwa Cement Factory", due: dayOffset(2), priority: "Medium" },
  { id: 5, action: "Follow-up Execution", caseNo: "1156/2026", client: "Salalah Port Services", due: dayOffset(3), priority: "Medium" },
  { id: 6, action: "Contact Client", caseNo: "1240/2026", client: "Muscat Finance LLC", due: dayOffset(1), priority: "Medium" },
  { id: 7, action: "Obtain Judgment", caseNo: "1312/2026", client: "Fatima Rashid", due: dayOffset(4), priority: "Information" },
];

export const casesRequiringAttention = [
  { id: 1, caseNo: "1187/2026", client: "Gulf Construction Co", reason: "No update for 15 days", severity: "High" },
  { id: 2, caseNo: "1044/2026", client: "Ahmed Al Lawati", reason: "No action after hearing", severity: "High" },
  { id: 3, caseNo: "1278/2026", client: "ABC Holdings LLC", reason: "No update for 7 days", severity: "Medium" },
  { id: 4, caseNo: "0988/2026", client: "Al Madina Trading", reason: "No action after judgment", severity: "High" },
  { id: 5, caseNo: "1240/2026", client: "Muscat Finance LLC", reason: "Required document missing", severity: "Medium" },
  { id: 6, caseNo: "1156/2026", client: "Salalah Port Services", reason: "Required task not completed", severity: "Medium" },
];

export const missingDocuments = [
  { id: 1, caseNo: "1234/2026", client: "ABC Holdings LLC", document: "Power of Attorney", responsible: "Mohammed Al Yahyaei" },
  { id: 2, caseNo: "1187/2026", client: "Gulf Construction Co", document: "Commercial Registration", responsible: "Salim Al Rawahi" },
  { id: 3, caseNo: "1312/2026", client: "Fatima Rashid", document: "Civil ID", responsible: "Layla Al Balushi" },
  { id: 4, caseNo: "0988/2026", client: "Al Madina Trading", document: "Statement of Claim", responsible: "Mohammed Al Yahyaei" },
  { id: 5, caseNo: "1099/2026", client: "XYZ Investments", document: "Judgment", responsible: "Layla Al Balushi" },
];

export const courtNotifications = [
  { id: 1, date: dayOffset(0), caseNo: "1234/2026", court: "Muscat Primary Court", summary: "Hearing rescheduled to next session", requiredAction: "Notify client", assignee: "Mohammed Al Yahyaei" },
  { id: 2, date: dayOffset(0), caseNo: "0988/2026", court: "Court of Appeal", summary: "Judgment issued in favour of client", requiredAction: "Obtain certified copy", assignee: "Mohammed Al Yahyaei" },
  { id: 3, date: dayOffset(0), caseNo: "1301/2026", court: "Labour Court", summary: "Expert report submitted", requiredAction: "Review and respond", assignee: "Layla Al Balushi" },
  { id: 4, date: dayOffset(-1), caseNo: "1156/2026", court: "Salalah Primary Court", summary: "Opponent requested postponement", requiredAction: "File objection", assignee: "Salim Al Rawahi" },
  { id: 5, date: dayOffset(-2), caseNo: "1099/2026", court: "Court of Appeal", summary: "Court fee balance outstanding", requiredAction: "Pay court fee", assignee: "Salim Al Rawahi" },
];

/* ---------------------------------------------------------------- updates */

export const recentCaseUpdates = [
  { id: 1, caseNo: "0988/2026", client: "Al Madina Trading", update: "Judgment Issued", at: "10 minutes ago", by: "Mohammed Al Yahyaei" },
  { id: 2, caseNo: "1234/2026", client: "ABC Holdings LLC", update: "Memorandum Submitted", at: "1 hour ago", by: "Mohammed Al Yahyaei" },
  { id: 3, caseNo: "1301/2026", client: "Nizwa Cement Factory", update: "Court Notification Received", at: "2 hours ago", by: "System" },
  { id: 4, caseNo: "1156/2026", client: "Salalah Port Services", update: "Hearing Postponed", at: "4 hours ago", by: "Salim Al Rawahi" },
  { id: 5, caseNo: "1187/2026", client: "Gulf Construction Co", update: "Document Uploaded", at: "Yesterday", by: "Layla Al Balushi" },
  { id: 6, caseNo: "1099/2026", client: "XYZ Investments", update: "Execution Request Submitted", at: "Yesterday", by: "Salim Al Rawahi" },
  { id: 7, caseNo: "1240/2026", client: "Muscat Finance LLC", update: "Payment Received", at: "2 days ago", by: "Accounts" },
  { id: 8, caseNo: "1312/2026", client: "Fatima Rashid", update: "Case Status Changed", at: "2 days ago", by: "Layla Al Balushi" },
];

export const casesByStage = [
  { stage: "Registration", count: 34 },
  { stage: "Under Litigation", count: 86 },
  { stage: "Reserved for Judgment", count: 22 },
  { stage: "Judgment Issued", count: 19 },
  { stage: "Appeal", count: 27 },
  { stage: "Supreme Court", count: 9 },
  { stage: "Execution", count: 37 },
  { stage: "Closed", count: 143 },
];

/* -------------------------------------------------------------- execution */

export const executionIndicators = [
  { label: "New Execution Files", value: 6, tone: "info" },
  { label: "Pending Execution Actions", value: 14, tone: "warning" },
  { label: "Attachment Requests", value: 8, tone: "info" },
  { label: "Bank Attachment Requests", value: 5, tone: "info" },
  { label: "Vehicle Attachment Requests", value: 3, tone: "info" },
  { label: "Travel Ban Requests", value: 4, tone: "warning" },
  { label: "Arrest / Detention Requests", value: 2, tone: "high" },
  { label: "Files Without Recent Action", value: 9, tone: "high" },
  { label: "Files Waiting for Court Response", value: 12, tone: "warning" },
];

export const amountsCollected = 38600;

export const recentJudgments = [
  { id: 1, caseNo: "0988/2026", client: "Al Madina Trading", date: dayOffset(-1), result: "In favour of client", nextAction: "Obtain certified copy", appealDeadline: dayOffset(8), lawyer: "Mohammed Al Yahyaei" },
  { id: 2, caseNo: "1234/2026", client: "ABC Holdings LLC", date: dayOffset(-4), result: "Partially in favour", nextAction: "Consider appeal", appealDeadline: dayOffset(3), lawyer: "Mohammed Al Yahyaei" },
  { id: 3, caseNo: "1044/2026", client: "Ahmed Al Lawati", date: dayOffset(-9), result: "Claim dismissed", nextAction: "File appeal", appealDeadline: null, lawyer: "Layla Al Balushi" },
  { id: 4, caseNo: "1312/2026", client: "Fatima Rashid", date: dayOffset(-12), result: "In favour of client", nextAction: "Start execution", appealDeadline: null, lawyer: "Salim Al Rawahi" },
];

/* ---------------------------------------------------------- client follow */

export const clientFollowUp = [
  { id: 1, client: "ABC Holdings LLC", reason: "Client must provide documents", caseNo: "1234/2026", priority: "High" },
  { id: 2, client: "Gulf Construction Co", reason: "Payment Pending", caseNo: "1187/2026", priority: "High" },
  { id: 3, client: "Muscat Finance LLC", reason: "Client must sign documents", caseNo: "1240/2026", priority: "Medium" },
  { id: 4, client: "XYZ Investments", reason: "Approval required from client", caseNo: "1099/2026", priority: "Medium" },
  { id: 5, client: "Fatima Rashid", reason: "Client needs a case update", caseNo: "1312/2026", priority: "Information" },
  { id: 6, client: "Nizwa Cement Factory", reason: "Client response pending", caseNo: "1301/2026", priority: "Medium" },
];

/* -------------------------------------------------------------- financial */

export const financialSnapshot = {
  totalInvoices: 184,
  paidInvoices: 149,
  pendingInvoices: 23,
  cancelledInvoices: 12,
  collectedThisMonth: 62300,
  outstandingAmount: 128450,
  unbilledWork: 24700,
  expenses: 18900,
};

export const unbilledCases = [
  { id: 1, caseNo: "1240/2026", client: "Muscat Finance LLC", service: "New Case Registration", completed: dayOffset(-3), estimate: 850 },
  { id: 2, caseNo: "0988/2026", client: "Al Madina Trading", service: "Appeal Filing", completed: dayOffset(-5), estimate: 1500 },
  { id: 3, caseNo: "1156/2026", client: "Salalah Port Services", service: "Execution Filing", completed: dayOffset(-8), estimate: 1200 },
  { id: 4, caseNo: "1312/2026", client: "Fatima Rashid", service: "Legal Consultation", completed: dayOffset(-11), estimate: 400 },
  { id: 5, caseNo: "1099/2026", client: "XYZ Investments", service: "Completed Legal Service", completed: dayOffset(-14), estimate: 2100 },
];

/* -------------------------------------------------------------- case flow */

// Counts per client across the periods the filter offers.
export const clientCaseFlow = [
  { client: "ABC Holdings LLC", today: 1, week: 5, thisMonth: 18, lastMonth: 24, last3Months: 61, last6Months: 118, thisYear: 173, lastYear: 201, activeCases: 47, firstCaseAt: dayOffset(-820), lastCaseAt: dayOffset(-1) },
  { client: "XYZ Investments", today: 2, week: 9, thisMonth: 32, lastMonth: 21, last3Months: 74, last6Months: 132, thisYear: 188, lastYear: 149, activeCases: 65, firstCaseAt: dayOffset(-610), lastCaseAt: dayOffset(0) },
  { client: "Gulf Construction Co", today: 0, week: 2, thisMonth: 11, lastMonth: 16, last3Months: 38, last6Months: 79, thisYear: 104, lastYear: 122, activeCases: 28, firstCaseAt: dayOffset(-540), lastCaseAt: dayOffset(-4) },
  { client: "Al Madina Trading", today: 0, week: 1, thisMonth: 7, lastMonth: 10, last3Months: 24, last6Months: 51, thisYear: 68, lastYear: 74, activeCases: 19, firstCaseAt: dayOffset(-430), lastCaseAt: dayOffset(-6) },
  { client: "Muscat Finance LLC", today: 0, week: 0, thisMonth: 0, lastMonth: 9, last3Months: 14, last6Months: 40, thisYear: 52, lastYear: 88, activeCases: 12, firstCaseAt: dayOffset(-700), lastCaseAt: dayOffset(-46) },
  { client: "Salalah Port Services", today: 1, week: 3, thisMonth: 14, lastMonth: 8, last3Months: 33, last6Months: 62, thisYear: 84, lastYear: 61, activeCases: 22, firstCaseAt: dayOffset(-380), lastCaseAt: dayOffset(-2) },
  { client: "Nizwa Cement Factory", today: 0, week: 1, thisMonth: 6, lastMonth: 0, last3Months: 6, last6Months: 6, thisYear: 6, lastYear: 0, activeCases: 6, firstCaseAt: dayOffset(-21), lastCaseAt: dayOffset(-3) },
  { client: "Ahmed Al Lawati", today: 0, week: 0, thisMonth: 0, lastMonth: 3, last3Months: 5, last6Months: 12, thisYear: 17, lastYear: 26, activeCases: 4, firstCaseAt: dayOffset(-900), lastCaseAt: dayOffset(-71) },
  { client: "Fatima Rashid", today: 0, week: 0, thisMonth: 0, lastMonth: 0, last3Months: 2, last6Months: 7, thisYear: 9, lastYear: 15, activeCases: 3, firstCaseAt: dayOffset(-960), lastCaseAt: dayOffset(-104) },
];

// Which field a filter reads, and what it compares against.
export const CASE_FLOW_PERIODS = [
  { key: "today", label: "Today", field: "today", previousField: null },
  { key: "week", label: "This Week", field: "week", previousField: null },
  { key: "thisMonth", label: "This Month", field: "thisMonth", previousField: "lastMonth" },
  { key: "lastMonth", label: "Last Month", field: "lastMonth", previousField: null },
  { key: "last3Months", label: "Last 3 Months", field: "last3Months", previousField: null },
  { key: "last6Months", label: "Last 6 Months", field: "last6Months", previousField: "last3Months" },
  { key: "thisYear", label: "This Year", field: "thisYear", previousField: "lastYear" },
  { key: "lastYear", label: "Last Year", field: "lastYear", previousField: null },
  { key: "custom", label: "Custom Date Range", field: "thisMonth", previousField: "lastMonth" },
];

// Office-wide cases received, month by month, for the trend chart.
export const caseFlowTrend = [
  { month: "2025-09", received: 132 },
  { month: "2025-10", received: 148 },
  { month: "2025-11", received: 121 },
  { month: "2025-12", received: 139 },
  { month: "2026-01", received: 156 },
  { month: "2026-02", received: 144 },
  { month: "2026-03", received: 167 },
  { month: "2026-04", received: 151 },
  { month: "2026-05", received: 172 },
  { month: "2026-06", received: 159 },
  { month: "2026-07", received: 165 },
  { month: "2026-08", received: 185 },
];

// Weekly view of the same measure.
export const caseFlowTrendWeekly = [
  { month: "W-11", received: 34 },
  { month: "W-10", received: 41 },
  { month: "W-9", received: 38 },
  { month: "W-8", received: 45 },
  { month: "W-7", received: 39 },
  { month: "W-6", received: 47 },
  { month: "W-5", received: 42 },
  { month: "W-4", received: 51 },
  { month: "W-3", received: 44 },
  { month: "W-2", received: 48 },
  { month: "W-1", received: 53 },
  { month: "This week", received: 21 },
];

export const newClients = [
  { client: "Nizwa Cement Factory", firstCaseAt: dayOffset(-21), cases: 6 },
  { client: "Sohar Aluminium Co", firstCaseAt: dayOffset(-9), cases: 2 },
];

/* ------------------------------------------------------------- team */

export const teamWorkload = [
  { name: "Mohammed Al Yahyaei", role: "Partner", activeCases: 62, pendingTasks: 9, overdueTasks: 2, hearingsThisWeek: 5, upcomingDeadlines: 4 },
  { name: "Salim Al Rawahi", role: "Senior Lawyer", activeCases: 54, pendingTasks: 12, overdueTasks: 3, hearingsThisWeek: 4, upcomingDeadlines: 3 },
  { name: "Layla Al Balushi", role: "Lawyer", activeCases: 47, pendingTasks: 7, overdueTasks: 2, hearingsThisWeek: 3, upcomingDeadlines: 2 },
  { name: "Khalid Al Hinai", role: "Execution Officer", activeCases: 37, pendingTasks: 14, overdueTasks: 0, hearingsThisWeek: 0, upcomingDeadlines: 1 },
];

/* ---------------------------------------------------------- quick search */

export const QUICK_SEARCH_FIELDS = [
  "Case Number",
  "Execution Number",
  "Client Name",
  "Client Phone",
  "Civil ID",
  "Commercial Registration",
  "Opponent Name",
  "Court",
  "Lawyer Name",
];

export const searchIndex = [
  { label: "1234/2026 - ABC Holdings LLC", detail: "Case - Muscat Primary Court", to: "/litigation" },
  { label: "0988/2026 - Al Madina Trading", detail: "Case - Court of Appeal", to: "/litigation" },
  { label: "1301/2026 - Nizwa Cement Factory", detail: "Case - Labour Court", to: "/litigation" },
  { label: "EX-2026-114 - Gulf Construction Co", detail: "Execution file", to: "/litigation" },
  { label: "ABC Holdings LLC", detail: "Client - +968 2411 1111", to: "/clients/1" },
  { label: "Fatima Rashid", detail: "Client - +968 9234 5678", to: "/clients/2" },
  { label: "Al Madina Trading", detail: "Client - CR 1234567", to: "/clients/3" },
  { label: "Gulf Construction Co", detail: "Client - +968 2433 3333", to: "/clients/4" },
  { label: "Ahmed Al Lawati", detail: "Client - Civil ID 12345678", to: "/clients/5" },
  { label: "Mohammed Al Yahyaei", detail: "Lawyer - 62 active cases", to: "/employees" },
  { label: "Salim Al Rawahi", detail: "Lawyer - 54 active cases", to: "/employees" },
  { label: "Muscat Primary Court", detail: "Court - 86 cases", to: "/litigation" },
];
