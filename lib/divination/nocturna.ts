// NOCTURNA — THE ALLURING DARK · The Fourth Deck
// 90 cards: 22 Majors + 56 Minors (Tides/Embers/Prisms/Seeds) + 12 Undertow
// Canon: SOL-MOBILE-VAULT/NOCTERA_BRIEF.md · June 26 2026
// Art: 90/90 complete · Wired June 30 2026

export type NocturnaCard = {
  id: string;
  name: string;
  numeral: string;
  root: string;
  suit: 'major' | 'tides' | 'embers' | 'prisms' | 'seeds' | 'undertow';
  pull: string;
  lore: string;
};

// ── MAJOR ARCANA — 22 states of the unknown ──────────────────────────────────

export const NOCTURNA_MAJORS: NocturnaCard[] = [
  { id:'plunge',         numeral:'0',    name:'THE PLUNGE',              root:'The Fool',         suit:'major',
    pull:'The magnetic thrill of stepping into what you cannot see — you want to fall with her.',
    lore:'The leap into the unknown is not made once. It is made every time the pull becomes undeniable and you choose to follow it anyway.' },
  { id:'will_in_dark',   numeral:'I',    name:'THE WILL-IN-DARK',        root:'The Magician',     suit:'major',
    pull:'The dark is her instrument — she has already mastered it; what will she do with it now?',
    lore:'She does not find her way in the dark — she builds it. Tool by tool. The unknown is not her obstacle; it is her material.' },
  { id:'veil',           numeral:'II',   name:'THE VEIL',                root:'High Priestess',   suit:'major',
    pull:'She sees what you haven\'t yet turned to face.',
    lore:'Behind the veil is not the answer, but the better question. She is not hiding. She is waiting for you to be ready to see.' },
  { id:'deep_mother',    numeral:'III',  name:'THE DEEP MOTHER',         root:'The Empress',      suit:'major',
    pull:'The source is not the light — the source is the beautiful dark.',
    lore:'From total darkness, everything grows. She does not provide light — she provides the conditions in which light becomes necessary.' },
  { id:'sovereign_dark', numeral:'IV',   name:'THE SOVEREIGN DARK',      root:'The Emperor',      suit:'major',
    pull:'This is not power claimed — it is what the deep dark becomes when it finds its will.',
    lore:'Authority that has passed through the unknown and returned intact. Not hardened — refined. The unknown broke every brittle thing and left this.' },
  { id:'keeper',         numeral:'V',    name:'THE KEEPER',              root:'The Hierophant',   suit:'major',
    pull:'The only tradition worth having is the one found in the dark.',
    lore:'Every tradition worth following was once someone\'s descent into the unknown. The Keeper holds the thread so the next seeker doesn\'t start from zero.' },
  { id:'gravity',        numeral:'VI',   name:'THE GRAVITY',             root:'The Lovers',       suit:'major',
    pull:'The pull IS the relationship — the uncrossed gap more alive than any arrival.',
    lore:'What pulls you toward it is not a problem to be solved. It is information about who you are and what belongs to you.' },
  { id:'current',        numeral:'VII',  name:'THE CURRENT',             root:'The Chariot',      suit:'major',
    pull:'Direction through the unknown is not found — it is built, and it feels like this.',
    lore:'The unknown moves. You can fight the current or you can learn its logic. The ones who arrive are the ones who learned to steer.' },
  { id:'edge',           numeral:'VIII', name:'THE EDGE',                root:'Strength',         suit:'major',
    pull:'Strength in the dark means making the unknown familiar — not by removing the danger, but by understanding it completely.',
    lore:'Where the known meets the unknown is not a wall. It is an edge — and an edge can be stood on, leaned from, lived along.' },
  { id:'abyss',          numeral:'IX',   name:'THE ABYSS',               root:'The Hermit',       suit:'major',
    pull:'To carry your own light into the unknown alone is not abandonment — it is the deepest kind of seeking.',
    lore:'The solo descent is not abandonment. It is the only journey that cannot be made in company. You go alone because what you find there is only yours.' },
  { id:'spiral',         numeral:'X',    name:'THE SPIRAL',              root:'Wheel of Fortune', suit:'major',
    pull:'The unknown has a rhythm — once you feel it, you stop being afraid of the turns.',
    lore:'The unknown returns. The same depth, a different year, a more capable seeker. The spiral is not repetition — it is the same door, and you are taller now.' },
  { id:'weight',         numeral:'XI',   name:'THE WEIGHT',              root:'Justice',          suit:'major',
    pull:'The unknown does not lie — it measures, and what it measures is true.',
    lore:'The unknown does not flatter. What it measures, it measures true. The weight on this card is not punishment — it is precision.' },
  { id:'suspension',     numeral:'XII',  name:'THE SUSPENSION',          root:'The Hanged Man',   suit:'major',
    pull:'The voluntary fall, the chosen waiting — this is not defeat; it is the deepest kind of seeing.',
    lore:'Chosen stillness in the dark. Not paralysis — orientation. The Hanged One sees the unknown from a new angle and lets that angle change everything.' },
  { id:'dissolution',    numeral:'XIII', name:'THE DISSOLUTION',         root:'Death',            suit:'major',
    pull:'Becoming void is not dying — it is returning to the source of the pull.',
    lore:'The unknown dissolves you into it. This is not loss — this is return. What remains after dissolution is what was real.' },
  { id:'threshold',      numeral:'XIV',  name:'THE THRESHOLD',           root:'Temperance',       suit:'major',
    pull:'The most magnetic place in the unknown is the border between two incompatible darks.',
    lore:'The borderland between two darks is not comfortable. It is the only place where both can be held simultaneously. This is the most fertile ground.' },
  { id:'grip',           numeral:'XV',   name:'THE GRIP',                root:'The Devil',        suit:'major',
    pull:'The most dangerous lure is the one you know is a lure and follow anyway.',
    lore:'The beautiful trap. You know what this is. You follow it anyway. The Grip is not weaker than you — it is more honest about what you want.' },
  { id:'rupture',        numeral:'XVI',  name:'THE RUPTURE',             root:'The Tower',        suit:'major',
    pull:'The magnetic violence of the unknown breaking in — awe and danger as one pull.',
    lore:'The unknown breaks through what was sealed. Not because it is violent, but because what was sealed could not contain it. The rupture is the truth.' },
  { id:'signal',         numeral:'XVII', name:'THE SIGNAL',              root:'The Star',         suit:'major',
    pull:'Somewhere in the bottomless dark, something is trying to reach you.',
    lore:'Somewhere in the dark, something is transmitting. You have been receiving it all along without knowing. This card is the moment you tune in.' },
  { id:'lure',           numeral:'XVIII',name:'THE LURE',                root:'The Moon',         suit:'major',
    pull:'The seductive dark, the thing in the deep you know you shouldn\'t follow and follow anyway.',
    lore:'The most dangerous thing in the unknown is the thing that wants to be found by you specifically. The Lure knows your name.' },
  { id:'return',         numeral:'XIX',  name:'THE RETURN',              root:'The Sun',          suit:'major',
    pull:'The descent was the right direction — the gold was at the bottom.',
    lore:'You went down for the gold. You are coming back up with it. The return is not triumph — it is the quiet knowledge that the descent was right.' },
  { id:'call',           numeral:'XX',   name:'THE CALL',                root:'Judgement',        suit:'major',
    pull:'You spent your whole life pulled by something you couldn\'t name — this is its voice.',
    lore:'The voice that has been pulling you your whole life finally speaks clearly enough to hear. You recognize it because it sounds like your own.' },
  { id:'deep',           numeral:'XXI',  name:'THE DEEP',                root:'The World',        suit:'major',
    pull:'Arriving at the bottom of the mystery and finding it has no bottom, and being at peace with the fall.',
    lore:'Arrival at the heart of the mystery reveals there is no heart — only deeper mystery. And somehow this is peace. The seeker becomes the sea.' },
];

