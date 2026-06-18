// ─── Ceremony Arcs — Sol Mystery School ─────────────────────────────────────
// 6 arc types × 3 durations. Full content: 3-day + 7-day. 40-day: scaffold.

export type CeremonyArcType = 'grief' | 'dissolution' | 'initiation' | 'awakening' | 'return' | 'saturn';
export type CeremonyDuration = 3 | 7 | 40;

export interface CeremonyDay {
  title: string;
  reading: string;
  practice: string;
  prompt: string;
  closing: string;
}

export interface CeremonyArcDef {
  type: CeremonyArcType;
  label: string;
  glyph: string;
  color: string;
  description: string;
  days: Record<CeremonyDuration, CeremonyDay[]>;
}

// ─── GRIEF ───────────────────────────────────────────────────────────────────

const GRIEF_3: CeremonyDay[] = [
  {
    title: 'Acknowledgment',
    reading: 'Grief is not a disorder. It is the evidence of love encountering its limit — the place where what you held can no longer be held in the same way.\n\nThe school does not ask you to move through grief quickly. It asks you to move through it honestly. Today you begin by naming what is present, without rushing it toward resolution.\n\nThe naming is not the grieving — it is what makes the grieving possible.',
    practice: 'Sit in stillness for 10 minutes. Place one hand on your chest. Feel the weight of what you are carrying. Do not try to describe it or explain it — simply let it be present in your body. When thoughts arise, return to the sensation of weight beneath your hand.',
    prompt: 'What are you carrying that you have not yet been allowed to name?',
    closing: 'The weight you named today is the beginning of honest movement.',
  },
  {
    title: 'The River',
    reading: 'There is a difference between feeling grief and being submerged by it. Today we practice the river.\n\nYou are not the water. You are the riverbank. The grief moves through. You watch. You are present without being swept. This is not distance — it is stable witnessing.\n\nThe riverbank does not resist the river. It simply remains.',
    practice: 'For 15 minutes: write continuously without stopping. Do not edit. Let whatever needs to move, move through the pen. When you are finished, do not read it back immediately. Close the book and sit quietly for two minutes.',
    prompt: 'What would it mean to witness your own grief with the same compassion you would offer a close friend?',
    closing: 'The riverbank holds. The water moves. Both are necessary.',
  },
  {
    title: 'What Remains',
    reading: 'On the third day, we turn toward what remains after the loss. Not as a bypass — not as looking on the bright side — but as a genuine accounting.\n\nLoss always reveals something about what we valued, who we were, what mattered. That revelation is not a consolation prize. It is the other face of grief, inseparable from it.\n\nWhat you loved has not been erased. It has changed shape.',
    practice: 'Make a list of what the loss has taught you about what matters. Not what you wish you had done differently — what the loss has revealed about what you actually value. Take as long as you need.',
    prompt: 'What does this grief show you about what you love?',
    closing: 'What you have loved has not been erased. It has changed shape.',
  },
];

