// ─── THOTH TAROT ATTRIBUTIONS ─────────────────────────────────────────────────
// Aleister Crowley / Lady Frieda Harris system (1944).
// Grounding layer for Sol readings — practitioners will clock a wrong attribution
// immediately. Hebrew letters, astrological bodies, Kabbalistic paths, decan rulers.
//
// Key Thoth naming differences from RWS:
//   Strength → Lust (VIII)
//   Justice → Adjustment (XI, moved to VIII in some orderings — Thoth keeps XI)
//   Wheel of Fortune → Fortune (X)
//   Judgement → The Aeon (XX)
//   The World → The Universe (XXI)
//   Pentacles → Disks
//   Knight → King (active/mounted), King → Prince (in chariot), Page → Princess
//
// Structure:
//   Major Arcana: 22 cards, paths 11–32 on the Tree of Life
//   Minor Arcana: 40 pip cards (Ace–10 × 4 suits)
//   Court Cards: 16 cards (Knight/Queen/Prince/Princess × 4 suits)
// ──────────────────────────────────────────────────────────────────────────────

export interface ThothMajor {
  num: number;
  name: string;          // Thoth name
  rwsName: string;       // RWS equivalent for cross-reference
  hebrewLetter: string;
  hebrewMeaning: string;
  path: number;          // Tree of Life path (11–32)
  from: string;          // Sephirah connecting from
  to: string;            // Sephirah connecting to
  astro: string;         // Astrological attribution
  element?: string;      // Elemental attribution (where applicable)
  keywords: string;
  thothNote: string;     // What makes this card distinctly Thoth
}

export interface ThothMinor {
  name: string;
  suit: 'wands' | 'cups' | 'swords' | 'disks';
  num: number;           // 1–10
  astro: string;         // Decan ruler (e.g. "Mars in Aries")
  sephirah: string;      // Kabbalistic position (e.g. "Chokmah")
  keywords: string;
  thothNote: string;
}

export interface ThothCourt {
  name: string;          // Thoth name (Knight/Queen/Prince/Princess)
  rwsName: string;       // RWS equivalent
  suit: 'wands' | 'cups' | 'swords' | 'disks';
  element: string;       // Elemental nature (e.g. "Fire of Fire")
  astro: string;         // Astrological range
  keywords: string;
}

// ── ELEMENTS + SUITS ──────────────────────────────────────────────────────────

export const THOTH_SUITS = {
  wands:  { element: 'Fire',  world: 'Atziluth',  quality: 'Will, primal force, spirit' },
  cups:   { element: 'Water', world: 'Briah',     quality: 'Feeling, reflection, soul' },
  swords: { element: 'Air',   world: 'Yetzirah',  quality: 'Mind, conflict, intellect' },
  disks:  { element: 'Earth', world: 'Assiah',    quality: 'Matter, body, manifestation' },
} as const;

// ── MAJOR ARCANA ──────────────────────────────────────────────────────────────