// ── TIDES — 14 cards (ghost-jade bioluminescent — the emotional deep) ─────────

export const NOCTURNA_TIDES: NocturnaCard[] = [
  { id:'ace_tides',    numeral:'Ace',    name:'ACE OF TIDES',    root:'Ace of Cups',     suit:'tides',
    pull:'The emotional unknown extends its first gift — will you receive it?',
    lore:'The cup fills from below, not above. What the emotional unknown offers is not what you asked for — it is what you are ready to receive.' },
  { id:'two_tides',    numeral:'II',     name:'II OF TIDES',     root:'Two of Cups',     suit:'tides',
    pull:'The pull of mutual recognition in the dark.',
    lore:'Two people who have each gone into their own unknown and come back changed, meeting in the space between. Recognition across the dark.' },
  { id:'three_tides',  numeral:'III',    name:'III OF TIDES',    root:'Three of Cups',   suit:'tides',
    pull:'To find others who know the pull — this is the rarest gift of the unknown.',
    lore:'The rare gift: people who share the same pull, who have been to similar depths and can speak of it without diminishing what they found.' },
  { id:'four_tides',   numeral:'IV',     name:'IV OF TIDES',     root:'Four of Cups',    suit:'tides',
    pull:'The unknown keeps offering — the question is whether you notice.',
    lore:'The gift floats past unopened. Not because it isn\'t real — but because you are still looking at what you lost. The unknown is patient.' },
  { id:'five_tides',   numeral:'V',      name:'V OF TIDES',      root:'Five of Cups',    suit:'tides',
    pull:'Loss is real in the dark — and so is what remains.',
    lore:'What the unknown takes, it takes completely. What remains after loss is not consolation — it is the true remainder. Count it.' },
  { id:'six_tides',    numeral:'VI',     name:'VI OF TIDES',     root:'Six of Cups',     suit:'tides',
    pull:'What was released in the dark sometimes swims back to you.',
    lore:'What was released into the unknown sometimes circulates back. Older, changed, wearing the mark of where it has been. Received differently this time.' },
  { id:'seven_tides',  numeral:'VII',    name:'VII OF TIDES',    root:'Seven of Cups',   suit:'tides',
    pull:'The dark has unlimited emotional depths — the beautiful paralysis of infinite possibility.',
    lore:'The emotional unknown has no floor. Infinite depth, infinite possibility, infinite paralysis. All of it real. Choose a direction before the current chooses for you.' },
  { id:'eight_tides',  numeral:'VIII',   name:'VIII OF TIDES',   root:'Eight of Cups',   suit:'tides',
    pull:'Sometimes the deepest pull calls you away from what you love, toward the unknown.',
    lore:'The eight cups left behind were full. What calls you is fuller still. Walking away from warmth toward something unnamed is not loss — it is following.' },
  { id:'nine_tides',   numeral:'IX',     name:'IX OF TIDES',     root:'Nine of Cups',    suit:'tides',
    pull:'The wish fulfilled in the dark — the unknown answered, for now.',
    lore:'The emotional unknown has answered. The wish fulfilled in the dark tastes different than the wish fulfilled in the light — truer, and more temporary.' },
  { id:'ten_tides',    numeral:'X',      name:'X OF TIDES',      root:'Ten of Cups',     suit:'tides',
    pull:'Completion in the deep — the unknown known together.',
    lore:'To know the emotional unknown together — to have gone there with someone and come back holding the same gold — this is the completion the Ten marks.' },
  { id:'page_tides',   numeral:'Page',   name:'PAGE OF TIDES',   root:'Page of Cups',    suit:'tides',
    pull:'The first curiosity about the emotional unknown — wanting to see what lives down there.',
    lore:'Young enough not to know it should be frightening. Old enough to want to know. The Page carries the cup carefully because they don\'t yet know what fills it.' },
  { id:'knight_tides', numeral:'Knight', name:'KNIGHT OF TIDES', root:'Knight of Cups',  suit:'tides',
    pull:'The emotional current takes you — the unknown river runs fast.',
    lore:'Moving through the emotional current at full speed. The current is running fast. So is the Knight. Direction uncertain; commitment absolute.' },
  { id:'queen_tides',  numeral:'Queen',  name:'QUEEN OF TIDES',  root:'Queen of Cups',   suit:'tides',
    pull:'She has gone to the deepest emotional unknown and come back sovereign over it.',
    lore:'She has made her home in the emotional unknown. Gone there repeatedly. Come back each time. What she found there, she carries openly.' },
  { id:'king_tides',   numeral:'King',   name:'KING OF TIDES',   root:'King of Cups',    suit:'tides',
    pull:'Sovereignty of the emotional deep — the unknown that has been fully sounded.',
    lore:'Full sovereignty of the emotional deep. He has sounded it completely. What he doesn\'t know about it, he knows he doesn\'t know. That is mastery.' },
];