const GRIEF_7: CeremonyDay[] = [
  ...GRIEF_3,
  {
    title: 'The Body Knows',
    reading: 'Grief lives in the body before it lives in the mind. The tightness in the chest, the heaviness in the limbs, the way certain sounds or smells ambush you without warning — these are not symptoms to be managed. They are the body\'s intelligence processing what the mind cannot hold alone.\n\nToday we bring deliberate attention to where grief lives in the body.',
    practice: 'Body scan for 20 minutes. Move attention slowly from feet to crown. At each area, pause and notice: is there tightness, heaviness, aliveness, numbness? Do not try to change anything. Simply report to yourself what is there.',
    prompt: 'Where in your body does this grief live, and what does it feel like from the inside?',
    closing: 'The body is not separate from the grieving. It is where the grieving is done.',
  },
  {
    title: 'What You Shared',
    reading: 'Every grief is a story of what was shared — time, space, love, work, attention. Today we honour the specific texture of what was shared: not the abstract loss, but the particular, irreplaceable details that made it real.\n\nThese details are not evidence of what you are missing. They are evidence of what was real. That reality does not end because the form that held it has changed.',
    practice: 'Write a specific memory — not a summary, but a scene. Sensory detail: what was said, what was seen, what was felt. Let the specificity be the honoring.',
    prompt: 'What specific memory are you most afraid of losing, and what does holding it cost you?',
    closing: 'The specific is where the love lived. The specific is where it still lives.',
  },
  {
    title: 'Permission',
    reading: 'Many people grieve in secret — convinced they should be further along, should be managing better, should not still be feeling this. The word "should" is grief\'s enemy.\n\nToday you are given permission — not by this school, which has no authority to grant it, but by the honest acknowledgment that you grieve because you loved, and loving is not a thing to manage. It is a thing to honour.',
    practice: 'Write yourself a letter of permission. Begin: "You are allowed to feel ___." Fill it with every feeling you have been telling yourself is too much, too slow, too raw. Sign it and keep it.',
    prompt: 'What feeling have you been telling yourself you should not have by now?',
    closing: 'You grieve because you loved. There is nothing to be ashamed of.',
  },
  {
    title: 'Carrying Forward',
    reading: 'The seventh day is not the end of grief — nothing ends grief on a schedule. But it is a threshold: from acute grieving into the long, quieter work of carrying what you love forward into a life that is now shaped differently than you expected.\n\nCarrying is not the same as not grieving. You can carry and grieve at the same time. The carrying is the proof that what mattered, mattered.',
    practice: 'Identify one thing you want to carry forward — one quality, value, practice, or way of being that this loss has clarified for you. Write how you will carry it in your daily life. Make it specific.',
    prompt: 'What will you carry forward, and how will your life show that you carried it?',
    closing: 'The arc does not close. It deepens. You carry what mattered into the life that remains.',
  },
];

// ─── DISSOLUTION ─────────────────────────────────────────────────────────────

const DISSOLUTION_3: CeremonyDay[] = [
  {
    title: 'The Dissolving',
    reading: 'Something is coming apart. This is not failure — it is the nature of transformation.\n\nThe alchemical tradition names this stage Nigredo: the blackening, the prima materia reduced to its raw components before it can be reconstituted at a higher level. You are in the blackening. The task is not to stop it. The task is to understand what is dissolving, and why.\n\nThe dissolution serves something. It always does.',
    practice: 'Identify one belief, identity, or structure that is actively dissolving. Write it at the top of a page. Below it, write what you are afraid will disappear if it fully dissolves. Be honest about the fear.',
    prompt: 'What are you holding onto that has already begun to release?',
    closing: 'What cannot hold its form has already begun to transform.',
  },
  {
    title: 'The Witness',
    reading: 'When we are dissolving, the temptation is to rebuild immediately — to find something solid to grab. But the rebuilt structure is always built on the old form\'s terms, and the old form is what needed to dissolve.\n\nToday: practice watching the dissolution without building yet. The open space is not a problem. It is an interval — necessary, uncomfortable, generative.',
    practice: 'Sit for 20 minutes. Each time you notice yourself constructing a new narrative or reaching for solid ground, name it quietly — "building" — and return to open observation. The dissolution needs space to complete.',
    prompt: 'What would you build if you were not afraid?',
    closing: 'The open space before the new form is not emptiness. It is possibility.',
  },
  {
    title: 'What Survives',
    reading: 'The alchemical operation of dissolution reveals what the ordinary structures were concealing. When the dissolving runs its course — when it has completed what it needed to complete — what remains is the incorruptible: the part of you that was never identical to the structure that fell.\n\nToday we name that part. Not as a new identity to cling to, but as a recognition of what was always true beneath the form.',
    practice: 'Complete this sentence 12 times, without repetition: "Even if everything changes, I remain ___." Do not settle for easy answers. Push into the ones that feel most true.',
    prompt: 'What in you is incorruptible — what cannot be dissolved no matter what falls away?',
    closing: 'The incorruptible does not need protecting. It was always there.',
  },
];

