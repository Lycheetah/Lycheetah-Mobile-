// NOCTURNA image array — positional mapping to NOCTURNA_DECK order.
// 90/90 cards wired. Order verified June 30 2026 by reading all card art.
import { NOCTURNA_DECK } from './nocturna';

const NOCTURNA_ART: any[] = [
  // MAJORS 0–21
  require('../../assets/tarot/nocturna/nonXZ.jpg'),   // 0  THE PLUNGE
  require('../../assets/tarot/nocturna/rPfju.jpg'),   // 1  THE WILL-IN-DARK
  require('../../assets/tarot/nocturna/WAJk2.jpg'),   // 2  THE VEIL
  require('../../assets/tarot/nocturna/MVfy1.jpg'),   // 3  THE DEEP MOTHER
  require('../../assets/tarot/nocturna/Km4Cs.jpg'),   // 4  THE SOVEREIGN DARK
  require('../../assets/tarot/nocturna/yBe1h.jpg'),   // 5  THE KEEPER
  require('../../assets/tarot/nocturna/9BuQN.jpg'),   // 6  THE GRAVITY
  require('../../assets/tarot/nocturna/5ekVv.jpg'),   // 7  THE CURRENT
  require('../../assets/tarot/nocturna/SPtzC.jpg'),   // 8  THE EDGE
  require('../../assets/tarot/nocturna/fCHH7.jpg'),   // 9  THE ABYSS
  require('../../assets/tarot/nocturna/YCZJn.jpg'),   // 10 THE SPIRAL
  require('../../assets/tarot/nocturna/8Mh5z.jpg'),   // 11 THE WEIGHT
  require('../../assets/tarot/nocturna/YzYNa.jpg'),   // 12 THE SUSPENSION
  require('../../assets/tarot/nocturna/LYPfA.jpg'),   // 13 THE DISSOLUTION
  require('../../assets/tarot/nocturna/qlNF5.jpg'),   // 14 THE THRESHOLD
  require('../../assets/tarot/nocturna/sHtiV.jpg'),   // 15 THE GRIP
  require('../../assets/tarot/nocturna/GmcQf.jpg'),   // 16 THE RUPTURE
  require('../../assets/tarot/nocturna/hsk5r.jpg'),   // 17 THE SIGNAL
  require('../../assets/tarot/nocturna/nzsGZ.jpg'),   // 18 THE LURE
  require('../../assets/tarot/nocturna/s1AuE.jpg'),   // 19 THE RETURN
  require('../../assets/tarot/nocturna/MPZxs.jpg'),   // 20 THE CALL
  require('../../assets/tarot/nocturna/ANuJk.jpg'),   // 21 THE DEEP

  // TIDES 22–35
  require('../../assets/tarot/nocturna/QyE2O.jpg'),   // 22 ACE OF TIDES
  require('../../assets/tarot/nocturna/qlekj.jpg'),   // 23 II OF TIDES
  require('../../assets/tarot/nocturna/xhxHe.jpg'),   // 24 III OF TIDES
  require('../../assets/tarot/nocturna/GPpb3.jpg'),   // 25 IV OF TIDES
  require('../../assets/tarot/nocturna/gG2IA.jpg'),   // 26 V OF TIDES
  require('../../assets/tarot/nocturna/lGyf7.jpg'),   // 27 VI OF TIDES
  require('../../assets/tarot/nocturna/L1BK5.jpg'),   // 28 VII OF TIDES
  require('../../assets/tarot/nocturna/W8aAE.jpg'),   // 29 VIII OF TIDES
  require('../../assets/tarot/nocturna/thYsn.jpg'),   // 30 IX OF TIDES
  require('../../assets/tarot/nocturna/hJX6i.jpg'),   // 31 X OF TIDES
  require('../../assets/tarot/nocturna/SJQSP.jpg'),   // 32 PAGE OF TIDES
  require('../../assets/tarot/nocturna/ZKjQF.jpg'),   // 33 KNIGHT OF TIDES
  require('../../assets/tarot/nocturna/iY3jB.jpg'),   // 34 QUEEN OF TIDES
  require('../../assets/tarot/nocturna/52Hjk.jpg'),   // 35 KING OF TIDES

  // EMBERS 36–49
  require('../../assets/tarot/nocturna/KG8mC.jpg'),   // 36 ACE OF EMBERS
  require('../../assets/tarot/nocturna/CR8uW.jpg'),   // 37 II OF EMBERS
  require('../../assets/tarot/nocturna/7Z6eC.jpg'),   // 38 III OF EMBERS
  require('../../assets/tarot/nocturna/Z0lWM.jpg'),   // 39 IV OF EMBERS
  require('../../assets/tarot/nocturna/HUNyX.jpg'),   // 40 V OF EMBERS
  require('../../assets/tarot/nocturna/gUbEW.jpg'),   // 41 VI OF EMBERS
  require('../../assets/tarot/nocturna/zK08Q.jpg'),   // 42 VII OF EMBERS
  require('../../assets/tarot/nocturna/PiWNO.jpg'),   // 43 VIII OF EMBERS
  require('../../assets/tarot/nocturna/ljiyA.jpg'),   // 44 IX OF EMBERS
  require('../../assets/tarot/nocturna/C3nfT.jpg'),   // 45 X OF EMBERS
  require('../../assets/tarot/nocturna/uTe5T.jpg'),   // 46 PAGE OF EMBERS
  require('../../assets/tarot/nocturna/s2ID4.jpg'),   // 47 KNIGHT OF EMBERS
  require('../../assets/tarot/nocturna/b11ol.jpg'),   // 48 QUEEN OF EMBERS
  require('../../assets/tarot/nocturna/x5a2c.jpg'),   // 49 KING OF EMBERS

  // PRISMS 50–63
  require('../../assets/tarot/nocturna/oPZ2y.jpg'),   // 50 ACE OF PRISMS
  require('../../assets/tarot/nocturna/RupCX.jpg'),   // 51 II OF PRISMS
  require('../../assets/tarot/nocturna/SXWZi.jpg'),   // 52 III OF PRISMS
  require('../../assets/tarot/nocturna/SRlef.jpg'),   // 53 IV OF PRISMS
  require('../../assets/tarot/nocturna/B3UWv.jpg'),   // 54 V OF PRISMS
  require('../../assets/tarot/nocturna/APBze.jpg'),   // 55 VI OF PRISMS
  require('../../assets/tarot/nocturna/voA5u.jpg'),   // 56 VII OF PRISMS
  require('../../assets/tarot/nocturna/Yu86M.jpg'),   // 57 VIII OF PRISMS
  require('../../assets/tarot/nocturna/PuZLF.jpg'),   // 58 IX OF PRISMS
  require('../../assets/tarot/nocturna/fIVMq.jpg'),   // 59 X OF PRISMS
  require('../../assets/tarot/nocturna/Yj0sB.jpg'),   // 60 PAGE OF PRISMS
  require('../../assets/tarot/nocturna/pr0YZ.jpg'),   // 61 KNIGHT OF PRISMS
  require('../../assets/tarot/nocturna/kO8Uo.jpg'),   // 62 QUEEN OF PRISMS
  require('../../assets/tarot/nocturna/SNdRt.jpg'),   // 63 KING OF PRISMS

  // SEEDS 64–77
  require('../../assets/tarot/nocturna/WCO5F.jpg'),   // 64 ACE OF SEEDS
  require('../../assets/tarot/nocturna/49Hun.jpg'),   // 65 II OF SEEDS
  require('../../assets/tarot/nocturna/RLT64.jpg'),   // 66 III OF SEEDS
  require('../../assets/tarot/nocturna/M26MQ.jpg'),   // 67 IV OF SEEDS
  require('../../assets/tarot/nocturna/ZBhGG.jpg'),   // 68 V OF SEEDS
  require('../../assets/tarot/nocturna/iOMCt.jpg'),   // 69 VI OF SEEDS
  require('../../assets/tarot/nocturna/GqBAm.jpg'),   // 70 VII OF SEEDS
  require('../../assets/tarot/nocturna/NEfcV.jpg'),   // 71 VIII OF SEEDS
  require('../../assets/tarot/nocturna/dSoOZ.jpg'),   // 72 IX OF SEEDS
  require('../../assets/tarot/nocturna/BEvhm.jpg'),   // 73 X OF SEEDS
  require('../../assets/tarot/nocturna/VbTOF.jpg'),   // 74 PAGE OF SEEDS
  require('../../assets/tarot/nocturna/fl7eo.jpg'),   // 75 KNIGHT OF SEEDS
  require('../../assets/tarot/nocturna/Zk9ye.jpg'),   // 76 QUEEN OF SEEDS
  require('../../assets/tarot/nocturna/e858o.jpg'),   // 77 KING OF SEEDS

  // UNDERTOW 78–89 (art prints "THE UNDERTOW I–XII"; canonical names in nocturna.ts)
  require('../../assets/tarot/nocturna/7cWTo.jpg'),   // 78 THE DRIFT (U1)
  require('../../assets/tarot/nocturna/oqjbf.jpg'),   // 79 THE DESCENT (U2)
  require('../../assets/tarot/nocturna/gvRIv.jpg'),   // 80 THE PRESSURE (U3)
  require('../../assets/tarot/nocturna/xmvia.jpg'),   // 81 THE BIOLUMINESCENCE (U4)
  require('../../assets/tarot/nocturna/zVoBR.jpg'),   // 82 THE FEEDING (U5)
  require('../../assets/tarot/nocturna/Spjtu.jpg'),   // 83 THE BONE FIELD (U6)
  require('../../assets/tarot/nocturna/IuxQN.jpg'),   // 84 THE CURRENT UNDER THE CURRENT (U7)
  require('../../assets/tarot/nocturna/tEloK.jpg'),   // 85 THE MAGNETISM (U8)
  require('../../assets/tarot/nocturna/a12e8.jpg'),   // 86 THE BEAUTIFUL DANGER (U9)
  require('../../assets/tarot/nocturna/Rnth2.jpg'),   // 87 THE DISSOLUTION POINT (U10)
  require('../../assets/tarot/nocturna/8lell.jpg'),   // 88 THE NEVER-ENDING (U11)
  require('../../assets/tarot/nocturna/IEWk2.jpg'),   // 89 THE WAITING (U12)
];

export default NOCTURNA_ART;
export { NOCTURNA_DECK };