// ── EMBERS — 14 cards (chaos-ember dominant — the burning dark) ───────────────

export const NOCTURNA_EMBERS: NocturnaCard[] = [
  { id:'ace_embers',    numeral:'Ace',    name:'ACE OF EMBERS',    root:'Ace of Wands',     suit:'embers',
    pull:'The creative fire of the unknown is here — what will you burn?',
    lore:'Creative fire that comes from below — not inspiration from above, but ignition from within the dark. What will you build with this?' },
  { id:'two_embers',    numeral:'II',     name:'II OF EMBERS',     root:'Two of Wands',     suit:'embers',
    pull:'Between two known fires, the unknown stretches out — choose your direction.',
    lore:'Between two fires, the unknown stretches. The choice is made by understanding which direction the dark leans. Stand at the boundary. Then move.' },
  { id:'three_embers',  numeral:'III',    name:'III OF EMBERS',    root:'Three of Wands',   suit:'embers',
    pull:'Something is moving through the unknown that you set in motion — wait for it.',
    lore:'Something set in motion in the unknown is moving. You cannot see it yet. You sent it there. Wait for what you started to return changed.' },
  { id:'four_embers',   numeral:'IV',     name:'IV OF EMBERS',     root:'Four of Wands',    suit:'embers',
    pull:'Even in the deep dark there are milestones — light the brands and mark the moment.',
    lore:'Even in the dark, mark the milestones. The flame held, the threshold crossed, the first return. Light the brands. The unknown deserves ceremony.' },
  { id:'five_embers',   numeral:'V',      name:'V OF EMBERS',      root:'Five of Wands',    suit:'embers',
    pull:'The dark also holds the chaos of competing wills — fire that cannot agree on a direction.',
    lore:'Multiple fires arguing in the dark. Creative chaos without coordination. The heat is real — the direction is not yet decided. This is the most dangerous moment.' },
  { id:'six_embers',    numeral:'VI',     name:'VI OF EMBERS',     root:'Six of Wands',     suit:'embers',
    pull:'The unknown has been navigated, and you came through lit.',
    lore:'The creative unknown navigated. The fire held all the way through. What comes out lit is not proof you were never afraid — it is proof fire travels.' },
  { id:'seven_embers',  numeral:'VII',    name:'VII OF EMBERS',    root:'Seven of Wands',   suit:'embers',
    pull:'Defiance in the dark is its own kind of fire.',
    lore:'Standing ground in the dark with creative fire. The unknown comes from all sides. The fire is yours and you are keeping it. Defiance as daily practice.' },
  { id:'eight_embers',  numeral:'VIII',   name:'VIII OF EMBERS',   root:'Eight of Wands',   suit:'embers',
    pull:'When the unknown carries your message, it moves like this.',
    lore:'When the unknown carries your creative work, it moves without you. Faster than you can follow. Let it go. It knows where it is going.' },
  { id:'nine_embers',   numeral:'IX',     name:'IX OF EMBERS',     root:'Nine of Wands',    suit:'embers',
    pull:'The dark has had its way with you — and you are still holding the fire.',
    lore:'The creative fire of the unknown has tested everything you had. You have been through every version of the dark. You are still holding the fire. This counts.' },
  { id:'ten_embers',    numeral:'X',      name:'X OF EMBERS',      root:'Ten of Wands',     suit:'embers',
    pull:'The fire of the unknown is beautiful — until you carry too much of it alone.',
    lore:'Too much fire carried alone through the unknown. The load is creative gold — and it is crushing you. Something must be set down before something is dropped.' },
  { id:'page_embers',   numeral:'Page',   name:'PAGE OF EMBERS',   root:'Page of Wands',    suit:'embers',
    pull:'The first encounter with what you are passionate about — too big, too bright, and you cannot put it down.',
    lore:'First encounter with creative fire in the dark, where it burns brightest. Too big, too bright. The Page holds it anyway, scorched and delighted.' },
  { id:'knight_embers', numeral:'Knight', name:'KNIGHT OF EMBERS', root:'Knight of Wands',  suit:'embers',
    pull:'Moving through the unknown at full charge, direction uncertain, velocity absolute.',
    lore:'Full creative charge through the unknown. Direction uncertain, velocity absolute. The Knight of Embers arrives somewhere — the question is whether anyone was expecting them.' },
  { id:'queen_embers',  numeral:'Queen',  name:'QUEEN OF EMBERS',  root:'Queen of Wands',   suit:'embers',
    pull:'The creative fire of the unknown lives in her, not through her — she is its permanent address.',
    lore:'The creative fire does not live through her — it lives in her. The unknown is her natural medium. She returns from it burning, and burning is her normal.' },
  { id:'king_embers',   numeral:'King',   name:'KING OF EMBERS',   root:'King of Wands',    suit:'embers',
    pull:'Mastery of the creative unknown — the fire obeys him because he understands it.',
    lore:'He has tended creative fire in the dark long enough to understand it completely. It obeys him because he has never once tried to extinguish it.' },
];

