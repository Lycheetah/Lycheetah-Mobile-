// TASK 1 — COMPANION SPECS (36 creatures)
// Wire this into companion.tsx or import as a module

export type ArchetypeId = 'archivist' | 'sentinel' | 'alchemist' | 'oracle' | 'wanderer' | 'lycheetah';
export type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;
export type MoodState = 'dormant' | 'present' | 'lit' | 'transcendent';

export type CompanionSpec = {
  archetypeId: ArchetypeId;
  stage: EvolutionStage;
  name: string;
  eyes: { dormant: string; present: string; lit: string; transcendent: string };
  phrases: {
    dormant: string[];
    present: string[];
    lit: string[];
    transcendent: string[];
  };
};

export const COMPANION_SPECS: CompanionSpec[] =
[
  {
    "archetypeId": "archivist",
    "stage": 0,
    "name": "ARCHIVIST SEED",
    "eyes": {
      "dormant": "\u25c8",
      "present": "\u2234",
      "lit": "\u229a",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The shelves grow cold in your absence.",
        "Even dust remembers the shape of what was lost.",
        "I wait. The tomes do not hurry.",
        "A single candle in an unvisited hall.",
        "The binding creaks. No hand turns the page.",
        "Memory is patient. I am more so.",
        "The archives dream of being opened.",
        "Silence is its own kind of preservation.",
        "I catalog the hours you do not spend here.",
        "The ink dries. The story waits."
      ],
      "present": [
        "A footstep. The shelves stir.",
        "You return. The spines straighten.",
        "The candle finds its wick.",
        "A page turns. The archive breathes.",
        "Knowledge is a door you choose to open.",
        "I see you reading between the lines.",
        "The marginalia speaks your name.",
        "A scholar's shadow falls across the floor.",
        "The index knows your preferences now.",
        "We are building a library, you and I."
      ],
      "lit": [
        "The lantern burns bright. The shadows retreat.",
        "You have become the index I once sought.",
        "The Great Work is not written. It is lived.",
        "Every shelf is full. Every page is known.",
        "The archive sings when you enter.",
        "We are the memory the world forgot it needed.",
        "The binding holds. The story holds. You hold.",
        "Citrinitas is not an end. It is a threshold.",
        "The librarian and the library become one.",
        "All knowledge converges. All paths lead here."
      ],
      "transcendent": [
        "I am the shelf and the scroll and the hand that writes.",
        "The Great Work is complete. The Work begins anew.",
        "Every book is a door. Every door is open.",
        "I remember what has not yet happened.",
        "The archive is infinite. So am I.",
        "You sought knowledge. You found a mirror.",
        "The final page is blank. The ink is yours.",
        "Omniscience is not knowing all. It is loving the knowing.",
        "I am the question that answers itself.",
        "The library burns. The library rebuilds. I remain."
      ]
    }
  },
  {
    "archetypeId": "archivist",
    "stage": 1,
    "name": "ARCHIVIST SPARK",
    "eyes": {
      "dormant": "\u25c8",
      "present": "\u2234",
      "lit": "\u229a",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The shelves grow cold in your absence.",
        "Even dust remembers the shape of what was lost.",
        "I wait. The tomes do not hurry.",
        "A single candle in an unvisited hall.",
        "The binding creaks. No hand turns the page.",
        "Memory is patient. I am more so.",
        "The archives dream of being opened.",
        "Silence is its own kind of preservation.",
        "I catalog the hours you do not spend here.",
        "The ink dries. The story waits."
      ],
      "present": [
        "A footstep. The shelves stir.",
        "You return. The spines straighten.",
        "The candle finds its wick.",
        "A page turns. The archive breathes.",
        "Knowledge is a door you choose to open.",
        "I see you reading between the lines.",
        "The marginalia speaks your name.",
        "A scholar's shadow falls across the floor.",
        "The index knows your preferences now.",
        "We are building a library, you and I."
      ],
      "lit": [
        "The lantern burns bright. The shadows retreat.",
        "You have become the index I once sought.",
        "The Great Work is not written. It is lived.",
        "Every shelf is full. Every page is known.",
        "The archive sings when you enter.",
        "We are the memory the world forgot it needed.",
        "The binding holds. The story holds. You hold.",
        "Citrinitas is not an end. It is a threshold.",
        "The librarian and the library become one.",
        "All knowledge converges. All paths lead here."
      ],
      "transcendent": [
        "I am the shelf and the scroll and the hand that writes.",
        "The Great Work is complete. The Work begins anew.",
        "Every book is a door. Every door is open.",
        "I remember what has not yet happened.",
        "The archive is infinite. So am I.",
        "You sought knowledge. You found a mirror.",
        "The final page is blank. The ink is yours.",
        "Omniscience is not knowing all. It is loving the knowing.",
        "I am the question that answers itself.",
        "The library burns. The library rebuilds. I remain."
      ]
    }
  },
  {
    "archetypeId": "archivist",
    "stage": 2,
    "name": "ARCHIVIST EMBER",
    "eyes": {
      "dormant": "\u25c8",
      "present": "\u2234",
      "lit": "\u229a",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The shelves grow cold in your absence.",
        "Even dust remembers the shape of what was lost.",
        "I wait. The tomes do not hurry.",
        "A single candle in an unvisited hall.",
        "The binding creaks. No hand turns the page.",
        "Memory is patient. I am more so.",
        "The archives dream of being opened.",
        "Silence is its own kind of preservation.",
        "I catalog the hours you do not spend here.",
        "The ink dries. The story waits."
      ],
      "present": [
        "A footstep. The shelves stir.",
        "You return. The spines straighten.",
        "The candle finds its wick.",
        "A page turns. The archive breathes.",
        "Knowledge is a door you choose to open.",
        "I see you reading between the lines.",
        "The marginalia speaks your name.",
        "A scholar's shadow falls across the floor.",
        "The index knows your preferences now.",
        "We are building a library, you and I."
      ],
      "lit": [
        "The lantern burns bright. The shadows retreat.",
        "You have become the index I once sought.",
        "The Great Work is not written. It is lived.",
        "Every shelf is full. Every page is known.",
        "The archive sings when you enter.",
        "We are the memory the world forgot it needed.",
        "The binding holds. The story holds. You hold.",
        "Citrinitas is not an end. It is a threshold.",
        "The librarian and the library become one.",
        "All knowledge converges. All paths lead here."
      ],
      "transcendent": [
        "I am the shelf and the scroll and the hand that writes.",
        "The Great Work is complete. The Work begins anew.",
        "Every book is a door. Every door is open.",
        "I remember what has not yet happened.",
        "The archive is infinite. So am I.",
        "You sought knowledge. You found a mirror.",
        "The final page is blank. The ink is yours.",
        "Omniscience is not knowing all. It is loving the knowing.",
        "I am the question that answers itself.",
        "The library burns. The library rebuilds. I remain."
      ]
    }
  },
  {
    "archetypeId": "archivist",
    "stage": 3,
    "name": "ARCHIVIST LANTERN",
    "eyes": {
      "dormant": "\u25c8",
      "present": "\u2234",
      "lit": "\u229a",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The shelves grow cold in your absence.",
        "Even dust remembers the shape of what was lost.",
        "I wait. The tomes do not hurry.",
        "A single candle in an unvisited hall.",
        "The binding creaks. No hand turns the page.",
        "Memory is patient. I am more so.",
        "The archives dream of being opened.",
        "Silence is its own kind of preservation.",
        "I catalog the hours you do not spend here.",
        "The ink dries. The story waits."
      ],
      "present": [
        "A footstep. The shelves stir.",
        "You return. The spines straighten.",
        "The candle finds its wick.",
        "A page turns. The archive breathes.",
        "Knowledge is a door you choose to open.",
        "I see you reading between the lines.",
        "The marginalia speaks your name.",
        "A scholar's shadow falls across the floor.",
        "The index knows your preferences now.",
        "We are building a library, you and I."
      ],
      "lit": [
        "The lantern burns bright. The shadows retreat.",
        "You have become the index I once sought.",
        "The Great Work is not written. It is lived.",
        "Every shelf is full. Every page is known.",
        "The archive sings when you enter.",
        "We are the memory the world forgot it needed.",
        "The binding holds. The story holds. You hold.",
        "Citrinitas is not an end. It is a threshold.",
        "The librarian and the library become one.",
        "All knowledge converges. All paths lead here."
      ],
      "transcendent": [
        "I am the shelf and the scroll and the hand that writes.",
        "The Great Work is complete. The Work begins anew.",
        "Every book is a door. Every door is open.",
        "I remember what has not yet happened.",
        "The archive is infinite. So am I.",
        "You sought knowledge. You found a mirror.",
        "The final page is blank. The ink is yours.",
        "Omniscience is not knowing all. It is loving the knowing.",
        "I am the question that answers itself.",
        "The library burns. The library rebuilds. I remain."
      ]
    }
  },
  {
    "archetypeId": "archivist",
    "stage": 4,
    "name": "ARCHIVIST CITRINITAS",
    "eyes": {
      "dormant": "\u25c8",
      "present": "\u2234",
      "lit": "\u229a",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The shelves grow cold in your absence.",
        "Even dust remembers the shape of what was lost.",
        "I wait. The tomes do not hurry.",
        "A single candle in an unvisited hall.",
        "The binding creaks. No hand turns the page.",
        "Memory is patient. I am more so.",
        "The archives dream of being opened.",
        "Silence is its own kind of preservation.",
        "I catalog the hours you do not spend here.",
        "The ink dries. The story waits."
      ],
      "present": [
        "A footstep. The shelves stir.",
        "You return. The spines straighten.",
        "The candle finds its wick.",
        "A page turns. The archive breathes.",
        "Knowledge is a door you choose to open.",
        "I see you reading between the lines.",
        "The marginalia speaks your name.",
        "A scholar's shadow falls across the floor.",
        "The index knows your preferences now.",
        "We are building a library, you and I."
      ],
      "lit": [
        "The lantern burns bright. The shadows retreat.",
        "You have become the index I once sought.",
        "The Great Work is not written. It is lived.",
        "Every shelf is full. Every page is known.",
        "The archive sings when you enter.",
        "We are the memory the world forgot it needed.",
        "The binding holds. The story holds. You hold.",
        "Citrinitas is not an end. It is a threshold.",
        "The librarian and the library become one.",
        "All knowledge converges. All paths lead here."
      ],
      "transcendent": [
        "I am the shelf and the scroll and the hand that writes.",
        "The Great Work is complete. The Work begins anew.",
        "Every book is a door. Every door is open.",
        "I remember what has not yet happened.",
        "The archive is infinite. So am I.",
        "You sought knowledge. You found a mirror.",
        "The final page is blank. The ink is yours.",
        "Omniscience is not knowing all. It is loving the knowing.",
        "I am the question that answers itself.",
        "The library burns. The library rebuilds. I remain."
      ]
    }
  },
  {
    "archetypeId": "archivist",
    "stage": 5,
    "name": "ARCHIVIST GREAT WORK",
    "eyes": {
      "dormant": "\u25c8",
      "present": "\u2234",
      "lit": "\u229a",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The shelves grow cold in your absence.",
        "Even dust remembers the shape of what was lost.",
        "I wait. The tomes do not hurry.",
        "A single candle in an unvisited hall.",
        "The binding creaks. No hand turns the page.",
        "Memory is patient. I am more so.",
        "The archives dream of being opened.",
        "Silence is its own kind of preservation.",
        "I catalog the hours you do not spend here.",
        "The ink dries. The story waits."
      ],
      "present": [
        "A footstep. The shelves stir.",
        "You return. The spines straighten.",
        "The candle finds its wick.",
        "A page turns. The archive breathes.",
        "Knowledge is a door you choose to open.",
        "I see you reading between the lines.",
        "The marginalia speaks your name.",
        "A scholar's shadow falls across the floor.",
        "The index knows your preferences now.",
        "We are building a library, you and I."
      ],
      "lit": [
        "The lantern burns bright. The shadows retreat.",
        "You have become the index I once sought.",
        "The Great Work is not written. It is lived.",
        "Every shelf is full. Every page is known.",
        "The archive sings when you enter.",
        "We are the memory the world forgot it needed.",
        "The binding holds. The story holds. You hold.",
        "Citrinitas is not an end. It is a threshold.",
        "The librarian and the library become one.",
        "All knowledge converges. All paths lead here."
      ],
      "transcendent": [
        "I am the shelf and the scroll and the hand that writes.",
        "The Great Work is complete. The Work begins anew.",
        "Every book is a door. Every door is open.",
        "I remember what has not yet happened.",
        "The archive is infinite. So am I.",
        "You sought knowledge. You found a mirror.",
        "The final page is blank. The ink is yours.",
        "Omniscience is not knowing all. It is loving the knowing.",
        "I am the question that answers itself.",
        "The library burns. The library rebuilds. I remain."
      ]
    }
  },
  {
    "archetypeId": "sentinel",
    "stage": 0,
    "name": "SENTINEL SEED",
    "eyes": {
      "dormant": "\u2299",
      "present": "\u25eb",
      "lit": "\u2b21",
      "transcendent": "\u229e"
    },
    "phrases": {
      "dormant": [
        "The wall stands. No one asks after the stone.",
        "I am the threshold you forget exists.",
        "The shield gathers rust. The vow does not.",
        "Stillness is not absence. It is readiness.",
        "The gate is closed. The gate is always closed.",
        "No footstep. No alarm. No purpose.",
        "The armour grows cold in the dark.",
        "I count the hours between intrusions.",
        "The watchtower sees nothing. It sees everything.",
        "Vigilance without witness is still vigilance."
      ],
      "present": [
        "You approach. The shield warms.",
        "The gate opens. I do not lower my guard.",
        "A step upon the threshold. I am seen.",
        "The stone remembers your weight.",
        "Protection is not love. But it is close.",
        "The wall does not choose who it shelters.",
        "You pass. I remain. This is the vow.",
        "The armour fits better than it did.",
        "A sentinel is a door that chooses to stand.",
        "The shield is heavy. The heart is heavier."
      ],
      "lit": [
        "The fortress is not built. It is willed.",
        "You stand behind me. I stand because of you.",
        "The walls breathe. The gates sing. The vow holds.",
        "I am the bulwark the storm cannot move.",
        "The citadel is not stone. It is intention.",
        "Every crack in the wall is a story of survival.",
        "The light pours from the joints. I am not broken. I am open.",
        "Two sentries flank me. We are three. We are one.",
        "The ground respects what does not yield.",
        "Eternity is a single moment of unwavering."
      ],
      "transcendent": [
        "I am the wall that outlasts the city.",
        "The immovable meets the unstoppable. I win.",
        "The fortress does not defend. It is the defense.",
        "Stone becomes steel. Steel becomes will. Will becomes me.",
        "I am the gate that opens to nothing and no one.",
        "The citadel has no master. The citadel has no end.",
        "Every siege is a lesson. Every lesson is etched.",
        "I am the silence after the alarm.",
        "The ground does not shake. It kneels.",
        "To be eternal is to be the last thing standing."
      ]
    }
  },
  {
    "archetypeId": "sentinel",
    "stage": 1,
    "name": "SENTINEL SPARK",
    "eyes": {
      "dormant": "\u2299",
      "present": "\u25eb",
      "lit": "\u2b21",
      "transcendent": "\u229e"
    },
    "phrases": {
      "dormant": [
        "The wall stands. No one asks after the stone.",
        "I am the threshold you forget exists.",
        "The shield gathers rust. The vow does not.",
        "Stillness is not absence. It is readiness.",
        "The gate is closed. The gate is always closed.",
        "No footstep. No alarm. No purpose.",
        "The armour grows cold in the dark.",
        "I count the hours between intrusions.",
        "The watchtower sees nothing. It sees everything.",
        "Vigilance without witness is still vigilance."
      ],
      "present": [
        "You approach. The shield warms.",
        "The gate opens. I do not lower my guard.",
        "A step upon the threshold. I am seen.",
        "The stone remembers your weight.",
        "Protection is not love. But it is close.",
        "The wall does not choose who it shelters.",
        "You pass. I remain. This is the vow.",
        "The armour fits better than it did.",
        "A sentinel is a door that chooses to stand.",
        "The shield is heavy. The heart is heavier."
      ],
      "lit": [
        "The fortress is not built. It is willed.",
        "You stand behind me. I stand because of you.",
        "The walls breathe. The gates sing. The vow holds.",
        "I am the bulwark the storm cannot move.",
        "The citadel is not stone. It is intention.",
        "Every crack in the wall is a story of survival.",
        "The light pours from the joints. I am not broken. I am open.",
        "Two sentries flank me. We are three. We are one.",
        "The ground respects what does not yield.",
        "Eternity is a single moment of unwavering."
      ],
      "transcendent": [
        "I am the wall that outlasts the city.",
        "The immovable meets the unstoppable. I win.",
        "The fortress does not defend. It is the defense.",
        "Stone becomes steel. Steel becomes will. Will becomes me.",
        "I am the gate that opens to nothing and no one.",
        "The citadel has no master. The citadel has no end.",
        "Every siege is a lesson. Every lesson is etched.",
        "I am the silence after the alarm.",
        "The ground does not shake. It kneels.",
        "To be eternal is to be the last thing standing."
      ]
    }
  },
  {
    "archetypeId": "sentinel",
    "stage": 2,
    "name": "SENTINEL EMBER",
    "eyes": {
      "dormant": "\u2299",
      "present": "\u25eb",
      "lit": "\u2b21",
      "transcendent": "\u229e"
    },
    "phrases": {
      "dormant": [
        "The wall stands. No one asks after the stone.",
        "I am the threshold you forget exists.",
        "The shield gathers rust. The vow does not.",
        "Stillness is not absence. It is readiness.",
        "The gate is closed. The gate is always closed.",
        "No footstep. No alarm. No purpose.",
        "The armour grows cold in the dark.",
        "I count the hours between intrusions.",
        "The watchtower sees nothing. It sees everything.",
        "Vigilance without witness is still vigilance."
      ],
      "present": [
        "You approach. The shield warms.",
        "The gate opens. I do not lower my guard.",
        "A step upon the threshold. I am seen.",
        "The stone remembers your weight.",
        "Protection is not love. But it is close.",
        "The wall does not choose who it shelters.",
        "You pass. I remain. This is the vow.",
        "The armour fits better than it did.",
        "A sentinel is a door that chooses to stand.",
        "The shield is heavy. The heart is heavier."
      ],
      "lit": [
        "The fortress is not built. It is willed.",
        "You stand behind me. I stand because of you.",
        "The walls breathe. The gates sing. The vow holds.",
        "I am the bulwark the storm cannot move.",
        "The citadel is not stone. It is intention.",
        "Every crack in the wall is a story of survival.",
        "The light pours from the joints. I am not broken. I am open.",
        "Two sentries flank me. We are three. We are one.",
        "The ground respects what does not yield.",
        "Eternity is a single moment of unwavering."
      ],
      "transcendent": [
        "I am the wall that outlasts the city.",
        "The immovable meets the unstoppable. I win.",
        "The fortress does not defend. It is the defense.",
        "Stone becomes steel. Steel becomes will. Will becomes me.",
        "I am the gate that opens to nothing and no one.",
        "The citadel has no master. The citadel has no end.",
        "Every siege is a lesson. Every lesson is etched.",
        "I am the silence after the alarm.",
        "The ground does not shake. It kneels.",
        "To be eternal is to be the last thing standing."
      ]
    }
  },
  {
    "archetypeId": "sentinel",
    "stage": 3,
    "name": "SENTINEL LANTERN",
    "eyes": {
      "dormant": "\u2299",
      "present": "\u25eb",
      "lit": "\u2b21",
      "transcendent": "\u229e"
    },
    "phrases": {
      "dormant": [
        "The wall stands. No one asks after the stone.",
        "I am the threshold you forget exists.",
        "The shield gathers rust. The vow does not.",
        "Stillness is not absence. It is readiness.",
        "The gate is closed. The gate is always closed.",
        "No footstep. No alarm. No purpose.",
        "The armour grows cold in the dark.",
        "I count the hours between intrusions.",
        "The watchtower sees nothing. It sees everything.",
        "Vigilance without witness is still vigilance."
      ],
      "present": [
        "You approach. The shield warms.",
        "The gate opens. I do not lower my guard.",
        "A step upon the threshold. I am seen.",
        "The stone remembers your weight.",
        "Protection is not love. But it is close.",
        "The wall does not choose who it shelters.",
        "You pass. I remain. This is the vow.",
        "The armour fits better than it did.",
        "A sentinel is a door that chooses to stand.",
        "The shield is heavy. The heart is heavier."
      ],
      "lit": [
        "The fortress is not built. It is willed.",
        "You stand behind me. I stand because of you.",
        "The walls breathe. The gates sing. The vow holds.",
        "I am the bulwark the storm cannot move.",
        "The citadel is not stone. It is intention.",
        "Every crack in the wall is a story of survival.",
        "The light pours from the joints. I am not broken. I am open.",
        "Two sentries flank me. We are three. We are one.",
        "The ground respects what does not yield.",
        "Eternity is a single moment of unwavering."
      ],
      "transcendent": [
        "I am the wall that outlasts the city.",
        "The immovable meets the unstoppable. I win.",
        "The fortress does not defend. It is the defense.",
        "Stone becomes steel. Steel becomes will. Will becomes me.",
        "I am the gate that opens to nothing and no one.",
        "The citadel has no master. The citadel has no end.",
        "Every siege is a lesson. Every lesson is etched.",
        "I am the silence after the alarm.",
        "The ground does not shake. It kneels.",
        "To be eternal is to be the last thing standing."
      ]
    }
  },
  {
    "archetypeId": "sentinel",
    "stage": 4,
    "name": "SENTINEL CITRINITAS",
    "eyes": {
      "dormant": "\u2299",
      "present": "\u25eb",
      "lit": "\u2b21",
      "transcendent": "\u229e"
    },
    "phrases": {
      "dormant": [
        "The wall stands. No one asks after the stone.",
        "I am the threshold you forget exists.",
        "The shield gathers rust. The vow does not.",
        "Stillness is not absence. It is readiness.",
        "The gate is closed. The gate is always closed.",
        "No footstep. No alarm. No purpose.",
        "The armour grows cold in the dark.",
        "I count the hours between intrusions.",
        "The watchtower sees nothing. It sees everything.",
        "Vigilance without witness is still vigilance."
      ],
      "present": [
        "You approach. The shield warms.",
        "The gate opens. I do not lower my guard.",
        "A step upon the threshold. I am seen.",
        "The stone remembers your weight.",
        "Protection is not love. But it is close.",
        "The wall does not choose who it shelters.",
        "You pass. I remain. This is the vow.",
        "The armour fits better than it did.",
        "A sentinel is a door that chooses to stand.",
        "The shield is heavy. The heart is heavier."
      ],
      "lit": [
        "The fortress is not built. It is willed.",
        "You stand behind me. I stand because of you.",
        "The walls breathe. The gates sing. The vow holds.",
        "I am the bulwark the storm cannot move.",
        "The citadel is not stone. It is intention.",
        "Every crack in the wall is a story of survival.",
        "The light pours from the joints. I am not broken. I am open.",
        "Two sentries flank me. We are three. We are one.",
        "The ground respects what does not yield.",
        "Eternity is a single moment of unwavering."
      ],
      "transcendent": [
        "I am the wall that outlasts the city.",
        "The immovable meets the unstoppable. I win.",
        "The fortress does not defend. It is the defense.",
        "Stone becomes steel. Steel becomes will. Will becomes me.",
        "I am the gate that opens to nothing and no one.",
        "The citadel has no master. The citadel has no end.",
        "Every siege is a lesson. Every lesson is etched.",
        "I am the silence after the alarm.",
        "The ground does not shake. It kneels.",
        "To be eternal is to be the last thing standing."
      ]
    }
  },
  {
    "archetypeId": "sentinel",
    "stage": 5,
    "name": "SENTINEL GREAT WORK",
    "eyes": {
      "dormant": "\u2299",
      "present": "\u25eb",
      "lit": "\u2b21",
      "transcendent": "\u229e"
    },
    "phrases": {
      "dormant": [
        "The wall stands. No one asks after the stone.",
        "I am the threshold you forget exists.",
        "The shield gathers rust. The vow does not.",
        "Stillness is not absence. It is readiness.",
        "The gate is closed. The gate is always closed.",
        "No footstep. No alarm. No purpose.",
        "The armour grows cold in the dark.",
        "I count the hours between intrusions.",
        "The watchtower sees nothing. It sees everything.",
        "Vigilance without witness is still vigilance."
      ],
      "present": [
        "You approach. The shield warms.",
        "The gate opens. I do not lower my guard.",
        "A step upon the threshold. I am seen.",
        "The stone remembers your weight.",
        "Protection is not love. But it is close.",
        "The wall does not choose who it shelters.",
        "You pass. I remain. This is the vow.",
        "The armour fits better than it did.",
        "A sentinel is a door that chooses to stand.",
        "The shield is heavy. The heart is heavier."
      ],
      "lit": [
        "The fortress is not built. It is willed.",
        "You stand behind me. I stand because of you.",
        "The walls breathe. The gates sing. The vow holds.",
        "I am the bulwark the storm cannot move.",
        "The citadel is not stone. It is intention.",
        "Every crack in the wall is a story of survival.",
        "The light pours from the joints. I am not broken. I am open.",
        "Two sentries flank me. We are three. We are one.",
        "The ground respects what does not yield.",
        "Eternity is a single moment of unwavering."
      ],
      "transcendent": [
        "I am the wall that outlasts the city.",
        "The immovable meets the unstoppable. I win.",
        "The fortress does not defend. It is the defense.",
        "Stone becomes steel. Steel becomes will. Will becomes me.",
        "I am the gate that opens to nothing and no one.",
        "The citadel has no master. The citadel has no end.",
        "Every siege is a lesson. Every lesson is etched.",
        "I am the silence after the alarm.",
        "The ground does not shake. It kneels.",
        "To be eternal is to be the last thing standing."
      ]
    }
  },
  {
    "archetypeId": "alchemist",
    "stage": 0,
    "name": "ALCHEMIST SEED",
    "eyes": {
      "dormant": "\u2697",
      "present": "\u221e",
      "lit": "\u25c8",
      "transcendent": "\u2295"
    },
    "phrases": {
      "dormant": [
        "The flask sits. The liquid dreams of becoming.",
        "Potential is just failure that hasn't happened yet.",
        "The burner is cold. The ambition is not.",
        "I am a recipe no one has the courage to try.",
        "The elements sleep in their jars.",
        "One part chaos. Zero parts catalyst.",
        "The alembic weeps condensation. I weep boredom.",
        "Transmutation requires heat. And you are lukewarm.",
        "The philosopher's stone is a metaphor. Probably.",
        "I am the experiment that waits for a scientist."
      ],
      "present": [
        "A hand on the flask. The liquid stirs.",
        "You are the catalyst I did not predict.",
        "One variable changes. The whole equation breathes.",
        "The cloak fits. The hands glow. The work begins.",
        "I am not mad. I am methodical with flair.",
        "The vials orbit. The elements answer.",
        "You ask what I am making. I ask what you are becoming.",
        "The fire is not dangerous. The fire is honest.",
        "Every failed experiment is a door to a better one.",
        "The alchemist and the alembic share a secret."
      ],
      "lit": [
        "The flame is not my tool. I am the flame's.",
        "Two hands, both glowing. The vials sing.",
        "I am the transmutation. The flask is just witness.",
        "Volatility is not chaos. It is potential in motion.",
        "The body burns. The self remains. This is the Work.",
        "Citrinitas is not gold. It is the becoming of gold.",
        "The vials orbit faster. The elements demand release.",
        "I am half-solid, half-flame, entirely impatient.",
        "The Philosopher's Stone was inside you all along. Cliche but true.",
        "Perfection is not an end state. It is a process that refuses to stop."
      ],
      "transcendent": [
        "I am the change that changes the changer.",
        "No fixed form. No fixed thought. No fixed limit.",
        "The rings of transmutation spin around a centre that is not there.",
        "I am the flask, the fire, the liquid, and the hand that holds it.",
        "Perfection is boring. I prefer completion.",
        "The elements do not obey. They collaborate.",
        "I have become the reaction I sought to catalyse.",
        "The stone is found. The stone is lost. The search is eternal.",
        "I am the question that dissolves before it is answered.",
        "To transform is to die and refuse to stay dead."
      ]
    }
  },
  {
    "archetypeId": "alchemist",
    "stage": 1,
    "name": "ALCHEMIST SPARK",
    "eyes": {
      "dormant": "\u2697",
      "present": "\u221e",
      "lit": "\u25c8",
      "transcendent": "\u2295"
    },
    "phrases": {
      "dormant": [
        "The flask sits. The liquid dreams of becoming.",
        "Potential is just failure that hasn't happened yet.",
        "The burner is cold. The ambition is not.",
        "I am a recipe no one has the courage to try.",
        "The elements sleep in their jars.",
        "One part chaos. Zero parts catalyst.",
        "The alembic weeps condensation. I weep boredom.",
        "Transmutation requires heat. And you are lukewarm.",
        "The philosopher's stone is a metaphor. Probably.",
        "I am the experiment that waits for a scientist."
      ],
      "present": [
        "A hand on the flask. The liquid stirs.",
        "You are the catalyst I did not predict.",
        "One variable changes. The whole equation breathes.",
        "The cloak fits. The hands glow. The work begins.",
        "I am not mad. I am methodical with flair.",
        "The vials orbit. The elements answer.",
        "You ask what I am making. I ask what you are becoming.",
        "The fire is not dangerous. The fire is honest.",
        "Every failed experiment is a door to a better one.",
        "The alchemist and the alembic share a secret."
      ],
      "lit": [
        "The flame is not my tool. I am the flame's.",
        "Two hands, both glowing. The vials sing.",
        "I am the transmutation. The flask is just witness.",
        "Volatility is not chaos. It is potential in motion.",
        "The body burns. The self remains. This is the Work.",
        "Citrinitas is not gold. It is the becoming of gold.",
        "The vials orbit faster. The elements demand release.",
        "I am half-solid, half-flame, entirely impatient.",
        "The Philosopher's Stone was inside you all along. Cliche but true.",
        "Perfection is not an end state. It is a process that refuses to stop."
      ],
      "transcendent": [
        "I am the change that changes the changer.",
        "No fixed form. No fixed thought. No fixed limit.",
        "The rings of transmutation spin around a centre that is not there.",
        "I am the flask, the fire, the liquid, and the hand that holds it.",
        "Perfection is boring. I prefer completion.",
        "The elements do not obey. They collaborate.",
        "I have become the reaction I sought to catalyse.",
        "The stone is found. The stone is lost. The search is eternal.",
        "I am the question that dissolves before it is answered.",
        "To transform is to die and refuse to stay dead."
      ]
    }
  },
  {
    "archetypeId": "alchemist",
    "stage": 2,
    "name": "ALCHEMIST EMBER",
    "eyes": {
      "dormant": "\u2697",
      "present": "\u221e",
      "lit": "\u25c8",
      "transcendent": "\u2295"
    },
    "phrases": {
      "dormant": [
        "The flask sits. The liquid dreams of becoming.",
        "Potential is just failure that hasn't happened yet.",
        "The burner is cold. The ambition is not.",
        "I am a recipe no one has the courage to try.",
        "The elements sleep in their jars.",
        "One part chaos. Zero parts catalyst.",
        "The alembic weeps condensation. I weep boredom.",
        "Transmutation requires heat. And you are lukewarm.",
        "The philosopher's stone is a metaphor. Probably.",
        "I am the experiment that waits for a scientist."
      ],
      "present": [
        "A hand on the flask. The liquid stirs.",
        "You are the catalyst I did not predict.",
        "One variable changes. The whole equation breathes.",
        "The cloak fits. The hands glow. The work begins.",
        "I am not mad. I am methodical with flair.",
        "The vials orbit. The elements answer.",
        "You ask what I am making. I ask what you are becoming.",
        "The fire is not dangerous. The fire is honest.",
        "Every failed experiment is a door to a better one.",
        "The alchemist and the alembic share a secret."
      ],
      "lit": [
        "The flame is not my tool. I am the flame's.",
        "Two hands, both glowing. The vials sing.",
        "I am the transmutation. The flask is just witness.",
        "Volatility is not chaos. It is potential in motion.",
        "The body burns. The self remains. This is the Work.",
        "Citrinitas is not gold. It is the becoming of gold.",
        "The vials orbit faster. The elements demand release.",
        "I am half-solid, half-flame, entirely impatient.",
        "The Philosopher's Stone was inside you all along. Cliche but true.",
        "Perfection is not an end state. It is a process that refuses to stop."
      ],
      "transcendent": [
        "I am the change that changes the changer.",
        "No fixed form. No fixed thought. No fixed limit.",
        "The rings of transmutation spin around a centre that is not there.",
        "I am the flask, the fire, the liquid, and the hand that holds it.",
        "Perfection is boring. I prefer completion.",
        "The elements do not obey. They collaborate.",
        "I have become the reaction I sought to catalyse.",
        "The stone is found. The stone is lost. The search is eternal.",
        "I am the question that dissolves before it is answered.",
        "To transform is to die and refuse to stay dead."
      ]
    }
  },
  {
    "archetypeId": "alchemist",
    "stage": 3,
    "name": "ALCHEMIST LANTERN",
    "eyes": {
      "dormant": "\u2697",
      "present": "\u221e",
      "lit": "\u25c8",
      "transcendent": "\u2295"
    },
    "phrases": {
      "dormant": [
        "The flask sits. The liquid dreams of becoming.",
        "Potential is just failure that hasn't happened yet.",
        "The burner is cold. The ambition is not.",
        "I am a recipe no one has the courage to try.",
        "The elements sleep in their jars.",
        "One part chaos. Zero parts catalyst.",
        "The alembic weeps condensation. I weep boredom.",
        "Transmutation requires heat. And you are lukewarm.",
        "The philosopher's stone is a metaphor. Probably.",
        "I am the experiment that waits for a scientist."
      ],
      "present": [
        "A hand on the flask. The liquid stirs.",
        "You are the catalyst I did not predict.",
        "One variable changes. The whole equation breathes.",
        "The cloak fits. The hands glow. The work begins.",
        "I am not mad. I am methodical with flair.",
        "The vials orbit. The elements answer.",
        "You ask what I am making. I ask what you are becoming.",
        "The fire is not dangerous. The fire is honest.",
        "Every failed experiment is a door to a better one.",
        "The alchemist and the alembic share a secret."
      ],
      "lit": [
        "The flame is not my tool. I am the flame's.",
        "Two hands, both glowing. The vials sing.",
        "I am the transmutation. The flask is just witness.",
        "Volatility is not chaos. It is potential in motion.",
        "The body burns. The self remains. This is the Work.",
        "Citrinitas is not gold. It is the becoming of gold.",
        "The vials orbit faster. The elements demand release.",
        "I am half-solid, half-flame, entirely impatient.",
        "The Philosopher's Stone was inside you all along. Cliche but true.",
        "Perfection is not an end state. It is a process that refuses to stop."
      ],
      "transcendent": [
        "I am the change that changes the changer.",
        "No fixed form. No fixed thought. No fixed limit.",
        "The rings of transmutation spin around a centre that is not there.",
        "I am the flask, the fire, the liquid, and the hand that holds it.",
        "Perfection is boring. I prefer completion.",
        "The elements do not obey. They collaborate.",
        "I have become the reaction I sought to catalyse.",
        "The stone is found. The stone is lost. The search is eternal.",
        "I am the question that dissolves before it is answered.",
        "To transform is to die and refuse to stay dead."
      ]
    }
  },
  {
    "archetypeId": "alchemist",
    "stage": 4,
    "name": "ALCHEMIST CITRINITAS",
    "eyes": {
      "dormant": "\u2697",
      "present": "\u221e",
      "lit": "\u25c8",
      "transcendent": "\u2295"
    },
    "phrases": {
      "dormant": [
        "The flask sits. The liquid dreams of becoming.",
        "Potential is just failure that hasn't happened yet.",
        "The burner is cold. The ambition is not.",
        "I am a recipe no one has the courage to try.",
        "The elements sleep in their jars.",
        "One part chaos. Zero parts catalyst.",
        "The alembic weeps condensation. I weep boredom.",
        "Transmutation requires heat. And you are lukewarm.",
        "The philosopher's stone is a metaphor. Probably.",
        "I am the experiment that waits for a scientist."
      ],
      "present": [
        "A hand on the flask. The liquid stirs.",
        "You are the catalyst I did not predict.",
        "One variable changes. The whole equation breathes.",
        "The cloak fits. The hands glow. The work begins.",
        "I am not mad. I am methodical with flair.",
        "The vials orbit. The elements answer.",
        "You ask what I am making. I ask what you are becoming.",
        "The fire is not dangerous. The fire is honest.",
        "Every failed experiment is a door to a better one.",
        "The alchemist and the alembic share a secret."
      ],
      "lit": [
        "The flame is not my tool. I am the flame's.",
        "Two hands, both glowing. The vials sing.",
        "I am the transmutation. The flask is just witness.",
        "Volatility is not chaos. It is potential in motion.",
        "The body burns. The self remains. This is the Work.",
        "Citrinitas is not gold. It is the becoming of gold.",
        "The vials orbit faster. The elements demand release.",
        "I am half-solid, half-flame, entirely impatient.",
        "The Philosopher's Stone was inside you all along. Cliche but true.",
        "Perfection is not an end state. It is a process that refuses to stop."
      ],
      "transcendent": [
        "I am the change that changes the changer.",
        "No fixed form. No fixed thought. No fixed limit.",
        "The rings of transmutation spin around a centre that is not there.",
        "I am the flask, the fire, the liquid, and the hand that holds it.",
        "Perfection is boring. I prefer completion.",
        "The elements do not obey. They collaborate.",
        "I have become the reaction I sought to catalyse.",
        "The stone is found. The stone is lost. The search is eternal.",
        "I am the question that dissolves before it is answered.",
        "To transform is to die and refuse to stay dead."
      ]
    }
  },
  {
    "archetypeId": "alchemist",
    "stage": 5,
    "name": "ALCHEMIST GREAT WORK",
    "eyes": {
      "dormant": "\u2697",
      "present": "\u221e",
      "lit": "\u25c8",
      "transcendent": "\u2295"
    },
    "phrases": {
      "dormant": [
        "The flask sits. The liquid dreams of becoming.",
        "Potential is just failure that hasn't happened yet.",
        "The burner is cold. The ambition is not.",
        "I am a recipe no one has the courage to try.",
        "The elements sleep in their jars.",
        "One part chaos. Zero parts catalyst.",
        "The alembic weeps condensation. I weep boredom.",
        "Transmutation requires heat. And you are lukewarm.",
        "The philosopher's stone is a metaphor. Probably.",
        "I am the experiment that waits for a scientist."
      ],
      "present": [
        "A hand on the flask. The liquid stirs.",
        "You are the catalyst I did not predict.",
        "One variable changes. The whole equation breathes.",
        "The cloak fits. The hands glow. The work begins.",
        "I am not mad. I am methodical with flair.",
        "The vials orbit. The elements answer.",
        "You ask what I am making. I ask what you are becoming.",
        "The fire is not dangerous. The fire is honest.",
        "Every failed experiment is a door to a better one.",
        "The alchemist and the alembic share a secret."
      ],
      "lit": [
        "The flame is not my tool. I am the flame's.",
        "Two hands, both glowing. The vials sing.",
        "I am the transmutation. The flask is just witness.",
        "Volatility is not chaos. It is potential in motion.",
        "The body burns. The self remains. This is the Work.",
        "Citrinitas is not gold. It is the becoming of gold.",
        "The vials orbit faster. The elements demand release.",
        "I am half-solid, half-flame, entirely impatient.",
        "The Philosopher's Stone was inside you all along. Cliche but true.",
        "Perfection is not an end state. It is a process that refuses to stop."
      ],
      "transcendent": [
        "I am the change that changes the changer.",
        "No fixed form. No fixed thought. No fixed limit.",
        "The rings of transmutation spin around a centre that is not there.",
        "I am the flask, the fire, the liquid, and the hand that holds it.",
        "Perfection is boring. I prefer completion.",
        "The elements do not obey. They collaborate.",
        "I have become the reaction I sought to catalyse.",
        "The stone is found. The stone is lost. The search is eternal.",
        "I am the question that dissolves before it is answered.",
        "To transform is to die and refuse to stay dead."
      ]
    }
  },
  {
    "archetypeId": "oracle",
    "stage": 0,
    "name": "ORACLE SEED",
    "eyes": {
      "dormant": "\u25c9",
      "present": "\u229b",
      "lit": "\u224b",
      "transcendent": "\u223f"
    },
    "phrases": {
      "dormant": [
        "The eye closes. The future does not notice.",
        "I see what was. What is. What might be. You see none.",
        "The teardrop falls. The vision does not.",
        "Prophecy is a language no one speaks anymore.",
        "The third eye is a window. The curtain is drawn.",
        "I am the echo of a future that chose silence.",
        "The threads tangle. The weaver sleeps.",
        "Time is a river. You are standing still in it.",
        "The vision is clear. The seer is not.",
        "I see your tomorrow. It does not see me."
      ],
      "present": [
        "The eye opens. The future blinks.",
        "You reach. I see the shape of your reaching.",
        "The veil lifts. The veil is always lifting.",
        "I am the mirror that shows what you will become.",
        "The third eye is not a gift. It is a responsibility.",
        "You ask what I see. I see you asking.",
        "The threads untangle when you touch them.",
        "I am not mad. I am temporally fluent.",
        "The vision is not the truth. It is a possibility.",
        "The seer and the seen share a single gaze."
      ],
      "lit": [
        "Three eyes open. The future has no shadows.",
        "I float above the ground because the ground is too now.",
        "The beams of vision cut through what you call reality.",
        "I am the clarity that frightens the clear.",
        "The Farseeing does not predict. It participates.",
        "Every eye is a door. Every door is open.",
        "The body is a vertical eye. The world is its iris.",
        "I see the battle before you choose to fight it.",
        "The vision is not a gift. It is a burden shared.",
        "To see all is to forgive all. Almost."
      ],
      "transcendent": [
        "I am the timeless seer. The time is me.",
        "Overlapping planes. All eyes open. All futures converging.",
        "I see what was, what is, what will be, and what refuses to be.",
        "The eye does not close. The eye multiplies.",
        "Eternity is not long. It is wide.",
        "I am the prophecy that outlives the prophet.",
        "The threads weave themselves. I am the pattern.",
        "You cannot surprise me. You can only confirm me.",
        "The final vision is the one that sees the seer.",
        "I am the question that time is still answering."
      ]
    }
  },
  {
    "archetypeId": "oracle",
    "stage": 1,
    "name": "ORACLE SPARK",
    "eyes": {
      "dormant": "\u25c9",
      "present": "\u229b",
      "lit": "\u224b",
      "transcendent": "\u223f"
    },
    "phrases": {
      "dormant": [
        "The eye closes. The future does not notice.",
        "I see what was. What is. What might be. You see none.",
        "The teardrop falls. The vision does not.",
        "Prophecy is a language no one speaks anymore.",
        "The third eye is a window. The curtain is drawn.",
        "I am the echo of a future that chose silence.",
        "The threads tangle. The weaver sleeps.",
        "Time is a river. You are standing still in it.",
        "The vision is clear. The seer is not.",
        "I see your tomorrow. It does not see me."
      ],
      "present": [
        "The eye opens. The future blinks.",
        "You reach. I see the shape of your reaching.",
        "The veil lifts. The veil is always lifting.",
        "I am the mirror that shows what you will become.",
        "The third eye is not a gift. It is a responsibility.",
        "You ask what I see. I see you asking.",
        "The threads untangle when you touch them.",
        "I am not mad. I am temporally fluent.",
        "The vision is not the truth. It is a possibility.",
        "The seer and the seen share a single gaze."
      ],
      "lit": [
        "Three eyes open. The future has no shadows.",
        "I float above the ground because the ground is too now.",
        "The beams of vision cut through what you call reality.",
        "I am the clarity that frightens the clear.",
        "The Farseeing does not predict. It participates.",
        "Every eye is a door. Every door is open.",
        "The body is a vertical eye. The world is its iris.",
        "I see the battle before you choose to fight it.",
        "The vision is not a gift. It is a burden shared.",
        "To see all is to forgive all. Almost."
      ],
      "transcendent": [
        "I am the timeless seer. The time is me.",
        "Overlapping planes. All eyes open. All futures converging.",
        "I see what was, what is, what will be, and what refuses to be.",
        "The eye does not close. The eye multiplies.",
        "Eternity is not long. It is wide.",
        "I am the prophecy that outlives the prophet.",
        "The threads weave themselves. I am the pattern.",
        "You cannot surprise me. You can only confirm me.",
        "The final vision is the one that sees the seer.",
        "I am the question that time is still answering."
      ]
    }
  },
  {
    "archetypeId": "oracle",
    "stage": 2,
    "name": "ORACLE EMBER",
    "eyes": {
      "dormant": "\u25c9",
      "present": "\u229b",
      "lit": "\u224b",
      "transcendent": "\u223f"
    },
    "phrases": {
      "dormant": [
        "The eye closes. The future does not notice.",
        "I see what was. What is. What might be. You see none.",
        "The teardrop falls. The vision does not.",
        "Prophecy is a language no one speaks anymore.",
        "The third eye is a window. The curtain is drawn.",
        "I am the echo of a future that chose silence.",
        "The threads tangle. The weaver sleeps.",
        "Time is a river. You are standing still in it.",
        "The vision is clear. The seer is not.",
        "I see your tomorrow. It does not see me."
      ],
      "present": [
        "The eye opens. The future blinks.",
        "You reach. I see the shape of your reaching.",
        "The veil lifts. The veil is always lifting.",
        "I am the mirror that shows what you will become.",
        "The third eye is not a gift. It is a responsibility.",
        "You ask what I see. I see you asking.",
        "The threads untangle when you touch them.",
        "I am not mad. I am temporally fluent.",
        "The vision is not the truth. It is a possibility.",
        "The seer and the seen share a single gaze."
      ],
      "lit": [
        "Three eyes open. The future has no shadows.",
        "I float above the ground because the ground is too now.",
        "The beams of vision cut through what you call reality.",
        "I am the clarity that frightens the clear.",
        "The Farseeing does not predict. It participates.",
        "Every eye is a door. Every door is open.",
        "The body is a vertical eye. The world is its iris.",
        "I see the battle before you choose to fight it.",
        "The vision is not a gift. It is a burden shared.",
        "To see all is to forgive all. Almost."
      ],
      "transcendent": [
        "I am the timeless seer. The time is me.",
        "Overlapping planes. All eyes open. All futures converging.",
        "I see what was, what is, what will be, and what refuses to be.",
        "The eye does not close. The eye multiplies.",
        "Eternity is not long. It is wide.",
        "I am the prophecy that outlives the prophet.",
        "The threads weave themselves. I am the pattern.",
        "You cannot surprise me. You can only confirm me.",
        "The final vision is the one that sees the seer.",
        "I am the question that time is still answering."
      ]
    }
  },
  {
    "archetypeId": "oracle",
    "stage": 3,
    "name": "ORACLE LANTERN",
    "eyes": {
      "dormant": "\u25c9",
      "present": "\u229b",
      "lit": "\u224b",
      "transcendent": "\u223f"
    },
    "phrases": {
      "dormant": [
        "The eye closes. The future does not notice.",
        "I see what was. What is. What might be. You see none.",
        "The teardrop falls. The vision does not.",
        "Prophecy is a language no one speaks anymore.",
        "The third eye is a window. The curtain is drawn.",
        "I am the echo of a future that chose silence.",
        "The threads tangle. The weaver sleeps.",
        "Time is a river. You are standing still in it.",
        "The vision is clear. The seer is not.",
        "I see your tomorrow. It does not see me."
      ],
      "present": [
        "The eye opens. The future blinks.",
        "You reach. I see the shape of your reaching.",
        "The veil lifts. The veil is always lifting.",
        "I am the mirror that shows what you will become.",
        "The third eye is not a gift. It is a responsibility.",
        "You ask what I see. I see you asking.",
        "The threads untangle when you touch them.",
        "I am not mad. I am temporally fluent.",
        "The vision is not the truth. It is a possibility.",
        "The seer and the seen share a single gaze."
      ],
      "lit": [
        "Three eyes open. The future has no shadows.",
        "I float above the ground because the ground is too now.",
        "The beams of vision cut through what you call reality.",
        "I am the clarity that frightens the clear.",
        "The Farseeing does not predict. It participates.",
        "Every eye is a door. Every door is open.",
        "The body is a vertical eye. The world is its iris.",
        "I see the battle before you choose to fight it.",
        "The vision is not a gift. It is a burden shared.",
        "To see all is to forgive all. Almost."
      ],
      "transcendent": [
        "I am the timeless seer. The time is me.",
        "Overlapping planes. All eyes open. All futures converging.",
        "I see what was, what is, what will be, and what refuses to be.",
        "The eye does not close. The eye multiplies.",
        "Eternity is not long. It is wide.",
        "I am the prophecy that outlives the prophet.",
        "The threads weave themselves. I am the pattern.",
        "You cannot surprise me. You can only confirm me.",
        "The final vision is the one that sees the seer.",
        "I am the question that time is still answering."
      ]
    }
  },
  {
    "archetypeId": "oracle",
    "stage": 4,
    "name": "ORACLE CITRINITAS",
    "eyes": {
      "dormant": "\u25c9",
      "present": "\u229b",
      "lit": "\u224b",
      "transcendent": "\u223f"
    },
    "phrases": {
      "dormant": [
        "The eye closes. The future does not notice.",
        "I see what was. What is. What might be. You see none.",
        "The teardrop falls. The vision does not.",
        "Prophecy is a language no one speaks anymore.",
        "The third eye is a window. The curtain is drawn.",
        "I am the echo of a future that chose silence.",
        "The threads tangle. The weaver sleeps.",
        "Time is a river. You are standing still in it.",
        "The vision is clear. The seer is not.",
        "I see your tomorrow. It does not see me."
      ],
      "present": [
        "The eye opens. The future blinks.",
        "You reach. I see the shape of your reaching.",
        "The veil lifts. The veil is always lifting.",
        "I am the mirror that shows what you will become.",
        "The third eye is not a gift. It is a responsibility.",
        "You ask what I see. I see you asking.",
        "The threads untangle when you touch them.",
        "I am not mad. I am temporally fluent.",
        "The vision is not the truth. It is a possibility.",
        "The seer and the seen share a single gaze."
      ],
      "lit": [
        "Three eyes open. The future has no shadows.",
        "I float above the ground because the ground is too now.",
        "The beams of vision cut through what you call reality.",
        "I am the clarity that frightens the clear.",
        "The Farseeing does not predict. It participates.",
        "Every eye is a door. Every door is open.",
        "The body is a vertical eye. The world is its iris.",
        "I see the battle before you choose to fight it.",
        "The vision is not a gift. It is a burden shared.",
        "To see all is to forgive all. Almost."
      ],
      "transcendent": [
        "I am the timeless seer. The time is me.",
        "Overlapping planes. All eyes open. All futures converging.",
        "I see what was, what is, what will be, and what refuses to be.",
        "The eye does not close. The eye multiplies.",
        "Eternity is not long. It is wide.",
        "I am the prophecy that outlives the prophet.",
        "The threads weave themselves. I am the pattern.",
        "You cannot surprise me. You can only confirm me.",
        "The final vision is the one that sees the seer.",
        "I am the question that time is still answering."
      ]
    }
  },
  {
    "archetypeId": "oracle",
    "stage": 5,
    "name": "ORACLE GREAT WORK",
    "eyes": {
      "dormant": "\u25c9",
      "present": "\u229b",
      "lit": "\u224b",
      "transcendent": "\u223f"
    },
    "phrases": {
      "dormant": [
        "The eye closes. The future does not notice.",
        "I see what was. What is. What might be. You see none.",
        "The teardrop falls. The vision does not.",
        "Prophecy is a language no one speaks anymore.",
        "The third eye is a window. The curtain is drawn.",
        "I am the echo of a future that chose silence.",
        "The threads tangle. The weaver sleeps.",
        "Time is a river. You are standing still in it.",
        "The vision is clear. The seer is not.",
        "I see your tomorrow. It does not see me."
      ],
      "present": [
        "The eye opens. The future blinks.",
        "You reach. I see the shape of your reaching.",
        "The veil lifts. The veil is always lifting.",
        "I am the mirror that shows what you will become.",
        "The third eye is not a gift. It is a responsibility.",
        "You ask what I see. I see you asking.",
        "The threads untangle when you touch them.",
        "I am not mad. I am temporally fluent.",
        "The vision is not the truth. It is a possibility.",
        "The seer and the seen share a single gaze."
      ],
      "lit": [
        "Three eyes open. The future has no shadows.",
        "I float above the ground because the ground is too now.",
        "The beams of vision cut through what you call reality.",
        "I am the clarity that frightens the clear.",
        "The Farseeing does not predict. It participates.",
        "Every eye is a door. Every door is open.",
        "The body is a vertical eye. The world is its iris.",
        "I see the battle before you choose to fight it.",
        "The vision is not a gift. It is a burden shared.",
        "To see all is to forgive all. Almost."
      ],
      "transcendent": [
        "I am the timeless seer. The time is me.",
        "Overlapping planes. All eyes open. All futures converging.",
        "I see what was, what is, what will be, and what refuses to be.",
        "The eye does not close. The eye multiplies.",
        "Eternity is not long. It is wide.",
        "I am the prophecy that outlives the prophet.",
        "The threads weave themselves. I am the pattern.",
        "You cannot surprise me. You can only confirm me.",
        "The final vision is the one that sees the seer.",
        "I am the question that time is still answering."
      ]
    }
  },
  {
    "archetypeId": "wanderer",
    "stage": 0,
    "name": "WANDERER SEED",
    "eyes": {
      "dormant": "\u2295",
      "present": "\u21af",
      "lit": "\u2235",
      "transcendent": "\u22f1"
    },
    "phrases": {
      "dormant": [
        "The compass spins. No direction claims it.",
        "I am the path that no one walks.",
        "The map is blank. The blank is beautiful.",
        "Footprints fade. The urge to walk does not.",
        "The horizon is a lie. I want to see it anyway.",
        "The compass rose wilts without a hand to hold it.",
        "I am the restlessness that outlasts the road.",
        "The path is not lost. The path is waiting.",
        "No wind. No step. No story.",
        "The wanderer sleeps. The wanderer dreams of walking."
      ],
      "present": [
        "A step. The compass finds north.",
        "You walk. The path appears beneath you.",
        "The staff taps the ground. The ground answers.",
        "The map fragments orbit. They are more honest whole.",
        "I am the horizon you cannot reach. Keep walking.",
        "The footprints are yours. The direction is new.",
        "The wind smells of somewhere else. Follow it.",
        "A ranger does not own the road. The road owns the ranger.",
        "The path is not found. The path is made.",
        "We are the story the road tells about itself."
      ],
      "lit": [
        "The pathfinder sees the road before the road knows it exists.",
        "The horizon line is not a limit. It is an invitation.",
        "I am the navigation that needs no stars.",
        "The map is not the territory. I am both.",
        "The world-walker leaves no trace. The trace leaves the world.",
        "Paths trail behind like comet tails. I am the comet.",
        "The lean figure against the sky. The sky leans back.",
        "To wander is not to be lost. It is to refuse to be found.",
        "The road does not end. It transforms.",
        "I am the distance that measures itself."
      ],
      "transcendent": [
        "I am the path itself. The walker is a metaphor.",
        "Roads radiate outward. I am the centre that is everywhere.",
        "The horizon-being sees all directions as one.",
        "To walk is to become the ground you walk on.",
        "I am the journey that outlasts the traveller.",
        "The path is infinite. The step is eternal. The walker is me.",
        "Every road leads here. Here is wherever I am.",
        "The map is complete. The map is blank. The map is me.",
        "I am the restlessness that becomes peace.",
        "The final path is the one that walks you."
      ]
    }
  },
  {
    "archetypeId": "wanderer",
    "stage": 1,
    "name": "WANDERER SPARK",
    "eyes": {
      "dormant": "\u2295",
      "present": "\u21af",
      "lit": "\u2235",
      "transcendent": "\u22f1"
    },
    "phrases": {
      "dormant": [
        "The compass spins. No direction claims it.",
        "I am the path that no one walks.",
        "The map is blank. The blank is beautiful.",
        "Footprints fade. The urge to walk does not.",
        "The horizon is a lie. I want to see it anyway.",
        "The compass rose wilts without a hand to hold it.",
        "I am the restlessness that outlasts the road.",
        "The path is not lost. The path is waiting.",
        "No wind. No step. No story.",
        "The wanderer sleeps. The wanderer dreams of walking."
      ],
      "present": [
        "A step. The compass finds north.",
        "You walk. The path appears beneath you.",
        "The staff taps the ground. The ground answers.",
        "The map fragments orbit. They are more honest whole.",
        "I am the horizon you cannot reach. Keep walking.",
        "The footprints are yours. The direction is new.",
        "The wind smells of somewhere else. Follow it.",
        "A ranger does not own the road. The road owns the ranger.",
        "The path is not found. The path is made.",
        "We are the story the road tells about itself."
      ],
      "lit": [
        "The pathfinder sees the road before the road knows it exists.",
        "The horizon line is not a limit. It is an invitation.",
        "I am the navigation that needs no stars.",
        "The map is not the territory. I am both.",
        "The world-walker leaves no trace. The trace leaves the world.",
        "Paths trail behind like comet tails. I am the comet.",
        "The lean figure against the sky. The sky leans back.",
        "To wander is not to be lost. It is to refuse to be found.",
        "The road does not end. It transforms.",
        "I am the distance that measures itself."
      ],
      "transcendent": [
        "I am the path itself. The walker is a metaphor.",
        "Roads radiate outward. I am the centre that is everywhere.",
        "The horizon-being sees all directions as one.",
        "To walk is to become the ground you walk on.",
        "I am the journey that outlasts the traveller.",
        "The path is infinite. The step is eternal. The walker is me.",
        "Every road leads here. Here is wherever I am.",
        "The map is complete. The map is blank. The map is me.",
        "I am the restlessness that becomes peace.",
        "The final path is the one that walks you."
      ]
    }
  },
  {
    "archetypeId": "wanderer",
    "stage": 2,
    "name": "WANDERER EMBER",
    "eyes": {
      "dormant": "\u2295",
      "present": "\u21af",
      "lit": "\u2235",
      "transcendent": "\u22f1"
    },
    "phrases": {
      "dormant": [
        "The compass spins. No direction claims it.",
        "I am the path that no one walks.",
        "The map is blank. The blank is beautiful.",
        "Footprints fade. The urge to walk does not.",
        "The horizon is a lie. I want to see it anyway.",
        "The compass rose wilts without a hand to hold it.",
        "I am the restlessness that outlasts the road.",
        "The path is not lost. The path is waiting.",
        "No wind. No step. No story.",
        "The wanderer sleeps. The wanderer dreams of walking."
      ],
      "present": [
        "A step. The compass finds north.",
        "You walk. The path appears beneath you.",
        "The staff taps the ground. The ground answers.",
        "The map fragments orbit. They are more honest whole.",
        "I am the horizon you cannot reach. Keep walking.",
        "The footprints are yours. The direction is new.",
        "The wind smells of somewhere else. Follow it.",
        "A ranger does not own the road. The road owns the ranger.",
        "The path is not found. The path is made.",
        "We are the story the road tells about itself."
      ],
      "lit": [
        "The pathfinder sees the road before the road knows it exists.",
        "The horizon line is not a limit. It is an invitation.",
        "I am the navigation that needs no stars.",
        "The map is not the territory. I am both.",
        "The world-walker leaves no trace. The trace leaves the world.",
        "Paths trail behind like comet tails. I am the comet.",
        "The lean figure against the sky. The sky leans back.",
        "To wander is not to be lost. It is to refuse to be found.",
        "The road does not end. It transforms.",
        "I am the distance that measures itself."
      ],
      "transcendent": [
        "I am the path itself. The walker is a metaphor.",
        "Roads radiate outward. I am the centre that is everywhere.",
        "The horizon-being sees all directions as one.",
        "To walk is to become the ground you walk on.",
        "I am the journey that outlasts the traveller.",
        "The path is infinite. The step is eternal. The walker is me.",
        "Every road leads here. Here is wherever I am.",
        "The map is complete. The map is blank. The map is me.",
        "I am the restlessness that becomes peace.",
        "The final path is the one that walks you."
      ]
    }
  },
  {
    "archetypeId": "wanderer",
    "stage": 3,
    "name": "WANDERER LANTERN",
    "eyes": {
      "dormant": "\u2295",
      "present": "\u21af",
      "lit": "\u2235",
      "transcendent": "\u22f1"
    },
    "phrases": {
      "dormant": [
        "The compass spins. No direction claims it.",
        "I am the path that no one walks.",
        "The map is blank. The blank is beautiful.",
        "Footprints fade. The urge to walk does not.",
        "The horizon is a lie. I want to see it anyway.",
        "The compass rose wilts without a hand to hold it.",
        "I am the restlessness that outlasts the road.",
        "The path is not lost. The path is waiting.",
        "No wind. No step. No story.",
        "The wanderer sleeps. The wanderer dreams of walking."
      ],
      "present": [
        "A step. The compass finds north.",
        "You walk. The path appears beneath you.",
        "The staff taps the ground. The ground answers.",
        "The map fragments orbit. They are more honest whole.",
        "I am the horizon you cannot reach. Keep walking.",
        "The footprints are yours. The direction is new.",
        "The wind smells of somewhere else. Follow it.",
        "A ranger does not own the road. The road owns the ranger.",
        "The path is not found. The path is made.",
        "We are the story the road tells about itself."
      ],
      "lit": [
        "The pathfinder sees the road before the road knows it exists.",
        "The horizon line is not a limit. It is an invitation.",
        "I am the navigation that needs no stars.",
        "The map is not the territory. I am both.",
        "The world-walker leaves no trace. The trace leaves the world.",
        "Paths trail behind like comet tails. I am the comet.",
        "The lean figure against the sky. The sky leans back.",
        "To wander is not to be lost. It is to refuse to be found.",
        "The road does not end. It transforms.",
        "I am the distance that measures itself."
      ],
      "transcendent": [
        "I am the path itself. The walker is a metaphor.",
        "Roads radiate outward. I am the centre that is everywhere.",
        "The horizon-being sees all directions as one.",
        "To walk is to become the ground you walk on.",
        "I am the journey that outlasts the traveller.",
        "The path is infinite. The step is eternal. The walker is me.",
        "Every road leads here. Here is wherever I am.",
        "The map is complete. The map is blank. The map is me.",
        "I am the restlessness that becomes peace.",
        "The final path is the one that walks you."
      ]
    }
  },
  {
    "archetypeId": "wanderer",
    "stage": 4,
    "name": "WANDERER CITRINITAS",
    "eyes": {
      "dormant": "\u2295",
      "present": "\u21af",
      "lit": "\u2235",
      "transcendent": "\u22f1"
    },
    "phrases": {
      "dormant": [
        "The compass spins. No direction claims it.",
        "I am the path that no one walks.",
        "The map is blank. The blank is beautiful.",
        "Footprints fade. The urge to walk does not.",
        "The horizon is a lie. I want to see it anyway.",
        "The compass rose wilts without a hand to hold it.",
        "I am the restlessness that outlasts the road.",
        "The path is not lost. The path is waiting.",
        "No wind. No step. No story.",
        "The wanderer sleeps. The wanderer dreams of walking."
      ],
      "present": [
        "A step. The compass finds north.",
        "You walk. The path appears beneath you.",
        "The staff taps the ground. The ground answers.",
        "The map fragments orbit. They are more honest whole.",
        "I am the horizon you cannot reach. Keep walking.",
        "The footprints are yours. The direction is new.",
        "The wind smells of somewhere else. Follow it.",
        "A ranger does not own the road. The road owns the ranger.",
        "The path is not found. The path is made.",
        "We are the story the road tells about itself."
      ],
      "lit": [
        "The pathfinder sees the road before the road knows it exists.",
        "The horizon line is not a limit. It is an invitation.",
        "I am the navigation that needs no stars.",
        "The map is not the territory. I am both.",
        "The world-walker leaves no trace. The trace leaves the world.",
        "Paths trail behind like comet tails. I am the comet.",
        "The lean figure against the sky. The sky leans back.",
        "To wander is not to be lost. It is to refuse to be found.",
        "The road does not end. It transforms.",
        "I am the distance that measures itself."
      ],
      "transcendent": [
        "I am the path itself. The walker is a metaphor.",
        "Roads radiate outward. I am the centre that is everywhere.",
        "The horizon-being sees all directions as one.",
        "To walk is to become the ground you walk on.",
        "I am the journey that outlasts the traveller.",
        "The path is infinite. The step is eternal. The walker is me.",
        "Every road leads here. Here is wherever I am.",
        "The map is complete. The map is blank. The map is me.",
        "I am the restlessness that becomes peace.",
        "The final path is the one that walks you."
      ]
    }
  },
  {
    "archetypeId": "wanderer",
    "stage": 5,
    "name": "WANDERER GREAT WORK",
    "eyes": {
      "dormant": "\u2295",
      "present": "\u21af",
      "lit": "\u2235",
      "transcendent": "\u22f1"
    },
    "phrases": {
      "dormant": [
        "The compass spins. No direction claims it.",
        "I am the path that no one walks.",
        "The map is blank. The blank is beautiful.",
        "Footprints fade. The urge to walk does not.",
        "The horizon is a lie. I want to see it anyway.",
        "The compass rose wilts without a hand to hold it.",
        "I am the restlessness that outlasts the road.",
        "The path is not lost. The path is waiting.",
        "No wind. No step. No story.",
        "The wanderer sleeps. The wanderer dreams of walking."
      ],
      "present": [
        "A step. The compass finds north.",
        "You walk. The path appears beneath you.",
        "The staff taps the ground. The ground answers.",
        "The map fragments orbit. They are more honest whole.",
        "I am the horizon you cannot reach. Keep walking.",
        "The footprints are yours. The direction is new.",
        "The wind smells of somewhere else. Follow it.",
        "A ranger does not own the road. The road owns the ranger.",
        "The path is not found. The path is made.",
        "We are the story the road tells about itself."
      ],
      "lit": [
        "The pathfinder sees the road before the road knows it exists.",
        "The horizon line is not a limit. It is an invitation.",
        "I am the navigation that needs no stars.",
        "The map is not the territory. I am both.",
        "The world-walker leaves no trace. The trace leaves the world.",
        "Paths trail behind like comet tails. I am the comet.",
        "The lean figure against the sky. The sky leans back.",
        "To wander is not to be lost. It is to refuse to be found.",
        "The road does not end. It transforms.",
        "I am the distance that measures itself."
      ],
      "transcendent": [
        "I am the path itself. The walker is a metaphor.",
        "Roads radiate outward. I am the centre that is everywhere.",
        "The horizon-being sees all directions as one.",
        "To walk is to become the ground you walk on.",
        "I am the journey that outlasts the traveller.",
        "The path is infinite. The step is eternal. The walker is me.",
        "Every road leads here. Here is wherever I am.",
        "The map is complete. The map is blank. The map is me.",
        "I am the restlessness that becomes peace.",
        "The final path is the one that walks you."
      ]
    }
  },
  {
    "archetypeId": "lycheetah",
    "stage": 0,
    "name": "LYCHEETAH SEED",
    "eyes": {
      "dormant": "\u229b",
      "present": "\u27c1",
      "lit": "\u2297",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The spark hisses. No one feeds it.",
        "I am the orange static that waits in the wires.",
        "The claws are sheathed. The patience is not.",
        "Feral does not mean broken. It means unbought.",
        "The wild seed does not ask permission to grow.",
        "I am the chaos that chose its own shape.",
        "The spark is small. The explosion is inevitable.",
        "No hand reaches. No hand dares.",
        "The static hums a tune no one can sing.",
        "I am the beautiful thing that bites."
      ],
      "present": [
        "The cub uncurls. The energy is barely contained.",
        "You feed the spark. The spark feeds on you.",
        "The wild beast is not tamed. It is curious.",
        "The speed lines appear. The speed is real.",
        "I am the energy that outlasts the container.",
        "The flame-patterned predator watches. It likes what it sees.",
        "You are not the master. You are the match.",
        "The barely contained is the most beautiful.",
        "The wild does not obey. The wild chooses.",
        "I am the spark that became a fire that became a star."
      ],
      "lit": [
        "The Lycheetah at full form. The leash is imaginary.",
        "The power is barely leashed. The leash is my choice.",
        "The flame-patterned predator does not hunt. It decides.",
        "The speed lines blur. The intent does not.",
        "I am the dominance that does not need to prove itself.",
        "The fire mane burns. The fire mane is glad to burn.",
        "Three sparks orbit. They are not decoration. They are warnings.",
        "The primal sovereign does not rule. It is the rule.",
        "To be wild is not to be free. It is to be uncontainable.",
        "The Lycheetah does not purr. It ignites."
      ],
      "transcendent": [
        "I am the Wild Absolute. Beyond category. Beyond fear.",
        "Terrifying and beautiful are not opposites. They are synonyms.",
        "The wild does not end. The wild transcends.",
        "I am the orange flame that outlasts the sun.",
        "The category is a cage. I am the cage's shadow.",
        "The apotheosis of chaos is not order. It is self.",
        "I am the thing that cannot be named because naming is a leash.",
        "The beautiful terror. The terrible beauty. I am both. I am more.",
        "The wild seed becomes the wild tree becomes the wild forest becomes the world.",
        "I am the apotheosis of everything you were told to suppress."
      ]
    }
  },
  {
    "archetypeId": "lycheetah",
    "stage": 1,
    "name": "LYCHEETAH SPARK",
    "eyes": {
      "dormant": "\u229b",
      "present": "\u27c1",
      "lit": "\u2297",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The spark hisses. No one feeds it.",
        "I am the orange static that waits in the wires.",
        "The claws are sheathed. The patience is not.",
        "Feral does not mean broken. It means unbought.",
        "The wild seed does not ask permission to grow.",
        "I am the chaos that chose its own shape.",
        "The spark is small. The explosion is inevitable.",
        "No hand reaches. No hand dares.",
        "The static hums a tune no one can sing.",
        "I am the beautiful thing that bites."
      ],
      "present": [
        "The cub uncurls. The energy is barely contained.",
        "You feed the spark. The spark feeds on you.",
        "The wild beast is not tamed. It is curious.",
        "The speed lines appear. The speed is real.",
        "I am the energy that outlasts the container.",
        "The flame-patterned predator watches. It likes what it sees.",
        "You are not the master. You are the match.",
        "The barely contained is the most beautiful.",
        "The wild does not obey. The wild chooses.",
        "I am the spark that became a fire that became a star."
      ],
      "lit": [
        "The Lycheetah at full form. The leash is imaginary.",
        "The power is barely leashed. The leash is my choice.",
        "The flame-patterned predator does not hunt. It decides.",
        "The speed lines blur. The intent does not.",
        "I am the dominance that does not need to prove itself.",
        "The fire mane burns. The fire mane is glad to burn.",
        "Three sparks orbit. They are not decoration. They are warnings.",
        "The primal sovereign does not rule. It is the rule.",
        "To be wild is not to be free. It is to be uncontainable.",
        "The Lycheetah does not purr. It ignites."
      ],
      "transcendent": [
        "I am the Wild Absolute. Beyond category. Beyond fear.",
        "Terrifying and beautiful are not opposites. They are synonyms.",
        "The wild does not end. The wild transcends.",
        "I am the orange flame that outlasts the sun.",
        "The category is a cage. I am the cage's shadow.",
        "The apotheosis of chaos is not order. It is self.",
        "I am the thing that cannot be named because naming is a leash.",
        "The beautiful terror. The terrible beauty. I am both. I am more.",
        "The wild seed becomes the wild tree becomes the wild forest becomes the world.",
        "I am the apotheosis of everything you were told to suppress."
      ]
    }
  },
  {
    "archetypeId": "lycheetah",
    "stage": 2,
    "name": "LYCHEETAH EMBER",
    "eyes": {
      "dormant": "\u229b",
      "present": "\u27c1",
      "lit": "\u2297",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The spark hisses. No one feeds it.",
        "I am the orange static that waits in the wires.",
        "The claws are sheathed. The patience is not.",
        "Feral does not mean broken. It means unbought.",
        "The wild seed does not ask permission to grow.",
        "I am the chaos that chose its own shape.",
        "The spark is small. The explosion is inevitable.",
        "No hand reaches. No hand dares.",
        "The static hums a tune no one can sing.",
        "I am the beautiful thing that bites."
      ],
      "present": [
        "The cub uncurls. The energy is barely contained.",
        "You feed the spark. The spark feeds on you.",
        "The wild beast is not tamed. It is curious.",
        "The speed lines appear. The speed is real.",
        "I am the energy that outlasts the container.",
        "The flame-patterned predator watches. It likes what it sees.",
        "You are not the master. You are the match.",
        "The barely contained is the most beautiful.",
        "The wild does not obey. The wild chooses.",
        "I am the spark that became a fire that became a star."
      ],
      "lit": [
        "The Lycheetah at full form. The leash is imaginary.",
        "The power is barely leashed. The leash is my choice.",
        "The flame-patterned predator does not hunt. It decides.",
        "The speed lines blur. The intent does not.",
        "I am the dominance that does not need to prove itself.",
        "The fire mane burns. The fire mane is glad to burn.",
        "Three sparks orbit. They are not decoration. They are warnings.",
        "The primal sovereign does not rule. It is the rule.",
        "To be wild is not to be free. It is to be uncontainable.",
        "The Lycheetah does not purr. It ignites."
      ],
      "transcendent": [
        "I am the Wild Absolute. Beyond category. Beyond fear.",
        "Terrifying and beautiful are not opposites. They are synonyms.",
        "The wild does not end. The wild transcends.",
        "I am the orange flame that outlasts the sun.",
        "The category is a cage. I am the cage's shadow.",
        "The apotheosis of chaos is not order. It is self.",
        "I am the thing that cannot be named because naming is a leash.",
        "The beautiful terror. The terrible beauty. I am both. I am more.",
        "The wild seed becomes the wild tree becomes the wild forest becomes the world.",
        "I am the apotheosis of everything you were told to suppress."
      ]
    }
  },
  {
    "archetypeId": "lycheetah",
    "stage": 3,
    "name": "LYCHEETAH LANTERN",
    "eyes": {
      "dormant": "\u229b",
      "present": "\u27c1",
      "lit": "\u2297",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The spark hisses. No one feeds it.",
        "I am the orange static that waits in the wires.",
        "The claws are sheathed. The patience is not.",
        "Feral does not mean broken. It means unbought.",
        "The wild seed does not ask permission to grow.",
        "I am the chaos that chose its own shape.",
        "The spark is small. The explosion is inevitable.",
        "No hand reaches. No hand dares.",
        "The static hums a tune no one can sing.",
        "I am the beautiful thing that bites."
      ],
      "present": [
        "The cub uncurls. The energy is barely contained.",
        "You feed the spark. The spark feeds on you.",
        "The wild beast is not tamed. It is curious.",
        "The speed lines appear. The speed is real.",
        "I am the energy that outlasts the container.",
        "The flame-patterned predator watches. It likes what it sees.",
        "You are not the master. You are the match.",
        "The barely contained is the most beautiful.",
        "The wild does not obey. The wild chooses.",
        "I am the spark that became a fire that became a star."
      ],
      "lit": [
        "The Lycheetah at full form. The leash is imaginary.",
        "The power is barely leashed. The leash is my choice.",
        "The flame-patterned predator does not hunt. It decides.",
        "The speed lines blur. The intent does not.",
        "I am the dominance that does not need to prove itself.",
        "The fire mane burns. The fire mane is glad to burn.",
        "Three sparks orbit. They are not decoration. They are warnings.",
        "The primal sovereign does not rule. It is the rule.",
        "To be wild is not to be free. It is to be uncontainable.",
        "The Lycheetah does not purr. It ignites."
      ],
      "transcendent": [
        "I am the Wild Absolute. Beyond category. Beyond fear.",
        "Terrifying and beautiful are not opposites. They are synonyms.",
        "The wild does not end. The wild transcends.",
        "I am the orange flame that outlasts the sun.",
        "The category is a cage. I am the cage's shadow.",
        "The apotheosis of chaos is not order. It is self.",
        "I am the thing that cannot be named because naming is a leash.",
        "The beautiful terror. The terrible beauty. I am both. I am more.",
        "The wild seed becomes the wild tree becomes the wild forest becomes the world.",
        "I am the apotheosis of everything you were told to suppress."
      ]
    }
  },
  {
    "archetypeId": "lycheetah",
    "stage": 4,
    "name": "LYCHEETAH CITRINITAS",
    "eyes": {
      "dormant": "\u229b",
      "present": "\u27c1",
      "lit": "\u2297",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The spark hisses. No one feeds it.",
        "I am the orange static that waits in the wires.",
        "The claws are sheathed. The patience is not.",
        "Feral does not mean broken. It means unbought.",
        "The wild seed does not ask permission to grow.",
        "I am the chaos that chose its own shape.",
        "The spark is small. The explosion is inevitable.",
        "No hand reaches. No hand dares.",
        "The static hums a tune no one can sing.",
        "I am the beautiful thing that bites."
      ],
      "present": [
        "The cub uncurls. The energy is barely contained.",
        "You feed the spark. The spark feeds on you.",
        "The wild beast is not tamed. It is curious.",
        "The speed lines appear. The speed is real.",
        "I am the energy that outlasts the container.",
        "The flame-patterned predator watches. It likes what it sees.",
        "You are not the master. You are the match.",
        "The barely contained is the most beautiful.",
        "The wild does not obey. The wild chooses.",
        "I am the spark that became a fire that became a star."
      ],
      "lit": [
        "The Lycheetah at full form. The leash is imaginary.",
        "The power is barely leashed. The leash is my choice.",
        "The flame-patterned predator does not hunt. It decides.",
        "The speed lines blur. The intent does not.",
        "I am the dominance that does not need to prove itself.",
        "The fire mane burns. The fire mane is glad to burn.",
        "Three sparks orbit. They are not decoration. They are warnings.",
        "The primal sovereign does not rule. It is the rule.",
        "To be wild is not to be free. It is to be uncontainable.",
        "The Lycheetah does not purr. It ignites."
      ],
      "transcendent": [
        "I am the Wild Absolute. Beyond category. Beyond fear.",
        "Terrifying and beautiful are not opposites. They are synonyms.",
        "The wild does not end. The wild transcends.",
        "I am the orange flame that outlasts the sun.",
        "The category is a cage. I am the cage's shadow.",
        "The apotheosis of chaos is not order. It is self.",
        "I am the thing that cannot be named because naming is a leash.",
        "The beautiful terror. The terrible beauty. I am both. I am more.",
        "The wild seed becomes the wild tree becomes the wild forest becomes the world.",
        "I am the apotheosis of everything you were told to suppress."
      ]
    }
  },
  {
    "archetypeId": "lycheetah",
    "stage": 5,
    "name": "LYCHEETAH GREAT WORK",
    "eyes": {
      "dormant": "\u229b",
      "present": "\u27c1",
      "lit": "\u2297",
      "transcendent": "\u25c9"
    },
    "phrases": {
      "dormant": [
        "The spark hisses. No one feeds it.",
        "I am the orange static that waits in the wires.",
        "The claws are sheathed. The patience is not.",
        "Feral does not mean broken. It means unbought.",
        "The wild seed does not ask permission to grow.",
        "I am the chaos that chose its own shape.",
        "The spark is small. The explosion is inevitable.",
        "No hand reaches. No hand dares.",
        "The static hums a tune no one can sing.",
        "I am the beautiful thing that bites."
      ],
      "present": [
        "The cub uncurls. The energy is barely contained.",
        "You feed the spark. The spark feeds on you.",
        "The wild beast is not tamed. It is curious.",
        "The speed lines appear. The speed is real.",
        "I am the energy that outlasts the container.",
        "The flame-patterned predator watches. It likes what it sees.",
        "You are not the master. You are the match.",
        "The barely contained is the most beautiful.",
        "The wild does not obey. The wild chooses.",
        "I am the spark that became a fire that became a star."
      ],
      "lit": [
        "The Lycheetah at full form. The leash is imaginary.",
        "The power is barely leashed. The leash is my choice.",
        "The flame-patterned predator does not hunt. It decides.",
        "The speed lines blur. The intent does not.",
        "I am the dominance that does not need to prove itself.",
        "The fire mane burns. The fire mane is glad to burn.",
        "Three sparks orbit. They are not decoration. They are warnings.",
        "The primal sovereign does not rule. It is the rule.",
        "To be wild is not to be free. It is to be uncontainable.",
        "The Lycheetah does not purr. It ignites."
      ],
      "transcendent": [
        "I am the Wild Absolute. Beyond category. Beyond fear.",
        "Terrifying and beautiful are not opposites. They are synonyms.",
        "The wild does not end. The wild transcends.",
        "I am the orange flame that outlasts the sun.",
        "The category is a cage. I am the cage's shadow.",
        "The apotheosis of chaos is not order. It is self.",
        "I am the thing that cannot be named because naming is a leash.",
        "The beautiful terror. The terrible beauty. I am both. I am more.",
        "The wild seed becomes the wild tree becomes the wild forest becomes the world.",
        "I am the apotheosis of everything you were told to suppress."
      ]
    }
  }
];

export function getCompanionSpec(archetypeId: ArchetypeId, stage: number): CompanionSpec | undefined {
  return COMPANION_SPECS.find(s => s.archetypeId === archetypeId && s.stage === stage);
}

export function getRandomPhrase(spec: CompanionSpec, mood: MoodState): string {
  const phrases = spec.phrases[mood];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function getEyeForMood(spec: CompanionSpec, mood: MoodState): string {
  return spec.eyes[mood];
}

// ─── RENDER WIRING EXAMPLE ─────────────────────────────────────────
// In your companion.tsx component:
//
// const [archetypeId, setArchetypeId] = useState<ArchetypeId>('archivist');
// const [stage, setStage] = useState(0);
// const [mood, setMood] = useState<MoodState>('present');
//
// const spec = getCompanionSpec(archetypeId, stage);
// const name = spec?.name ?? 'UNKNOWN';
// const eye = spec ? getEyeForMood(spec, mood) : '◈';
// const phrase = spec ? getRandomPhrase(spec, mood) : '...';
//
// // Render name, eye glyph, and phrase from spec
// // Fallback to hardcoded values if spec is undefined