export const THOTH_MAJOR: ThothMajor[] = [
  {
    num: 0, name: 'The Fool', rwsName: 'The Fool',
    hebrewLetter: 'Aleph', hebrewMeaning: 'Ox',
    path: 11, from: 'Kether', to: 'Chokmah',
    astro: 'Air', element: 'Air',
    keywords: 'pure spirit, the zero, infinite potential, the divine madness',
    thothNote: 'The Fool leaps into the abyss not in ignorance but in absolute trust. The crocodile below is not threat but transformation. Zero is not nothing — it is all numbers before they choose to be one.',
  },
  {
    num: 1, name: 'The Magus', rwsName: 'The Magician',
    hebrewLetter: 'Beth', hebrewMeaning: 'House',
    path: 12, from: 'Kether', to: 'Binah',
    astro: 'Mercury',
    keywords: 'will, communication, skill, the word made flesh',
    thothNote: 'Called The Magus in Thoth — the emphasis shifts from showmanship to pure Mercury: the messenger, the trickster, the one who makes the Word real. The tools float around him unmastered; the mastery is in his relationship with Mercury itself.',
  },
  {
    num: 2, name: 'The Priestess', rwsName: 'The High Priestess',
    hebrewLetter: 'Gimel', hebrewMeaning: 'Camel',
    path: 13, from: 'Kether', to: 'Tiphareth',
    astro: 'Moon',
    keywords: 'the hidden, pure intuition, the unmanifest feminine, the veil before mystery',
    thothNote: 'The camel crosses the desert between the supernals — she carries what cannot be spoken across the Abyss. The bow she holds is the crescent moon; the crystal she sits upon refracts all light into the spectrum of manifestation.',
  },
  {
    num: 3, name: 'The Empress', rwsName: 'The Empress',
    hebrewLetter: 'Daleth', hebrewMeaning: 'Door',
    path: 14, from: 'Chokmah', to: 'Binah',
    astro: 'Venus',
    keywords: 'fertility, abundance, creative nature, the world made flesh and good',
    thothNote: 'The door between the two great pillars of force and form. She is pregnant with all manifestation — Venus as the great creative force, not merely romantic love but the love that makes things exist.',
  },
  {
    num: 4, name: 'The Emperor', rwsName: 'The Emperor',
    hebrewLetter: 'Tzaddi', hebrewMeaning: 'Fish-hook',
    path: 28, from: 'Netzach', to: 'Yesod',
    astro: 'Aries',
    keywords: 'authority, structure, the will to order, solar power of the masculine',
    thothNote: 'Note: Crowley swapped Tzaddi and Heh between The Emperor and The Star, stating "All these old letters of my Book are aright; but Tzaddi is not the Star." The Emperor takes Tzaddi; The Star takes Heh.',
  },
  {
    num: 5, name: 'The Hierophant', rwsName: 'The Hierophant',
    hebrewLetter: 'Vau', hebrewMeaning: 'Nail',
    path: 16, from: 'Chokmah', to: 'Chesed',
    astro: 'Taurus',
    keywords: 'tradition, initiation, the inner teacher, sacred knowledge transmitted',
    thothNote: 'The nail that holds the worlds together — the link between the divine and the human. Crowley emphasises the initiatory function over institutional religion: the Hierophant as the inner voice of tradition that has survived because it is true.',
  },
  {
    num: 6, name: 'The Lovers', rwsName: 'The Lovers',
    hebrewLetter: 'Zain', hebrewMeaning: 'Sword',
    path: 17, from: 'Binah', to: 'Tiphareth',
    astro: 'Gemini',
    keywords: 'union of opposites, the royal marriage, discrimination, the great choice',
    thothNote: 'The sword of discrimination — not merely romantic union but the alchemical marriage of opposites. The figure performing the ceremony is Crowley himself; the image is drawn from the Rosicrucian alchemical tradition of the Chymical Wedding.',
  },
  {
    num: 7, name: 'The Chariot', rwsName: 'The Chariot',
    hebrewLetter: 'Cheth', hebrewMeaning: 'Fence',
    path: 18, from: 'Binah', to: 'Geburah',
    astro: 'Cancer',
    keywords: 'victory through will, the grail knight, control of opposing forces',
    thothNote: 'The fence that separates the sacred from the profane. The charioteer holds the Holy Grail — the Chariot is the vehicle of the grail quest. The four sphinxes below represent the four elements held in dynamic balance by pure will.',
  },
  {
    num: 8, name: 'Adjustment', rwsName: 'Justice',
    hebrewLetter: 'Lamed', hebrewMeaning: 'Ox-goad',
    path: 22, from: 'Geburah', to: 'Tiphareth',
    astro: 'Libra',
    keywords: 'cosmic balance, karma, the truth that cannot be negotiated with, Ma\'at',
    thothNote: 'Crowley renamed Justice to Adjustment — the emphasis is not legal or moral but cosmic. She is Ma\'at, the Egyptian goddess of truth and cosmic order. The diamond she balances upon is the perfect equilibrium that underlies all manifestation. She is paired with The Fool: 0 and 22, the alpha and omega of the Major Arcana.',
  },
  {
    num: 9, name: 'The Hermit', rwsName: 'The Hermit',
    hebrewLetter: 'Yod', hebrewMeaning: 'Hand / Semen',
    path: 20, from: 'Chesed', to: 'Tiphareth',
    astro: 'Virgo',
    keywords: 'the inner light, solitude as power, Mercurial intelligence, the seed',
    thothNote: 'Yod — the primal hand, the seed of all letters. In Thoth the Hermit is associated with Virgo and carries a three-headed serpent staff. He is not merely old and withdrawn but Hermes Trismegistus himself: the hermetic wisdom that illuminates from within.',
  },
  {
    num: 10, name: 'Fortune', rwsName: 'Wheel of Fortune',
    hebrewLetter: 'Kaph', hebrewMeaning: 'Palm of hand',
    path: 21, from: 'Chesed', to: 'Netzach',
    astro: 'Jupiter',
    keywords: 'cycles, the law of change, Jupiter\'s abundance, the wheel that turns',
    thothNote: 'Called Fortune in Thoth — stripped of the medieval wheel imagery, replaced by a pure symbol of cyclic cosmic law. The three figures (Sphinx, Hermanubis, Typhon) represent the three qualities of the three gunas: Sattvas, Rajas, Tamas. Fortune is neither good nor bad — it is the nature of manifestation to move.',
  },
  {
    num: 11, name: 'Lust', rwsName: 'Strength',
    hebrewLetter: 'Teth', hebrewMeaning: 'Serpent',
    path: 19, from: 'Chesed', to: 'Geburah',
    astro: 'Leo',
    keywords: 'Babalon, the Beast, creative fire, the joy of strength, sacred ecstasy',
    thothNote: 'Crowley\'s most radical renaming — Strength becomes Lust. Not carnal lust but the divine lust for existence, the creative joy of the infinite. The woman riding the lion-serpent is Babalon; the beast below carries the ten heads of the Qliphoth mastered. The cup she holds is the Holy Grail filled with the blood of saints — those who have given everything to the great work.',
  },
  {
    num: 12, name: 'The Hanged Man', rwsName: 'The Hanged Man',
    hebrewLetter: 'Mem', hebrewMeaning: 'Water',
    path: 23, from: 'Geburah', to: 'Hod',
    astro: 'Water', element: 'Water',
    keywords: 'suspension, sacrifice, reversal of perspective, the willing death',
    thothNote: 'Mem — the great water. The Hanged Man in Thoth dissolves into pure water; the ankh-cross he forms is the sign of Venus. The sacrifice here is voluntary — the mystic who suspends ordinary consciousness to receive what cannot be grasped right-side-up.',
  },
  {
    num: 13, name: 'Death', rwsName: 'Death',
    hebrewLetter: 'Nun', hebrewMeaning: 'Fish',
    path: 24, from: 'Tiphareth', to: 'Netzach',
    astro: 'Scorpio',
    keywords: 'transformation, the great work, putrefaction into new life, the scorpion eagle',
    thothNote: 'The fish — life that lives in the unconscious depths and transforms by dying. In Thoth, Death wields his scythe in a field of living things that include a king, a child, a serpent, and a fish — all transformation is included. The white rose at the bottom is Osiris; the black cross is the fixed cross of the elements. Nothing is destroyed, only transformed.',
  },
  {
    num: 14, name: 'Art', rwsName: 'Temperance',
    hebrewLetter: 'Samekh', hebrewMeaning: 'Prop / Support',
    path: 25, from: 'Tiphareth', to: 'Yesod',
    astro: 'Sagittarius',
    keywords: 'alchemical synthesis, the great work in progress, blending, the arrow of will',
    thothNote: 'Crowley renamed Temperance to Art — the alchemical operation of synthesis. The figure pours fire into water and water into fire simultaneously; the sun and moon merge. The rainbow garment contains all colours. This is not temperance as moderation but the Great Art: the transformation of the alchemist themselves through the work.',
  },
  {
    num: 15, name: 'The Devil', rwsName: 'The Devil',
    hebrewLetter: 'Ayin', hebrewMeaning: 'Eye',
    path: 26, from: 'Tiphareth', to: 'Hod',
    astro: 'Capricorn',
    keywords: 'Pan, creative force, matter fully inhabited, the eye of the goat',
    thothNote: 'The eye — direct perception of material reality without spiritual filter. Crowley\'s Devil is Pan, not Satan — the all, the creative force of nature fully expressed. The phallus is explicit; the goat is joyful. Matter is not fallen; it is the divine fully embodied. The chains of the chained figures are loose; they stay not from bondage but from choice.',
  },
  {
    num: 16, name: 'The Tower', rwsName: 'The Tower',
    hebrewLetter: 'Peh', hebrewMeaning: 'Mouth',
    path: 27, from: 'Netzach', to: 'Hod',
    astro: 'Mars',
    keywords: 'sudden awakening, the mouth of God speaks, war, the lightning flash of truth',
    thothNote: 'The mouth — the word of God that shatters false structures. In Thoth the Tower is the Eye of Shiva opening, the divine fire that burns away illusion. The dove (spirit) and the serpent (matter) fall together — both modes of being are shattered to be reborn. The lightning is the thirty-second path, the direct force of Mars.',
  },
  {
    num: 17, name: 'The Star', rwsName: 'The Star',
    hebrewLetter: 'Heh', hebrewMeaning: 'Window',
    path: 15, from: 'Chokmah', to: 'Tiphareth',
    astro: 'Aquarius',
    keywords: 'Nuit, the infinite sky, hope, the star goddess, cosmic possibility',
    thothNote: 'Heh — the window. Crowley associated The Star with Nuit, the Egyptian sky goddess, the infinite space of all possibility. The Aquarian quality is not water-bearer but the outpouring of stars. Nuit arches over all creation; each star is a possible world. This is the window through which the infinite looks in.',
  },
  {
    num: 18, name: 'The Moon', rwsName: 'The Moon',
    hebrewLetter: 'Qoph', hebrewMeaning: 'Back of the head',
    path: 29, from: 'Netzach', to: 'Malkuth',
    astro: 'Pisces',
    keywords: 'the unconscious, illusion, the dark path, atavistic resurgence',
    thothNote: 'The back of the head — the atavistic unconscious, the oldest parts of the brain activated. In Thoth the path through the Moon is the most dangerous: Anubis guards both sides of the path between the towers, and the scarab of Khephra rolls the sun through the underworld. The crayfish emerging from the pool is the oldest life reasserting itself in the new form.',
  },
  {
    num: 19, name: 'The Sun', rwsName: 'The Sun',
    hebrewLetter: 'Resh', hebrewMeaning: 'Head',
    path: 30, from: 'Hod', to: 'Yesod',
    astro: 'Sun',
    keywords: 'solar consciousness, joy, the twins, Ra-Hoor-Khuit',
    thothNote: 'The head — consciousness itself, the solar principle. In Thoth the twin children of RWS become the divine twins of the new aeon: the active and passive aspects of Horus. The butterfly above represents the soul fully freed. The Sun in Thoth is not innocent joy but solar initiation — the full waking of the Tiphareths consciousness.',
  },
  {
    num: 20, name: 'The Aeon', rwsName: 'Judgement',
    hebrewLetter: 'Shin', hebrewMeaning: 'Tooth / Fire',
    path: 31, from: 'Hod', to: 'Malkuth',
    astro: 'Fire', element: 'Fire',
    keywords: 'the new aeon of Horus, the great transformation of the age, the final fire',
    thothNote: 'Crowley\'s most significant replacement — Judgement becomes The Aeon. Not the Christian last judgement but the dawning of a new age: the Aeon of Horus replacing the Aeon of Osiris. Nuit arches above, Hadit burns at the centre, Ra-Hoor-Khuit stands as the crowned child. The old trumpets and dead rising are replaced by a cosmic reconfiguration of consciousness itself.',
  },
  {
    num: 21, name: 'The Universe', rwsName: 'The World',
    hebrewLetter: 'Tau', hebrewMeaning: 'Cross',
    path: 32, from: 'Yesod', to: 'Malkuth',
    astro: 'Saturn', element: 'Earth',
    keywords: 'completion, Saturn\'s crystallisation, the matter of the world fully realised',
    thothNote: 'The cross — Tau, the last letter, the completion of all. The dancing figure is surrounded by the four kerubic beasts (the fixed signs: Aquarius, Scorpio, Leo, Taurus) and a serpent that forms the oval of space. Saturn rules — not death but crystallisation, the form that will be held until the next great cycle begins.',
  },
];