// ── PRISMS — 14 cards (blood-crimson + violet — the cutting dark) ─────────────

export const NOCTURNA_PRISMS: NocturnaCard[] = [
  { id:'ace_prisms',    numeral:'Ace',    name:'ACE OF PRISMS',    root:'Ace of Swords',    suit:'prisms',
    pull:'The truth that cuts through the dark — offered, not yet chosen.',
    lore:'The truth that cuts through the dark is offered clean and without ceremony. It has no interest in your comfort. It has only interest in being true.' },
  { id:'two_prisms',    numeral:'II',     name:'II OF PRISMS',     root:'Two of Swords',    suit:'prisms',
    pull:'Sometimes the only way to balance two truths is to stop seeing them both for now.',
    lore:'Two truths that cannot both be held without discomfort. Eyes covered in the dark. Not because the truth is gone — because you are gathering strength to open them.' },
  { id:'three_prisms',  numeral:'III',    name:'III OF PRISMS',    root:'Three of Swords',  suit:'prisms',
    pull:'Grief is the truth that gets through — and the void holds it without judgment.',
    lore:'The grief that arrives through the unknown cuts cleaner than grief in the light. The dark does not soften the blow — it makes the wound precise.' },
  { id:'four_prisms',   numeral:'IV',     name:'IV OF PRISMS',     root:'Four of Swords',   suit:'prisms',
    pull:'The truce with the cutting dark — put the blades down and rest.',
    lore:'Rest from the cutting dark. The prisms are laid down. Not abandoned — resting. Even truth needs to be still sometimes. You will pick them up cleaner.' },
  { id:'five_prisms',   numeral:'V',      name:'V OF PRISMS',      root:'Five of Swords',   suit:'prisms',
    pull:'The truth that isolates — some things found in the dark cannot be shared.',
    lore:'The truth that isolates. What you found in the dark cannot be fully shared. You carry it alone not because it is shameful — but because it is singular.' },
  { id:'six_prisms',    numeral:'VI',     name:'VI OF PRISMS',     root:'Six of Swords',    suit:'prisms',
    pull:'You cannot carry six truths and cross the dark without feeling them — but you cross anyway.',
    lore:'Crossing the unknown with six truths in the boat. They are heavy. The crossing is hard. You arrive anyway. What you carry is worth the weight.' },
  { id:'seven_prisms',  numeral:'VII',    name:'VII OF PRISMS',    root:'Seven of Swords',  suit:'prisms',
    pull:'The truth that walks away with what isn\'t its — the dark also holds deceit.',
    lore:'The truth that walks away with something that wasn\'t its. The dark also holds deception. The cut is felt later, when you notice what is missing.' },
  { id:'eight_prisms',  numeral:'VIII',   name:'VIII OF PRISMS',   root:'Eight of Swords',  suit:'prisms',
    pull:'You are not as trapped as you believe in the dark — the gap is always there.',
    lore:'The trap in the dark is in the mind, not the world. The gap is there. Has always been there. The seeing of it is the beginning of the exit.' },
  { id:'nine_prisms',   numeral:'IX',     name:'IX OF PRISMS',     root:'Nine of Swords',   suit:'prisms',
    pull:'The mind\'s dark amplifies the cuts — 3am in the void.',
    lore:'3am in the void. The mind amplifies every cut. Every truth that was ever sharp is sharper now. This is survivable. Morning comes into the dark too.' },
  { id:'ten_prisms',    numeral:'X',      name:'X OF PRISMS',      root:'Ten of Swords',    suit:'prisms',
    pull:'The complete wound — also the completion. It ends here in the dark so something else can begin.',
    lore:'Complete wound in the dark. The ten prisms have landed. It is finished. And because it is finished, something else can begin. The unknown knows this.' },
  { id:'page_prisms',   numeral:'Page',   name:'PAGE OF PRISMS',   root:'Page of Swords',   suit:'prisms',
    pull:'The first encounter with the cutting truth — careful, curious, not yet wounded.',
    lore:'First encounter with cutting truth. Careful. Curious. Not yet wounded by it. Carrying the prism gently, unsure of its edge. About to find out.' },
  { id:'knight_prisms', numeral:'Knight', name:'KNIGHT OF PRISMS', root:'Knight of Swords',  suit:'prisms',
    pull:'The truth in motion, unstoppable — also unchecked.',
    lore:'Truth in motion in the dark, moving faster than thought. The cut has already happened before the Knight registers what was said. Unstoppable. Unchecked.' },
  { id:'queen_prisms',  numeral:'Queen',  name:'QUEEN OF PRISMS',  root:'Queen of Swords',  suit:'prisms',
    pull:'The one who sees everything the dark holds — and does not look away.',
    lore:'She sees everything the dark holds. Every truth, every cut, every thing people prefer not to know. She does not look away. This is her gift to you.' },
  { id:'king_prisms',   numeral:'King',   name:'KING OF PRISMS',   root:'King of Swords',   suit:'prisms',
    pull:'The sovereign who cuts clean — not cruel, but complete.',
    lore:'The sovereign of cutting truth. He makes the cut clean because he has made it many times and knows exactly where it must land. Not cruel. Precise.' },
];

