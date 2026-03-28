export const EGYPT_BRANCHES = [
  { key: "محطة الرمل", label: "محطة الرمل" },
  { key: "المكس", label: "المكس" },
  { key: "سموحة", label: "سموحة" },
  { key: "ميامي", label: "ميامي" },
  { key: "المنتزه", label: "المنتزه" },
  { key: "جليم", label: "جليم" },
  { key: "التجمع الخامس", label: "التجمع الخامس" },
  { key: "الشيخ زايد", label: "الشيخ زايد" },
];

export const BRANCHES: Record<string, { name: string; phone: string }[]> = {
  egypt: EGYPT_BRANCHES.map(b => ({ name: b.label, phone: "19274" })),
};

export const BRANCH_STORAGE_KEY = "bahijBranch";

export function getStoredBranch(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BRANCH_STORAGE_KEY) || "";
}

export function setStoredBranch(branch: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BRANCH_STORAGE_KEY, branch);
}
