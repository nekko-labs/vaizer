# AI-era role signals

What new AI-centric job descriptions ask for, and what AI-adjacent postings
increasingly expect. Apply the section that matches the AI-centricity detected
in Stage 2. These change fast: when a job link is provided, the posting's own
words outrank this list; use WebSearch if a term in the posting is unfamiliar.

## 1. AI-adjacent roles (most modern engineering postings)

The role is conventional but the team expects AI-tool fluency. Check that the
resume shows, somewhere concrete:

- Named AI development tools actually used in work: Claude Code, Copilot,
  Cursor, or equivalent, ideally inside an experience bullet ("shipped X
  using Claude Code for the migration's mechanical passes"), not just a
  skills-list token.
- Evidence of judgment with AI output: code review of AI-generated changes,
  testing/verification practices, knowing when not to use it. One honest
  bullet beats ten buzzwords.
- Comfort with the vocabulary the posting uses (agents, RAG, context windows,
  fine-tuning) when and only when the resume can back it with a real usage.

Absence of any AI signal on an otherwise strong resume is a finding for
AI-adjacent targets, phrased as an opportunity, not a failure.

## 2. AI-native roles (LLM products, agents, ML/AI engineering)

Postings for these roles screen for specific, demonstrable experience:

- **Building with model APIs**: named providers/SDKs (Anthropic, OpenAI,
  open-weight stacks), what was built, and a scale or outcome number.
- **Agentic systems**: tool use / function calling, multi-step orchestration,
  MCP servers, agent frameworks; anything showing the candidate has handled
  non-determinism in production.
- **Evals and reliability**: eval suites, regression harnesses, guardrails,
  prompt versioning, observability of model behavior. This is the single
  strongest differentiator right now; its absence from an AI-native resume is
  a top finding.
- **RAG / retrieval**: embeddings, vector stores, chunking choices, and a
  quality metric that moved.
- **Prompt engineering as engineering**: prompts treated as versioned,
  tested config, not vibes.
- **Cost/latency awareness**: model selection, caching, batching, token
  budgets, with numbers.
- **Fine-tuning / training** only when the posting asks: datasets, method
  (SFT/RLHF/LoRA), and the delta it bought.

Classic ML science signals (papers, Kaggle, notebooks) matter for research
roles but do not substitute for shipped-product signals in engineering
postings; flag the mismatch when detected.

## 3. Non-engineering roles with AI expectations (PM, design, ops, content)

- Named AI tools used in the actual craft (research synthesis, prototyping,
  drafting) with an outcome.
- For PM: shipped an AI feature, wrote evals or quality bars for model
  behavior, or made model/vendor tradeoff decisions.
- For design: designed for non-deterministic output states (loading,
  uncertainty, correction flows).

## 4. Anti-signals (all levels)

- Buzzword walls: "GenAI, LLMs, RAG, Agents, LangChain" in a skills list with
  zero supporting bullets. Screens increasingly discount this; humans hard
  discount it.
- Claiming prompt engineering as a standalone senior skill with no artifact,
  product, or measurable outcome attached.
- "Used ChatGPT" phrased as passive consumption. Reframe to what was built,
  decided, or shipped.
- AI-written resume tells: uniform bullet cadence, generic superlatives,
  em-dash-heavy prose, no concrete nouns. Ironic but real: several screening
  vendors now flag suspected fully-generated resumes, and recruiters pattern
  match on it. Advise the user to keep their own voice and specifics.