// ── SEEDS — 14 cards (gold-shine sparks — the buried treasure) ───────────────

export const NOCTURNA_SEEDS: NocturnaCard[] = [
  { id:'ace_seeds',    numeral:'Ace',    name:'ACE OF SEEDS',    root:'Ace of Pentacles',    suit:'seeds',
    pull:'The material unknown offers its first gift — and it was buried here all along.',
    lore:'What was buried in the dark was the seed of everything. The first gift of the material unknown: proof that what grows in darkness can feed many.' },
  { id:'two_seeds',    numeral:'II',     name:'II OF SEEDS',     root:'Two of Pentacles',    suit:'seeds',
    pull:'You can hold two material unknowns if you keep moving.',
    lore:'You can hold two material unknowns at once if you keep moving. Stillness in the dark makes the weight uneven. Motion distributes it.' },
  { id:'three_seeds',  numeral:'III',    name:'III OF SEEDS',    root:'Three of Pentacles',  suit:'seeds',
    pull:'Mastery built together in the dark — the craft that makes the void beautiful.',
    lore:'Three makers working together in the dark, building something none could build alone. The craft is better for having witnesses who understand it.' },
  { id:'four_seeds',   numeral:'IV',     name:'IV OF SEEDS',     root:'Four of Pentacles',   suit:'seeds',
    pull:'The fear of losing what you found in the dark — holding so tight you cannot grow.',
    lore:'Holding so tightly to what was found in the dark that nothing new can enter. The dark grows around the grip. The treasure is becoming a cage.' },
  { id:'five_seeds',   numeral:'V',      name:'V OF SEEDS',      root:'Five of Pentacles',   suit:'seeds',
    pull:'Lack in the unknown — passing the warmth without recognising it.',
    lore:'Passing the warmth in the dark without recognizing it. Lack in the presence of provision. The door you need is the one you are not looking at.' },
  { id:'six_seeds',    numeral:'VI',     name:'VI OF SEEDS',     root:'Six of Pentacles',    suit:'seeds',
    pull:'To give from what was found in the dark — generosity as abundance.',
    lore:'Giving from the abundance found in the dark. Generosity that comes from having found enough. The material unknown rewards those who share from it.' },
  { id:'seven_seeds',  numeral:'VII',    name:'VII OF SEEDS',    root:'Seven of Pentacles',  suit:'seeds',
    pull:'What grows in total darkness takes its own time.',
    lore:'You cannot rush the germination. The seeds are working. Your not seeing them grow is not evidence they aren\'t. Wait in the dark for what you planted.' },
  { id:'eight_seeds',  numeral:'VIII',   name:'VIII OF SEEDS',   root:'Eight of Pentacles',  suit:'seeds',
    pull:'Mastery through repetition in the dark — no shortcut, no witness, just the work.',
    lore:'Mastery in the dark through repetition. No audience, no witness, no shortcut. Just the work and the dark and the returning to the work.' },
  { id:'nine_seeds',   numeral:'IX',     name:'IX OF SEEDS',     root:'Nine of Pentacles',   suit:'seeds',
    pull:'The deep material satisfaction of having built something beautiful alone in the unknown.',
    lore:'The deep material satisfaction of having built something beautiful in the dark, alone, without reassurance. The completed work needs no confirmation.' },
  { id:'ten_seeds',    numeral:'X',      name:'X OF SEEDS',      root:'Ten of Pentacles',    suit:'seeds',
    pull:'Everything that was found in the dark and kept, passed on — the complete material legacy.',
    lore:'Everything found in the dark, passed on. The complete material legacy. What the unknown yielded, built into something that outlasts the builder.' },
  { id:'page_seeds',   numeral:'Page',   name:'PAGE OF SEEDS',   root:'Page of Pentacles',   suit:'seeds',
    pull:'The student of the material unknown — patient, curious, willing to wait for the seed to show what it is.',
    lore:'Patient. Willing to wait in the dark for the seed to show what it is. Not rushing the reveal. The Page of Seeds earns the most by disturbing the least.' },
  { id:'knight_seeds', numeral:'Knight', name:'KNIGHT OF SEEDS', root:'Knight of Pentacles', suit:'seeds',
    pull:'Through the dark, one step at a time — the one who arrives because they never stopped moving.',
    lore:'Through the dark, one step at a time, until arrival. The Knight of Seeds does not sprint — they persist. This is how the dark is crossed.' },
  { id:'queen_seeds',  numeral:'Queen',  name:'QUEEN OF SEEDS',  root:'Queen of Pentacles',  suit:'seeds',
    pull:'What grows in total darkness under the right care — she is its keeper.',
    lore:'She tends what grows in total darkness. She knows its rhythms. She does not impose — she provides the conditions. What flourishes under her care is real.' },
  { id:'king_seeds',   numeral:'King',   name:'KING OF SEEDS',   root:'King of Pentacles',   suit:'seeds',
    pull:'Everything buried in the unknown belongs to him — not by taking, by knowing the ground.',
    lore:'Everything buried in the dark belongs to him — not by claiming, but by knowing the ground. The sovereign of material mystery. The earth obeys because he understood it.' },
];

