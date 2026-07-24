export type IssueStatus = "scheduled" | "open" | "published";
export type QuestionType = "text" | "photo" | "prediction";
export type SuggestionStatus = "pending" | "used" | "dismissed";
export type NotificationEventType = "submission_open" | "week_reminder" | "day_reminder" | "issue_release";

export type Profile = {
  id: string;
  display_name: string;
  avatar_path: string | null;
  avatar_url?: string | null;
  email_notifications_enabled: boolean;
};

export type Group = {
  id: string;
  name: string;
  timezone: string;
};

export type Question = {
  id: string;
  issue_id: string;
  prompt: string;
  type: QuestionType;
  position: number;
  callback_to_question_id?: string | null;
  callback_body?: string | null;
};

export type Answer = {
  id: string;
  question_id: string;
  body: string;
  image_path: string | null;
  image_url?: string | null;
  image_caption: string;
  updated_at?: string;
};

export type Submission = {
  id: string;
  issue_id: string;
  user_id: string;
  ready_at: string | null;
  answers: Answer[];
};

export type Issue = {
  id: string;
  group_id: string;
  title: string;
  introduction: string;
  cover_emoji: string;
  accent_color: string;
  status: IssueStatus;
  release_at: string;
  published_at: string | null;
  questions: Question[];
  submission?: Submission | null;
};

export type Contributor = {
  profile: Profile;
  submission: Submission;
};

export type PublishedIssue = Issue & {
  contributors: Contributor[];
};

export type HomeData = {
  group: Group;
  profile: Profile;
  currentIssue: Issue | null;
  recentIssues: PublishedIssue[];
  memberCount: number;
};

export type ManageData = {
  group: Group;
  members: Profile[];
  upcomingIssues: Issue[];
};