// ── MINOR ARCANA — ACES ───────────────────────────────────────────────────────
// Aces = pure elemental force, root of their suit, attributed to Kether

export const THOTH_ACES = {
  wands:  { name: 'Ace of Wands',  sephirah: 'Kether in Atziluth', astro: 'Root of Fire',  keywords: 'pure will, the primal flame, the lightning rod of spirit' },
  cups:   { name: 'Ace of Cups',   sephirah: 'Kether in Briah',    astro: 'Root of Water', keywords: 'pure love, the grail overflowing, the root of all feeling' },
  swords: { name: 'Ace of Swords', sephirah: 'Kether in Yetzirah', astro: 'Root of Air',   keywords: 'pure intellect, the sword of truth, mind before thought' },
  disks:  { name: 'Ace of Disks',  sephirah: 'Kether in Assiah',   astro: 'Root of Earth', keywords: 'pure matter, the rose-cross of manifestation, the seed of all material things' },
};

// ── MINOR ARCANA — PIPS (2–10) ────────────────────────────────────────────────
// Decan attributions: each pip = one of the 36 decans of the zodiac
// Sephiroth: 2=Chokmah, 3=Binah, 4=Chesed, 5=Geburah, 6=Tiphareth,
//            7=Netzach, 8=Hod, 9=Yesod, 10=Malkuth

