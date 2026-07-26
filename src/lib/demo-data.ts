import { DEFAULT_QUESTIONS, DEMO_GROUP_ID, DEMO_USER_ID } from "@/lib/constants";
import { firstMonday, nextFirstMonday } from "@/lib/date";
import type { HomeData, Issue, ManageData, MemberStatus, Profile, PublishedIssue, SubmissionState } from "@/lib/types";

const memberNames = ["Joash", "Maya", "Dev", "Clara", "Niko"];

export const demoProfiles: Profile[] = memberNames.map((display_name, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`,
  display_name,
  avatar_path: null,
  avatar_url: null,
  email_notifications_enabled: true,
}));

export const demoGroup = {
  id: DEMO_GROUP_ID,
  name: "EATING",
  timezone: "America/Los_Angeles",
};

function questions(issueId: string) {
  return DEFAULT_QUESTIONS.map((question, index) => ({
    id: `${issueId.slice(0, -1)}${index + 1}`,
    issue_id: issueId,
    prompt: question.prompt,
    type: question.type,
    position: index + 1,
  }));
}

const currentIssueId = "20000000-0000-4000-8000-000000000001";
const nextRelease = nextFirstMonday();

export const demoCurrentIssue: Issue = {
  id: currentIssueId,
  group_id: DEMO_GROUP_ID,
  title: "The long-table issue",
  introduction: "A small place to leave the bits of life we might otherwise forget.",
  cover_emoji: "🍅",
  accent_color: "#C86B4A",
  status: "open",
  release_at: nextRelease.toISOString(),
  published_at: null,
  questions: questions(currentIssueId),
  submission: {
    id: "30000000-0000-4000-8000-000000000001",
    issue_id: currentIssueId,
    user_id: DEMO_USER_ID,
    ready_at: null,
    answers: [
      {
        id: "40000000-0000-4000-8000-000000000001",
        question_id: `${currentIssueId.slice(0, -1)}1`,
        body: "Long dinners, half-finished books, and trying to get outside before the sun disappears.",
        image_path: null,
        image_caption: "",
      },
      {
        id: "40000000-0000-4000-8000-000000000002",
        question_id: `${currentIssueId.slice(0, -1)}3`,
        body: "How quickly a month becomes a story once you stop living inside it.",
        image_path: null,
        image_caption: "",
      },
      {
        id: "40000000-0000-4000-8000-000000000003",
        question_id: `${currentIssueId.slice(0, -1)}5`,
        body: "I keep returning to old soul records while cooking. They make even chopping onions feel cinematic.",
        image_path: null,
        image_caption: "",
      },
    ],
  },
};

function publishedIssue(monthOffset: number, color: string, emoji: string, title: string): PublishedIssue {
  const now = new Date();
  const date = firstMonday(now.getUTCFullYear(), now.getUTCMonth() - monthOffset);
  const issueId = `50000000-0000-4000-8000-00000000000${monthOffset}`;
  const issueQuestions = questions(issueId);
  const answerSets = [
    [
      "I learned that a quiet Sunday can carry an entire week.",
      "The five of us squeezing around a table clearly meant for four.",
      "I want to make more things badly, just for the fun of making them.",
    ],
    [
      "Work, soup experiments, and a very stubborn basil plant.",
      "A train ride with nowhere urgent to be.",
      "How nice it is to know people over a long stretch of time.",
    ],
    [
      "A new project and relearning how to sleep before midnight.",
      "Laughing in the grocery aisle over absolutely nothing.",
      "I predict next month will contain one excellent picnic.",
    ],
    [
      "Long walks and calling my sister more often.",
      "The first peach that actually tasted like summer.",
      "Small routines are doing more for me than grand plans.",
    ],
    [
      "Cooking through the vegetables I usually ignore.",
      "A late-night kitchen debrief with everyone still in their coats.",
      "I have been listening to the same three songs and refuse to apologize.",
    ],
  ];

  return {
    id: issueId,
    group_id: DEMO_GROUP_ID,
    title,
    introduction: "Collected from five corners of the month, with crumbs still on the page.",
    cover_emoji: emoji,
    accent_color: color,
    status: "published",
    release_at: date.toISOString(),
    published_at: date.toISOString(),
    questions: issueQuestions,
    contributors: demoProfiles.map((profile, memberIndex) => ({
      profile,
      submission: {
        id: `60000000-0000-4000-8000-0000000000${monthOffset}${memberIndex}`,
        issue_id: issueId,
        user_id: profile.id,
        ready_at: date.toISOString(),
        answers: answerSets[memberIndex].map((body, answerIndex) => ({
          id: `70000000-0000-4000-8000-000000000${monthOffset}${memberIndex}${answerIndex}`,
          question_id: issueQuestions[[0, 1, memberIndex === 2 ? 3 : 2][answerIndex]].id,
          body,
          image_path: null,
          image_caption: "",
        })),
      },
    })),
  };
}

export const demoPublishedIssues = [
  publishedIssue(1, "#738B6B", "🌿", "Windows open"),
  publishedIssue(2, "#C39A45", "🍋", "A little more daylight"),
];

export function demoHomeData(): HomeData {
  return {
    group: demoGroup,
    profile: demoProfiles[0],
    currentIssue: structuredClone(demoCurrentIssue),
    recentIssues: structuredClone(demoPublishedIssues),
    memberCount: demoProfiles.length,
  };
}

export function demoMemberStatuses(): MemberStatus[] {
  const total = DEFAULT_QUESTIONS.length;
  const plan: Array<{ state: SubmissionState; answered: number }> = [
    { state: "in_progress", answered: 3 },
    { state: "ready", answered: total },
    { state: "not_started", answered: 0 },
    { state: "in_progress", answered: 5 },
    { state: "ready", answered: 6 },
  ];
  return demoProfiles.map((profile, index) => {
    const { state, answered } = plan[index] ?? { state: "not_started", answered: 0 };
    return {
      profile,
      state,
      answered,
      total,
      ready_at: state === "ready" ? demoCurrentIssue.release_at : null,
    };
  });
}

export function demoManageData(): ManageData {
  return {
    group: demoGroup,
    members: demoProfiles,
    upcomingIssues: [structuredClone(demoCurrentIssue)],
    openIssue: structuredClone(demoCurrentIssue),
    memberStatuses: demoMemberStatuses(),
  };
}

export function getDemoIssue(id: string) {
  if (id === demoCurrentIssue.id) return structuredClone(demoCurrentIssue);
  return structuredClone(demoPublishedIssues.find((issue) => issue.id === id) ?? null);
}
