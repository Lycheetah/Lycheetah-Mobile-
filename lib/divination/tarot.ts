// ─── TAROT ENGINE ─────────────────────────────────────────────────────────────
// Rider-Waite-Smith 78-card deck. Compact keyword structure — Sol generates the
// prose reading from these keywords + the seeker's field context.
// Date-seeded draws (same card all day) with LQ field-state weighting.

export type Arcana = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotCard {
  n: string;       // name
  a: Arcana;       // arcana / suit
  num: number;     // number (major: 0-21; minor: 1-14 where 11=Page 12=Knight 13=Queen 14=King)
  up: string;      // upright keywords
  rev: string;     // reversed keywords
  m?: string;      // prose meaning (1-2 sentences, scene-grounded)
}

export const SUIT_GLYPH: Record<Arcana, string> = {
  major: '✦', wands: '🜂', cups: '🜄', swords: '🜁', pentacles: '🜃',
};

export const SUIT_ELEMENT: Record<Arcana, string> = {
  major: 'Spirit', wands: 'Fire', cups: 'Water', swords: 'Air', pentacles: 'Earth',
};

export const TAROT_DECK: TarotCard[] = [
  // ── Major Arcana ──
  { n: 'The Fool',            a: 'major', num: 0,  up: 'beginnings, innocence, a leap of faith, free spirit',        rev: 'recklessness, hesitation, fear of the unknown',
    m: 'A young figure steps off a cliff into open air, utterly unafraid — the beginning of every journey is an act of trust before understanding arrives. The Fool carries only what is essential; the rest will be found along the way.' },
  { n: 'The Magician',        a: 'major', num: 1,  up: 'will, manifestation, resourcefulness, focused power',         rev: 'manipulation, untapped talent, scattered will',
    m: 'The Magician stands between heaven and earth, all four tools before him — sword, wand, cup, pentacle — ready to be used. What is above can be brought below; the gap between intention and reality closes when will is truly focused.' },
  { n: 'The High Priestess',  a: 'major', num: 2,  up: 'intuition, the unconscious, hidden knowledge, the inner voice', rev: 'secrets withheld, disconnection from intuition',
    m: 'She sits between two pillars — light and shadow, yes and no — with a scroll of hidden law half-concealed in her robes. What she knows she does not speak aloud; it must be listened for in the silence between thoughts.' },
  { n: 'The Empress',         a: 'major', num: 3,  up: 'abundance, nurture, fertility, creative flourishing',         rev: 'creative block, dependence, smothering',
    m: 'The Empress presides over a world in full bloom — forest, stream, field of wheat — the embodiment of life sustaining life. She does not create by force but by presence; abundance follows from being fully, generously here.' },
  { n: 'The Emperor',         a: 'major', num: 4,  up: 'authority, structure, the father, stable foundation',          rev: 'domination, rigidity, loss of control',
    m: 'The Emperor sits on a stone throne carved with rams\' heads, a mountain behind him — order carved from chaos by the application of sustained will. His power is not warmth but reliability; he is the structure that makes other growth possible.' },
  { n: 'The Hierophant',      a: 'major', num: 5,  up: 'tradition, teaching, spiritual lineage, shared belief',        rev: 'rebellion, dogma questioned, personal path',
    m: 'The Hierophant holds the keys to knowledge that has been handed down through generations, blessing two acolytes who kneel before received wisdom. What was learned the hard way by those who came before is offered here — the question is whether you receive or reject it.' },
  { n: 'The Lovers',          a: 'major', num: 6,  up: 'union, choice, alignment of values, deep connection',          rev: 'disharmony, misalignment, broken trust',
    m: 'A man and woman stand naked beneath an angel, a choice implicit in the space between them — to unite or to part, to align or to compromise. The Lovers is less about romance than about the integrity required when two paths could become one.' },
  { n: 'The Chariot',         a: 'major', num: 7,  up: 'willpower, victory, directed force, self-discipline',          rev: 'lack of direction, opposition, scattered drive',
    m: 'The Charioteer holds no reins — two sphinxes of opposite nature obey through sheer concentrated will. Victory here is not the absence of opposing forces but the mastery of holding them in productive tension.' },
  { n: 'Strength',            a: 'major', num: 8,  up: 'inner strength, courage, gentle mastery, patience',            rev: 'self-doubt, raw force, weakness',
    m: 'A woman closes the jaws of a lion with her bare hands, wearing flowers — the scene\'s power is in its gentleness. The lion is not defeated; it is tamed by someone who was not afraid of its nature and did not need to destroy what frightened them.' },
  { n: 'The Hermit',          a: 'major', num: 9,  up: 'solitude, inner search, guidance, the inward turn',            rev: 'isolation, withdrawal, lost path',
    m: 'An old figure holds a lantern at the peak of a mountain in the dark, alone by choice — the light he carries is not for the path behind him but for whoever follows. Wisdom earned through solitude is not meant to be hoarded; it illuminates the way for others.' },
  { n: 'Wheel of Fortune',    a: 'major', num: 10, up: 'cycles, turning point, fate, momentum shifting',               rev: 'resistance to change, bad luck, holding the wheel still',
    m: 'The Wheel turns with or without consent — kings become beggars and beggars become kings, all by the motion of forces larger than any single life. The only meaningful position is at the centre, where the wheel\'s turning is felt but does not sweep you off.' },
  { n: 'Justice',             a: 'major', num: 11, up: 'truth, fairness, cause and effect, accountability',            rev: 'injustice, evasion, imbalance',
    m: 'Justice holds scales and a sword with eyes open — unlike Fortune\'s blindfolded deity, she sees clearly and cuts accordingly. Every choice creates a consequence; what is brought before this card will be weighed against what is true, not what is wished.' },
  { n: 'The Hanged Man',      a: 'major', num: 12, up: 'surrender, new perspective, suspension, letting go',           rev: 'stalling, resistance, needless sacrifice',
    m: 'The Hanged Man dangles by one foot from a living tree, utterly calm — his face is serene because the suspension is chosen, not imposed. The world seen upside down reveals what cannot be seen from the usual angle; the price is only the willingness to stop.' },
  { n: 'Death',               a: 'major', num: 13, up: 'transformation, endings, release, profound change',            rev: 'clinging, fear of change, stagnation',
    m: 'Death rides a pale horse past figures of every rank — pope, king, child — and none are exempt from what must end. The card is rarely literal; it marks the threshold where one form of life must fully close before another can genuinely begin.' },
  { n: 'Temperance',          a: 'major', num: 14, up: 'balance, patience, synthesis, the middle way',                 rev: 'excess, imbalance, impatience',
    m: 'An angel pours water between two cups in a continuous flow, one foot on land and one in the stream — moderation not as restriction but as art. The blend that neither cup alone could produce is the whole point; Temperance is alchemy in practice.' },
  { n: 'The Devil',           a: 'major', num: 15, up: 'attachment, shadow, the cage you can leave, material bind',    rev: 'release, breaking free, reclaiming power',
    m: 'Two figures are chained to the Devil\'s pedestal — but the chains are loose enough to slip over their heads. The card\'s sting is in that detail: the prison is real but not locked, and those inside have stopped noticing the chain is light.' },
  { n: 'The Tower',           a: 'major', num: 16, up: 'sudden upheaval, revelation, the false structure falls',       rev: 'fear of disaster, delayed collapse, averted ruin',
    m: 'Lightning strikes a tower built on false foundations and figures fall through the air — the destruction is instant and complete. The Tower does not punish; it reveals: whatever was built on something untrue cannot stand, and the sooner it falls, the sooner something true can be built.' },
  { n: 'The Star',            a: 'major', num: 17, up: 'hope, renewal, serenity, faith restored',                      rev: 'despair, disconnection, faith shaken',
    m: 'A naked woman kneels at a pool beneath a canopy of stars, pouring water back into earth and stream without anxiety — there is enough, and it flows. The Star follows the Tower; what survives the collapse is this: the quiet certainty that the water keeps moving.' },
  { n: 'The Moon',            a: 'major', num: 18, up: 'illusion, the unconscious, dreams, what is not yet clear',     rev: 'clarity emerging, fear released, truth surfacing',
    m: 'The Moon illuminates a path between two towers while a crayfish crawls from dark water — everything is visible but nothing is certain, each shadow potentially real or imagined. The only way through is to keep walking the path and trust that daylight will come.' },
  { n: 'The Sun',             a: 'major', num: 19, up: 'joy, vitality, success, radiant clarity',                      rev: 'temporary clouds, dimmed light, inner child neglected',
    m: 'A child rides a white horse through a field of sunflowers, arms wide, face lifted — the card is pure and uncomplicated in a way that only becomes possible after the Moon\'s long walk. The Sun is not naive joy but earned radiance: clarity that has come through.' },
  { n: 'Judgement',           a: 'major', num: 20, up: 'reckoning, awakening, the call, rebirth',                      rev: 'self-doubt, refusal of the call, harsh self-judgement',
    m: 'An angel sounds a trumpet and figures rise from coffins with arms raised — not resurrection by accident but in response to a call they cannot ignore. Judgement asks whether you will answer the signal when it comes, or whether you will stay in the comfortable coffin because you know its dimensions.' },
  { n: 'The World',           a: 'major', num: 21, up: 'completion, wholeness, integration, the cycle fulfilled',      rev: 'incompletion, loose ends, delayed closure',
    m: 'A dancer moves within a laurel wreath, surrounded by the four fixed signs — the whole world held in one image, nothing excluded. The World is not an ending but a completion: the cycle closes cleanly enough that the next one can begin with nothing owed.' },

  // ── Wands (Fire — will, drive, creativity) ──
  { n: 'Ace of Wands',    a: 'wands', num: 1,  up: 'spark, inspiration, new venture, raw potential',      rev: 'delays, false start, lack of energy',
    m: 'A hand extends from a cloud offering a single wand still sprouting leaves — the idea has arrived before any plan has. This is the moment before momentum, when the only required act is to take hold.' },
  { n: 'Two of Wands',    a: 'wands', num: 2,  up: 'planning, future vision, decision, first step',       rev: 'fear of the unknown, playing safe, indecision',
    m: 'A figure stands on a rampart holding a globe, gazing past the walls at a world not yet traveled — one wand is already planted, one is in hand. The first step has been taken; the question now is whether to act on the vision or watch it from safety.' },
  { n: 'Three of Wands',  a: 'wands', num: 3,  up: 'expansion, foresight, ships coming in, progress',     rev: 'delays, obstacles, limited vision',
    m: 'Three wands planted on a cliff overlook a harbour where ships return — what was sent out is coming back with cargo. Expansion here is not an aspiration but a process already underway, requiring patience rather than another launch.' },
  { n: 'Four of Wands',   a: 'wands', num: 4,  up: 'celebration, homecoming, harmony, milestone',         rev: 'transition, instability, lack of support',
    m: 'Four wands form a flower-garlanded canopy beneath which two figures welcome returning revelers — a moment of genuine rest earned by reaching a milestone. The Four of Wands is permission to stop and mark the progress before moving again.' },
  { n: 'Five of Wands',   a: 'wands', num: 5,  up: 'competition, conflict, friction, struggle',           rev: 'avoiding conflict, resolution, inner tension',
    m: 'Five figures clash with wands in a chaotic tangle where it\'s unclear whether they\'re fighting or playing — the competition is real but the stakes are unclear. Creative friction and genuine conflict live in the same card; only context reveals which this is.' },
  { n: 'Six of Wands',    a: 'wands', num: 6,  up: 'victory, recognition, public success, momentum',      rev: 'private win, ego, fall from grace',
    m: 'A victor rides through a crowd wearing a laurel wreath while those around lift their own wands in celebration — public recognition following genuine effort. The danger the Six carries is mistaking the crowd\'s response for the measure of the achievement.' },
  { n: 'Seven of Wands',  a: 'wands', num: 7,  up: 'defence, standing your ground, conviction',           rev: 'overwhelm, giving up, exhaustion',
    m: 'A figure on high ground holds one wand against six raised from below, the advantage of position barely compensating for the odds. This is the moment after success when others arrive to contest what you\'ve built; ground must be defended, not abandoned.' },
  { n: 'Eight of Wands',  a: 'wands', num: 8,  up: 'speed, movement, swift action, messages',             rev: 'delays, frustration, scattered energy',
    m: 'Eight wands arc through clear sky in perfect parallel — the air itself seems to move. Something long delayed is finally in flight; the only error now would be to hesitate when momentum has done the hard work of lifting off.' },
  { n: 'Nine of Wands',   a: 'wands', num: 9,  up: 'resilience, last stand, persistence, near the end',   rev: 'depletion, defensiveness, burnout',
    m: 'A wounded figure leans on a wand with eight behind him, eyes wary — he has been through this before and the marks are visible. The Nine of Wands does not promise ease; it promises that what has already survived this much can survive one push more.' },
  { n: 'Ten of Wands',    a: 'wands', num: 10, up: 'burden, responsibility, the heavy load, near completion', rev: 'release, delegation, collapse under weight',
    m: 'A figure carries ten wands bundled awkwardly, bent forward by the weight, the destination visible ahead. The load is real and the strain is real; the question is whether the load is being carried because it must be, or because putting it down has stopped feeling like an option.' },
  { n: 'Page of Wands',   a: 'wands', num: 11, up: 'enthusiasm, exploration, free spirit, a spark of news', rev: 'aimlessness, false start, hesitation',
    m: 'A young figure examines a budding wand with fascination, dressed for adventure but not yet gone — the fire is lit but direction has not yet been chosen. Pages carry messages; this one\'s message is that something interesting has arrived and it deserves attention.' },
  { n: 'Knight of Wands', a: 'wands', num: 12, up: 'passion, action, adventure, impulsive drive',         rev: 'recklessness, impatience, scattered fire',
    m: 'The Knight of Wands charges on a rearing horse with wand raised, moving because stillness is intolerable — action is the point and direction is secondary. At best this is infectious courage; at worst it burns through everything including the goal.' },
  { n: 'Queen of Wands',  a: 'wands', num: 13, up: 'confidence, warmth, magnetism, self-assured fire',    rev: 'self-doubt, jealousy, demanding',
    m: 'The Queen of Wands sits with a sunflower and a black cat — fire made warm, power made generous, certainty made welcoming. She does not need others\' approval because her fire comes from inside; she gives it freely because there is more where it came from.' },
  { n: 'King of Wands',   a: 'wands', num: 14, up: 'vision, leadership, bold mastery, natural authority',  rev: 'impulsiveness, domineering, overreach',
    m: 'The King of Wands looks as though he might rise from his throne at any moment — the vision is bigger than the seat. He leads not by managing but by embodying the direction so clearly that others follow without being told.' },

  // ── Cups (Water — emotion, relationship, intuition) ──
  { n: 'Ace of Cups',    a: 'cups', num: 1,  up: 'new feeling, love, overflowing heart, emotional opening', rev: 'blocked emotion, emptiness, withheld love',
    m: 'A cup overflows with water beneath a dove descending — the heart opening is not dramatic but quiet and unstoppable, like rain beginning. The Ace of Cups is the first yes before any thought intervenes.' },
  { n: 'Two of Cups',    a: 'cups', num: 2,  up: 'partnership, mutual love, connection, union',           rev: 'imbalance, broken bond, tension',
    m: 'Two figures face each other raising cups in a joined pledge beneath a caduceus — the exchange is equal, the recognition mutual. This is connection where both arrive whole rather than seeking to be completed by the other.' },
  { n: 'Three of Cups',  a: 'cups', num: 3,  up: 'friendship, celebration, community, shared joy',        rev: 'isolation, gossip, overindulgence',
    m: 'Three women raise their cups in a dancing circle surrounded by harvest abundance — the joy here requires witnesses and is multiplied by being shared. What cannot be celebrated alone is meant for this kind of gathering.' },
  { n: 'Four of Cups',   a: 'cups', num: 4,  up: 'apathy, contemplation, the offer unseen, withdrawal',   rev: 'new awareness, acceptance, re-engagement',
    m: 'A figure sits under a tree staring at three cups on the ground while a fourth is offered from a cloud — and he doesn\'t see it. The Four of Cups is the blindness that comes from being absorbed in what is missing rather than open to what is being offered.' },
  { n: 'Five of Cups',   a: 'cups', num: 5,  up: 'grief, loss, focus on what is gone, regret',            rev: 'acceptance, moving on, finding what remains',
    m: 'A cloaked figure stares at three spilled cups while two full ones stand upright behind them — grief is real here and not to be rushed past. But the card holds both: the loss that deserves mourning and the cups still standing when the mourning is done.' },
  { n: 'Six of Cups',    a: 'cups', num: 6,  up: 'nostalgia, memory, innocence, the past returning',      rev: 'stuck in the past, leaving home, growing up',
    m: 'A child offers a cup filled with flowers to a smaller child in a village scene — the past arriving as a gift, unbidden and warm. Memory here is not escapism but reunion with something that still has something to give.' },
  { n: 'Seven of Cups',  a: 'cups', num: 7,  up: 'choices, fantasy, illusion, too many options',          rev: 'clarity, decisive choice, dispelled illusion',
    m: 'A figure stands before seven cups in the clouds, each containing a different vision — wealth, victory, a castle, a wreath, a dragon, a head, a shrouded figure. Not all of them are what they appear; one choice is real and six are the mind dreaming instead of deciding.' },
  { n: 'Eight of Cups',  a: 'cups', num: 8,  up: 'walking away, search for meaning, leaving the known',   rev: 'fear of change, staying too long, drifting back',
    m: 'A figure walks away from eight neatly stacked cups into a dark mountain landscape — not in anger but in quiet recognition that what was built is not what was needed. The Eight of Cups is the kind of leaving that takes more courage than staying.' },
  { n: 'Nine of Cups',   a: 'cups', num: 9,  up: 'contentment, wish fulfilled, satisfaction',             rev: 'inner lack, smugness, unfulfilled wish',
    m: 'A satisfied figure sits before nine cups arranged like a display — arms crossed, expression content, everything in order. The wish-card of the deck; what has been asked for is here or coming, and the satisfaction is genuine rather than performed.' },
  { n: 'Ten of Cups',    a: 'cups', num: 10, up: 'harmony, family, emotional fulfilment, lasting joy',    rev: 'broken harmony, misalignment, strained bonds',
    m: 'A couple stands with two dancing children beneath a rainbow arc of ten cups — not the peak moment of passion but the deep, quiet joy of a life that has settled into what it was meant to be. This is the emotional version of wholeness.' },
  { n: 'Page of Cups',   a: 'cups', num: 11, up: 'tender message, intuition, creative feeling, openness', rev: 'emotional immaturity, blocked creativity',
    m: 'The Page of Cups holds a cup from which a fish peers out — dreamy, surprised by its own imagination, utterly open to the unexpected. Messages arrive through feeling before they arrive through words; this Page is the willingness to receive them.' },
  { n: 'Knight of Cups', a: 'cups', num: 12, up: 'romance, the offer, following the heart, idealism',     rev: 'moodiness, unrealistic, broken promise',
    m: 'The Knight of Cups rides slowly forward with a cup extended like an offering — calm where the other knights are charging, idealistic where they are strategic. He arrives with feeling rather than force; what he brings is real if the receiver is ready.' },
  { n: 'Queen of Cups',  a: 'cups', num: 13, up: 'compassion, emotional depth, intuition, nurture',       rev: 'overwhelm, codependence, emotional flooding',
    m: 'The Queen of Cups holds an ornate covered cup, gazing at it as though she can see inside — her power is in what she perceives, not what she commands. She knows the emotional truth of a situation before it is spoken and holds it with care rather than judgment.' },
  { n: 'King of Cups',   a: 'cups', num: 14, up: 'emotional mastery, calm, diplomacy, steady heart',      rev: 'volatility, suppression, manipulation',
    m: 'The King of Cups sits on a stone throne in a turbulent sea, unmoved — not because he feels nothing but because he has learned to feel without being swept away. Emotional mastery is not detachment; it is the ability to stay present in the wave.' },

  // ── Swords (Air — mind, truth, conflict) ──
  { n: 'Ace of Swords',    a: 'swords', num: 1,  up: 'breakthrough, clarity, truth, mental sharpness',     rev: 'confusion, brutal truth, clouded mind',
    m: 'A hand extends from a cloud holding a sword crowned with light — the blade cuts through everything that obscures. The Ace of Swords is the moment of absolute clarity when what is true becomes undeniable regardless of whether it is welcome.' },
  { n: 'Two of Swords',    a: 'swords', num: 2,  up: 'stalemate, hard choice, avoidance, blindfolded',     rev: 'decision made, truth faced, release',
    m: 'A blindfolded figure holds two swords crossed over her heart, the sea behind her — refusing to look at a choice that has already been made by everything except the looking. The Two of Swords cannot stay; the blindfold eventually has to come off.' },
  { n: 'Three of Swords',  a: 'swords', num: 3,  up: 'heartbreak, painful truth, grief, the cut',          rev: 'healing, recovery, releasing pain',
    m: 'Three swords pierce a heart against a stormy sky — direct, unambiguous, no softening. The Three of Swords is not a warning but a diagnosis: something has been severed, and the pain of it is real enough to require acknowledgment before healing can start.' },
  { n: 'Four of Swords',   a: 'swords', num: 4,  up: 'rest, recovery, retreat, stillness',                 rev: 'restlessness, burnout, forced pause ending',
    m: 'A knight lies in effigy on a tomb, three swords on the wall and one beneath — the pause between battles, chosen or imposed. The Four of Swords asks that the sword be set down; what cannot be thought through in motion can sometimes only be resolved in stillness.' },
  { n: 'Five of Swords',   a: 'swords', num: 5,  up: 'conflict, hollow victory, tension, defeat',          rev: 'reconciliation, releasing resentment, walking away',
    m: 'A figure gathers fallen swords while two others walk away, heads down — winning a fight that cost the relationships it was fought over. The Five of Swords asks what was actually gained, and whether the victory was worth what it required to win.' },
  { n: 'Six of Swords',    a: 'swords', num: 6,  up: 'transition, moving on, calmer waters ahead',         rev: 'stuck, resistance to moving, unfinished journey',
    m: 'A figure and a child are ferried across water toward a calmer shore, six swords planted in the bow — not a triumphant crossing but a necessary one. The water behind was rougher; the destination is not paradise but it is forward, and forward is what is needed.' },
  { n: 'Seven of Swords',  a: 'swords', num: 7,  up: 'strategy, stealth, acting alone, getting away',      rev: 'confession, exposure, returning what was taken',
    m: 'A figure slips away from a camp carrying five swords with two left behind, glancing over his shoulder — operating outside the rules, gathering intelligence, or simply taking what wasn\'t offered. Whether cunning or dishonest depends on what the swords are for.' },
  { n: 'Eight of Swords',  a: 'swords', num: 8,  up: 'restriction, self-imposed cage, feeling trapped',    rev: 'release, new perspective, freeing yourself',
    m: 'A bound and blindfolded figure stands surrounded by swords, the sea behind her — but the swords are loosely arranged and the bindings could be worked free. The prison of the Eight of Swords is not external; the belief that escape is impossible is the only lock that holds.' },
  { n: 'Nine of Swords',   a: 'swords', num: 9,  up: 'anxiety, fear, the 3am mind, mental anguish',        rev: 'hope returning, facing fear, recovery',
    m: 'A figure sits up in bed with head in hands, nine swords hanging on the wall — the darkest hour of the mind, 3am logic, the thoughts that grow teeth at night. The Nine of Swords does not exaggerate; it simply refuses to pretend the anguish is not real.' },
  { n: 'Ten of Swords',    a: 'swords', num: 10, up: 'rock bottom, painful ending, the worst is over',     rev: 'recovery, survival, the only way is up',
    m: 'A figure lies face-down with ten swords in their back against a dark sky — the ending is complete and total, nothing equivocal about it. The strange mercy of the Ten of Swords is this: when you have hit absolute bottom, there is no further to fall, and the dawn is beginning at the horizon.' },
  { n: 'Page of Swords',   a: 'swords', num: 11, up: 'curiosity, new ideas, vigilance, mental energy',     rev: 'scattered thinking, gossip, hasty words',
    m: 'The Page of Swords stands on a windswept hill, sword raised, alert to every movement — young, sharp, watching for something not yet visible. The mind is running ahead of the experience; insight and impulsiveness live in this figure together.' },
  { n: 'Knight of Swords', a: 'swords', num: 12, up: 'drive, decisive action, charging forward, ambition', rev: 'recklessness, aggression, no plan',
    m: 'The Knight of Swords charges through a storm at full gallop, cutting directly through whatever is in the way — momentum as a substitute for strategy. At best this is decisive courage; at worst it destroys the very thing it was riding toward.' },
  { n: 'Queen of Swords',  a: 'swords', num: 13, up: 'clear sight, independence, honest perception',       rev: 'coldness, bitterness, harsh judgement',
    m: 'The Queen of Swords sits erect with blade raised and one hand extended, seeing clearly and without sentiment — she has experienced enough loss to stop being surprised by truth. Her perception is a gift when it cuts through illusion; it is a wound when it mistakes honesty for cruelty.' },
  { n: 'King of Swords',   a: 'swords', num: 14, up: 'intellectual mastery, truth, authority, clear judgement', rev: 'manipulation, tyranny of logic, cold control',
    m: 'The King of Swords sits with an upright blade and a direct gaze — he governs by principle, not preference, and his rulings hold even when they cost him something. Truth is the only standard he recognises; the question is whether his truth has room for what cannot be measured.' },

  // ── Pentacles (Earth — body, work, material) ──
  { n: 'Ace of Pentacles',    a: 'pentacles', num: 1,  up: 'opportunity, prosperity, new resource, manifestation', rev: 'missed chance, scarcity mindset, delay',
    m: 'A hand extends from a cloud offering a single pentacle over a garden in full bloom — the seed of material possibility, a door opening where ground was bare. What is offered here is real and will grow if the work follows the opening.' },
  { n: 'Two of Pentacles',    a: 'pentacles', num: 2,  up: 'balance, juggling, adaptability, priorities',     rev: 'overwhelm, dropped ball, disorganisation',
    m: 'A figure in a jester\'s cap juggles two pentacles in an infinity loop while ships ride turbulent waves behind him — the dance of maintaining multiple things without losing either. The Two of Pentacles is not crisis; it is the specific art of moving with the motion rather than against it.' },
  { n: 'Three of Pentacles',  a: 'pentacles', num: 3,  up: 'collaboration, craft, building together, skill',  rev: 'misalignment, poor teamwork, lack of mastery',
    m: 'Three figures confer over a blueprint in a cathedral — an architect, a monk, and a craftsman, each essential to what is being built. The Three of Pentacles honours the point where individual mastery meets collective vision and the result is larger than any one person could achieve.' },
  { n: 'Four of Pentacles',   a: 'pentacles', num: 4,  up: 'security, holding on, saving, control',           rev: 'release, generosity, letting go of grip',
    m: 'A figure sits clutching a pentacle on his crown and two beneath his feet while a city recedes behind him — accumulation as defense, security that has tightened into something else. What began as prudence can become a kind of poverty when holding on prevents anything new from arriving.' },
  { n: 'Five of Pentacles',   a: 'pentacles', num: 5,  up: 'hardship, lack, feeling left out, scarcity',      rev: 'recovery, help arriving, end of hard times',
    m: 'Two figures in thin clothes trudge past a lit church window in the snow — outside the warmth, in real want, yet the door is not mentioned. The Five of Pentacles is the suffering that comes with material lack and the invisible pride that makes it harder to step inside.' },
  { n: 'Six of Pentacles',    a: 'pentacles', num: 6,  up: 'generosity, giving and receiving, balance',       rev: 'strings attached, inequality, debt',
    m: 'A wealthy merchant holds scales and distributes coins to two kneeling figures — generosity in action, but the power differential is part of the image. The Six of Pentacles asks whether what is being given is truly freely given, and whether what is being received comes with an invisible cost.' },
  { n: 'Seven of Pentacles',  a: 'pentacles', num: 7,  up: 'patience, long-term view, the harvest waits',     rev: 'impatience, poor return, wasted effort',
    m: 'A figure leans on a staff gazing at pentacles growing on a vine — the planting is done, the tending continues, and there is nothing to do but wait. The Seven of Pentacles is the uncomfortable middle of long work where results are not yet visible and commitment must be its own reward.' },
  { n: 'Eight of Pentacles',  a: 'pentacles', num: 8,  up: 'mastery, diligence, refining the craft, focus',   rev: 'perfectionism, uninspired work, cutting corners',
    m: 'A craftsman works steadily at his bench with finished pentacles hung like a display behind him — not talent but repetition, the kind of work where the 100th attempt is better than the first. Mastery is built here, one unspectacular session at a time.' },
  { n: 'Nine of Pentacles',   a: 'pentacles', num: 9,  up: 'self-sufficiency, earned comfort, refinement',    rev: 'overwork, financial dependence, hollow luxury',
    m: 'A richly dressed figure walks a garden alone with a trained bird on her hand — abundance earned through her own work, enjoyed on her own terms. The Nine of Pentacles is the quiet dignity of having built something that sustains you without requiring constant performance of need.' },
  { n: 'Ten of Pentacles',    a: 'pentacles', num: 10, up: 'legacy, lasting wealth, family, foundation',      rev: 'instability, fleeting success, family conflict',
    m: 'An elder sits among grandchildren and dogs within a household archway hung with pentacles — generations benefiting from foundations laid before they were born. The Ten of Pentacles asks not what you accumulate but what you leave behind.' },
  { n: 'Page of Pentacles',   a: 'pentacles', num: 11, up: 'study, new opportunity, ambition, groundwork',    rev: 'procrastination, missed lesson, lack of focus',
    m: 'The Page of Pentacles holds a single coin and gazes at it with total absorption, standing in a field — methodical, curious, not yet in motion but preparing the ground. Learning at this stage is itself the work; what is studied here becomes the foundation for everything built later.' },
  { n: 'Knight of Pentacles', a: 'pentacles', num: 12, up: 'diligence, routine, reliability, steady progress', rev: 'stagnation, boredom, overcaution',
    m: 'The Knight of Pentacles sits on a motionless horse in a plowed field, holding his pentacle with careful attention — where other knights charge, this one stays. What he lacks in dramatic speed he makes up in the thing that actually produces results: showing up consistently, doing the work whether it is interesting or not.' },
  { n: 'Queen of Pentacles',  a: 'pentacles', num: 13, up: 'nurture, practicality, abundance, grounded care', rev: 'self-neglect, smothering, work-life imbalance',
    m: 'The Queen of Pentacles sits in a lush garden with a pentacle in her lap, a rabbit at her feet — wealth here is not display but warmth, abundance as something that flows toward the people in her care. She tends what she has and it multiplies because she pays attention.' },
  { n: 'King of Pentacles',   a: 'pentacles', num: 14, up: 'wealth, mastery of the material, stability, provider', rev: 'greed, stubbornness, controlling',
    m: 'The King of Pentacles sits on a vine-carved throne in full regalia, his garden and castle behind him — what was planted across decades is fully expressed now. He has learned that real wealth is what you have built that remains standing without constant effort to hold it up.' },
];