export const THOTH_PIPS: ThothMinor[] = [
  // ── WANDS ──
  { name: 'Two of Wands',   suit: 'wands', num: 2,  astro: 'Mars in Aries',      sephirah: 'Chokmah',   keywords: 'dominion, will established, the first act of power', thothNote: 'Mars in Aries — the first decan of the zodiac, pure martial fire at its most direct. Crowley titled it Dominion: the will that does not negotiate.' },
  { name: 'Three of Wands', suit: 'wands', num: 3,  astro: 'Sun in Aries',       sephirah: 'Binah',     keywords: 'virtue, established strength, the will made manifest', thothNote: 'Sun in Aries — solar will in the fire sign. Virtue here means strength in the original Latin sense: virtus, the power of the man.' },
  { name: 'Four of Wands',  suit: 'wands', num: 4,  astro: 'Venus in Aries',     sephirah: 'Chesed',    keywords: 'completion, the perfected work, celebration of achievement', thothNote: 'Venus in Aries — completion and beauty in the first fire. The will has found its form and rests in what it has made.' },
  { name: 'Five of Wands',  suit: 'wands', num: 5,  astro: 'Saturn in Leo',      sephirah: 'Geburah',   keywords: 'strife, the necessary conflict, energy in opposition', thothNote: 'Saturn in Leo — the constraint of Saturn in the sign of solar pride creates necessary conflict. Strife is not failure; it is the fire meeting resistance and growing stronger.' },
  { name: 'Six of Wands',   suit: 'wands', num: 6,  astro: 'Jupiter in Leo',     sephirah: 'Tiphareth', keywords: 'victory, the triumphant will, Jupiter\'s abundance in Leo', thothNote: 'Jupiter in Leo — the expansion of Jupiter in the royal fire sign. Victory is complete, earned, and radiant.' },
  { name: 'Seven of Wands', suit: 'wands', num: 7,  astro: 'Mars in Leo',        sephirah: 'Netzach',   keywords: 'valour, courage under pressure, the stand that must be made', thothNote: 'Mars in Leo — martial courage in the sign of the lion. Netzach (the sphere of victory/desire) + Mars in Leo = the courage that comes from wanting something enough to fight for it.' },
  { name: 'Eight of Wands', suit: 'wands', num: 8,  astro: 'Mercury in Sagittarius', sephirah: 'Hod',  keywords: 'swiftness, the arrow loosed, communication at speed', thothNote: 'Mercury in Sagittarius — the messenger in the sign of the arrow. Eight of Wands is the purest speed card in the deck: thought made into flight.' },
  { name: 'Nine of Wands',  suit: 'wands', num: 9,  astro: 'Moon in Sagittarius', sephirah: 'Yesod',   keywords: 'strength, the great reserve of power, moon in the archer', thothNote: 'Moon in Sagittarius — the reflective force of the moon in the expansive fire sign creates a reservoir of strength. Yesod (the foundation) + fire = deep reserves.' },
  { name: 'Ten of Wands',   suit: 'wands', num: 10, astro: 'Saturn in Sagittarius', sephirah: 'Malkuth', keywords: 'oppression, the burden of fire in matter, will weighted down', thothNote: 'Saturn in Sagittarius — the limitation of Saturn crushing the expansive fire of Sagittarius in the heaviest sphere. The fire that once soared now bears too much.' },

  // ── CUPS ──
  { name: 'Two of Cups',   suit: 'cups', num: 2,  astro: 'Venus in Cancer',     sephirah: 'Chokmah',   keywords: 'love, the first union, deep feeling reflected and received', thothNote: 'Venus in Cancer — love in the sign of home and deep feeling. The first and purest emotional union.' },
  { name: 'Three of Cups', suit: 'cups', num: 3,  astro: 'Mercury in Cancer',   sephirah: 'Binah',     keywords: 'abundance, the overflowing cup, joy in community', thothNote: 'Mercury in Cancer — communication of feeling, the word that carries emotion. Abundance flows from the meeting of mind and heart.' },
  { name: 'Four of Cups',  suit: 'cups', num: 4,  astro: 'Moon in Cancer',      sephirah: 'Chesed',    keywords: 'luxury, the too-full cup, satiation that numbs', thothNote: 'Moon in Cancer — the moon rules Cancer; here the emotional fullness becomes excess. Luxury is not always pleasure; it is also the inertia of having enough.' },
  { name: 'Five of Cups',  suit: 'cups', num: 5,  astro: 'Mars in Scorpio',     sephirah: 'Geburah',   keywords: 'disappointment, the cup that could not hold, loss and its residue', thothNote: 'Mars in Scorpio — the severance of Mars in the sign of deep water and transformation. What is lost cannot be recovered; what remains must be faced.' },
  { name: 'Six of Cups',   suit: 'cups', num: 6,  astro: 'Sun in Scorpio',      sephirah: 'Tiphareth', keywords: 'pleasure, the beauty in depth, Scorpionic joy', thothNote: 'Sun in Scorpio — the solar principle illuminating the deepest water. Pleasure here is not surface but the joy found in depth, the pleasure of having gone through something real.' },
  { name: 'Seven of Cups', suit: 'cups', num: 7,  astro: 'Venus in Scorpio',    sephirah: 'Netzach',   keywords: 'debauch, the cup that becomes poison, desire without direction', thothNote: 'Venus in Scorpio — beauty and love in the sign of transformation and obsession. The cups overflow but with putrefying water; desire without will becomes debauch.' },
  { name: 'Eight of Cups', suit: 'cups', num: 8,  astro: 'Saturn in Pisces',    sephirah: 'Hod',       keywords: 'indolence, the still water, withdrawal from feeling', thothNote: 'Saturn in Pisces — the weight of Saturn in the most fluid sign. The cups are still; nothing moves. Indolence is not rest — it is the water that has forgotten how to flow.' },
  { name: 'Nine of Cups',  suit: 'cups', num: 9,  astro: 'Jupiter in Pisces',   sephirah: 'Yesod',     keywords: 'happiness, the full tide, emotional completion', thothNote: 'Jupiter in Pisces — the great expander in the sign of the deep ocean. The nine cups overflow with clear water; this is the happiness that arises from emotional fullness, not grasping.' },
  { name: 'Ten of Cups',   suit: 'cups', num: 10, astro: 'Mars in Pisces',      sephirah: 'Malkuth',   keywords: 'satiety, the end of feeling, the cup that has held everything', thothNote: 'Mars in Pisces — the force of Mars in the final water sign, in the heaviest sphere. The satiety here is complete: the emotional journey has reached its end. Not tragedy — completion.' },

  // ── SWORDS ──
  { name: 'Two of Swords',   suit: 'swords', num: 2,  astro: 'Moon in Libra',      sephirah: 'Chokmah',   keywords: 'peace, the truce of crossed blades, mental equilibrium', thothNote: 'Moon in Libra — the reflected light of the moon in the sign of balance. Two swords cross in peace; the mind has reached a temporary equilibrium, neither advancing nor retreating.' },
  { name: 'Three of Swords', suit: 'swords', num: 3,  astro: 'Saturn in Libra',    sephirah: 'Binah',     keywords: 'sorrow, the wound of understanding, the price of clarity', thothNote: 'Saturn in Libra — limitation meeting the need for balance. The three swords pierce the rose; understanding can wound. Sorrow is not failure — it is the price of seeing clearly.' },
  { name: 'Four of Swords',  suit: 'swords', num: 4,  astro: 'Jupiter in Libra',   sephirah: 'Chesed',    keywords: 'truce, the rest between battles, the mind at temporary peace', thothNote: 'Jupiter in Libra — expansion in the sign of balance. Four Swords is the armistice: not victory, not defeat, but the necessary ceasefire that allows both sides to breathe.' },
  { name: 'Five of Swords',  suit: 'swords', num: 5,  astro: 'Venus in Aquarius',  sephirah: 'Geburah',   keywords: 'defeat, the loss that cannot be argued with, the sword that cuts through pride', thothNote: 'Venus in Aquarius — love and beauty in the most cerebral air sign, in the sphere of severity. Defeat: the mind that has met something it cannot defeat with thought alone.' },
  { name: 'Six of Swords',   suit: 'swords', num: 6,  astro: 'Mercury in Aquarius', sephirah: 'Tiphareth', keywords: 'science, the earned clarity, the mind at its peak', thothNote: 'Mercury in Aquarius — the messenger in the sign of universal mind, at the solar sphere of beauty and truth. This is the sword at its finest: Science — not cold data but the joy of clear understanding.' },
  { name: 'Seven of Swords', suit: 'swords', num: 7,  astro: 'Moon in Aquarius',   sephirah: 'Netzach',   keywords: 'futility, the clever plan that cannot work, intellect in the wrong place', thothNote: 'Moon in Aquarius — the emotional moon in the most impersonal air sign, in the sphere of desire. The swords are used cleverly but futilely; the intellect applied to a problem it cannot solve.' },
  { name: 'Eight of Swords', suit: 'swords', num: 8,  astro: 'Jupiter in Gemini',  sephirah: 'Hod',       keywords: 'interference, the mind that cuts itself, overthinking', thothNote: 'Jupiter in Gemini — expansion in the sign of the twins, in the sphere of Mercury. Interference: too many thoughts, too much information, the mind interfering with itself.' },
  { name: 'Nine of Swords',  suit: 'swords', num: 9,  astro: 'Mars in Gemini',     sephirah: 'Yesod',     keywords: 'cruelty, the mind turned against itself, the 3am thought', thothNote: 'Mars in Gemini — the war-force in the sign of the split mind, in the foundational sphere. Cruelty: the mind that has found a wound and will not stop pressing it. The 3am thought that returns.' },
  { name: 'Ten of Swords',   suit: 'swords', num: 10, astro: 'Sun in Gemini',      sephirah: 'Malkuth',   keywords: 'ruin, the final cut, total dissolution of the mental structure', thothNote: 'Sun in Gemini — the solar principle in the dual sign, in the heaviest sphere. Ruin: not merely defeat but the total collapse of the mental edifice. Nothing to salvage. But ruins are what new structures are built on.' },

  // ── DISKS ──
  { name: 'Two of Disks',   suit: 'disks', num: 2,  astro: 'Jupiter in Capricorn', sephirah: 'Chokmah',   keywords: 'change, the juggle of resources, flux in matter', thothNote: 'Jupiter in Capricorn — the expansive force in the sign of structure and material ambition. Change: matter is not static; even the most solid things are in motion. The serpent eating its own tail (oroboros) encircles the two disks.' },
  { name: 'Three of Disks',  suit: 'disks', num: 3,  astro: 'Mars in Capricorn',   sephirah: 'Binah',     keywords: 'work, the foundation laid, the craft begun', thothNote: 'Mars in Capricorn — Mars is exalted in Capricorn; the war-force perfectly expressed through disciplined material effort. Work: not toil but the joy of skilled craft applied to real problems.' },
  { name: 'Four of Disks',   suit: 'disks', num: 4,  astro: 'Sun in Capricorn',    sephirah: 'Chesed',    keywords: 'power, the fortress built, material security and its cost', thothNote: 'Sun in Capricorn — solar will crystallised into Capricornian structure. Power: the castle that has been built to last. The question Crowley poses: what does the fortress prevent from entering?' },
  { name: 'Five of Disks',   suit: 'disks', num: 5,  astro: 'Mercury in Taurus',   sephirah: 'Geburah',   keywords: 'worry, the material crisis, mind caught in scarcity', thothNote: 'Mercury in Taurus — the quick mind trapped in the fixed earth sign, in the sphere of severity. Worry: the mind that cannot stop calculating the loss, the resource that might run out.' },
  { name: 'Six of Disks',    suit: 'disks', num: 6,  astro: 'Moon in Taurus',      sephirah: 'Tiphareth', keywords: 'success, the harvest received, material beauty at its peak', thothNote: 'Moon in Taurus — the moon is exalted in Taurus; feeling in its most receptive material form. Success: the harvest that comes from patient tending. The beauty of having enough.' },
  { name: 'Seven of Disks',  suit: 'disks', num: 7,  astro: 'Saturn in Taurus',    sephirah: 'Netzach',   keywords: 'failure, the delayed harvest, effort that has not yet fruit', thothNote: 'Saturn in Taurus — the great limiter in the sign of patient earth. Failure: not permanent, but the crop that will not come in this season. The effort was real; the result has not yet arrived.' },
  { name: 'Eight of Disks',  suit: 'disks', num: 8,  astro: 'Sun in Virgo',        sephirah: 'Hod',       keywords: 'prudence, the careful craftsman, skill applied with precision', thothNote: 'Sun in Virgo — solar consciousness in the sign of craft and discernment. Prudence: the master craftsman who does not waste a movement, whose skill is so deep it appears effortless.' },
  { name: 'Nine of Disks',   suit: 'disks', num: 9,  astro: 'Venus in Virgo',      sephirah: 'Yesod',     keywords: 'gain, the material abundance of skill, the reward of patient work', thothNote: 'Venus in Virgo — beauty in the sign of the harvest. Gain: what has been grown through skill and patience finally bears fruit. The abundance is real, earned, and precise.' },
  { name: 'Ten of Disks',    suit: 'disks', num: 10, astro: 'Mercury in Virgo',    sephirah: 'Malkuth',   keywords: 'wealth, the completed material cycle, the full expression of earth', thothNote: 'Mercury in Virgo — Mercury rules Virgo; the mind fully at home in matter, in the heaviest sphere. Wealth: not just money but the completion of the material journey. Everything that can be made has been made. The tree of life is mapped onto the ten coins.' },
];

