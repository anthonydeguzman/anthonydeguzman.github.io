export const prompts = [
  {
    id: "role",
    question: "What do you do?",
    keywords: "role about developer founder product engineering growth",
    answer: "I’m a developer and co-founder of Breezeful. I work across product, engineering, and growth.",
    followups: ["breezeful", "stack", "work"]
  },
  {
    id: "breezeful",
    question: "What is Breezeful?",
    keywords: "company startup mortgage yc current",
    answer: "Breezeful is a Y Combinator-backed digital mortgage platform serving the U.S. and Canada. I co-founded the company and lead its technology work.",
    followups: ["role", "stack", "work"]
  },
  {
    id: "stack",
    question: "What technologies do you use?",
    keywords: "stack code typescript react node postgres redis python rails",
    answer: "Most of my current work uses TypeScript, React, Node.js, Redis, and PostgreSQL. I also work with Python, Ruby on Rails, SQL, AWS, GCP, and Heroku.",
    followups: ["role", "strengths", "work"]
  },
  {
    id: "work",
    question: "What have you built?",
    keywords: "projects work breezeful page outil portfolio",
    answer: "My selected work includes Breezeful, a digital mortgage platform, and Page Outil, an on-page SEO tool. More details are in the Work section.",
    followups: ["breezeful", "pageoutil", "contact"]
  },
  {
    id: "background",
    question: "What is your background?",
    keywords: "experience career shopify saatchi cover stylekick",
    answer: "My background includes software development, company-building, product growth, analytics, and search. I’ve worked at Breezeful, Cover, Shopify, Saatchi & Saatchi, and Stylekick.",
    followups: ["role", "strengths", "work"]
  },
  {
    id: "strengths",
    question: "What are your main strengths?",
    keywords: "skills capabilities engineering product growth analytics",
    answer: "I’m strongest where product, engineering, and measurement overlap. I can move from defining a problem to building the software and evaluating the result.",
    followups: ["stack", "approach", "background"]
  },
  {
    id: "approach",
    question: "How do you work?",
    keywords: "approach collaborate process team",
    answer: "I prefer clear problems, practical implementations, and short feedback loops. I like to ship, measure, and improve from there.",
    followups: ["strengths", "collaborate", "contact"]
  },
  {
    id: "pageoutil",
    question: "What is Page Outil?",
    keywords: "project seo tool page outil",
    answer: "Page Outil is a tool I created for practical on-page optimization insights. You can find it at pageoutil.com.",
    followups: ["work", "background", "contact"]
  },
  {
    id: "collaborate",
    question: "Are you open to collaborating?",
    keywords: "work together hire opportunities consulting",
    answer: "I’m always open to a useful conversation. Email or LinkedIn are the best ways to get in touch.",
    followups: ["approach", "contact", "role"]
  },
  {
    id: "contact",
    question: "How can I reach you?",
    keywords: "email linkedin message contact",
    answer: "Email me at email@anthonydeguzman.com or connect with me on LinkedIn.",
    followups: ["collaborate", "role", "work"]
  }
];

export const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
