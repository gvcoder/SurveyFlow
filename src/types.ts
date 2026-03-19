export interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple-choice';
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdBy: string;
  createdAt: any;
  published: boolean;
}

export interface SurveyResponse {
  id?: string;
  surveyId: string;
  answers: Record<string, string>;
  submittedAt: any;
}