// ── COURT CARDS ───────────────────────────────────────────────────────────────
// Thoth court card hierarchy (differs from RWS):
//   Knight  = Fire of suit (active, mounted, charging) [RWS King]
//   Queen   = Water of suit (reflective, enthroned)    [RWS Queen]
//   Prince  = Air of suit (in chariot, directed)       [RWS Knight]
//   Princess = Earth of suit (standing, manifesting)   [RWS Page]

export const THOTH_COURTS: ThothCourt[] = [
  // ── WANDS ──
  { name: 'Knight of Wands',   rwsName: 'King of Wands',    suit: 'wands', element: 'Fire of Fire',    astro: '21° Scorpio – 20° Sagittarius', keywords: 'swift will, the pure fire, impulsive creative force, generosity that burns' },
  { name: 'Queen of Wands',    rwsName: 'Queen of Wands',   suit: 'wands', element: 'Water of Fire',   astro: '21° Pisces – 20° Aries',        keywords: 'adaptable fire, the magnetic queen, practical will with warmth' },
  { name: 'Prince of Wands',   rwsName: 'Knight of Wands',  suit: 'wands', element: 'Air of Fire',     astro: '21° Cancer – 20° Leo',          keywords: 'swift and directed will, the charioteer of fire, energy with aim' },
  { name: 'Princess of Wands', rwsName: 'Page of Wands',    suit: 'wands', element: 'Earth of Fire',   astro: 'Quadrant of Aries/Taurus/Gemini', keywords: 'the spark made flesh, fiery messenger, will taking form in matter' },

  // ── CUPS ──
  { name: 'Knight of Cups',    rwsName: 'King of Cups',     suit: 'cups',  element: 'Fire of Water',   astro: '21° Aquarius – 20° Pisces',     keywords: 'the romantic force, deep feeling that moves swiftly, intensity of emotion' },
  { name: 'Queen of Cups',     rwsName: 'Queen of Cups',    suit: 'cups',  element: 'Water of Water',  astro: '21° Gemini – 20° Cancer',       keywords: 'pure intuition, the mirror of feeling, deep receptivity' },
  { name: 'Prince of Cups',    rwsName: 'Knight of Cups',   suit: 'cups',  element: 'Air of Water',    astro: '21° Libra – 20° Scorpio',       keywords: 'the subtle one, feeling made into thought, the seductive intelligence' },
  { name: 'Princess of Cups',  rwsName: 'Page of Cups',     suit: 'cups',  element: 'Earth of Water',  astro: 'Quadrant of Cancer/Leo/Virgo',  keywords: 'the gentle one, feeling in its most tender form, the lotus dreamer' },

  // ── SWORDS ──
  { name: 'Knight of Swords',   rwsName: 'King of Swords',   suit: 'swords', element: 'Fire of Air',   astro: '21° Taurus – 20° Gemini',       keywords: 'fierce intellect, the charging mind, ideas that cut before thinking' },
  { name: 'Queen of Swords',    rwsName: 'Queen of Swords',  suit: 'swords', element: 'Water of Air',  astro: '21° Virgo – 20° Libra',         keywords: 'sharp clarity, the grief-sharpened mind, perception that costs something' },
  { name: 'Prince of Swords',   rwsName: 'Knight of Swords', suit: 'swords', element: 'Air of Air',    astro: '21° Capricorn – 20° Aquarius',  keywords: 'pure thought, the abstract mind, intelligence that loves itself' },
  { name: 'Princess of Swords', rwsName: 'Page of Swords',   suit: 'swords', element: 'Earth of Air',  astro: 'Quadrant of Capricorn/Aquarius/Pisces', keywords: 'the vigilant one, intellect grounded, the watchful mind' },

  // ── DISKS ──
  { name: 'Knight of Disks',    rwsName: 'King of Disks',    suit: 'disks', element: 'Fire of Earth',  astro: '21° Leo – 20° Virgo',           keywords: 'patient will, the laborer, the force that builds slowly and completely' },
  { name: 'Queen of Disks',     rwsName: 'Queen of Disks',   suit: 'disks', element: 'Water of Earth', astro: '21° Sagittarius – 20° Capricorn', keywords: 'nourishing abundance, the practical mother, earth that sustains' },
  { name: 'Prince of Disks',    rwsName: 'Knight of Disks',  suit: 'disks', element: 'Air of Earth',   astro: '21° Aries – 20° Taurus',        keywords: 'methodical progress, the steady builder, mind in service of matter' },
  { name: 'Princess of Disks',  rwsName: 'Page of Disks',    suit: 'disks', element: 'Earth of Earth', astro: 'Quadrant of Aries/Taurus/Gemini', keywords: 'the fertile one, the seed of all matter, potential fully in the body' },
];

// ── HELPER: look up a Thoth Major by number ───────────────────────────────────
export function getThothMajor(num: number): ThothMajor | undefined {
  return THOTH_MAJOR.find(c => c.num === num);
}

// ── HELPER: look up a Thoth pip by suit + number ─────────────────────────────
export function getThothPip(suit: 'wands'|'cups'|'swords'|'disks', num: number): ThothMinor | undefined {
  return THOTH_PIPS.find(c => c.suit === suit && c.num === num);
}

// ── HELPER: get all cards for a suit ─────────────────────────────────────────
export function getThothSuit(suit: 'wands'|'cups'|'swords'|'disks'): ThothMinor[] {
  return THOTH_PIPS.filter(c => c.suit === suit);
}
