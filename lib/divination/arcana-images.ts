// ─── LYCHEETAH ARCANA: image map ───────────────────────────────────────────
// Keys match getArcanaName() output from lycheetah-arcana.ts:
//   • Majors → ALL-CAPS string (e.g. 'THE ORACLE')
//   • Minors → "Three of Eyes", "Ace of Claws", etc. (suit word-swapped)
//
// 87 rendered cards copied to assets/arcana/.
// Missing renders (no art in the 87-card set): Four of Claws, Five of Claws,
//   Two of Eyes, Queen of Eyes, King of Eyes.
// Extra/variant renders (dual art for same position) included under their
//   printed name — not returned by getArcanaName but available for future use.

// ── MAJOR ARCANA ─────────────────────────────────────────────────────────────
export const ARCANA_IMAGE: Record<string, ReturnType<typeof require>> = {
  // Canonical names (matching ARCANA_MAJOR_NAMES in lycheetah-arcana.ts)
  'THE WANDERER':        require('../../assets/arcana/6JdFg.jpg'),
  'THE SOVEREIGN':       require('../../assets/arcana/B7tzA.jpg'),
  'THE ORACLE':          require('../../assets/arcana/z8r6r.jpg'),
  'THE BLOOM':           require('../../assets/arcana/3G0q8.jpg'),
  'THE DOMINION':        require('../../assets/arcana/LW3w9.jpg'),
  'THE CODEX KEEPER':    require('../../assets/arcana/itqRf.jpg'),
  'THE CONVERGENCE':     require('../../assets/arcana/sPYVj.jpg'),
  'THE VELOCITY':        require('../../assets/arcana/luVA1.jpg'),
  'THE HOLD':            require('../../assets/arcana/lZizq.jpg'),
  'THE RECLUSE':         require('../../assets/arcana/BzCvp.jpg'),
  'THE CYCLE':           require('../../assets/arcana/MSswj.jpg'),
  'THE MEASURE':         require('../../assets/arcana/naJh7.jpg'),
  'THE INVERSION':       require('../../assets/arcana/GxZgr.jpg'),
  'THE SHEDDING':        require('../../assets/arcana/JWApL.jpg'),
  'THE BLEND':           require('../../assets/arcana/hQBsy.jpg'),
  'THE TRAP':            require('../../assets/arcana/bQ9WY.jpg'),
  'THE DROP':            require('../../assets/arcana/ckzG4.jpg'),
  'THE SIGNAL':          require('../../assets/arcana/4cEAA.jpg'),
  'THE BETWEEN':         require('../../assets/arcana/VeJjw.jpg'),
  'THE SOVEREIGN BLOOM': require('../../assets/arcana/GMI5F.jpg'),
  'THE CALLING':         require('../../assets/arcana/IeLHc.jpg'),
  'THE SOVEREIGN STATE': require('../../assets/arcana/huG7K.jpg'),

  // Variant/alternate art (dual renders — not returned by getArcanaName)
  'THE WHISPER':         require('../../assets/arcana/2oO0k.jpg'),
  'THE VOID':            require('../../assets/arcana/jnGwW.jpg'),
  'THE FRACTURE':        require('../../assets/arcana/qM9D7.jpg'),
  'THE CAGE':            require('../../assets/arcana/C1xF1.jpg'),
  'THE HUNT':            require('../../assets/arcana/xHjGH.jpg'),
  'THE MIRROR':          require('../../assets/arcana/nRfql.jpg'),
  'THE BURDEN':          require('../../assets/arcana/P8Y2L.jpg'),
  'THE VEIL':            require('../../assets/arcana/zaXRG.jpg'),
  'THE HERMIT':          require('../../assets/arcana/fVJEE.jpg'),
  'THE WHEEL':           require('../../assets/arcana/o07rj.jpg'),
  'THE THRESHOLD':       require('../../assets/arcana/zmaCe.jpg'),
  'THE SACRIFICE':       require('../../assets/arcana/iITBo.jpg'),

  // ── MINOR ARCANA: CLAWS (Wands) ──────────────────────────────────────────
  'Ace of Claws':    require('../../assets/arcana/o0YLo.jpg'),
  'Two of Claws':    require('../../assets/arcana/MG3j4.jpg'),
  'Three of Claws':  require('../../assets/arcana/CteKb.jpg'),
  // Four of Claws: no render
  // Five of Claws: no render
  'Six of Claws':    require('../../assets/arcana/3y6rP.jpg'),
  'Seven of Claws':  require('../../assets/arcana/9zTqR.jpg'),
  'Eight of Claws':  require('../../assets/arcana/q7spa.jpg'),
  'Nine of Claws':   require('../../assets/arcana/OlSQR.jpg'),
  'Ten of Claws':    require('../../assets/arcana/jn2nL.jpg'),
  'Page of Claws':   require('../../assets/arcana/Yq2w4.jpg'),
  'Knight of Claws': require('../../assets/arcana/bfFDt.jpg'),
  'Queen of Claws':  require('../../assets/arcana/yoqnK.jpg'),
  'King of Claws':   require('../../assets/arcana/nPzur.jpg'),

  // ── MINOR ARCANA: EYES (Cups) ─────────────────────────────────────────────
  'Ace of Eyes':    require('../../assets/arcana/jgngM.jpg'),
  // Two of Eyes: no render
  'Three of Eyes':  require('../../assets/arcana/1UjTX.jpg'),
  'Four of Eyes':   require('../../assets/arcana/nuGrQ.jpg'),
  'Five of Eyes':   require('../../assets/arcana/8wRnc.jpg'),
  'Six of Eyes':    require('../../assets/arcana/wDpjr.jpg'),
  'Seven of Eyes':  require('../../assets/arcana/AdENK.jpg'),
  'Eight of Eyes':  require('../../assets/arcana/57iZ9.jpg'),
  'Nine of Eyes':   require('../../assets/arcana/AvBhr.jpg'),
  'Ten of Eyes':    require('../../assets/arcana/TaanG.jpg'),
  'Page of Eyes':   require('../../assets/arcana/URA7W.jpg'),
  'Knight of Eyes': require('../../assets/arcana/QfcNx.jpg'),
  // Queen of Eyes: no render
  // King of Eyes: no render

  // ── MINOR ARCANA: FANGS (Swords) ─────────────────────────────────────────
  'Ace of Fangs':    require('../../assets/arcana/UtD3q.jpg'),
  'Two of Fangs':    require('../../assets/arcana/VfeHX.jpg'),
  'Three of Fangs':  require('../../assets/arcana/gjK0A.jpg'),
  'Four of Fangs':   require('../../assets/arcana/GfMXk.jpg'),
  'Five of Fangs':   require('../../assets/arcana/NY5tV.jpg'),
  'Six of Fangs':    require('../../assets/arcana/DYiEm.jpg'),
  'Seven of Fangs':  require('../../assets/arcana/JpxzR.jpg'),
  'Eight of Fangs':  require('../../assets/arcana/MtJ7D.jpg'),
  'Nine of Fangs':   require('../../assets/arcana/NMAbO.jpg'),
  'Ten of Fangs':    require('../../assets/arcana/XYQoU.jpg'),
  'Page of Fangs':   require('../../assets/arcana/9S360.jpg'),
  'Knight of Fangs': require('../../assets/arcana/uy6NU.jpg'),
  'Queen of Fangs':  require('../../assets/arcana/HHlpN.jpg'),
  'King of Fangs':   require('../../assets/arcana/tO4YF.jpg'),

  // ── MINOR ARCANA: SIGILS (Pentacles) ─────────────────────────────────────
  'Ace of Sigils':    require('../../assets/arcana/Atn49.jpg'),
  'Two of Sigils':    require('../../assets/arcana/Cuva3.jpg'),
  'Three of Sigils':  require('../../assets/arcana/2mmLK.jpg'),
  'Four of Sigils':   require('../../assets/arcana/swYuI.jpg'),
  'Five of Sigils':   require('../../assets/arcana/dX1wD.jpg'),
  'Six of Sigils':    require('../../assets/arcana/NgJeo.jpg'),
  'Seven of Sigils':  require('../../assets/arcana/frUlP.jpg'),
  'Eight of Sigils':  require('../../assets/arcana/Mp5P8.jpg'),
  'Nine of Sigils':   require('../../assets/arcana/FAuOg.jpg'),
  'Ten of Sigils':    require('../../assets/arcana/OD6zY.jpg'),
  'Page of Sigils':   require('../../assets/arcana/lYSxq.jpg'),
  'Knight of Sigils': require('../../assets/arcana/R7itz.jpg'),
  'Queen of Sigils':  require('../../assets/arcana/6A9Wk.jpg'),
  'King of Sigils':   require('../../assets/arcana/69lJC.jpg'),
};
