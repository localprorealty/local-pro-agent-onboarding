// All copy here is sourced or adapted from:
// - LOCALPRO_RECRUITING_BROCHURE
// - LocalPRO_Performance_First_Homeowner_Continuity_Recruiting_Deck
// - LocalPRO_Recruiting_Visual_Storyboard (Deana / Trisha / Robert beats)
// Placeholder [[bracketed]] notes mark where real production assets
// (Deana/Trisha/Robert video, real product screenshots) slot in later.

export const SECTIONS = [
  {
    id: "open",
    eyebrow: "Built for productive agents",
    title: "A brokerage should multiply what you do well.",
    body: "Performance during the transaction. Continuity after the closing.",
    sub: "Produce the opportunity. Serve the transaction. Compound the relationship.",
    videoNote: "[[Deana — opening bookend, ~8–10s]]",
  },
  {
    id: "hidden-weight",
    eyebrow: "The traditional model",
    title: "Support exists. Leverage doesn't — until the work is coordinated.",
    body: "Resources are available, but the agent still has to assemble the business.",
    items: [
      { label: "FIND", detail: "Choose and connect the tools" },
      { label: "COORDINATE", detail: "Manage vendors, marketing and handoffs" },
      { label: "REMEMBER", detail: "Create every follow-up reason" },
      { label: "MEASURE", detail: "Decide what is working" },
    ],
  },
  {
    id: "platform-demo",
    eyebrow: "The proprietary platform",
    title: "Watch what happens when a listing comes in.",
    body: "Type an address. Watch the platform pull what used to take an hour of manual entry.",
    demo: "address-autofill",
  },
  {
    id: "ai-marketing",
    eyebrow: "Marketing, with an AI teammate",
    title: "We don't just give you tools. We give you a teammate that never sleeps.",
    body: "Rough notes in. A finished listing description, social post, or flyer copy out.",
    demo: "ai-marketing",
  },
  {
    id: "extension-demo",
    eyebrow: "The extension in action",
    title: "The busywork gets done for you — on the MLS side, too.",
    body: "Fields fill themselves in Matrix. You review, you submit.",
    demo: "extension-fill",
  },
  {
    id: "google-capture",
    eyebrow: "Stay in the loop",
    title: "Want us to follow up?",
    body: "Optional — sign in with Google and we'll save your spot. Skip it and keep scrolling.",
    optional: true,
  },
  {
    id: "performance-first",
    eyebrow: "Performance First",
    title: "People, technology, services and accountability — aligned.",
    body: "Practical training. Active coaching. Built to help agents produce more consistently.",
    videoNote: "[[Robert — training & coaching beat]]",
  },
  {
    id: "revenue-share-explain",
    eyebrow: "Growth beyond closings",
    title: "Revenue Share gives agents the opportunity to participate in the growth they help create.",
    body: "Sponsor with discernment. Help productive agents succeed. Share in expanding production.",
    videoNote: "[[Robert continues]]",
  },
  {
    id: "revenue-calculator",
    eyebrow: "Try it yourself",
    title: "See what sponsoring could mean for your business.",
    body: "Illustrative numbers, pending final confirmation from ownership — not a guarantee of payout.",
    demo: "revenue-calculator",
  },
  {
    id: "heart",
    eyebrow: "Culture determines how the platform feels",
    title: "H.E.A.R.T.",
    body: "Systems create consistency. Our culture determines how people experience it.",
    videoNote: "[[Trisha — standards & culture beat]]",
    heart: [
      { letter: "H", word: "Honor", detail: "Value every voice" },
      { letter: "E", word: "Excellence", detail: "Raise the standard" },
      { letter: "A", word: "Adaptability", detail: "Learn and improve" },
      { letter: "R", word: "Reliability", detail: "Keep the promise" },
      { letter: "T", word: "Transparency", detail: "Create clarity" },
    ],
  },
  {
    id: "built-for-next",
    eyebrow: "Built for what's next",
    title: "We're not building a bigger version of yesterday's brokerage.",
    body: "We're building what productive agents need next.",
  },
  {
    id: "close",
    eyebrow: "Inspired by a Dream. Empowered by LocalPRO.",
    title: "You bring the ambition. We bring the platform.",
    body: "If you believe your business is capable of more, we'd welcome a conversation.",
    videoNote: "[[Deana — closing bookend, ~10–12s]]",
  },
  {
    id: "form",
    eyebrow: "Let's talk",
    title: "Tell us where to reach you.",
    body: "That's it — no next step required. We'll be in touch.",
    mandatoryForm: true,
  },
] as const;

export type SectionData = (typeof SECTIONS)[number];