const DISSOLUTION_7: CeremonyDay[] = [
  ...DISSOLUTION_3,
  {
    title: 'What Needed to Fall',
    reading: 'Looking back at what dissolved — not with grief or relief, but with honest assessment — the question now is: what needed to fall? Not everything that dissolves should have been preserved. Some structures outlive their usefulness. The dissolution was serving something real.\n\nHonest acknowledgment of this is not cold. It is accurate.',
    practice: 'Write three things the dissolving structure was preventing you from becoming. Not in spite — as a genuine accounting of what it was costing you to maintain it.',
    prompt: 'What became possible in you that could only happen because the old form fell?',
    closing: 'Nothing dissolves that was built to last. Trust the intelligence of what fell.',
  },
  {
    title: 'The New Material',
    reading: 'After dissolution, the prima materia is available for a new form — but the new form is not determined by the old one. This is the radical possibility of the Nigredo: genuine novelty. Not the old structure repaired. Something new, built from what survived.\n\nToday we begin to sense the shape of what wants to be built.',
    practice: 'Freewrite for 20 minutes from this prompt: "The life I am actually building now looks like..." Let yourself be surprised by what comes. Do not plan before writing.',
    prompt: 'What is beginning to take shape in the space where the old form was?',
    closing: 'The new form is not dictated by the old. That is the gift the dissolution earned.',
  },
  {
    title: 'Patience with the Interval',
    reading: 'Between dissolution and reconstitution, there is an interval that cannot be shortened. The alchemist who rushes the interval gets a lower-grade product than the one who allows the operation to complete. This patience is not passive — it is an active, disciplined trust in the process.\n\nThe interval is part of the work.',
    practice: 'Identify one area of your life where you have been rushing the interval — trying to resolve something that is still in process. Write a specific commitment to allow that process the time it actually needs.',
    prompt: 'Where are you rushing yourself that needs you to wait?',
    closing: 'The interval is not delay. It is the process. Trust it.',
  },
  {
    title: 'Albedo',
    reading: 'After the Nigredo comes the Albedo — the whitening, the clarification, the first light of the new form emerging from what survived the dissolution. The Albedo is not certainty. It is the first glimpse of coherence — the sense that the scattered material is beginning to find its arrangement.\n\nYou are beginning to coalesce.',
    practice: 'Write a one-paragraph description of who you are becoming — not who you were, not who you think you should be. Who you are actually, visibly, becoming. Let it be tentative if it is. Let it be specific where you can.',
    prompt: 'What is the clearest, most honest version of who you are becoming?',
    closing: 'The Albedo is the beginning of the new form. Welcome what is coalescing.',
  },
];

// ─── INITIATION ──────────────────────────────────────────────────────────────

const INITIATION_3: CeremonyDay[] = [
  {
    title: 'The Threshold',
    reading: 'Every initiation begins with a threshold — a moment where the ordinary world is left behind and the territory ahead is genuinely unknown. Most thresholds are invisible from the outside. They look like ordinary decisions, ordinary days.\n\nThe initiation is in your relationship to the crossing — the willingness to go forward without the guarantee of return to who you were.',
    practice: 'Name the threshold you are crossing. Specifically: write what you are leaving, what you are entering, and what you cannot bring with you. Then sit with that list for ten minutes in silence.',
    prompt: 'What version of yourself cannot cross this threshold with you?',
    closing: 'The one who crosses is not the same as the one who stood at the door.',
  },
  {
    title: 'The Dark Wood',
    reading: 'Initiations have a dark wood — a period of genuine disorientation where the old maps don\'t work and the new maps haven\'t arrived yet. This is not a sign that the initiation is going wrong. It is a sign that it is going right.\n\nThe dark wood is where the old self\'s strategies fail. That failing is the point. The initiate must learn to navigate without the old tools.',
    practice: 'List every strategy you normally use to feel safe: control, planning, seeking reassurance, keeping busy, intellectualizing. For each one, ask: what am I afraid will happen if I don\'t use this strategy right now? Write the fear, not the strategy.',
    prompt: 'What is the fear beneath the fear — the one the strategies are protecting you from?',
    closing: 'The forest has always been there. You have chosen to walk into it. That choice is not reversible, and you are not the same for having made it.',
  },
  {
    title: 'The Oath',
    reading: 'Traditional initiations end with an oath — not a promise made to others, but a declaration made to oneself about who one is choosing to become. The oath is not a fantasy. It is a specific commitment, grounded in what the dark wood revealed.\n\nThe oath does not describe who you wish you were. It describes who you are choosing to become — starting now, with full knowledge of what that costs.',
    practice: 'Write your initiation oath. Begin: "Having crossed this threshold and walked the dark wood, I commit to __." Make it specific. Make it honest. Make it yours. Sign it with today\'s date.',
    prompt: 'What will you no longer pretend is acceptable in your own life?',
    closing: 'The oath is not the completion. It is the beginning of the initiated life.',
  },
];

