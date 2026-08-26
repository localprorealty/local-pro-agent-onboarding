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
    video: { src: "/videos/clip1-open.mp4", gatesScroll: true },
  },
  {
    id: "hidden-weight",
    eyebrow: "The weight nobody talks about",
    title: "You're not missing tools. You're missing time.",
    body: "Every brokerage hands you a stack of resources: a CRM login, a marketing portal, a training calendar. They call it support. Nobody actually turns it into a business for you, though. You're still the one deciding which tool fits which job, chasing down a photographer, remembering to follow up with a client six months after closing, and guessing whether any of it actually worked. None of that shows up as one big task. It shows up as a hundred small ones, every week, and it eats the hours you'd rather spend with clients.",
    items: [
      { label: "FIND", detail: "Every new tool means another decision: which CRM feature, which template, which vendor to call." },
      { label: "COORDINATE", detail: "Marketing, photography, signage, and paperwork all need someone chasing them and keeping things moving." },
      { label: "REMEMBER", detail: "The best follow-ups come from remembering a client's roof is 12 years old, or that their kid just started college. Nobody hands you that memory." },
      { label: "MEASURE", detail: "Was last month's marketing spend worth it? Most agents genuinely don't know, because nobody's tracking it for them." },
    ],
  },
  {
    id: "platform-demo",
    eyebrow: "The proprietary platform",
    title: "Watch what happens when a listing comes in.",
    body: "Every brokerage will tell you they have technology, marketing, training, and support. At LocalPRO, we actually built those pieces to work together, so you're not juggling five separate logins on your own. Easiest to just show you: type a real address below and watch something that normally takes an hour of manual entry happen in seconds.",
    demo: "address-autofill",
    video: { src: "/videos/clip2-platform.mp4", gatesScroll: true },
  },
  {
    id: "ai-marketing",
    eyebrow: "Marketing, with an AI teammate",
    title: "We don't just give you tools. We give you a teammate that never sleeps.",
    body: "Every listing needs a description, a caption, maybe a flyer, and writing decent copy from scratch every single time is its own quiet time sink. Give the platform a few details about the property, mention anything special about it, and it drafts a real starting point in seconds. You're not handing off your judgment. You're just skipping the blank page.",
    demo: "ai-marketing",
  },
  {
    id: "extension-demo",
    eyebrow: "The extension in action",
    title: "The busywork gets done for you: on the MLS side, too.",
    body: "Getting a listing onto MLS means retyping the same details you already entered above, into a separate, old-fashioned form. Our Chrome extension closes that gap. It reads what you've already told the platform and fills in the MLS form for you, field by field. You check it over and hit submit.",
    demo: "extension-fill",
  },
  {
    id: "google-capture",
    eyebrow: "Stay in the loop",
    title: "Want us to follow up?",
    body: "Entirely optional. Sign in if you'd like us to follow up as you decide, or skip it and keep exploring. The form at the end covers this either way.",
    optional: true,
  },
  {
    id: "performance-first",
    eyebrow: "Performance First",
    title: "People, technology, services and accountability: aligned.",
    body: "Performance First is what ties everything you've just scrolled through back together: the platform, the marketing help, the coaching, the accountability. All of it is built toward one outcome: helping you produce more consistently without burning yourself out doing everything by hand. This is genuinely how LocalPRO decides what to build next for its agents.",
    videoNote: "[[Robert - training & coaching beat]]",
    video: { src: "/videos/clip3-performance.mp4", gatesScroll: true },
  },
  {
    id: "revenue-share-explain",
    eyebrow: "Growth beyond closings",
    title: "Here's how sponsoring another agent actually pays you.",
    body: "When you help someone join LocalPRO, a friend, someone you mentored, a new agent you recruited, you become their sponsor. Every time they close a deal, LocalPRO keeps a portion of it, and a slice of that comes back to you automatically, for as long as they're still working toward their yearly cap. The more agents you've sponsored, and the further along they are in their cap, the bigger your slice. You don't do any extra work for this. It's a reward for helping someone else succeed.",
    videoNote: "[[Robert continues]]",
    video: { src: "/videos/clip4-revshare.mp4", gatesScroll: true },
  },
  {
    id: "revenue-calculator",
    eyebrow: "Try it yourself",
    title: "See what sponsoring could mean for your business.",
    body: "The numbers below are illustrative for now; the real rate table is still being finalized with ownership. But the mechanics are real. Slide things around and see roughly what sponsoring a few productive agents could mean for your business over a year.",
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
    body: "Most of what you've just seen, the platform, the coaching, revenue share, didn't exist in real estate ten years ago. This isn't a bigger version of an old-style brokerage. It's built for the agent working right now.",
    video: { src: "/videos/clip5-next.mp4", gatesScroll: true },
    creepSpeedMultiplier: 0.5,
  },
  {
    id: "close",
    eyebrow: "Inspired by a Dream. Empowered by LocalPRO.",
    title: "You bring the ambition. We bring the platform.",
    body: "If you believe your business is capable of more than it is today, we'd welcome a conversation.",
    videoNote: "[[Deana - closing bookend, ~10-12s]]",
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
