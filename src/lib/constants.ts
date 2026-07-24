import type { QuestionType } from "@/lib/types";

export const ACCENT_COLORS = ["#C86B4A", "#738B6B", "#C39A45", "#7D7A9E", "#56828D"];

export const DEFAULT_QUESTIONS: Array<{ prompt: string; type: QuestionType }> = [
  { prompt: "What has been taking up most of your time lately?", type: "text" },
  { prompt: "What is one moment from this month you want to remember?", type: "text" },
  { prompt: "What has been on your mind?", type: "text" },
  { prompt: "What are you looking forward to next month?", type: "prediction" },
  { prompt: "What have you watched, read, played, or listened to recently?", type: "text" },
  { prompt: "Share a photo from your month and tell us about it.", type: "photo" },
  { prompt: "If this month had a title, what would it be?", type: "text" },
];

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_GROUP_ID = "10000000-0000-4000-8000-000000000001";