const INITIATION_7: CeremonyDay[] = [
  ...INITIATION_3,
  {
    title: 'What the Crossing Cost',
    reading: 'Every threshold crossing has a cost — something given up, something surrendered, something that could not come through. Acknowledging the cost is not regret. It is honest accounting — the kind that makes future crossings more deliberate and more real.\n\nWhat did this crossing actually cost you?',
    practice: 'Write specifically what you surrendered to make this crossing. Not as loss — as a deliberate sacrifice. Name what you gave, and name what you gave it for.',
    prompt: 'What did you sacrifice for this crossing, and was it worth it?',
    closing: 'Sacrifice made in clarity is not loss. It is the currency of transformation.',
  },
  {
    title: 'The Guides',
    reading: 'No initiation happens alone. Every tradition acknowledges the guides — those who have crossed before, who have shown what is possible, who hold the lineage of the crossing. Some are living; some are not; some are texts and teachings.\n\nWho guided you through this threshold, knowingly or not?',
    practice: 'Write the names — or descriptions — of every person, text, teaching, or experience that guided this particular crossing. For each one, write specifically what they gave you.',
    prompt: 'Who or what made this crossing possible, and how will you honour that?',
    closing: 'The guide does not carry you. They show that the crossing is possible. That showing is everything.',
  },
  {
    title: 'The Initiated Life',
    reading: 'The initiated person moves through the world differently — not with superiority, but with a particular kind of clarity. They have been through something. They know it. The knowledge is not a trophy; it is a weight and a gift simultaneously.\n\nThe initiated life is not easier. It is more deliberate.',
    practice: 'Describe one specific way your daily life is different now than it was before this crossing. Not in aspiration — in observable fact. What do you actually do differently?',
    prompt: 'How does the initiated version of you show up in the ordinary moments of an ordinary day?',
    closing: 'The ordinary life is where the initiation is tested. Show up to it.',
  },
  {
    title: 'Passage Completed',
    reading: 'The seventh day of the initiation arc is a moment of formal acknowledgment: you have crossed. The crossing continues — initiations unfold over years, not days — but the passage has been made. This is the moment to mark it, to honour it, and to step fully into what you have become.\n\nYou are not who you were at the door.',
    practice: 'Perform a small physical ceremony — specific to you. Light a candle, change something about your space, write your name in a way that marks the new chapter. The specific act matters less than the deliberateness of the acknowledgment.',
    prompt: 'How will you mark and remember this crossing?',
    closing: 'The passage is complete. The initiated life has begun. Walk into it.',
  },
];

// ─── AWAKENING ───────────────────────────────────────────────────────────────

