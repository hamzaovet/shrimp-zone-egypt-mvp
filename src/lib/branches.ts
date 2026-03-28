export const EGYPT_BRANCHES = [
  { key: "شيراتون (سكاي لاين)", label: "شيراتون (فرع جديد/مميز): مول سكاي لاين - شارع المشير أحمد إسماعيل." },
  { key: "شيراتون 1", label: "فرع شيراتون 1: 108 صقر قريش - مساكن شيراتون امام مسجد الفاروق." },
  { key: "شيراتون 2", label: "فرع شيراتون 2: عماره 72 - عمارات صقر قريش امام شارع البحر." },
  { key: "مدينة نصر", label: "فرع مدينة نصر: 19 ش عباس العقاد امام الحديقة الدولية." },
  { key: "الساحل", label: "فرع الساحل: Marina 5 - امام فندق روتانا - لسان الوزراء." },
];

export const BRANCHES: Record<string, { name: string; phone: string }[]> = {
  egypt: EGYPT_BRANCHES.map(b => ({ name: b.label, phone: "15911" })),
};

export const BRANCH_STORAGE_KEY = "shrimpZoneBranch";

export function getStoredBranch(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(BRANCH_STORAGE_KEY) || "شيراتون (سكاي لاين)";
  return stored === "شيراتون 1" ? "شيراتون (سكاي لاين)" : stored;
}

export function setStoredBranch(branch: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BRANCH_STORAGE_KEY, branch);
}
