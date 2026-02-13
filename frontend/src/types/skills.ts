export interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  description: string;
  prompt: string;
  inputLabel: string;
  inputPlaceholder: string;
  timeSaved?: string;
  features?: string[];
}