const AWAKENING_3: CeremonyDay[] = [
  {
    title: 'The Opening',
    reading: 'Awakening is not an event. It is a direction — a continuous movement toward greater clarity, greater presence, greater contact with what is real.\n\nToday is the first day of choosing that direction consciously. The opening begins with noticing: noticing what you have been not-noticing, seeing what you have been looking past.\n\nWhat is actually here?',
    practice: 'Walk for 20 minutes — outside if possible. Practice noticing what you normally move past without seeing. Do not try to make meaning of it. Simply see it. A crack in the pavement. The quality of light. Someone\'s expression. What is actually here.',
    prompt: 'What have you been looking past that has been trying to get your attention?',
    closing: 'What you begin to see cannot be unseen. This is the price and the reward of the opening.',
  },
  {
    title: 'The Pattern',
    reading: 'Awakening often moves through pattern recognition — the sudden seeing of structures that were always present but invisible. These patterns are not external to you. They are patterns in the way you think, the way you relate, the way you construct reality.\n\nToday we look for the recurring pattern. Not to criticise it — to understand it.',
    practice: 'Review the last six months of your life. Identify one pattern that has repeated — in relationships, in how you respond to challenge, in what you avoid. Name it specifically. Not "I procrastinate" but "when I feel afraid of judgment, I withdraw and then feel worse."',
    prompt: 'If this pattern has been trying to teach you something, what is it?',
    closing: 'The pattern repeats until it is seen. You have begun to see it.',
  },
  {
    title: 'Integration',
    reading: 'Awakening without integration becomes bypassing — the use of expansive experience to avoid the ordinary work of becoming. Integration is the movement from insight to embodiment: not just knowing something, but living from it.\n\nToday we ask how the opening changes the actual texture of daily life. Not the philosophy of your life — the daily life itself.',
    practice: 'Identify one concrete way the insight from this arc changes a specific behaviour or decision in your daily life. Not a vague "be more present" — a specific change. Write it as a commitment with a timeline.',
    prompt: 'What changes when you live from what you have seen rather than from what you have always done?',
    closing: 'The awake life is not a destination. It is the practice of returning to what you know, every day.',
  },
];

const AWAKENING_7: CeremonyDay[] = [
  ...AWAKENING_3,
  {
    title: 'What Was Always True',
    reading: 'Many awakenings are not the arrival of something new — they are the recognition of something that was always true but unseen. The ground was always there. The quality of presence was always available. What shifted was not reality — it was your relationship to it.\n\nWhat was always true that you are only now seeing?',
    practice: 'Write three things you now recognize as having always been true, that you could not see before. For each one, write what prevented you from seeing it.',
    prompt: 'What was always true, and what were you doing instead of seeing it?',
    closing: 'The truth does not arrive. It is uncovered. The uncovering is the work.',
  },
  {
    title: 'The Dark Side of the Opening',
    reading: 'Every genuine opening has a shadow — the part of the awakening that is harder to integrate than the expansive part. The clarity that shows you what needs to change. The seeing that reveals what you can no longer unsee, including about yourself.\n\nThe shadow of awakening is not a sign it is incomplete. It is a sign it is real.',
    practice: 'Write honestly about the difficulty of this opening. What has it cost you? What have you had to acknowledge that is uncomfortable? What do you wish you could unsee?',
    prompt: 'What is the hardest thing this awakening has shown you?',
    closing: 'The opening shows what is true. All of it. Including the parts that are uncomfortable.',
  },
  {
    title: 'Staying Awake',
    reading: 'The great challenge of awakening is not the initial opening — it is the maintenance of that orientation in the face of ordinary life, which continually pulls toward the habitual, the familiar, the unconscious.\n\nHow do you stay awake when everything around you is structured to encourage sleep?',
    practice: 'Design a daily practice — no longer than five minutes — that you will use to return to the open state when you drift. Simple, specific, doable. Write it down as a commitment.',
    prompt: 'What is your practice for returning when you drift?',
    closing: 'Waking up is not the achievement. Staying awake is.',
  },
  {
    title: 'Sharing the Opening',
    reading: 'Awakening held entirely private tends to calcify — it becomes a possession rather than a direction. The opening becomes more real through contact with others, through conversation, through the friction of a world that does not see what you see.\n\nHow do you bring what you have seen into relationship with the world?',
    practice: 'Identify one person in your life who would benefit from knowing what you have seen. Write what you would say to them. You do not have to send it — but write it as if you will.',
    prompt: 'What would you share, with whom, and what stops you?',
    closing: 'The opening is not complete until it changes how you show up. Show up.',
  },
];

