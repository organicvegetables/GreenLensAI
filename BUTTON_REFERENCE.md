# Button UX Improvements - Quick Reference

## Button Hierarchy Map

```
┌─────────────────────────────────────────────┐
│          TOP UTILITY BAR                    │
│  ⚙ Settings  │  🌗 Theme  │  ℹ About       │
└─────────────────────────────────────────────┘

PRIMARY BUTTONS (Green - Core Actions)
├─ Start Camera         [#2e7d32 → #388e3c on hover]
└─ Capture & Detect     [#00897b → #00a89d on hover]

SECONDARY BUTTONS (Blue-Gray - Supporting)
└─ Upload Image         [#546e7a → #607d8b on hover]

TERTIARY BUTTONS (Neutral Gray - Utility)
└─ Stop Camera          [#9e9e9e → #ababab on hover]
   ↳ NOT red anymore! (was dangerous looking)
```

## Button States

```
Start Camera
│
├─ [ENABLED]   Can click to start camera
│   └─ Hover: Lifts up 2px, green glow
│
└─ [DISABLED]  When camera already running
    └─ Opacity: 0.4, Grayscale: 30%

Capture & Detect
│
├─ [DISABLED]  By default (no camera feed yet)
│   └─ Opacity: 0.4, Grayscale: 30%
│
└─ [ENABLED]   Only when camera is active
    ├─ Hover: Lifts up 2px, cyan glow
    └─ Icon pulses on hover (attention grabber!)

Stop Camera
│
├─ [DISABLED]  By default
│   └─ Gray and de-emphasized
│
└─ [ENABLED]   When camera is running
    ├─ Hover: Lifts up 2px, gray glow
    └─ Click to stop safely (neutral color)
```

## Icon Animations

### All Buttons On Hover
```
Icon: Scale 1.0 → 1.2 (20% larger)
Icon: Rotate 0° → 5° (slight tilt)
Time: 0.3s ease (smooth)
```

### Capture & Detect Button On Hover
```
Icon: Also pulses 1.2 → 1.35 → 1.2
Duration: 0.6s infinite
Effect: Draws attention to primary action
```

## Theme Toggle

### Dark Mode (Default)
```
Background: Dark green gradient
Text: Light green (#c8e6c9)
Buttons: Green tones
Icon: 🌙 Moon
```

### Light Mode
```
Background: Light green gradient
Text: Dark gray (#1a1a1a)
Buttons: Blue-gray tones
Icon: ☀️ Sun
Storage: Persisted in localStorage
```

## Utility Bar Quick Info

```
⚙ Settings
└─ Future: Sensitivity, threshold, resolution, format, privacy

🌗 Dark/Light Toggle
├─ Saves preference
├─ Applies instantly
└─ Toggle between two modes

ℹ About Model
├─ Model specs: CNN-based classifier
├─ Vegetables: Cabbage, Lettuce
├─ Categories: Organic vs Inorganic
└─ Accuracy: 92.5%
```

## CSS Classes Reference

```
.btn                 Base button styling
.btn-primary         Green - main actions
.btn-secondary       Blue-gray - supporting
.btn-tertiary        Gray - utility actions
.btn:disabled         Disabled state (opacity + grayscale)
.btn i               Icon styling + animations
.btn:hover i         Icon transform on hover

.utility-bar         Top bar container
.utility-icon-btn    Small utility buttons
.utility-icon-btn:hover  Elevated with glow
```

## Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## Testing Checklist

- [ ] Start Camera button enables/disables correctly
- [ ] Capture & Detect only active with running camera
- [ ] Stop Camera is neutral gray, not red
- [ ] Icons scale and rotate on hover
- [ ] Capture & Detect icon pulses when active
- [ ] Theme toggle works and persists
- [ ] Utility bar buttons show tooltips on hover
- [ ] All buttons have smooth animations
- [ ] Disabled buttons appear visually distinct
- [ ] No console errors in browser dev tools

---

**Created**: January 18, 2026
**For**: Organic & Inorganic Vegetables Detector App
**Version**: 1.0
