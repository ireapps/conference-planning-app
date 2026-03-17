// Types derived from the Sessionize /view/All API response.

export interface SessionizeRoom {
  id: number;
  name: string;
  sort: number;
}

export interface SessionizeCategoryItem {
  id: number;
  name: string;
  sort: number;
}

export interface SessionizeCategory {
  id: number;
  title: string;
  type: "session" | "speaker";
  sort: number;
  items: SessionizeCategoryItem[];
}

export interface SessionizeQuestion {
  id: number;
  question: string;
  questionType: string;
  sort: number;
}

export interface SessionizeQuestionAnswer {
  questionId: number;
  answerValue: string;
}

export interface SessionizeSpeakerLink {
  title: string;
  url: string;
  linkType: string;
}

export interface SessionizeSpeaker {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string | null;
  tagLine: string | null;
  profilePicture: string | null;
  links: SessionizeSpeakerLink[];
  sessions: number[];
  categoryItems: number[];
  questionAnswers: SessionizeQuestionAnswer[];
}

export interface SessionizeSession {
  id: number;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  speakers: string[];
  categoryItems: number[];
  questionAnswers: SessionizeQuestionAnswer[];
  roomId: number | null;
  status: string;
  isConfirmed: boolean;
  isPlenumSession: boolean;
  isServiceSession: boolean;
  liveUrl: string | null;
  recordingUrl: string | null;
}

export interface SessionizeAllData {
  sessions: SessionizeSession[];
  speakers: SessionizeSpeaker[];
  questions: SessionizeQuestion[];
  categories: SessionizeCategory[];
  rooms: SessionizeRoom[];
}
