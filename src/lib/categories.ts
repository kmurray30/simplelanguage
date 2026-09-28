/**
 * Normalized word categories, modeled on the units/topics typical of a language-learning
 * course (Duolingo-style). Fixed list rather than freeform tags so the LLM can't invent new
 * ones per word - keeps the taxonomy consistent as the list grows. Values here must stay in
 * sync with the `WordCategory` enum in prisma/schema.prisma.
 */
export const CATEGORIES = [
  { value: "BASICS", label: "Basics" },
  { value: "GREETINGS", label: "Greetings" },
  { value: "PEOPLE_FAMILY", label: "People & Family" },
  { value: "NUMBERS_COUNTING", label: "Numbers & Counting" },
  { value: "TIME_DATE", label: "Time & Date" },
  { value: "FOOD_DRINK", label: "Food & Drink" },
  { value: "RESTAURANT_DINING", label: "Restaurant & Dining" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "TRAVEL_TRANSPORTATION", label: "Travel & Transportation" },
  { value: "DIRECTIONS_PLACES", label: "Directions & Places" },
  { value: "HOME_DAILY_LIFE", label: "Home & Daily Life" },
  { value: "WORK_SCHOOL", label: "Work & School" },
  { value: "HEALTH_BODY", label: "Health & Body" },
  { value: "WEATHER_NATURE", label: "Weather & Nature" },
  { value: "EMOTIONS_FEELINGS", label: "Emotions & Feelings" },
  { value: "DESCRIPTIONS_COLORS", label: "Descriptions & Colors" },
  { value: "ANIMALS", label: "Animals" },
  { value: "HOBBIES_ENTERTAINMENT", label: "Hobbies & Entertainment" },
  { value: "TECHNOLOGY_COMMUNICATION", label: "Technology & Communication" },
  { value: "MONEY_FINANCE", label: "Money & Finance" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "OTHER", label: "Other" },
] as const;

export type WordCategory = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [WordCategory, ...WordCategory[]];

const LABEL_BY_VALUE = new Map<string, string>(CATEGORIES.map((c) => [c.value, c.label]));

export function categoryLabel(value: string): string {
  return LABEL_BY_VALUE.get(value) ?? value;
}
