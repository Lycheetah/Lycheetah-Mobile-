# KIMI SESSION 12 — 2.5D Foreground Parallax Layer + Living UI Animations

## What this session produces
A single file: `KIMI_SESSION_12_DELIVERABLE.md`

Two things: (1) the foreground parallax layer to complete the 2.5D depth stack, and (2) a set of "living UI" micro-animations for the companion tab — subtle pulse, glow, and breathing effects that make the creature feel alive.

---

## Current 2.5D system (companion.tsx)

The parallax system already has:
- **Background** — static scene image (no movement)
- **Mid layer** — Animated.Image that drifts on device tilt (accelerometer)

Here is the EXACT current mid-layer code (companion.tsx, inside CompanionScene component):

```tsx
// In CompanionScene component — already live:
const tiltX = useRef(0);
const midParallaxX = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const sub = Accelerometer.addListener(({ x }) => {
    tiltX.current = x;
    Animated.spring(midParallaxX, {
      toValue: -x * 18,
      useNativeDriver: true,
      speed: 4,
      bounciness: 0,
    }).start();
  });
  Accelerometer.setUpdateInterval(50);
  return () => sub.remove();
}, []);

// Mid layer render (inside the scene View, after background image):
<Animated.Image
  source={sceneImages[1] ?? sceneImages[0]}
  style={{
    position:'absolute', width:'150%', height:'110%', left:'-25%', top:'-5%',
    opacity: 0.35,
    tintColor: skinColor,
    transform: [{ translateX: midParallaxX }],
  }}
  blurRadius={2}
/>
```

---

## Task 1: Foreground parallax layer

Add a third layer on TOP of the mid layer (but BELOW the creature/UI).

Rules:
- Foreground drifts at **2.5× the speed** of mid layer
- Foreground moves in the **same direction** as mid (both chase the tilt)
- Foreground is MORE transparent than mid (opacity 0.18–0.22)
- Foreground uses a different visual — a radial/vignette pattern or the scene image with heavy blur (blurRadius 8–12)
- Foreground gives the illusion that the "camera" has depth — you're looking through a foreground plane

```typescript
// Add alongside midParallaxX:
const fgParallaxX = useRef(new Animated.Value(0)).current;

// Inside the Accelerometer listener, add:
Animated.spring(fgParallaxX, {
  toValue: -x * 40,  // 2.5× the mid drift (18 → 40)
  useNativeDriver: true,
  speed: 6,          // slightly faster response than mid
  bounciness: 0,
}).start();

// Foreground layer render (after mid layer, before creature):
<Animated.Image
  source={sceneImages[2] ?? sceneImages[0]}
  style={{
    position:'absolute', width:'170%', height:'120%', left:'-35%', top:'-10%',
    opacity: 0.18,
    tintColor: skinColor,
    transform: [{ translateX: fgParallaxX }],
  }}
  blurRadius={10}
/>
```

Build the complete foreground layer addition. If `sceneImages[2]` is null (some skins only have 2 scenes), fall back to `sceneImages[0]`.

---

## Task 2: Living UI micro-animations

Build these 4 effects as standalone Animated values with their corresponding JSX. These go in the main CompanionScreen (not CompanionScene). All use `useNativeDriver: true`.

### 2a. Creature breathing pulse
The creature glyph (or SVG container) gently scales between 1.0 and 1.03 on a 3-second loop:

```typescript
const breatheAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(breatheAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(breatheAnim, { toValue: 1.0,  duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ])
  );
  loop.start();
  return () => loop.stop();
}, []);

// Wrap creature container:
<Animated.View style={{ transform: [{ scale: breatheAnim }] }}>
  {/* creature render */}
</Animated.View>
```

### 2b. Stage glow pulse (on the creature border ring)
The creature's outer ring border opacity pulses between 0.4 and 0.9 on a 2-second loop:

```typescript
const glowAnim = useRef(new Animated.Value(0.4)).current;

useEffect(() => {
  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
    ])
  );
  loop.start();
  return () => loop.stop();
}, []);

// On the outer ring View:
<Animated.View style={{
  // ...existing ring styles...
  borderColor: color,  // interpolated opacity version:
  opacity: glowAnim,
}} />
```

### 2c. Battle HP bar shimmer
When battle is active and HP > 60%, the HP bar has a shimmer pass:

```typescript
const shimmerAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (!battle) return;
  const loop = Animated.loop(
    Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true })
  );
  loop.start();
  return () => loop.stop();
}, [!!battle]);

// Shimmer overlay on HP bar (absolutely positioned):
const shimmerTranslate = shimmerAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [-100, 200],
});
<View style={{ overflow:'hidden', ...hpBarContainerStyle }}>
  <View style={hpBarFillStyle} />
  <Animated.View style={{
    position:'absolute', top:0, bottom:0, width:40,
    backgroundColor:'rgba(255,255,255,0.15)',
    transform:[{ translateX: shimmerTranslate }],
  }} />
</View>
```

### 2d. Mood indicator float
The mood emoji/glyph shown above the creature floats up and down by 4px on a 2.5s loop:

```typescript
const floatAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(floatAnim, { toValue: -4, duration: 1250, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(floatAnim, { toValue: 4,  duration: 1250, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ])
  );
  loop.start();
  return () => loop.stop();
}, []);

// Wrap mood display:
<Animated.View style={{ transform:[{ translateY: floatAnim }] }}>
  <Text style={moodStyle}>{moodGlyph}</Text>
</Animated.View>
```

---

## Notes for Kimi

- The app is React Native / Expo SDK 54
- `Animated`, `Easing` are from `react-native`
- `Accelerometer` is from `expo-sensors` (already installed)
- All 4 living UI effects should use `useNativeDriver: true`
- Return each animation as a self-contained block (useRef init + useEffect + JSX wrapper)
- Do NOT try to read companion.tsx — embed the code inline in the deliverable

---

## Deliverable format

Return `KIMI_SESSION_12_DELIVERABLE.md` with:
1. `fgParallaxX` addition to the Accelerometer listener
2. Foreground layer `<Animated.Image>` JSX
3. All 4 living UI animation blocks (each as: state declaration + useEffect + JSX wrapper)

Label each section clearly so they can be spliced in one at a time.