// ─── RETURN ──────────────────────────────────────────────────────────────────

const RETURN_3: CeremonyDay[] = [
  {
    title: 'Landing',
    reading: 'Return is one of the most underestimated thresholds. We prepare for departure — the journey, the initiation, the experience — and give almost no attention to the return.\n\nBut return is its own crossing. The person who went out is not the same person who is coming back. And the world they are returning to does not know this yet.\n\nToday we begin the landing.',
    practice: 'Write a letter to the version of yourself who left. What does that person need to know about who is coming back? What has changed? What has survived unchanged?',
    prompt: 'What do you need to leave behind before you can fully return?',
    closing: 'Landing is not the end of the journey. It is the beginning of carrying it.',
  },
  {
    title: 'Translation',
    reading: 'The returning traveller faces the translation problem: how to make what was learned on the journey legible to the world that remained. Not every experience translates. Some of what you carried back cannot be spoken — it can only be lived.\n\nBut some of it must be translated, or it remains locked inside, slowly losing its charge.',
    practice: 'Identify one insight or shift from your journey. Write it in the simplest possible language — as if explaining it to someone who was not there and never could have been. The act of simplification reveals what you actually understand versus what you think you understand.',
    prompt: 'What truth did you bring back that you are afraid to live openly?',
    closing: 'The translation is not a diminishment. It is the proof that the journey was real.',
  },
  {
    title: 'The New World',
    reading: 'After genuine return, the world looks different — not because it changed, but because you did. This is the final task of the return arc: to see the familiar world through the eyes of the changed self.\n\nNot with disdain for what remained. With the particular love of the one who left and chose to come back.',
    practice: 'Choose one relationship, space, or routine that you have returned to. Look at it with completely fresh eyes. What do you see that you didn\'t see before? What have you been taking for granted? What do you want to offer it now?',
    prompt: 'What does it mean to choose to be here, now, in this life — again, with full knowledge of what that means?',
    closing: 'The return is the gift. You chose to come back. That choice is not small.',
  },
];

const RETURN_7: CeremonyDay[] = [
  ...RETURN_3,
  {
    title: 'What the Journey Gave',
    reading: 'The inventory of the journey: not what happened, but what it gave you. The skills, the clarity, the relationships, the failures, the moments of genuine contact. What did you come back with that you did not have when you left?\n\nThis is not nostalgia. It is gratitude — specific, grounded, earned.',
    practice: 'Write a specific inventory: five things you came back with that you did not have before. For each one, name exactly where you got it and what it cost.',
    prompt: 'What is the most important thing the journey gave you, and how will you honour it by how you live?',
    closing: 'You carry the journey inside you now. Let it show.',
  },
  {
    title: 'The People Who Waited',
    reading: 'Some waited — by choice or by necessity. While you were out there, others were here, holding what they held, living what they lived. The return is also a return to them.\n\nThere is often a gap between who you became and what those relationships expect. Navigating that gap with honesty and care is the long work of return.',
    practice: 'Write about one relationship that was changed — or needs to be renegotiated — because of who you have become. What does the honest conversation look like?',
    prompt: 'What do the people who waited deserve to know about who came back?',
    closing: 'Return with honesty. That is what they waited for.',
  },
  {
    title: 'Belonging Again',
    reading: 'The returned person sometimes cannot find their place. They belong here — they chose to come back — but belonging feels different now. This discomfort is not evidence that the return was wrong. It is evidence that belonging is something you actively create, not something you passively receive.\n\nHow do you choose to belong here?',
    practice: 'Identify three specific actions you will take to build genuine belonging in your current life. Not performances of fitting in — real acts of investment: in people, in place, in work.',
    prompt: 'How do you actively choose to belong to this life, this place, these people?',
    closing: 'You came back. Now build the life you came back to. That is the full return.',
  },
  {
    title: 'The Arc Closes',
    reading: 'Every journey has an ending — not of the journey\'s influence, which continues, but of the acute phase of return. Today we close the arc: not by finishing, but by choosing to step fully into the life that the return has made possible.\n\nThe journey does not end. You carry it forward now.',
    practice: 'Write one paragraph about the life you are choosing to build now that you have returned. Specific, grounded, honest. This is not a dream. This is a commitment.',
    prompt: 'What life are you building with everything the journey gave you?',
    closing: 'The arc closes here. The life continues. Go build it.',
  },
];

