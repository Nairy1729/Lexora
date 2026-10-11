# Lexora — Open Source & Dictionary Attributions

## 1. Word Lists

Lexora's offline dictionary incorporates public domain and open-source word lists:

### Curated Solution Pool (2,311 Words)
- **Source**: Canonical 5-letter common English vocabulary archive adapted from Grant Sanderson (3Blue1Brown) and open-source Wordle research datasets.
- **License**: MIT License / Public Domain.
- **Modifications**: Filtered for family-friendly, non-offensive, common English words. The initial 176 words preserve Lexora's historical daily puzzle sequence for deterministic backwards compatibility.

### Permitted Guess Vocabulary (12,947 Words)
- **Source**: ENABLE (Enhanced North American Benchmark Lexicon) and SCOWL (Spell Checking Oriented Word Lists) 5-letter word lists.
- **License**: Public Domain / MIT License.
- **Modifications**: Uppercased, normalized to exactly 5 alphabetical characters, de-duplicated, and validated offline.

---

## 2. Core Dependencies & Libraries

Lexora is built using the following open-source frameworks:
- **React Native & React**: MIT License (Meta Platforms, Inc.)
- **Expo Framework**: MIT License (650 Industries, Inc.)
- **React Native Reanimated**: MIT License (Software Mansion)
- **AsyncStorage**: MIT License (React Native Community)
- **Expo Haptics, Notifications, Blur, Clipboard, Splash Screen**: MIT License (Expo)
