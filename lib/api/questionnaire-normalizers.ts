import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

export type Questionnaire = {
  id: string;
  rawId: string | null;
  title: string;
  customer: string | null;
  type: string | null;
  status: string | null;
  progress: number | null;
  owner: string | null;
  url: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  dueDate: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "data.items", "questionnaires", "records"];

/** Normalize a 0–100 progress value from a 0–1 ratio or a 0–100 number. */
function progressFrom(entry: unknown): number | null {
  const raw = getNumberFromPaths(entry, ["progress", "completion", "completion_percentage", "percent_complete", "progress_pct"]);
  if (raw == null) return null;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(Math.min(100, raw));
}

export function normalizeQuestionnaires(value: unknown): Questionnaire[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "questionnaire_id"]);
    return {
      id: rawId || `questionnaire-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "questionnaire", "subject"]) || "Untitled questionnaire",
      customer: getStringFromPaths(entry, ["customer", "company", "client", "requester_company", "vendor"]),
      type: getStringFromPaths(entry, ["type", "category", "questionnaire_type", "kind"]),
      status: getStringFromPaths(entry, ["status", "state", "stage"]),
      progress: progressFrom(entry),
      owner: getStringFromPaths(entry, ["owner", "requested_by", "assignee", "created_by"]),
      url: getStringFromPaths(entry, ["download_url", "export_url", "url", "file_url", "link"]),
      createdAt: getDateFromPaths(entry, ["created_at", "createdAt", "received_at"]),
      updatedAt: getDateFromPaths(entry, ["updated_at", "updatedAt", "submitted_at", "completed_at"]),
      dueDate: getDateFromPaths(entry, ["due_date", "dueDate", "deadline", "respond_by"])
    };
  });
}

const COMPLETE = ["complete", "completed", "done", "submitted", "answered", "approved", "finished"];
const PROGRESS = ["progress", "in_progress", "in progress", "answering", "draft", "working"];
const REVIEW = ["review", "pending", "awaiting", "submitted_for_review"];

export function isComplete(q: Questionnaire): boolean {
  const s = (q.status || "").toLowerCase();
  if (COMPLETE.some((x) => s.includes(x))) return true;
  return q.progress != null && q.progress >= 100;
}
export function isInProgress(q: Questionnaire): boolean {
  if (isComplete(q)) return false;
  const s = (q.status || "").toLowerCase();
  if (PROGRESS.some((x) => s.includes(x))) return true;
  return q.progress != null && q.progress > 0 && q.progress < 100;
}
export function isPendingReview(q: Questionnaire): boolean {
  const s = (q.status || "").toLowerCase();
  return REVIEW.some((x) => s.includes(x));
}

export function averageCompletion(items: Questionnaire[]): number | null {
  const withProgress = items.filter((q) => q.progress != null);
  if (withProgress.length === 0) return null;
  return Math.round(withProgress.reduce((s, q) => s + (q.progress as number), 0) / withProgress.length);
}

export type QuestionnaireTemplate = {
  id: string;
  name: string;
  type: string | null;
  framework: string | null;
  description: string | null;
  questionCount: number | null;
};

export function normalizeQuestionnaireTemplates(value: unknown): QuestionnaireTemplate[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "templates", "questionnaire_templates"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "template_id", "key"]) || `qtemplate-${index}`,
    name: getStringFromPaths(entry, ["name", "title", "template_name"]) || "Untitled template",
    type: getStringFromPaths(entry, ["type", "category"]),
    framework: getStringFromPaths(entry, ["framework", "standard", "regulation"]),
    description: getStringFromPaths(entry, ["description", "summary", "details"]),
    questionCount: getNumberFromPaths(entry, ["question_count", "questions", "total_questions", "num_questions"])
  }));
}

export type QuestionnaireActivity = { id: string; title: string; action: string; status: string | null; timestamp: string };

export function questionnaireActivity(items: Questionnaire[]): QuestionnaireActivity[] {
  const events: QuestionnaireActivity[] = [];
  for (const q of items) {
    const ts = q.updatedAt || q.createdAt;
    if (!ts) continue;
    const action = isComplete(q) ? "Completed" : q.updatedAt && q.createdAt && q.updatedAt !== q.createdAt ? "Updated" : "Received";
    events.push({ id: q.id, title: q.title, action, status: q.status, timestamp: ts });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