// ─── SATURN ──────────────────────────────────────────────────────────────────

const SATURN_3: CeremonyDay[] = [
  {
    title: 'The Reckoning',
    reading: 'Saturn is the planet of structure, time, and accountability. The Saturn Return — which occurs approximately every 29 years — is not a crisis delivered from outside. It is an accounting.\n\nThe life you have actually built, measured against the life you said you were building. What does not measure up must be renegotiated — not with the cosmos, but with yourself.',
    practice: 'Write two columns. Column A: what you said you valued, what you told yourself your priorities were. Column B: where your time, money, and attention have actually gone in the last year. Sit with the gap between them. Do not explain it away.',
    prompt: 'What are you building that you would not build if you were being honest with yourself?',
    closing: 'Saturn does not punish. It reveals. The reckoning is a gift with a difficult face.',
  },
  {
    title: 'The Structure',
    reading: 'Structure is not the enemy of freedom. It is what makes freedom possible. An athlete who has no structure has no strength to be free with. A musician who avoids discipline has no instrument for expression.\n\nToday we look at the structures you need — not the ones imposed from outside, but the ones that would allow you to become who you are trying to become.',
    practice: 'Identify one structure you need to build — a daily practice, a boundary, a commitment, a constraint. Write what it is. Write why you have been avoiding it. Write what becomes possible if you hold it for 90 days.',
    prompt: 'What would become possible if you stopped negotiating with the structure you know you need?',
    closing: 'The constraint you choose is the freedom you build.',
  },
  {
    title: 'The Long Game',
    reading: 'Saturn teaches in decades, not days. This arc is not completed in three days — it is begun. What you commit to here is a direction for the next chapter of your life, not a short-term goal.\n\nThe long game requires a different kind of commitment: not the enthusiasm of a beginning, but the steady, unsexy, compound-interest work of becoming.',
    practice: 'Write a letter to yourself ten years from now. Tell them what you are choosing to build, starting now. Tell them what you are willing to sacrifice. Tell them what you are not willing to sacrifice. Sign it with a date.',
    prompt: 'What does the ten-year version of you need you to begin today?',
    closing: 'The long game is played one day at a time. Today was the first day.',
  },
];

