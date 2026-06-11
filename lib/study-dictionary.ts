// Study Dictionary — factual reference terms, no Sol-style language
// Categories: AI, Math, Science, Language, Programming

export type DictEntry = {
  term: string;
  short: string;        // one-line definition for list view
  full: string;         // 2-3 sentence definition for detail view
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  example?: string;
  related?: string[];
};

export const DICT_CATEGORIES: { id: string; label: string; glyph: string; color: string }[] = [
  { id: 'ai',          label: 'AI & Machine Learning', glyph: '◉', color: '#4A9EFF' },
  { id: 'math',        label: 'Mathematics',           glyph: '∑', color: '#F5A623' },
  { id: 'science',     label: 'Physics & Science',     glyph: '⌬', color: '#7EC8A4' },
  { id: 'language',    label: 'Language & Linguistics', glyph: 'Λ', color: '#C07A3A' },
  { id: 'programming', label: 'Programming & Logic',   glyph: '⊞', color: '#9B59B6' },
];

export const STUDY_DICTIONARY: DictEntry[] = [
  // ─── AI & Machine Learning ────────────────────────────────────────────────
  { category: 'ai', level: 'beginner', term: 'Neural Network',
    short: 'A computing system modelled on the structure of biological brains.',
    full: 'A neural network consists of layers of interconnected nodes (neurons) that process information and learn patterns from data. Each connection has a weight that adjusts during training. Deep networks with many layers are called deep neural networks.',
    related: ['Transformer', 'Parameters', 'Gradient Descent'] },

  { category: 'ai', level: 'beginner', term: 'Machine Learning',
    short: 'Systems that learn from data rather than explicit programming.',
    full: 'Instead of being programmed with rules, machine learning systems find patterns in training data and use those patterns to make predictions or decisions. Performance improves with more data and training time.',
    related: ['Neural Network', 'Overfitting', 'Inference'] },

  { category: 'ai', level: 'beginner', term: 'Large Language Model (LLM)',
    short: 'A neural network trained on vast text data to understand and generate language.',
    full: 'LLMs like GPT-4, Claude, and Gemini are trained on trillions of words from the internet, books, and code. They learn to predict the next token in a sequence, and from this simple task emerge complex abilities: reasoning, translation, coding, and conversation.',
    example: 'Claude is an LLM. When you type a question, it predicts the most likely helpful response token by token.',
    related: ['Transformer', 'Token', 'Parameters', 'Context Window'] },

  { category: 'ai', level: 'intermediate', term: 'Transformer',
    short: 'The architecture underlying most modern LLMs — uses attention to process whole sequences.',
    full: 'Introduced in "Attention Is All You Need" (2017), the transformer processes entire input sequences simultaneously rather than word-by-word. This parallelism enabled training on massive datasets and is the foundation of GPT, Claude, and Gemini.',
    related: ['Attention Mechanism', 'Large Language Model (LLM)'] },

  { category: 'ai', level: 'intermediate', term: 'Attention Mechanism',
    short: 'Lets a model focus on the most relevant parts of its input when generating output.',
    full: 'Attention computes a weighted sum over all input positions, giving more weight to relevant context. "Self-attention" lets each token attend to all other tokens in the sequence. This is what allows LLMs to understand long-range dependencies in text.',
    related: ['Transformer', 'Context Window'] },

  { category: 'ai', level: 'beginner', term: 'Prompt Engineering',
    short: 'The practice of crafting inputs to AI systems to get better outputs.',
    full: 'Prompt engineering involves structuring questions, instructions, and context to guide AI responses. Techniques include few-shot learning (providing examples), chain-of-thought prompting (asking to reason step-by-step), and role assignment.',
    example: '"You are an expert physicist. Explain quantum entanglement to a 10-year-old."',
    related: ['Large Language Model (LLM)', 'Context Window'] },

  { category: 'ai', level: 'beginner', term: 'Hallucination',
    short: 'When an AI generates plausible-sounding but factually incorrect information.',
    full: 'LLMs predict probable next tokens — they do not "know" facts. This causes hallucinations: confident-sounding claims about people, events, or citations that don\'t exist. Critical information from LLMs should always be verified.',
    related: ['Large Language Model (LLM)', 'Inference'] },

  { category: 'ai', level: 'intermediate', term: 'Embeddings',
    short: 'Numerical representations of words or concepts in high-dimensional space.',
    full: 'Embeddings map text (or images, audio) to vectors of numbers. Similar concepts end up close together in this space: "king" − "man" + "woman" ≈ "queen". Embeddings enable semantic search, clustering, and similarity comparisons.',
    related: ['Neural Network', 'Semantic Search'] },

  { category: 'ai', level: 'intermediate', term: 'RLHF',
    short: 'Reinforcement Learning from Human Feedback — how LLMs are made more helpful.',
    full: 'RLHF trains a reward model from human preferences, then uses reinforcement learning to adjust the base LLM toward outputs humans rate as better. Used by OpenAI, Anthropic, and Google to align LLMs with human values and reduce harmful outputs.',
    related: ['Fine-tuning', 'Large Language Model (LLM)'] },

  { category: 'ai', level: 'intermediate', term: 'Parameters',
    short: 'The learned numerical values inside a neural network — more = generally more capable.',
    full: 'Neural network parameters (weights and biases) are numbers adjusted during training. GPT-4 has an estimated ~1.8 trillion parameters; smaller models have 7B–70B. More parameters enable learning more complex patterns, but also require more compute.',
    related: ['Neural Network', 'Training'] },

  { category: 'ai', level: 'beginner', term: 'Context Window',
    short: 'The maximum text an LLM can process at once, measured in tokens.',
    full: 'The context window is the LLM\'s working memory. Claude 3.5 has a 200K token context; GPT-4 has 128K. Longer contexts allow referencing more of a conversation or document, but processing cost scales with length.',
    related: ['Token', 'Large Language Model (LLM)'] },

  { category: 'ai', level: 'beginner', term: 'Token',
    short: 'The basic unit of text an LLM processes — roughly ¾ of a word.',
    full: 'Tokenization splits text into subwords using algorithms like BPE. "Tokenization" might be 3 tokens: "Token", "iz", "ation". Common words are single tokens; rare words split into more. LLMs have a token limit, and billing is often per-token.',
    related: ['Context Window', 'Large Language Model (LLM)'] },

  { category: 'ai', level: 'intermediate', term: 'Fine-tuning',
    short: 'Further training a pre-trained model on specific data to adapt it for a task.',
    full: 'A base model trained on general data can be fine-tuned on medical, legal, or code data to make it more domain-specific. Much cheaper than training from scratch. RLHF is a form of fine-tuning using human feedback.',
    related: ['RLHF', 'Machine Learning'] },

  { category: 'ai', level: 'intermediate', term: 'Gradient Descent',
    short: 'The optimization algorithm that trains neural networks by minimizing error.',
    full: 'Gradient descent computes how much each parameter contributed to the error, then adjusts parameters in the direction that reduces it. "Stochastic" gradient descent does this on small batches of data. Modern variants include Adam and AdamW.',
    related: ['Neural Network', 'Parameters'] },

  { category: 'ai', level: 'intermediate', term: 'Overfitting',
    short: 'When a model memorizes training data and fails to generalize.',
    full: 'A model that overfits performs well on training data but poorly on new examples — it has learned noise rather than signal. Solutions include regularization, dropout, more diverse training data, and early stopping.',
    related: ['Machine Learning', 'Training'] },

  { category: 'ai', level: 'intermediate', term: 'RAG',
    short: 'Retrieval-Augmented Generation — grounding LLM responses with retrieved information.',
    full: 'RAG systems retrieve relevant documents at query time and include them in the LLM\'s context. This reduces hallucination, enables up-to-date knowledge, and makes the model\'s reasoning transparent. Used in enterprise AI systems and search.',
    related: ['Embeddings', 'Large Language Model (LLM)'] },

  { category: 'ai', level: 'beginner', term: 'Multimodal AI',
    short: 'AI systems that process multiple types of input: text, images, audio, or video.',
    full: 'Multimodal models encode different data types into a shared representation space. GPT-4V, Claude 3, and Gemini can analyze images, read charts, and describe photos. Training involves paired data (images with captions, videos with transcripts).',
    related: ['Embeddings', 'Large Language Model (LLM)'] },

  { category: 'ai', level: 'advanced', term: 'Autonomous Agent',
    short: 'An AI system that takes actions in an environment to complete goals.',
    full: 'Agents use tools (web search, code execution, APIs) and memory to plan and complete multi-step tasks. They can reason, retry failures, and adapt. Claude Code, AutoGPT, and Devin are examples. Key challenge: reliability over long task horizons.',
    related: ['Large Language Model (LLM)', 'RAG'] },

  { category: 'ai', level: 'intermediate', term: 'Temperature',
    short: 'A parameter controlling randomness in AI text generation.',
    full: 'At temperature 0, the model always picks the most likely next token (deterministic). At higher temperatures (1.0+), less likely tokens are chosen more often, producing more creative but less predictable output. Most APIs default to 0.7–1.0.',
    related: ['Token', 'Inference'] },

  { category: 'ai', level: 'intermediate', term: 'Inference',
    short: 'Running a trained model to produce outputs — distinct from training.',
    full: 'Inference is the serving/prediction phase: given an input, the model produces output. It doesn\'t change model weights. Training is expensive; inference is cheaper but must scale to many concurrent users. Hardware optimized for inference (like NVIDIA H100) differs from training hardware.',
    related: ['Parameters', 'Temperature'] },

  // ─── Mathematics ────────────────────────────────────────────────────────────
  { category: 'math', level: 'beginner', term: 'Prime Number',
    short: 'A natural number greater than 1 divisible only by 1 and itself.',
    full: 'The first primes: 2, 3, 5, 7, 11, 13, 17... There are infinitely many primes (Euclid proved this ~300 BC). Primes are the "atoms" of arithmetic — every integer factors uniquely into primes. Critical to modern cryptography.',
    related: ['Cryptography', 'Set Theory'] },

  { category: 'math', level: 'intermediate', term: 'Derivative',
    short: 'The instantaneous rate of change of a function at a given point.',
    full: 'The derivative f\'(x) gives the slope of the function at x. If position = f(t), then velocity = f\'(t) and acceleration = f\'\'(t). Derivatives are computed using differentiation rules and are central to optimization (including training neural networks).',
    example: 'f(x) = x² → f\'(x) = 2x. At x = 3, the slope is 6.',
    related: ['Integral', 'Gradient Descent'] },

  { category: 'math', level: 'intermediate', term: 'Integral',
    short: 'The accumulation of a quantity — mathematically, the area under a curve.',
    full: 'Integration is the inverse of differentiation (the Fundamental Theorem of Calculus). Definite integrals compute exact areas; indefinite integrals find antiderivatives. Used in physics (distance from velocity), probability (distributions), and signal processing.',
    related: ['Derivative', 'Fourier Transform'] },

  { category: 'math', level: 'intermediate', term: 'Logarithm',
    short: 'The inverse of exponentiation: log_b(x) asks "b to what power gives x?"',
    full: 'log₁₀(100) = 2 because 10² = 100. The natural log (ln) uses base e ≈ 2.718. Logarithmic scales (decibels, Richter, pH) are used when values span many orders of magnitude. Central to information theory and complexity analysis.',
    example: 'log₂(8) = 3 because 2³ = 8.',
    related: ['Entropy', 'Algorithm Complexity (Big O)'] },

  { category: 'math', level: 'beginner', term: 'Vector',
    short: 'A quantity with both magnitude and direction.',
    full: 'Vectors are represented as ordered lists of numbers (components). Addition, subtraction, dot products, and cross products operate on vectors. Used in physics (force, velocity), computer graphics (3D positions), and AI (embeddings, weight matrices).',
    example: '[3, 4] is a 2D vector with magnitude √(9+16) = 5.',
    related: ['Matrix', 'Embeddings'] },

  { category: 'math', level: 'intermediate', term: 'Matrix',
    short: 'A rectangular array of numbers — the fundamental structure of linear algebra.',
    full: 'Matrices represent linear transformations, systems of equations, and datasets. Matrix multiplication (not commutative: AB ≠ BA) is the core operation in neural networks — each layer is a matrix multiplication followed by a nonlinearity.',
    related: ['Vector', 'Neural Network'] },

  { category: 'math', level: 'beginner', term: 'Probability',
    short: 'A number 0–1 measuring how likely an event is.',
    full: 'P(impossible) = 0; P(certain) = 1. Conditional probability P(A|B) = probability of A given B has occurred. Probability theory underpins statistics, machine learning, and quantum mechanics. Counterintuitive results (Monty Hall, Birthday Problem) challenge intuition.',
    related: 'Bayes\' Theorem'.split(', ') },

  { category: 'math', level: 'intermediate', term: 'Bayes\' Theorem',
    short: 'A formula for updating probability estimates when new evidence arrives.',
    full: 'P(A|B) = P(B|A) × P(A) / P(B). Prior probability P(A) is updated by evidence B to give posterior P(A|B). Bayesian thinking underpins rational belief updating, medical diagnosis, spam filters, and much of modern AI.',
    example: 'A test is 99% accurate. A disease affects 1 in 1000. A positive test means only ~9% chance you have the disease.',
    related: ['Probability'] },

  { category: 'math', level: 'intermediate', term: 'Standard Deviation',
    short: 'A measure of how spread out values in a dataset are around the mean.',
    full: 'Low standard deviation means values cluster near the mean; high means they spread widely. About 68% of values lie within 1 SD of the mean in a normal distribution, 95% within 2 SDs. Essential for understanding data variability.',
    related: ['Probability'] },

  { category: 'math', level: 'advanced', term: 'Fourier Transform',
    short: 'Decomposes any signal into its component frequencies.',
    full: 'The Fourier Transform converts a signal from the time domain to the frequency domain. Any periodic function can be expressed as a sum of sine waves of different frequencies. Used in audio compression (MP3), image processing (JPEG), MRI, and signal analysis.',
    related: ['Integral', 'Complex Number'] },

  { category: 'math', level: 'advanced', term: 'Eigenvalue',
    short: 'A scalar describing how a matrix transformation stretches a special direction.',
    full: 'For a matrix A and vector v: if Av = λv, then λ is an eigenvalue and v is an eigenvector. Eigendecomposition reveals a matrix\'s fundamental structure. Used in dimensionality reduction (PCA), quantum mechanics, and stability analysis.',
    related: ['Matrix', 'Vector'] },

  { category: 'math', level: 'beginner', term: 'Pi (π)',
    short: 'The ratio of a circle\'s circumference to its diameter ≈ 3.14159...',
    full: 'Pi is irrational (infinite, non-repeating decimal) and transcendental (not a root of any polynomial with rational coefficients). It appears throughout mathematics far beyond circles: in probability, Fourier analysis, complex numbers, and number theory.',
    related: ['Complex Number'] },

  { category: 'math', level: 'beginner', term: 'Boolean Logic',
    short: 'A branch of algebra operating on true/false values with AND, OR, NOT.',
    full: 'Named after George Boole (1815–1864), Boolean logic is the mathematical foundation of digital computing. Every circuit, program, and database query reduces to Boolean operations. Key laws: De Morgan\'s, distributive, absorption.',
    related: ['Algorithm', 'Programming & Logic'] },

  { category: 'math', level: 'intermediate', term: 'Chaos Theory',
    short: 'The study of systems extremely sensitive to initial conditions.',
    full: 'Small differences in starting conditions produce vastly different outcomes — the "butterfly effect." Chaotic systems are deterministic but unpredictable in practice. Found in weather, fluid dynamics, ecology, and financial markets. Fractals are visual representations of chaos.',
    related: ['Probability'] },

  { category: 'math', level: 'advanced', term: 'Topology',
    short: 'The study of properties preserved under continuous deformation.',
    full: 'Topology asks which properties survive stretching and bending but not tearing or gluing. A donut and a coffee cup are topologically equivalent (both have one hole). Concepts like open/closed sets and continuity from topology underlie modern analysis.',
    related: ['Set Theory'] },

  { category: 'math', level: 'intermediate', term: 'Complex Number',
    short: 'Numbers of the form a + bi where i = √(−1).',
    full: 'Complex numbers extend real numbers to the complex plane. They elegantly describe rotation, oscillation, and wave behaviour. The complex exponential e^(iπ) + 1 = 0 (Euler\'s identity) is considered the most beautiful equation in mathematics.',
    related: ['Fourier Transform', 'Pi (π)'] },

  // ─── Physics & Science ────────────────────────────────────────────────────
  { category: 'science', level: 'intermediate', term: 'Quantum Mechanics',
    short: 'The physics governing particles at atomic and subatomic scales.',
    full: 'Quantum mechanics is fundamentally probabilistic — particles exist in superpositions of states until measured. Key phenomena: wave-particle duality, uncertainty principle (Heisenberg), quantum entanglement, and tunnelling. It underpins chemistry, semiconductors, and quantum computing.',
    related: ['Superposition', 'Wave-Particle Duality'] },

  { category: 'science', level: 'intermediate', term: 'Special Relativity',
    short: 'Einstein\'s theory that space and time are relative to the observer\'s velocity.',
    full: 'The speed of light (c ≈ 3×10⁸ m/s) is constant for all observers. Consequences: time dilation (moving clocks run slow), length contraction, and mass-energy equivalence (E = mc²). Nothing with mass can reach c — it would require infinite energy.',
    related: ['Entropy'] },

  { category: 'science', level: 'beginner', term: 'Entropy',
    short: 'A measure of disorder or randomness in a system.',
    full: 'The Second Law of Thermodynamics states total entropy always increases in a closed system. Systems naturally evolve toward higher disorder. Information entropy (Shannon) measures information content: more uncertainty = higher entropy. Deeply connected to both physics and information theory.',
    related: ['Thermodynamics', 'RLHF'] },

  { category: 'science', level: 'intermediate', term: 'Wave-Particle Duality',
    short: 'Quantum objects behave as both waves and particles depending on how they are measured.',
    full: 'Demonstrated by the double-slit experiment: electrons create an interference pattern (wave behaviour) when not observed, but particle-like hits when measured. This is not a limitation of measurement — it is the fundamental nature of quantum objects.',
    related: ['Quantum Mechanics', 'Superposition'] },

  { category: 'science', level: 'intermediate', term: 'Superposition',
    short: 'A quantum particle exists in multiple states simultaneously until measured.',
    full: 'Schrödinger\'s cat illustrates this: until observed, the cat is simultaneously alive and dead. Measurement collapses the superposition into one definite state. Superposition enables quantum computers to process many possibilities at once.',
    related: ['Quantum Mechanics', 'Wave-Particle Duality'] },

  { category: 'science', level: 'beginner', term: 'DNA',
    short: 'A double-helix molecule carrying genetic instructions for all known life.',
    full: 'DNA (deoxyribonucleic acid) is a sequence of four bases (A, T, G, C) encoding genes. The human genome has ~3 billion base pairs. DNA replicates with each cell division; mutations drive evolution. CRISPR enables precise DNA editing.',
    related: ['Evolution', 'CRISPR'] },

  { category: 'science', level: 'beginner', term: 'Evolution',
    short: 'The process of heritable change in populations over generations.',
    full: 'Natural selection favours traits that increase reproductive success. Combined with random mutation and genetic drift, selection produces the diversity of life from a common ancestor. Evolution does not have a goal — it is driven by differential reproduction.',
    related: ['DNA', 'Entropy'] },

  { category: 'science', level: 'intermediate', term: 'Electromagnetism',
    short: 'The fundamental force governing electric charges and magnetic fields.',
    full: 'Electricity and magnetism are two aspects of one force (Maxwell, 1865). Moving charges create magnetic fields; changing magnetic fields induce electric fields. Light is an electromagnetic wave. Electromagnetism underpins all chemistry, electronics, and photonics.',
    related: ['Photon', 'Special Relativity'] },

  { category: 'science', level: 'beginner', term: 'Photon',
    short: 'A quantum of light — the elementary particle of electromagnetic radiation.',
    full: 'Photons are massless particles that travel at the speed of light. Energy = hf where h is Planck\'s constant and f is frequency. Higher frequency = higher energy: radio < infrared < visible < UV < X-ray < gamma. Photons carry the electromagnetic force.',
    related: ['Electromagnetism', 'Wave-Particle Duality'] },

  { category: 'science', level: 'intermediate', term: 'Thermodynamics',
    short: 'The study of heat, energy, and their transformations.',
    full: 'The four laws govern all physical and chemical processes. Zeroth: thermal equilibrium. First: energy is conserved. Second: entropy always increases. Third: absolute zero is unattainable. Engines, refrigerators, and chemical reactions all obey thermodynamic constraints.',
    related: ['Entropy'] },

  { category: 'science', level: 'beginner', term: 'Black Hole',
    short: 'A region of spacetime where gravity is so strong nothing — not even light — can escape.',
    full: 'Formed when massive stars collapse at end of life, or through galactic mergers. The boundary of no return is the event horizon. At the centre is a singularity where known physics breaks down. Hawking radiation suggests black holes slowly evaporate over astronomical timescales.',
    related: ['Special Relativity', 'Entropy'] },

  { category: 'science', level: 'advanced', term: 'CRISPR',
    short: 'A gene-editing technology enabling precise modification of DNA sequences.',
    full: 'Adapted from a bacterial immune system, CRISPR-Cas9 uses guide RNA to target specific DNA locations and cuts them, allowing insertion, deletion, or correction. It is transforming medicine (genetic disease treatment), agriculture, and basic research. Ethical debates around germline editing are ongoing.',
    related: ['DNA', 'Evolution'] },

  { category: 'science', level: 'beginner', term: 'Neuron',
    short: 'A specialized cell that transmits electrical signals in the nervous system.',
    full: 'Neurons have a cell body, dendrites (receive signals), and an axon (transmit signals). Synapses are junctions where neurons communicate via neurotransmitters. The human brain has ~86 billion neurons with ~100 trillion connections. Neural networks in AI are loosely inspired by this structure.',
    related: ['Neural Network', 'DNA'] },

  // ─── Language & Linguistics ────────────────────────────────────────────────
  { category: 'language', level: 'beginner', term: 'Syntax',
    short: 'The rules governing how words combine to form grammatical sentences.',
    full: 'Syntax specifies legal sentence structures: word order, agreement, phrase structure. "Dog the bit man the" is ungrammatical; "The dog bit the man" is syntactically valid. Different languages have different syntactic rules (English is SVO; Japanese is SOV).',
    related: ['Morpheme', 'Recursion'] },

  { category: 'language', level: 'beginner', term: 'Semantics',
    short: 'The study of meaning in language.',
    full: 'Semantics examines how words, phrases, and sentences relate to concepts and the world. Lexical semantics studies word meaning; compositional semantics studies how meaning builds from parts. "The spirit is willing but the flesh is weak" failed early machine translation: it became "The vodka is good but the meat is rotten."',
    related: ['Pragmatics', 'Sapir-Whorf Hypothesis'] },

  { category: 'language', level: 'beginner', term: 'Pragmatics',
    short: 'How social context and intent shape meaning beyond literal words.',
    full: 'Grice\'s maxims describe cooperative communication: be truthful, relevant, clear, and informative. Pragmatics explains irony, sarcasm, implicature, and politeness. "Can you pass the salt?" is a request, not a yes/no question about ability.',
    related: ['Semantics', 'Register'] },

  { category: 'language', level: 'beginner', term: 'Morpheme',
    short: 'The smallest meaningful unit in language.',
    full: '"Unhelpfulness" contains 4 morphemes: un- (negation), help (root), -ful (adjective suffix), -ness (noun suffix). Free morphemes can stand alone (help, run, big); bound morphemes attach to others (-ing, -ed, un-, re-).',
    related: ['Syntax', 'Phoneme'] },

  { category: 'language', level: 'beginner', term: 'Phoneme',
    short: 'The smallest unit of sound that distinguishes meaning in a language.',
    full: 'English has ~44 phonemes despite 26 letters. Minimal pairs differ by one phoneme: "bat"/"cat", "ship"/"chip". Phonemes are abstract units; phones are their physical realisations. The same phoneme sounds different in different contexts (allophones).',
    related: ['Morpheme', 'Phonetics'] },

  { category: 'language', level: 'intermediate', term: 'Recursion',
    short: 'Language\'s ability to embed structures within structures, infinitely.',
    full: '"The man who said the woman who left was right was wrong." Recursion allows finite grammar to generate infinite sentences. Chomsky argued recursion is the core feature distinguishing human language from animal communication. LLMs process recursive structures via attention.',
    related: ['Syntax', 'Chomsky'] },

  { category: 'language', level: 'intermediate', term: 'Sapir-Whorf Hypothesis',
    short: 'The theory that the language you speak shapes how you think.',
    full: 'The strong version (linguistic determinism: language determines thought) is largely rejected. The weak version (linguistic relativity: language influences thought) has empirical support. Russian speakers discriminate shades of blue faster; Pirahã lacks number words and its speakers struggle with exact quantity tasks.',
    related: ['Semantics', 'Cognition'] },

  { category: 'language', level: 'beginner', term: 'Register',
    short: 'The variety of language used for a specific social context.',
    full: 'Formal register uses full sentences, technical vocabulary, and passive voice. Informal register uses contractions, slang, and ellipsis. Choosing the wrong register signals social incompetence. LLMs can switch registers on command.',
    related: ['Pragmatics', 'Code-Switching'] },

  { category: 'language', level: 'intermediate', term: 'Phonetics',
    short: 'The study of the physical sounds of human speech.',
    full: 'Articulatory phonetics describes how sounds are produced (lips, tongue, glottis). Acoustic phonetics studies sound waves. The International Phonetic Alphabet (IPA) provides a notation for every sound in every language. Distinct from phonology, which studies the sound system of a specific language.',
    related: ['Phoneme'] },

  { category: 'language', level: 'beginner', term: 'Etymology',
    short: 'The study of word origins and historical development.',
    full: '"Philosophy" is Greek: philos (loving) + sophia (wisdom). Understanding etymology reveals conceptual history and aids vocabulary learning. Many English words derive from Latin (via French Norman conquest), Greek, Old English (Germanic), and increasingly from other global languages.',
    related: ['Morpheme', 'Semantics'] },

  { category: 'language', level: 'intermediate', term: 'Code-Switching',
    short: 'Alternating between languages or dialects in a single conversation.',
    full: 'Common in bilingual and multilingual communities, code-switching is not random — it follows grammatical rules and serves social functions (expressing identity, filling lexical gaps, signalling group membership). Stigmatised historically; now recognised as sophisticated linguistic behaviour.',
    related: ['Register', 'Pragmatics'] },

  { category: 'language', level: 'intermediate', term: 'Metaphor',
    short: 'Describing one thing in terms of another — structuring thought, not just decoration.',
    full: 'Lakoff and Johnson\'s "Metaphors We Live By" (1980) showed conceptual metaphors structure thought: ARGUMENT IS WAR (attack a position, defend a claim), TIME IS MONEY (waste time, spend time). Metaphor is not ornamental — it shapes how we reason about abstract concepts.',
    related: ['Semantics', 'Sapir-Whorf Hypothesis'] },

  { category: 'language', level: 'beginner', term: 'Dialect',
    short: 'A variety of a language with distinct vocabulary, grammar, and pronunciation.',
    full: 'All languages have dialects; no dialect is inherently superior. Standard dialects gain prestige through political and social power, not linguistic complexity. Dialect continua (like across Germany or the Arab world) show gradual change without clear boundaries.',
    related: ['Register', 'Phonetics'] },

  // ─── Programming & Logic ──────────────────────────────────────────────────
  { category: 'programming', level: 'beginner', term: 'API',
    short: 'A set of rules letting software communicate with other software.',
    full: 'An API (Application Programming Interface) defines requests, data formats, and responses. REST APIs use HTTP; GraphQL APIs allow flexible queries; SDK APIs expose library functions. When you use Claude, you call Anthropic\'s API. APIs abstract complexity behind clean interfaces.',
    related: ['HTTP/REST', 'Abstraction'] },

  { category: 'programming', level: 'intermediate', term: 'Algorithm Complexity (Big O)',
    short: 'Notation describing how computational cost grows with input size.',
    full: 'O(1) = constant; O(log n) = logarithmic (binary search); O(n) = linear; O(n log n) = sorting; O(n²) = nested loops; O(2ⁿ) = exponential. Big O describes worst-case growth, ignoring constants. Essential for writing efficient code at scale.',
    example: 'Searching a sorted list of 1 million items: O(n) checks 1M items; O(log n) binary search checks only 20.',
    related: ['Algorithm', 'Recursion'] },

  { category: 'programming', level: 'intermediate', term: 'Recursion',
    short: 'A function that calls itself to solve a problem with self-similar structure.',
    full: 'Every recursive function needs a base case (stopping condition) and a recursive case. Fibonacci, tree traversal, and merge sort are classic recursive algorithms. Recursion uses call stack space — deep recursion can cause stack overflow. Some problems are cleaner recursively; others iteratively.',
    example: 'factorial(n) = n × factorial(n-1), with factorial(0) = 1.',
    related: ['Algorithm Complexity (Big O)', 'Stack vs Heap'] },

  { category: 'programming', level: 'beginner', term: 'Object-Oriented Programming',
    short: 'Organising code around objects with state (data) and behaviour (methods).',
    full: 'OOP\'s four pillars: encapsulation (bundling data and methods), inheritance (classes extending other classes), polymorphism (same interface, different implementations), abstraction (hiding complexity). Java, Python, C++, and Swift use OOP. Alternative paradigm: functional programming.',
    related: ['Abstraction', 'Functional Programming'] },

  { category: 'programming', level: 'intermediate', term: 'Functional Programming',
    short: 'A paradigm treating computation as evaluation of pure functions, avoiding mutable state.',
    full: 'Pure functions: same input always gives same output, no side effects. Immutability prevents bugs from shared state. Higher-order functions (map, filter, reduce) enable concise data processing. Languages: Haskell, Erlang, Clojure. Functional style in Python/JS: lambdas, list comprehensions.',
    related: ['Object-Oriented Programming', 'Concurrency'] },

  { category: 'programming', level: 'beginner', term: 'Version Control (Git)',
    short: 'A system tracking changes to code over time, enabling collaboration and rollback.',
    full: 'Git records snapshots of code at commits. Branches allow parallel development; merging integrates branches. GitHub/GitLab host remote repositories. Fundamental developer workflow: branch → change → commit → push → pull request → merge. Invented by Linus Torvalds in 2005.',
    related: ['Debugging'] },

  { category: 'programming', level: 'beginner', term: 'Abstraction',
    short: 'Hiding implementation details to expose only relevant functionality.',
    full: 'Abstraction manages complexity. A car\'s steering wheel abstracts the mechanical steering system. An API abstracts server infrastructure. Functions abstract repeated logic. Layers of abstraction: hardware → OS → runtime → language → framework → application.',
    related: ['API', 'Object-Oriented Programming'] },

  { category: 'programming', level: 'intermediate', term: 'Concurrency',
    short: 'Multiple computations happening in overlapping time periods.',
    full: 'Concurrency differs from parallelism: concurrent tasks may interleave on one processor; parallel tasks run simultaneously on multiple processors. Async/await handles I/O concurrency in JS/Python. Threads and processes handle CPU concurrency. Shared state in concurrent systems causes race conditions.',
    related: ['Functional Programming'] },

  { category: 'programming', level: 'beginner', term: 'Database',
    short: 'An organised collection of structured data with tools for querying and updating it.',
    full: 'Relational databases (PostgreSQL, MySQL) store data in tables with typed columns; SQL queries join and filter. NoSQL databases (MongoDB, Redis) use flexible documents, key-value pairs, or graphs. ACID properties (Atomicity, Consistency, Isolation, Durability) ensure data integrity.',
    related: ['API', 'Hash Function'] },

  { category: 'programming', level: 'beginner', term: 'HTTP/REST',
    short: 'The protocol and architectural style underlying web communication.',
    full: 'HTTP (HyperText Transfer Protocol) defines request/response cycles. REST (Representational State Transfer) is an architectural style using HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE. Stateless: each request contains all needed context. Most APIs are RESTful.',
    related: ['API'] },

  { category: 'programming', level: 'intermediate', term: 'Hash Function',
    short: 'A function mapping data of any size to a fixed-size output.',
    full: 'Good hash functions are deterministic, fast, and distribute outputs uniformly. Cryptographic hashes (SHA-256) are also one-way and collision-resistant. Uses: hash tables (O(1) lookup), data deduplication, digital signatures, blockchain, and password storage (bcrypt).',
    related: ['Algorithm Complexity (Big O)', 'Database'] },

  { category: 'programming', level: 'beginner', term: 'Debugging',
    short: 'The process of finding and fixing errors in code.',
    full: 'Debugging techniques: print/log statements, debugger breakpoints, rubber duck debugging (explaining code aloud), binary search (commenting half the code). Scientific method applies: hypothesise, test, observe. "99 bugs in the code — take one down, patch it around — 117 bugs in the code."',
    related: ['Version Control (Git)'] },

  { category: 'programming', level: 'intermediate', term: 'Compile vs Interpret',
    short: 'Two ways to execute code: ahead-of-time translation vs line-by-line execution.',
    full: 'Compilers (C, Rust, Go) translate source code to machine code before execution — fast runtime, slow build. Interpreters (Python, Ruby) execute source line-by-line — slow runtime, instant feedback. JIT compilers (Java, JS V8) compile at runtime, bridging both approaches.',
    related: ['Algorithm Complexity (Big O)'] },

  { category: 'programming', level: 'intermediate', term: 'Stack vs Heap',
    short: 'Two regions of memory with different lifecycle and performance characteristics.',
    full: 'Stack: fast, LIFO structure, automatic allocation/deallocation, limited size — holds local variables and function calls. Heap: flexible, manually managed (or garbage collected), larger but slower — holds dynamically allocated objects. Stack overflows occur from infinite recursion.',
    related: ['Recursion', 'Concurrency'] },

  { category: 'programming', level: 'beginner', term: 'Algorithm',
    short: 'A finite, unambiguous sequence of steps that solves a specific problem.',
    full: 'Algorithms must terminate, produce correct output, and be unambiguous. Sorting, searching, compression, and pathfinding are classic algorithm families. Analysed by correctness (does it work?) and efficiency (how fast? how much memory?). Most software is implementations of known algorithms.',
    related: ['Algorithm Complexity (Big O)', 'Recursion'] },
];

export function searchDictionary(query: string): DictEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return STUDY_DICTIONARY.filter(e =>
    e.term.toLowerCase().includes(q) ||
    e.short.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q) ||
    (e.related || []).some(r => r.toLowerCase().includes(q))
  );
}

export function getDictByCategory(categoryId: string): DictEntry[] {
  return STUDY_DICTIONARY.filter(e => e.category === categoryId);
}
