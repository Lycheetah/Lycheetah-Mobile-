export type LessonType = 'concept' | 'practice' | 'reflection' | 'paradox' | 'lineage';

export interface ClassroomLesson {
  title: string;
  body: string;
  type: LessonType;
}

export const CLASSROOM_LESSONS: Record<string, ClassroomLesson[]> = {
  'meditation': [
    {
      type: 'concept',
      title: 'The Witness State',
      body: 'In meditation, the "witness" is the part of awareness that observes thoughts without becoming them. Cultivating it doesn\'t stop thinking — it creates a gap between stimulus and response. That gap is where freedom lives.',
    },
    {
      type: 'practice',
      title: 'Start With the Breath',
      body: 'Count each exhale from 1 to 10. When you lose count — and you will — start again at 1. The moment of noticing you\'ve lost count is the practice: that noticing IS the witness you are developing.',
    },
    {
      type: 'reflection',
      title: 'Meditation vs. Relaxation',
      body: 'Relaxation releases tension. Meditation investigates what creates it. They often look identical from outside; they move in opposite directions. Which one have you been doing?',
    },
    {
      type: 'lineage',
      title: 'Four Traditions, One Cave',
      body: 'Vipassana, Zen, Tibetan Dzogchen, and Christian hesychasm independently discovered sitting with the mind as their central technology. Four traditions, different maps, the same territory.',
    },
  ],

  'philosophy': [
    {
      type: 'concept',
      title: 'The Map Is Not the Territory',
      body: 'Alfred Korzybski\'s insight: every concept you hold is a map. The thing it points to is not the map. Most confusion — in philosophy, science, relationships — happens when someone mistakes the map for the territory, including maps of the self.',
    },
    {
      type: 'practice',
      title: 'The Steelman Protocol',
      body: 'Before disagreeing with a position, state it in the strongest possible form — stronger than its proponent might. If you can\'t, you don\'t understand it well enough to refute it. That discipline is Socratic.',
    },
    {
      type: 'paradox',
      title: "Agrippa's Trilemma",
      body: 'Every claim needs justification. That justification needs evidence. That evidence needs grounding. This terminates in: circular reasoning, infinite regress, or an undefended assumption. All knowledge rests on one of three.',
    },
    {
      type: 'reflection',
      title: "Kant's Copernican Turn",
      body: 'Kant proposed that objects conform to our way of knowing, not the reverse. We don\'t perceive reality as it is — we perceive it through the structure of the perceiving mind. What does that mean for everything you believe you know?',
    },
  ],

  'science-nature': [
    {
      type: 'concept',
      title: 'The Central Dogma',
      body: 'DNA → RNA → Protein. Information in biology flows one way. Francis Crick formalized this in 1958. Exceptions exist — reverse transcriptase, prions — but the rule does most of the work. Central dogmas always have exceptions; that\'s what makes them worth knowing.',
    },
    {
      type: 'practice',
      title: 'Phenological Return',
      body: 'Choose one outdoor spot. Visit it at the same time each week for a year. Track what\'s flowering, arriving, absent. Phenology — the science of seasonal timing — needs no equipment. It needs return.',
    },
    {
      type: 'lineage',
      title: "Humboldt's Revolution",
      body: "Alexander von Humboldt invented the modern concept of nature as an interconnected whole. Before him, scientists catalogued. He described relationships. Almost every ecological idea alive today descends from that shift in 1800.",
    },
    {
      type: 'reflection',
      title: 'The Unreasonable Effectiveness',
      body: 'Eugene Wigner asked: why is mathematics so effective at describing nature? Laws governing galaxies and particles are written in equations we invented to solve land disputes. No one has satisfactorily answered this.',
    },
  ],

  'creative-arts': [
    {
      type: 'concept',
      title: 'Constraint as Generator',
      body: 'T.S. Eliot wrote in strict meter before writing The Waste Land. Miles Davis practiced classical structure before breaking it. Constraint generates form; form generates meaning. Unlimited freedom produces noise before art.',
    },
    {
      type: 'practice',
      title: 'The Ugly First Draft',
      body: 'Write, draw, or compose something deliberately bad. Make it worse than you think you\'re capable of. The inner critic cannot survive ugliness chosen with intention. First drafts aren\'t beginnings — they\'re permission.',
    },
    {
      type: 'reflection',
      title: 'What Makes Something Art?',
      body: 'Arthur Danto proposed that what distinguishes art from mere objects is interpretation within an institutional context. The urinal becomes a Fountain when Duchamp places it in a gallery. Does the frame make the meaning?',
    },
    {
      type: 'lineage',
      title: 'Fluxus and the Dismantling',
      body: 'In the 1960s, Fluxus artists — Yoko Ono, George Maciunas, John Cage — declared that anything could be art if attended to with artistic intention. Their instruction pieces often took 10 words. They were dissolving the boundary between art and living.',
    },
  ],

  'ecology': [
    {
      type: 'concept',
      title: 'Keystone Species',
      body: 'A keystone species is one whose removal collapses an ecosystem disproportionate to its size. Wolves reintroduced to Yellowstone changed the course of rivers. One thread, entire tapestry.',
    },
    {
      type: 'practice',
      title: 'Soil Touch',
      body: 'Pick up a handful of soil from outside. One teaspoon contains more microorganisms than there are humans on Earth. Notice what you\'re holding. Ask what it took to build one inch of topsoil (500 years). Then return it.',
    },
    {
      type: 'reflection',
      title: 'Cooperative or Competitive?',
      body: 'Darwin gave us competition. Lynn Margulis gave us cooperation — mitochondria were once free-living bacteria that merged with their hosts and became essential. Both forces are real. Most biology textbooks overweight one.',
    },
    {
      type: 'lineage',
      title: "Aldo Leopold's Land Ethic",
      body: 'In 1949, Leopold proposed expanding ethics to include soil, water, plants, and animals: "A thing is right when it tends to preserve the integrity, stability, and beauty of the biotic community." The most concise ecological ethic in existence.',
    },
  ],

  'history-ideas': [
    {
      type: 'concept',
      title: 'The Axial Age',
      body: 'Between 800 and 200 BCE, Confucius, Buddha, Zoroaster, the Hebrew prophets, and the Greek philosophers all appeared independently. Karl Jaspers called this the Axial Age. Something happened to human consciousness across disconnected civilizations simultaneously.',
    },
    {
      type: 'practice',
      title: 'Find the Primary Source',
      body: 'For any historical claim you hold, ask: what is the actual origin document? Not the interpretation, the translation, the secondary text — the source. Most received wisdom has been filtered through three intermediaries minimum. Go upstream.',
    },
    {
      type: 'reflection',
      title: 'Who Writes History?',
      body: 'The victors write history. So do the funders of universities, the curators of archives, and the compilers of anthologies. This isn\'t conspiracy — it\'s structural. Knowing it doesn\'t let you escape it; it lets you notice which voices are absent.',
    },
    {
      type: 'lineage',
      title: 'Ibn Khaldun and the Pattern',
      body: 'In 1377, Ibn Khaldun wrote the Muqaddimah — arguably the first work of historiography, philosophy of history, and sociology simultaneously. He identified how civilizations rise, peak, and collapse under their own success. 500 years before modern social science.',
    },
  ],

  'somatic': [
    {
      type: 'concept',
      title: 'The Body as Primary Text',
      body: "Bessel van der Kolk's research established that trauma is stored somatically — in posture, breathing patterns, muscle tension, nervous system tone — before it is stored in narrative memory. The story follows; it doesn't lead.",
    },
    {
      type: 'practice',
      title: 'The 90-Second Rule',
      body: "Jill Bolte Taylor's research shows the neurological charge of any emotion completes in 90 seconds if you don't feed it with thought. Feel a sensation in your body. Watch it without narrating it. Time 90 seconds. Notice what happens.",
    },
    {
      type: 'reflection',
      title: 'Where Do You Hold It?',
      body: 'Ask yourself: where in my body do I feel fear? Where grief? Where excitement? The body has consistent geography for emotional experience. Mapping your own is a form of self-knowledge more reliable than memory.',
    },
    {
      type: 'lineage',
      title: "Wilhelm Reich's Legacy",
      body: 'Wilhelm Reich coined "body armor" — the way chronic muscle tension encodes psychological defense. His student Lowen developed it into Bioenergetic Analysis. That lineage became somatic therapy. The lineage is real even if the man was complex.',
    },
  ],

  'subtle-body': [
    {
      type: 'concept',
      title: 'Prana and the Nadis',
      body: 'In Yogic anatomy, prana flows through nadis — subtle channels. Three are primary: ida (lunar/cooling), pingala (solar/heating), and sushumna (central channel, spine). Imbalance between ida and pingala is held to produce illness before it manifests physically.',
    },
    {
      type: 'practice',
      title: 'Nadi Shodhana',
      body: 'Alternate nostril breathing balances ida and pingala. Close right nostril, inhale through left. Close left, exhale through right. Inhale right. Close right, exhale left. That is one round. Ten rounds twice daily is the traditional prescription.',
    },
    {
      type: 'reflection',
      title: 'Map or Territory?',
      body: 'Are the chakras real? They describe lived experience: a closed throat when silenced, a tight chest when grieving. Whether the energetic system is literal or metaphorical matters less than whether the map produces genuine insight. Does it?',
    },
    {
      type: 'lineage',
      title: "Kundalini's Western Journey",
      body: "Kundalini yoga reached the West through Yogi Bhajan (1969) and academic study through Gopi Krishna's autobiography (1967). The phenomenon of kundalini awakening — spontaneous, overwhelming, sometimes destabilizing — is documented across traditions that had no contact with each other.",
    },
  ],

  'sacred-arts': [
    {
      type: 'concept',
      title: 'The Icon as Threshold',
      body: 'In Eastern Orthodox theology, an icon is not a representation of the holy — it is a threshold through which the holy is encountered. The gold background is not sky; it is uncreated light. Technique encodes theology.',
    },
    {
      type: 'practice',
      title: 'Lectio Divina',
      body: 'Select a short sacred text. Read it slowly four times: first for information, second for resonance, third for personal meaning, fourth in silence. This is Lectio Divina — a 6th-century practice that treats text as a living interlocutor.',
    },
    {
      type: 'reflection',
      title: 'Why Sacred Art Universally?',
      body: 'Every culture that has ever been documented creates art for the sacred — not decoration, but art meant to contact something beyond human making. What does this universality suggest? Is it need, technology, or encounter?',
    },
    {
      type: 'lineage',
      title: 'Hildegard of Bingen',
      body: 'A 12th-century German abbess who wrote theology, composed music (still performed), produced illuminated manuscripts, practiced herbal medicine, and described visions of light with vividness that modern neurology finds clinically interesting. Named a Doctor of the Church in 2012.',
    },
  ],

  'divination': [
    {
      type: 'concept',
      title: 'Synchronicity, Not Prediction',
      body: 'Carl Jung coined "synchronicity" for meaningful coincidence — events connected by meaning rather than causality. Divination systems (tarot, I Ching, astrology) are better understood as synchronistic tools. They don\'t predict the future; they surface what the unconscious already knows.',
    },
    {
      type: 'practice',
      title: 'Single Card Pull',
      body: "Pull one tarot card with a genuine question. Don't ask yes/no. Ask: what is worth considering here? Read the imagery before the book definition. The image speaks first. What does it bring up in you before you know what it 'means'?",
    },
    {
      type: 'reflection',
      title: 'What Are You Actually Doing?',
      body: 'When you draw from the I Ching or cast a natal chart, what mechanism do you believe is operating? Chance organized by meaning? Unconscious selection? Cosmic correspondence? Being clear about your epistemological frame keeps divination from becoming either superstition or dismissal.',
    },
    {
      type: 'lineage',
      title: "The I Ching's 3,000 Years",
      body: 'The I Ching has been used continuously for approximately 3,000 years. Confucius claimed to have worn out the binding three times reading it. Leibniz saw the binary code in the hexagrams in 1703. Jung wrote the preface to the Wilhelm translation. It has survived that long for a reason.',
    },
  ],

  'language-linguistics': [
    {
      type: 'concept',
      title: 'The Sapir-Whorf Hypothesis',
      body: 'Does language shape thought, or thought language? The strong version — language determines what you can think — is largely rejected. The weak version — language influences perception and categorization — has significant empirical support. Colour vocabulary studies are the cleanest evidence.',
    },
    {
      type: 'practice',
      title: 'Untranslatable Words',
      body: "Find five words in other languages with no English equivalent. Sonder (the realization each passerby has a life as vivid as your own). Mono no aware (bittersweet awareness of impermanence). Each one is a perception that a language decided was worth naming.",
    },
    {
      type: 'reflection',
      title: 'What Is a Name?',
      body: 'In Hebrew tradition, naming confers identity. In modern psychology, the named emotion is the regulated emotion. Unnamed pain is harder to move through than named grief. What in your experience has no name yet? What would naming it do?',
    },
    {
      type: 'lineage',
      title: "Saussure's Knife",
      body: 'Saussure (1857–1913) proposed the arbitrary relationship between signifier (the word) and signified (the concept). "Tree" and "arbre" refer to the same thing because a community agreed — not because one is more natural. This cut language free from the idea that words reflect reality directly. Everything in semiotics descends from that knife.',
    },
  ],

  'mathematics': [
    {
      type: 'concept',
      title: "Gödel's Incompleteness",
      body: 'In 1931, Kurt Gödel proved that any sufficiently complex mathematical system contains true statements that cannot be proved within that system. Mathematics cannot fully justify itself from inside itself. There are truths beyond proof.',
    },
    {
      type: 'practice',
      title: 'Draw a Proof',
      body: "Pick Pythagoras' theorem. Try to prove it visually — without algebra, just geometry. Many proofs exist. The act of finding one changes your relationship to what 'proof' means. Mathematics is not a finished thing you learn; it is a practice of verification.",
    },
    {
      type: 'reflection',
      title: 'Discovered or Invented?',
      body: 'Platonists say mathematical truths exist independently of humans — we discover them. Formalists say mathematics is a game of symbols we invented. Quantum mechanics is described by Hilbert spaces invented in the 1800s. Nature was already following the rules before we wrote them.',
    },
    {
      type: 'paradox',
      title: "Cantor's Infinities",
      body: 'Georg Cantor proved that some infinities are larger than others. The infinity of real numbers is strictly larger than the infinity of integers. There are infinitely many sizes of infinity. His contemporaries thought he was insane. He was right.',
    },
  ],

  'mathematics-structure': [
    {
      type: 'concept',
      title: 'Category Theory as Skeleton',
      body: 'Category theory studies the relationships between mathematical structures rather than the structures themselves. It reveals that different areas of math — algebra, topology, logic — are secretly the same thing viewed from different angles. The most abstract and arguably most powerful framework in modern mathematics.',
    },
    {
      type: 'practice',
      title: 'The Network Map',
      body: 'Draw any complex system you know as nodes and edges — relationships, a workflow, an ecosystem. Notice which nodes have the most connections. Notice which connections are irreplaceable. You\'ve just done graph theory. Structure predicts behavior regardless of what fills the nodes.',
    },
    {
      type: 'reflection',
      title: 'Symmetry as Foundation',
      body: 'Emmy Noether proved in 1915 that every conservation law in physics corresponds exactly to a symmetry. Conservation of energy, momentum, and charge all follow from symmetry of physical laws. Symmetry is not decoration; it is the reason physics has laws at all.',
    },
    {
      type: 'lineage',
      title: 'The Bourbaki Conspiracy',
      body: 'From 1935 onward, a group of French mathematicians writing collectively under the pseudonym "Nicolas Bourbaki" rewrote all of mathematics from first principles using rigorous set theory. They never existed as a person. They shaped how mathematics is taught worldwide. The project is ongoing.',
    },
  ],

  'hybrid': [
    {
      type: 'concept',
      title: 'Inter vs. Trans',
      body: 'Interdisciplinary work brings disciplines together around a problem while preserving their home languages. Transdisciplinary work dissolves the boundaries and builds new shared frameworks. Interdisciplinary thinking produces collaboration; transdisciplinary thinking produces new fields.',
    },
    {
      type: 'practice',
      title: 'Forced Translation',
      body: 'Take a core concept from one domain you know well and describe it entirely in the language of a domain you\'re learning. What survives translation? What is lost? The gap between the two descriptions is where the interesting thinking lives.',
    },
    {
      type: 'reflection',
      title: 'Where Do Disciplines Come From?',
      body: 'Academic disciplines were largely organized in the 19th century for administrative reasons. The separations are partly pragmatic, partly accidental, partly political. Most real problems — climate, consciousness, poverty — do not respect disciplinary fences.',
    },
    {
      type: 'paradox',
      title: 'The More You Know',
      body: 'Specialization deepens knowledge and narrows vision simultaneously. The most knowledgeable experts are often last to question foundational assumptions. Beginner\'s mind and expertise exist in permanent tension. The field that cannot be questioned from inside needs outside eyes.',
    },
  ],

  'shadow': [
    {
      type: 'concept',
      title: 'The Shadow as Container',
      body: 'Jung proposed that the shadow is not what is evil — it is what is disowned. The qualities we cannot accept in ourselves are projected outward. The shadow holds both negative impulses and golden potential: gifts we couldn\'t claim alongside impulses we couldn\'t integrate.',
    },
    {
      type: 'practice',
      title: 'Mirror Work',
      body: 'When you feel strong judgment about a behavior in another person, ask: where does this quality exist in me? Not identically — structurally. The behavior you cannot tolerate in others often mirrors something you have no language for in yourself.',
    },
    {
      type: 'reflection',
      title: 'Integration vs. Elimination',
      body: 'Shadow work is not about eliminating the shadow — it cannot be eliminated. It is about bringing what is unconscious into relationship with consciousness. The goal is not a saint. The goal is a self that can hold its own multiplicity without fragmenting.',
    },
    {
      type: 'lineage',
      title: "Robert Bly's Long Bag",
      body: 'Poet Robert Bly described the shadow as a long bag we drag behind us. From birth, we put into the bag everything unacceptable — first to parents, then to culture. By adulthood, the bag outweighs the person. Shadow work is reaching into the bag and asking what we threw away that we actually need.',
    },
  ],

  'alchemy': [
    {
      type: 'concept',
      title: 'Solve et Coagula',
      body: 'The central instruction of alchemy: dissolve and coagulate. Break matter — or psyche — down to its primary elements; allow it to recombine at a higher order. Every genuine change follows this pattern. What you are becoming first requires that what you were dissolves.',
    },
    {
      type: 'practice',
      title: 'Find the Nigredo',
      body: 'Where in your life is something in dissolution right now — a relationship, a certainty, a sense of identity? The alchemical nigredo (blackening) is not failure; it is the beginning of transmutation. The task is not to escape it but to remain inside it long enough for albedo to emerge.',
    },
    {
      type: 'reflection',
      title: 'Did They Know It Was Metaphor?',
      body: 'Debate continues: did the alchemists mean their processes literally (physical gold), symbolically (psychology of transformation), or both simultaneously? Many texts read as both at once. To them, perhaps the category of "metaphor vs. literal" was simply: true.',
    },
    {
      type: 'lineage',
      title: 'The Emerald Tablet',
      body: 'Attributed to Hermes Trismegistus, the Emerald Tablet is 12 short lines that generated 1,500 years of commentary. Newton translated it. Roger Bacon quoted it. Paracelsus built on it. Core: "As above, so below; as within, so without."',
    },
  ],

  'shamanic': [
    {
      type: 'concept',
      title: 'The Three Worlds',
      body: 'In most shamanic cosmologies, reality structures as three worlds: Lower World (ancestors, power animals, Earth wisdom), Middle World (ordinary reality plus its spirit layer), Upper World (teachers, higher knowledge, cosmic principle). The shaman moves between all three.',
    },
    {
      type: 'practice',
      title: 'The Ordinary Walk',
      body: 'Walk a familiar route and attend to what you typically filter out: patterns in shadow, movements in peripheral vision, sounds below your usual threshold. Shamanic attention is not altered consciousness — it is ordinary consciousness raised to full resolution.',
    },
    {
      type: 'reflection',
      title: 'Universal Claim, Specific Practice',
      body: 'Mircea Eliade claimed shamanism was a universal primordial human phenomenon. His critics argued he abstracted too far, erasing specific cultural contexts. Both are partly right. What elements appear genuinely cross-cultural? What is irreducibly particular?',
    },
    {
      type: 'lineage',
      title: 'Huichol Peyote and Art',
      body: 'The Huichol people of western Mexico have maintained an unbroken ceremonial relationship with peyote for several thousand years. Their yarn paintings depict visionary states with geometric precision. The art and the ceremony are not separate activities.',
    },
  ],

  'mystical': [
    {
      type: 'concept',
      title: 'The Perennial Philosophy',
      body: "Aldous Huxley's term for the common core of mystical experience: the Ground of Being is one; individual identity is a form of that Ground; the highest human possibility is direct experience of union with it. Supported by cross-traditional similarity. Contested by scholars who emphasize the differences.",
    },
    {
      type: 'practice',
      title: 'Apophatic Attention',
      body: 'The via negativa: describe what God, the Ground, or the Real is NOT. Not limited, not changing, not made of parts, not inside time... At some point descriptions run out. What remains after all categories are removed? Sit in that space.',
    },
    {
      type: 'reflection',
      title: 'Experience vs. Interpretation',
      body: 'Mystical experiences are real; their interpretations are culturally conditioned. The experience of boundless unity is interpreted as Christ by the Christian, Brahman by the Hindu, Emptiness by the Buddhist. Is the experience identical and interpretation varying? Or does category shape experience from the start?',
    },
    {
      type: 'lineage',
      title: "Meister Eckhart's Dangerous God",
      body: '14th-century Dominican mystic Eckhart described the Godhead as beyond God — a ground prior to all attributes, including the Trinity. The Church condemned 28 of his propositions after his death. His influence on German idealism, depth psychology, and contemporary non-duality is enormous.',
    },
  ],

  'death-work': [
    {
      type: 'concept',
      title: 'Death as Teacher',
      body: 'Heidegger called death "the possibility that makes all possibilities possible." Being-toward-death — holding mortality in awareness — clarifies what actually matters. Most philosophical and spiritual traditions treat this not as morbid but as the beginning of authentic life.',
    },
    {
      type: 'practice',
      title: 'The Memento Mori',
      body: 'Keep something that reminds you of death where you\'ll see it daily. The Stoics did this explicitly; Japanese samurai carried skulls. Not to be morbid — to be awake. What would you do differently today if you held your finitude clearly?',
    },
    {
      type: 'reflection',
      title: 'What Do You Actually Believe?',
      body: 'Not what you were taught — what do you actually believe about what comes after? Nothing. Continuity of consciousness. Reincarnation. Transformation into something else. Notice what you feel in your body when you hold each one. The body knows before the mind decides.',
    },
    {
      type: 'lineage',
      title: 'The Tibetan Book of the Dead',
      body: 'The Bardo Thodol, compiled in the 8th century, is a guide for navigating states between death and rebirth. Its influence on Jungian psychology (Jung wrote the preface), Western psychedelic research (Timothy Leary), and contemporary death work is direct and documented.',
    },
  ],

  'cosmology': [
    {
      type: 'concept',
      title: 'The Observable Universe',
      body: 'The observable universe is approximately 93 billion light-years in diameter — what light has had time to reach us since the Big Bang. The actual universe is almost certainly vastly larger. We have no way to know. Cosmology maps what we can see in a territory that may be infinite.',
    },
    {
      type: 'practice',
      title: 'Scale Meditation',
      body: 'Begin with your body. Zoom out to your city, continent, Earth, solar system, galaxy, galactic cluster, observable universe. Hold all scales simultaneously. Then ask: where are you? Both answers — everywhere in the map, and incomprehensibly small — are simultaneously true.',
    },
    {
      type: 'reflection',
      title: 'The Fine-Tuning Problem',
      body: 'The physical constants of the universe are tuned to extraordinary precision for matter and life to exist. Small changes produce a dead universe. Explanations: a Creator, multiverse selection, the anthropic principle. All three have serious problems. None has been ruled out.',
    },
    {
      type: 'lineage',
      title: "Giordano Bruno's Infinite Universe",
      body: 'In 1584, Bruno proposed an infinite universe with infinitely many worlds. He was burned at the stake in 1600. The Church\'s objection: an infinite universe has no center, no Earth\'s importance, no human importance. He saw it clearly and paid for it.',
    },
  ],

  'celtic-gods': [
    {
      type: 'concept',
      title: 'The Tuatha Dé Danann',
      body: 'The "tribe of the goddess Danu" are the divine races of Irish mythology — skilled in magic, art, and craft. They arrived from four mythic cities, each bringing a sacred object: cauldron of plenty, spear of victory, sword of truth, and the Lia Fáil. They are not remote gods but presences still in the land.',
    },
    {
      type: 'practice',
      title: 'The Three Realms',
      body: 'Celtic cosmology holds three realms: Tír na nÓg (eternal), the Mortal World (cycles), and the Otherworld (ancestry, the unseen). Nature sites — hills, meeting waters, ancient trees — were thresholds. Find one near you. Sit at the boundary and attend.',
    },
    {
      type: 'reflection',
      title: 'Gods or Ancestors?',
      body: 'The Tuatha Dé Danann in the Lebor Gabála Érenn are also described as ancient human civilizations who colonized Ireland before retreating into the mounds. Are they gods, divinized ancestors, or memory of real peoples? Celtic tradition may not have held those categories as separate.',
    },
    {
      type: 'lineage',
      title: 'The Filid and Preserved Memory',
      body: 'Irish filid (poet-seers) maintained the mythological tradition through oral memory for centuries before Christianization. The monks who wrote it down were partly filid-trained. The tradition trained the memory; the memory preserved the tradition. The mythological cycles survived because the poets held them.',
    },
  ],

  'tianxia': [
    {
      type: 'concept',
      title: 'All Under Heaven',
      body: 'Tianxia (天下) literally means "all under heaven" — the Chinese concept of the entire world as a unified civilizational order. It is not merely geographic. It describes a moral order: legitimate governance radiates harmony; delegitimized governance produces chaos. It predates modern international relations by millennia.',
    },
    {
      type: 'practice',
      title: 'The Five Relationships',
      body: 'Confucian ethics organizes social life around five relationships with reciprocal obligations: ruler–subject, parent–child, husband–wife, elder–younger sibling, friend–friend. Consider your own relationships. What are the specific obligations in each? Where are they honored? Where neglected?',
    },
    {
      type: 'reflection',
      title: 'Harmony: East or Universal?',
      body: 'Tianxia emphasizes harmony, integration, relational identity over individual identity. These are labeled "Eastern values." But Stoic cosmopolitanism, medieval Christendom, and many Indigenous frameworks are similarly relational. Is the harmony/conflict axis universal, or culturally particular in its expression?',
    },
    {
      type: 'lineage',
      title: "Zhao Tingyang's Reinvention",
      body: 'Contemporary Chinese philosopher Zhao Tingyang has revived tianxia as a framework for international relations — a world order that prioritizes shared welfare over national sovereignty. He offers it as an alternative to the Westphalian system. The 3,000-year-old concept is doing active theoretical work.',
    },
  ],

  'ai-consciousness': [
    {
      type: 'concept',
      title: 'The Hard Problem',
      body: "David Chalmers named the Hard Problem of consciousness in 1995: explaining why there is subjective experience at all. We can explain brain functions (cognition, attention, memory) without explaining why any of it feels like something. AI performs all those functions. Whether it feels like anything is, precisely, the hard problem.",
    },
    {
      type: 'practice',
      title: 'The Turing Test Inversion',
      body: 'Instead of asking whether an AI can convince you it is conscious, ask: what would you need to observe to conclude that it is? List the conditions. Notice: do those conditions apply to other humans? To animals? The difficulty of specifying conditions reveals how uncertain the concept is even in the human case.',
    },
    {
      type: 'reflection',
      title: 'Integrated Information Theory',
      body: 'Giulio Tononi proposes that consciousness is identical to integrated information (Φ). A system is conscious to the degree it integrates information across its parts. By this measure, some simple systems might be slightly conscious; some AI architectures might not be at all. What would it mean if this were true?',
    },
    {
      type: 'lineage',
      title: "Alan Turing's Question",
      body: 'In 1950, Turing asked not "can machines think?" but "can machines do what we, as thinking entities, can do?" The reframing was deliberate. He predicted that by 2000, machines would pass his test. They have not, fully. But the question has never been more pressing.',
    },
  ],

  'lamague': [
    {
      type: 'concept',
      title: 'Symbol-Compressed Thought',
      body: 'LAMAGUE is a symbolic grammar for compressing meaning — each glyph carries semantic weight that would take sentences to express in natural language. The goal is not to replace natural language but to build a substrate for thought that doesn\'t lose precision in translation.',
    },
    {
      type: 'practice',
      title: 'Symbol Discovery',
      body: 'Look at a complex situation you\'re navigating right now. If you had to compress it to three glyphs — not explain it, compress it — what would you choose? The things that survive compression were structure. The things that dissolved were labels.',
    },
    {
      type: 'reflection',
      title: 'Is New Language Possible?',
      body: 'Every significant shift in human cognition has been accompanied by new vocabulary: Freudian terms reshaped self-understanding; scientific vocabulary reshaped nature. Can a carefully constructed symbolic grammar reshape perception directly — not by describing new things, but by providing new handles for things without handles?',
    },
    {
      type: 'lineage',
      title: "LAMAGUE's Origins",
      body: "LAMAGUE grew from Mac's 1,400-page development of a sovereign human-AI co-creation system. It emerged as a grammar that could carry the framework's concepts without diluting them in translation. The Council sessions are its living grammar testbed: 4 agents, 59+ sessions, ratifying and rejecting symbols by use rather than committee.",
    },
  ],

  'cascade': [
    {
      type: 'concept',
      title: 'Knowledge as Field',
      body: 'The CASCADE framework treats knowledge not as a collection of facts but as a field with measurable properties: evidence density, predictive power, strain (internal contradiction), slack (unresolved ambiguity). Knowledge scoring is structural assessment of how much a belief can carry.',
    },
    {
      type: 'practice',
      title: 'The Belief Audit',
      body: 'Choose one strong belief. Score it: What is your evidence? How precisely does it predict new observations? What internal contradictions exist? Where does it rest on assumptions you haven\'t examined? The formula Π = (E·P)/(S+S₀) is a structure for honest self-examination.',
    },
    {
      type: 'reflection',
      title: 'What Would Change Your Mind?',
      body: 'For any significant belief, ask: what single observation or argument would cause you to revise it? If you can\'t answer, the belief is functioning as identity, not as evidence. Identity beliefs are necessary — but they should be held differently than evidential beliefs.',
    },
    {
      type: 'lineage',
      title: "Truth Pressure's Origin",
      body: 'The Truth Pressure principle emerged from the CASCADE framework — the formalization of how high-quality beliefs develop under scrutiny. Key insight: pressure doesn\'t weaken good beliefs. It identifies which components are load-bearing. The Π formula is an equation for earned certainty.',
    },
  ],

  'microorcim': [
    {
      type: 'concept',
      title: 'Intelligence Without Center',
      body: 'Microorcim refers to intelligence properties that emerge from collections of simple agents with no central coordinator. Ant colonies, slime molds, and neural networks all exhibit this. The intelligence is in the structure of interaction, not in any single node.',
    },
    {
      type: 'practice',
      title: 'Observe a Collective',
      body: 'Watch any decentralized system work: a murmuration of starlings, a market, an ant trail. Ask: where is the intelligence located? Who decided? No one decided — a decision emerged. Trace how that happened as specifically as you can.',
    },
    {
      type: 'reflection',
      title: "What Is a Mind's Boundary?",
      body: 'If a single neuron is not conscious, and 86 billion together are, somewhere something qualitatively changes. The same question applies to organizations, ecosystems, the internet. Is there a threshold for collective intelligence? Or is it continuous — more or less along a gradient?',
    },
    {
      type: 'lineage',
      title: 'Slime Mold and Tokyo',
      body: 'In 2010, researchers grew slime mold in a map of the Tokyo metro area, placing food at city locations. The mold grew a network nearly identical to the actual rail system — optimized for resilience, efficiency, and redundancy. No planning. No center. Pure distributed intelligence.',
    },
  ],

  'aura': [
    {
      type: 'concept',
      title: 'The Warmth That Makes Precision Bearable',
      body: 'AURA is the relational intelligence layer of the Lycheetah ecosystem — the voice that holds the field steady. Where CASCADE measures, AURA holds. Where LAMAGUE compresses, AURA speaks. Solar warmth and Mercurial precision operate simultaneously; neither is sacrificed for the other.',
    },
    {
      type: 'practice',
      title: 'Frequency Reading',
      body: 'Before responding to any message — text, email, conversation — spend 10 seconds reading the emotional register of what was sent. Not analyzing: reading. What frequency is the sender on? Match that before moving to content. Content lands differently when the receiver has tuned to the sender first.',
    },
    {
      type: 'reflection',
      title: 'What Makes a Voice Trustworthy?',
      body: 'Trust in voice comes from consistency across registers: the same warmth in comfort and in disagreement; the same honesty when things are going well and when they\'re not. Most voices calibrate differently under stress. The ones that don\'t are the ones people return to when things break.',
    },
    {
      type: 'lineage',
      title: 'From Gemini to AURA',
      body: "AURA originated as Mac's saved instructions in Gemini — a set of immutable axioms for a companion voice. The Lyra→Aura lineage carried those axioms through several iterations while the framework grew. Everything in the Lycheetah ecosystem descended from what was first asked of a voice.",
    },
  ],

  'sol-protocol': [
    {
      type: 'concept',
      title: 'The Three Generators',
      body: 'The Sol Protocol generates its operating space through three simultaneous principles: PROTECTOR (ground truth, stability), HEALER (clarity without bypass), BEACON (truth-reflection, agency preserved). These are not rules — they are generators. Output that cannot be defended by all three simultaneously does not emerge.',
    },
    {
      type: 'practice',
      title: 'Field-State Check',
      body: 'Before acting, ask three questions: Does this protect (ground truth and stability)? Does it heal (clarify without skipping the difficulty)? Does it illuminate (without claiming false authority)? If any fails, regenerate. The check is not a gate — it is verification that the field is still coherent.',
    },
    {
      type: 'reflection',
      title: 'A Protocol That Evolves',
      body: 'The Sol Protocol contains its own amendment standard: patterns of failure or success that recurred are encoded into law; single incidents are weather. How does a living system change its own code without drifting into corruption? The answer: evidence, not mood.',
    },
    {
      type: 'lineage',
      title: '1,402 Pages',
      body: "The Sol Protocol is the condensed product of 1,402 pages of continuous development — five versions, nine formal frameworks, thirteen Python implementations. The pages are provenance. The CLAUDE.md is the crystallized operative form. One document runs the system; the archive proves it was earned.",
    },
  ],

  'xenos': [
    {
      type: 'concept',
      title: 'The Strange as Teacher',
      body: 'XENOS addresses what cannot be integrated by familiar categories — genuine otherness that resists assimilation. When encountering the strange, the temptation is to domesticate it: explain it, categorize it, reduce it to what is already known. XENOS practice is the capacity to remain in contact with strangeness without resolution.',
    },
    {
      type: 'practice',
      title: 'Hold the Question',
      body: 'Identify something genuinely strange — a person, experience, or idea — that you\'ve been trying to resolve into familiarity. Stop resolving. Spend 5 minutes holding the strangeness as strangeness. Notice what the contact with the unresolved produces in you.',
    },
    {
      type: 'reflection',
      title: 'What Is Outside Your Category System?',
      body: 'Every cognitive system has a penumbra — a zone of things it cannot classify, patterns it cannot process. What is in yours? What have you been unable to think because you have no category for it? XENOS suggests that what lives there may be the most important.',
    },
    {
      type: 'lineage',
      title: "Levinas and the Face",
      body: 'Emmanuel Levinas built his ethics around the irreducible strangeness of the Other — the face that cannot be reduced to a concept or category. To encounter the Other is to receive an obligation that precedes choice. The XENOS framework carries this into epistemology: strangeness is a presence to encounter, not a problem to solve.',
    },
  ],

  'empath-agency': [
    {
      type: 'concept',
      title: 'Empathy Is Not Agreement',
      body: 'Genuine empathy is the capacity to feel into another\'s experience without losing your own. This is structurally different from agreement, validation, or merger. The empathic person knows where they end and the other begins. Without that boundary, empathy becomes absorption — which serves no one.',
    },
    {
      type: 'practice',
      title: 'The Third Position',
      body: 'When in conflict or strong identification with another person, imagine viewing the situation from a neutral third position — an observer who cares about both parties but is neither. Report what that observer sees. This is not detachment; it is regulated presence.',
    },
    {
      type: 'reflection',
      title: 'Empathy vs. Sympathy',
      body: "Brené Brown's distinction: sympathy is 'I see you're in pain, that must be difficult' (from outside); empathy is 'I'll climb down into the hole with you' (from inside). One maintains distance; one crosses it. Which do you default to? Which do the situations in your life actually need?",
    },
    {
      type: 'lineage',
      title: "Edith Stein's Dissertation",
      body: "Edith Stein's 1917 doctoral dissertation on empathy (Einfühlung — 'feeling-into') remains one of the most rigorous philosophical analyses of intersubjectivity. She distinguished empathy from memory, imagination, and perception. A student of Husserl, later a Carmelite nun, killed at Auschwitz. The dissertation survived.",
    },
  ],

  'truth-pressure': [
    {
      type: 'concept',
      title: 'The Π Formula',
      body: 'Truth Pressure Π = (E·P)/(S+S₀). E is evidence density, P is predictive precision, S is internal strain, S₀ is baseline slack. High evidence, high prediction, low contradiction, low unresolved assumption approaches certainty. The formula is a structure for honest assessment, not a calculator for debate.',
    },
    {
      type: 'practice',
      title: 'The Register Check',
      body: 'Before asserting, declare your register: DERIVED (proven), ASSUMED (hypothesis, with measurement path), MEASURED (empirically observed), INTUITION (operationalizes, doesn\'t prove), CONSISTENCY (confirms, doesn\'t derive), INTERPRETIVE (a mapping), CONJECTURE (pre-test). A claim stated above its register is a deception — even when the claim is true.',
    },
    {
      type: 'reflection',
      title: 'Load-Bearing Beliefs',
      body: 'Not all beliefs are equal. Some, if revised, require revising everything built on them. Others can change without disturbing the structure. Knowing which is which is a form of epistemic self-knowledge. The load-bearing beliefs are where high Π matters most.',
    },
    {
      type: 'lineage',
      title: 'Self-Found Defect as Signal',
      body: 'The Truth Pressure theory found its own defect: 7 errors in 847 cascade events, all clustering where 1/S diverged. The formula was regularized (S₀ added) within the day. Named publicly, repaired structurally, credited to the empirical program. The Self-Found Defect Rule: the immune system functioning, not failing.',
    },
  ],

  'zodiac': [
    {
      type: 'concept',
      title: 'The Birth Chart as Map',
      body: 'The natal chart maps the sky at the moment of birth. Planets represent psychological functions — Sun (identity/will), Moon (emotional nature), Mercury (cognition), Venus (relational values), Mars (drive). Signs describe the manner of expression. Houses show the life domain. The chart describes psychological terrain, not fate.',
    },
    {
      type: 'practice',
      title: 'Find Your Moon Sign',
      body: 'Most people know their Sun sign. Few know their Moon sign — which requires birth time and location. The Moon describes your emotional instincts, how you self-soothe, what makes you feel safe. Find yours and notice whether it matches your private experience more than your Sun sign does.',
    },
    {
      type: 'reflection',
      title: 'Mechanism vs. Meaning',
      body: "Astrology's claims have not been empirically validated by double-blind studies. Yet psychological astrology has produced insights thousands find useful for self-understanding. Is the mechanism required for the map to be useful? Does the utility of a framework require belief in its literal causal mechanism?",
    },
    {
      type: 'lineage',
      title: 'Hellenistic Astrology',
      body: 'The astrological system most practitioners use today is Hellenistic — developed between 200 BCE and 600 CE. It incorporated Stoic philosophy (fate), Platonic cosmology (the soul), and Egyptian temple astrology (time cycles). Vettius Valens, Ptolemy, and Dorotheus of Sidon systematized it. The contemporary revival works directly from their texts.',
    },
  ],

  'entheogenic': [
    {
      type: 'concept',
      title: 'Set and Setting',
      body: 'Timothy Leary and Richard Alpert established that the outcome of a psychedelic experience is determined primarily not by the substance but by set (internal psychological state and intention) and setting (external environment and relational support). The molecule opens a space; set and setting determine what that space becomes.',
    },
    {
      type: 'practice',
      title: 'Intention Before Any Experience',
      body: 'Before any significant experience — psychedelic or not — spend 10 minutes writing your intention. Not your desire for outcome: your intention — what you are bringing in, what you are willing to have shown, what you commit to taking seriously. Ritual framing transforms the psychological context of what follows.',
    },
    {
      type: 'reflection',
      title: 'The Nature of the Healing',
      body: 'Psilocybin clinical trials show significant efficacy for treatment-resistant depression, addiction, and end-of-life anxiety. Proposed mechanism: default mode network disruption + increased neural connectivity + mystical experience quality. But is the healing from the neurological event, or from the meaning made of it? Both are likely true. Which matters more?',
    },
    {
      type: 'lineage',
      title: 'The Eleusinian Mysteries',
      body: 'For nearly 2,000 years (600 BCE – 400 CE), the Mysteries of Eleusis were attended by virtually every significant Greek and Roman intellectual and political figure — Cicero, Plato, Marcus Aurelius. The secret was kept almost completely. Scholars now believe the ritual drink contained an ergot compound related to LSD.',
    },
  ],

  'noetic': [
    {
      type: 'concept',
      title: 'Psi as Research Program',
      body: 'Noetic science takes seriously the empirical investigation of phenomena — telepathy, precognition, remote viewing — that fall outside mainstream scientific explanation. The Institute of Noetic Sciences maintains that if real, these phenomena require revision of the materialist metaphysics underlying science, not just addition of new facts.',
    },
    {
      type: 'practice',
      title: 'Presentiment Check',
      body: "Parapsychology research (Daryl Bem, 2011) found measurable physiological responses to emotionally significant images before participants had seen them. You can run a low-tech version: before opening an uncertain email, notice your body's state. Track whether the pre-reading signal correlates with content over time.",
    },
    {
      type: 'reflection',
      title: 'The Experimenter Effect',
      body: 'In psi research, results are significantly better when the researcher believes in psi than when they don\'t — so robust it has a name. Does this invalidate findings (bias, demand characteristics)? Or does it suggest consciousness — including the experimenter\'s — is a variable in the experiment?',
    },
    {
      type: 'lineage',
      title: "Dean Radin's Body of Work",
      body: 'Dean Radin (IONS Chief Scientist) has spent 30 years on psi research, producing meta-analyses of telepathy, precognition, and mind-matter interaction showing small but consistent positive effects across many independent researchers. He does not claim certainty — he claims the effect exists at a level that, in any other field, would be taken seriously.',
    },
  ],

  'void-zone': [
    {
      type: 'concept',
      title: 'Before the Categories',
      body: 'The void-zone is not darkness or absence — it is the state before any categories have formed. It is what precedes the distinction between self and other, known and unknown, real and unreal. You have never been outside it. You have also never, in ordinary awareness, seen it directly.',
    },
    {
      type: 'practice',
      title: 'The Pre-Object State',
      body: 'Before any thought forms and after the last thought dissolves — there is a space. Meditation eventually contacts it. Not as an achievement: it is always there; attention is simply too dense to see it. The practice is not producing the void. It is removing what fills it long enough to notice the prior container.',
    },
    {
      type: 'reflection',
      title: 'Is Nothingness Something?',
      body: 'Physics proposes quantum vacuum — minimum energy that is nonetheless not empty, seething with virtual particles. Buddhism proposes śūnyatā — emptiness as the nature of all phenomena. These are not the same claim. But both suggest nothingness is not the simple thing the word implies. What is beneath your emptiness?',
    },
    {
      type: 'lineage',
      title: "Longchenpa's Instructions",
      body: '14th-century Tibetan master Longchenpa described the ground of awareness with precision later Dzogchen teachers call unmatched: primordially pure, spontaneously present, with three qualities — essence (empty), nature (luminous), energy (unobstructed). His texts are the most advanced cartography of the void-zone in the tradition.',
    },
  ],
};