// ─── Date-seeded draws ───────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export interface DrawnCard { card: TarotCard; reversed: boolean }

/**
 * Daily card — deterministic per (date, salt). LQ shifts the field:
 * low LQ surfaces more reversed (blocked / shadow) cards; high LQ keeps mostly upright.
 * LQ in [0,1]. salt lets multiple daily draws differ (e.g. spread positions).
 */
export function drawDailyCard(lq = 0.5, salt = ''): DrawnCard {
  const seed = hashStr(todayKey() + '|' + salt);
  const idx = seed % TAROT_DECK.length;
  // Reversal: second hash normalized 0..1. Reversed when value exceeds (LQ floored).
  // Low LQ → low threshold → more reversals. Clamp so high LQ still gets ~15% reversals.
  const r = (hashStr(String(seed) + 'rev') % 1000) / 1000;
  const threshold = Math.max(0.15, Math.min(0.85, lq));
  const reversed = r > threshold;
  return { card: TAROT_DECK[idx], reversed };
}

/** Random draw — not seeded, different every call. For shuffle/reshuffle UX. */
export function drawRandomCard(lq = 0.5): DrawnCard {
  const idx = Math.floor(Math.random() * TAROT_DECK.length);
  const threshold = Math.max(0.15, Math.min(0.85, lq));
  const reversed = Math.random() > threshold;
  return { card: TAROT_DECK[idx], reversed };
}

/**
 * Draw N distinct cards for a spread (date-seeded, no repeats).
 * Position index is folded into the salt so each slot is stable per day.
 */
export function drawSpread(count: number, lq = 0.5, salt = ''): DrawnCard[] {
  const order = TAROT_DECK.map((_, i) => i);
  // Fisher-Yates seeded by date+salt
  let s = hashStr(todayKey() + '|spread|' + salt);
  for (let i = order.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const threshold = Math.max(0.15, Math.min(0.85, lq));
  return order.slice(0, count).map((idx, pos) => {
    const r = (hashStr(String(idx) + 'rev' + pos) % 1000) / 1000;
    return { card: TAROT_DECK[idx], reversed: r > threshold };
  });
}

export function cardLine(d: DrawnCard): string {
  const kw = d.reversed ? d.card.rev : d.card.up;
  return `${d.card.n}${d.reversed ? ' (reversed)' : ''} — ${kw}`;
}