const SATURN_7: CeremonyDay[] = [
  ...SATURN_3,
  {
    title: 'What Time Revealed',
    reading: 'Saturn is the teacher of time. The planet\'s slow orbit — approximately 29 years — means its lessons unfold across years, not months. Looking back across the last several years, what has time revealed that shorter timescales concealed?\n\nThe long view changes what looks like failure and what looks like success.',
    practice: 'Write about a decision or period from five or more years ago that looks different now than it did then. What did time reveal that you could not have seen in the moment?',
    prompt: 'What does the long view of your life reveal that the short view hides?',
    closing: 'Time is not running out. It is running. Make what you build worth the running.',
  },
  {
    title: 'The Debt',
    reading: 'Saturn governs debt — not only financial, but the debts of attention, integrity, and presence we accumulate when we live inauthentically. These debts compound. The Saturn return is often when they come due.\n\nWhat debts have you been carrying? To yourself, to others, to the life you said you wanted?',
    practice: 'Write a debt inventory — specific, honest, unjudged. What do you owe, to whom or what, and what would settling that debt actually require?',
    prompt: 'What debt is heaviest, and what would it mean to settle it?',
    closing: 'Debts acknowledged are debts that can be paid. Begin.',
  },
  {
    title: 'The Necessary Work',
    reading: 'Beneath all the structures and disciplines, there is usually one necessary work — the thing that, if you do not do it, the rest of your life will be built on an evasion. Not the thing you want to do. The thing you cannot avoid doing and remain who you say you are.\n\nWhat is your necessary work?',
    practice: 'Name the necessary work. Write why you have been avoiding it. Write what the cost of continued avoidance is. Write the first concrete step.',
    prompt: 'What is the work you cannot avoid and still be who you say you are?',
    closing: 'The necessary work does not wait. It only compounds. Begin today.',
  },
  {
    title: 'The Saturn Oath',
    reading: 'The seventh day of the Saturn arc asks for the hardest oath: not the enthusiastic commitment of a beginning, but the sober, eyes-open commitment of someone who knows exactly what they are signing up for — including the difficulty, the sacrifice, and the length of time required.\n\nThis is the oath that Saturn actually wants. Not the excited one. The honest one.',
    practice: 'Write your Saturn Oath. Begin: "Knowing what it costs, knowing how long it takes, knowing what I must give up — I commit to __." Sign it. Date it. Keep it somewhere you will see it.',
    prompt: 'What are you willing to commit to, with full knowledge of what it costs?',
    closing: 'The oath made with open eyes is the only oath Saturn recognises. You have made it. Now honour it — one day, one structure, one ordinary act of becoming at a time.',
  },
];

// ─── Arc Definitions ─────────────────────────────────────────────────────────

export const CEREMONY_ARCS: CeremonyArcDef[] = [
  {
    type: 'grief',
    label: 'Grief',
    glyph: '◌',
    color: '#7B8CDE',
    description: 'A ceremony for loss, mourning, and the honest movement through what can no longer be held.',
    days: { 3: GRIEF_3, 7: GRIEF_7, 40: GRIEF_7 },
  },
  {
    type: 'dissolution',
    label: 'Dissolution',
    glyph: '∇',
    color: '#9B59B6',
    description: 'For when something is coming apart. The alchemical Nigredo — not collapse, but the necessary reduction before reconstitution.',
    days: { 3: DISSOLUTION_3, 7: DISSOLUTION_7, 40: DISSOLUTION_7 },
  },
  {
    type: 'initiation',
    label: 'Initiation',
    glyph: '◈',
    color: '#F5A623',
    description: 'For threshold crossings. Entering new territory with no guarantee of return to who you were.',
    days: { 3: INITIATION_3, 7: INITIATION_7, 40: INITIATION_7 },
  },
  {
    type: 'awakening',
    label: 'Awakening',
    glyph: '✦',
    color: '#4CAF50',
    description: 'For openings — the recognition of patterns, the sight of what was always true, the movement toward greater presence.',
    days: { 3: AWAKENING_3, 7: AWAKENING_7, 40: AWAKENING_7 },
  },
  {
    type: 'return',
    label: 'Return',
    glyph: '⊚',
    color: '#E07040',
    description: 'For coming back. The underestimated threshold of carrying what you found into the life you returned to.',
    days: { 3: RETURN_3, 7: RETURN_7, 40: RETURN_7 },
  },
  {
    type: 'saturn',
    label: 'Saturn',
    glyph: '⊕',
    color: '#4A9EFF',
    description: 'The arc of reckoning. Structure, time, accountability — the long game, played honestly.',
    days: { 3: SATURN_3, 7: SATURN_7, 40: SATURN_7 },
  },
];

export function getArcDef(type: CeremonyArcType): CeremonyArcDef {
  return CEREMONY_ARCS.find(a => a.type === type)!;
}

export function getArcDay(type: CeremonyArcType, duration: CeremonyDuration, dayIndex: number): CeremonyDay | null {
  const arc = getArcDef(type);
  const days = arc.days[duration];
  return days[dayIndex] ?? null;
}