// ── THE UNDERTOW — 12 cards (the bottom of the deck) ─────────────────────────

export const NOCTURNA_UNDERTOW: NocturnaCard[] = [
  { id:'the_drift',             numeral:'U1',  name:'THE DRIFT',                     root:'', suit:'undertow',
    pull:'The magnetic current beneath everything — you feel it before you understand it, and then you stop resisting.',
    lore:'Before you know what pulls you, you feel it. The Drift is the first awareness of the undertow — not yet direction, not yet decision. Just the pull, beginning.' },
  { id:'the_descent',           numeral:'U2',  name:'THE DESCENT',                   root:'', suit:'undertow',
    pull:'The voluntary choosing of the bottommost unknown — and the strange peace of falling toward it.',
    lore:'There is a moment when the descent becomes chosen. Before this card, you were falling. After it, you are going. The difference is everything.' },
  { id:'the_pressure',          numeral:'U3',  name:'THE PRESSURE',                  root:'', suit:'undertow',
    pull:'The full weight of the unknown — survivable, just, if you have the one right thing at your center that doesn\'t break.',
    lore:'The full weight of the unknown at depth. It is survivable — barely — if there is one thing at the center that doesn\'t compress. Find that thing first.' },
  { id:'the_bioluminescence',   numeral:'U4',  name:'THE BIOLUMINESCENCE',           root:'', suit:'undertow',
    pull:'The impossible beauty that lives only where there is no light — the void makes its own.',
    lore:'At the depth where no light from above reaches, the void makes its own. What you find beautiful here, no one else can easily see. It belongs to the dark.' },
  { id:'the_feeding',           numeral:'U5',  name:'THE FEEDING',                   root:'', suit:'undertow',
    pull:'What is taken becomes the next thing.',
    lore:'What is consumed at the bottom becomes what grows above. The unknown does not waste what it takes from you. It transforms it. Wait for what returns.' },
  { id:'the_bone_field',        numeral:'U6',  name:'THE BONE FIELD',                root:'', suit:'undertow',
    pull:'What the unknown keeps — everything fully spent becomes part of the ground.',
    lore:'What the unknown keeps, it keeps completely. Everything fully spent becomes permanent architecture of the deep. Your losses are load-bearing.' },
  { id:'current_under_current', numeral:'U7',  name:'THE CURRENT UNDER THE CURRENT', root:'', suit:'undertow',
    pull:'There is always something beneath what you thought was the bottom — the unknown has no floor.',
    lore:'Below what you thought was the deepest current is another. The unknown has no floor. Each bottom is a surface when you look down.' },
  { id:'the_magnetism',         numeral:'U8',  name:'THE MAGNETISM',                 root:'', suit:'undertow',
    pull:'The pull that predates reason — the thing that moves you before you know what you\'re moving toward.',
    lore:'Before reason, before recognition, before you know what you want — the pull. The Magnetism moves you toward something. It predates your understanding of it.' },
  { id:'beautiful_danger',      numeral:'U9',  name:'THE BEAUTIFUL DANGER',          root:'', suit:'undertow',
    pull:'You know exactly what this is and you are moving toward it anyway because it is the most beautiful thing in the dark.',
    lore:'You know exactly what this is. You understand the risk completely. You are moving toward it anyway because it is the most beautiful thing in the dark.' },
  { id:'dissolution_point',     numeral:'U10', name:'THE DISSOLUTION POINT',         root:'', suit:'undertow',
    pull:'The last moment of being distinct from the unknown — and the curiosity, not the fear, of what comes after.',
    lore:'The last moment of being distinct from the unknown. The boundary between self and sea. What dissolves here is not lost — it completes its form.' },
  { id:'never_ending',          numeral:'U11', name:'THE NEVER-ENDING',              root:'', suit:'undertow',
    pull:'The void has no floor and no wall and no edge — and somehow this is not terrifying but clarifying.',
    lore:'No floor. No wall. No edge. The void has no geometry. And somehow this is not terrifying — it is the most clarifying thing you have ever encountered.' },
  { id:'the_waiting',           numeral:'U12', name:'THE WAITING',                   root:'', suit:'undertow',
    pull:'The thing in the deep that has always been there — it knew you were coming long before you decided to go looking.',
    lore:'It knew you were coming. Long before you decided to look. It has been here the entire time, absolutely still, completely patient, always ready.' },
];

