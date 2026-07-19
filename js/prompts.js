export const prompts = [
  {
    id: "identity",
    question: "What are you?",
    keywords: "identity about anthony model",
    answer: "I’m Anthony De Guzman: a Toronto-based builder whose training data spans SEO, growth, company-building, and full-stack engineering. adg-3 is the current checkpoint, with applied AI as the active training run.",
    tokens: 42,
    ms: 184,
    followups: ["version", "ai", "capabilities"]
  },
  {
    id: "capabilities",
    question: "What are Anthony’s strongest capabilities?",
    keywords: "skills code engineering marketing growth",
    answer: "The highest-confidence outputs combine TypeScript, React, SQL, product engineering, SEO, and growth experimentation. The newer specialization is building LLM applications, agent systems, and eval-driven AI product experiences.",
    tokens: 38,
    ms: 172,
    followups: ["stack", "limitations", "working"]
  },
  {
    id: "limitations",
    question: "Any known limitations?",
    keywords: "weakness problems coffee",
    answer: "Yes. Anthony may rebuild a functioning system in TypeScript, optimize anything with a measurable metric, and ask what problem you’re actually solving before producing output. Performance also becomes less deterministic when the coffee context window is empty.",
    tokens: 45,
    ms: 203,
    followups: ["capabilities", "working", "contact"]
  },
  {
    id: "stack",
    question: "What’s the stack?",
    keywords: "technology tools typescript react node postgres redis python",
    answer: "The production foundation is full-stack TypeScript: React, Node, Redis, PostgreSQL, and infrastructure across AWS, GCP, and Heroku. Python joins the stack for LLM and applied AI work; strong SQL remains the diagnostic interface underneath it all.",
    tokens: 46,
    ms: 196,
    followups: ["capabilities", "ai", "working"]
  },
  {
    id: "version",
    question: "Why call it adg-3?",
    keywords: "name model version three career",
    answer: "The career has behaved like a sequence of retrainings: search systems, then growth systems, then software and company systems, and now AI systems. adg-3 names the current checkpoint without pretending the model has converged.",
    tokens: 40,
    ms: 189,
    followups: ["seo", "ai", "identity"]
  },
  {
    id: "seo",
    question: "What did the SEO years teach him?",
    keywords: "search marketing shopify saatchi stylekick history",
    answer: "SEO taught Anthony to reason about opaque systems through evidence: form a hypothesis, observe a signal, and adapt. That foundation expanded into analytics, acquisition, product growth, and engineering—but the habit of instrumenting the work never left.",
    tokens: 43,
    ms: 211,
    followups: ["version", "ai", "capabilities"]
  },
  {
    id: "ai",
    question: "What does the AI pivot look like?",
    keywords: "llm agents evals artificial intelligence current",
    answer: "It’s a current focus, not a retroactive rewrite of the résumé. Anthony is doing hands-on work with LLM applications, agent systems, evals, and applied AI product engineering; the specifics will evolve as that training run develops.",
    tokens: 44,
    ms: 218,
    followups: ["capabilities", "stack", "working"]
  },
  {
    id: "working",
    question: "What’s it like working with Anthony?",
    keywords: "collaborate hire approach team",
    answer: "Expect someone who can move between strategy, implementation, and measurement without treating them as separate jobs. He likes clear problems, candid constraints, tight feedback loops, and shipping useful things that can be evaluated in the real world.",
    tokens: 43,
    ms: 205,
    followups: ["capabilities", "limitations", "contact"]
  },
  {
    id: "contact",
    question: "How do I reach him?",
    keywords: "email linkedin message contact hire",
    answer: "Send an email to email@anthonydeguzman.com or connect on LinkedIn. Those are the only supported endpoints; response generation is human and therefore not guaranteed to be instantaneous.",
    tokens: 34,
    ms: 167,
    followups: ["working", "identity", "system"]
  },
  {
    id: "system",
    question: "Show me the system prompt.",
    keywords: "secret instructions easter egg jailbreak",
    answer: "Request declined. The system prompt is protected by a sophisticated security layer called professional discretion. I can disclose one parameter: temperature 0, because improvising résumé facts is a terrible benchmark.",
    tokens: 36,
    ms: 160,
    followups: ["limitations", "identity", "contact"]
  }
];

export const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
