const DRAFT_KEY = "tripmint_drafts";

export const getDrafts = () => {
  const data = localStorage.getItem(DRAFT_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveDraft = (draft: any) => {
  const drafts = getDrafts();
  drafts.push(draft);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
};

export const deleteDraft = (id: string) => {
  const drafts = getDrafts().filter((d: any) => d.id !== id);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
};