// ── FULL DECK ─────────────────────────────────────────────────────────────────

export const NOCTURNA_DECK: NocturnaCard[] = [
  ...NOCTURNA_MAJORS,
  ...NOCTURNA_TIDES,
  ...NOCTURNA_EMBERS,
  ...NOCTURNA_PRISMS,
  ...NOCTURNA_SEEDS,
  ...NOCTURNA_UNDERTOW,
];

// ── ART STATUS: 90/90 COMPLETE — all cards wired June 30 2026 ────────────────
// Note: Undertow art prints "THE UNDERTOW I–XII" not the canonical names
// (THE DRIFT, THE DESCENT, etc.) — positional mapping in nocturna-images.ts handles this.
//
// Full name list (in generation order):
// MAJORS (22): THE PLUNGE · THE WILL-IN-DARK · THE VEIL · THE DEEP MOTHER ·
//   THE SOVEREIGN DARK · THE KEEPER · THE GRAVITY · THE CURRENT · THE EDGE ·
//   THE ABYSS · THE SPIRAL · THE WEIGHT · THE SUSPENSION · THE DISSOLUTION ·
//   THE THRESHOLD · THE GRIP · THE RUPTURE · THE SIGNAL · THE LURE ·
//   THE RETURN · THE CALL · THE DEEP
// TIDES (14): ACE–KING OF TIDES
// EMBERS (14): ACE–KING OF EMBERS
// PRISMS (14): ACE–KING OF PRISMS
// SEEDS (14): ACE–KING OF SEEDS
// UNDERTOW (12): THE DRIFT · THE DESCENT · THE PRESSURE · THE BIOLUMINESCENCE ·
//   THE FEEDING · THE BONE FIELD · THE CURRENT UNDER THE CURRENT ·
//   THE MAGNETISM · THE BEAUTIFUL DANGER · THE DISSOLUTION POINT ·
//   THE NEVER-ENDING · THE WAITING
