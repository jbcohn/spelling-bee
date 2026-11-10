# 🐝 SpellBee - Adaptive Audio Spelling Bee App

A progressive web app (PWA) designed for students preparing for a spelling bee. It speaks each word aloud, checks spelling instantly, provides character-by-character visual feedback, and uses an adaptive spaced-repetition algorithm to re-quiz missed words more frequently until mastered.

---

## 🚀 Quick Start

### Option 1: Run locally in your browser
From the project folder:
```bash
cd /Users/joshcohn/Developer/spelling-bee
python3 -m http.server 8080
```
Then open: [http://localhost:8080](http://localhost:8080) in Chrome, Safari, or Edge.

*(Running via a local HTTP server ensures the Web Speech API and ServiceWorker have full access without local `file://` restrictions).*

### Option 2: Use on Android or iPhone
1. **Local Wi-Fi**: Run the server command above, find your computer's local IP address (e.g. `192.168.1.X:8080`), and open that URL on your phone's Chrome browser.
2. **Instant Web / Free Hosting**: Drop this folder onto GitHub Pages, Vercel, or Netlify.
3. **Install as Native-like App**:
   - On **Android (Chrome)**: Tap the 3-dot menu ➔ **"Add to Home Screen"** or **"Install app"**. It will appear with its own icon and run offline.
   - On **iOS (Safari)**: Tap the Share button ➔ **"Add to Home Screen"**.

---

## 📝 Word List: Handwritten Original vs. Corrected

The app comes preloaded with all **50 words** transcribed and corrected from the handwritten sheet:

| # | Handwritten Note | Corrected Word | Example Sentence |
|---|---|---|---|
| 1 | `medium` | **medium** | The shirt was a size medium. |
| 2 | `spides` | **spiders** | Some spiders spin intricate silk webs. |
| 3 | `giud` | **guide** | The tour guide led us through the historic cavern. |
| 4 | `holliday` | **holiday** | Our family took a wonderful winter holiday trip. |
| 5 | `trouble` | **trouble** | He worked hard to stay out of trouble at school. |
| 6 | `wistle` | **whistle** | The coach blew his loud whistle to stop the play. |
| 7 | `Knit` | **knit** | Grandma taught me how to knit a warm scarf. |
| 8 | `lead` | **lead** | Pencils contain graphite, not actual toxic lead. |
| 9 | `frazzled` | **frazzled** | After the long day, the teacher felt frazzled. |
| 10 | `distance` | **distance** | We could hear thunder rumbling softly in the distance. |
| 11 | `humble` | **humble** | Despite winning first place, she remained humble. |
| 12 | `grupliy` | **gruffly** | 'Don't touch that!' the pirate barked gruffly. |
| 13 | `beasts` | **beasts** | Mythical beasts and dragons roamed through the tale. |
| 14 | `soarce` | **source** | The mountain spring was the source of the clean river. |
| 15 | `remember` | **remember** | Did you remember to pack your spelling notebook? |
| 16 | `hiking` | **hiking** | We wore sturdy boots while hiking up the steep trail. |
| 17 | `narrow` | **narrow** | The bicycle bridge was too narrow for cars. |
| 18 | `mustard` | **mustard** | He put tangy yellow mustard on his hot pretzel. |
| 19 | `library` | **library** | We checked out five books from our local library. |
| 20 | `stout` | **stout** | The ancient fortress was guarded by stout wooden gates. |
| 21 | `finish` | **finish** | He sprinted as fast as he could to finish the race. |
| 22 | `indoors` | **indoors** | When the rain began, the campers played indoors. |
| 23 | `paraid` | **parade** | Brass bands and floats filled the street in the parade. |
| 24 | `sloth` | **sloth** | The three-toed sloth moves very slowly through trees. |
| 25 | `illness` | **illness** | Rest and warm soup helped her recover from illness. |
| 26 | `soared` | **soared** | The golden eagle soared high across the mountain valley. |
| 27 | `dangle` | **dangle** | Be careful not to let your keys dangle over the drain. |
| 28 | `cottage` | **cottage** | Our family spent summer in a cozy seaside cottage. |
| 29 | `barage` | **barrage** | The scientist answered a barrage of rapid questions. |
| 30 | `switch` | **switch** | Don't forget to flip the light switch off. |
| 31 | `tangy` | **tangy** | Fresh lemonade had a delightfully tangy, citrus flavor. |
| 32 | `charming` | **charming** | The quiet bookstore had a warm and charming atmosphere. |
| 33 | `afraid` | **afraid** | The brave puppy was not at all afraid of the dark. |
| 34 | `pennies` | **pennies** | She counted eighty copper pennies from her piggy bank. |
| 35 | `ginger` | **ginger** | Grated fresh ginger gave the tea a warming spicy aroma. |
| 36 | `hospital` | **hospital** | The caring doctors worked tirelessly in the hospital. |
| 37 | `intire` | **entire** | She read the entire chapter book in a single afternoon. |
| 38 | `safety` | **safety** | Fastening your seatbelt is an essential safety habit. |
| 39 | `relax` | **relax** | Deep breaths helped the student relax before going on stage. |
| 40 | `cloak` | **cloak** | The magician wrapped a dark velvet cloak around himself. |
| 41 | `total` | **total** | What was the total score after all five rounds? |
| 42 | `groan` | **groan** | A dramatic groan swept the room when test was announced. |
| 43 | `bamboo` | **bamboo** | Giant pandas eat hundreds of stalks of green bamboo. |
| 44 | `brezee` | **breeze** | A gentle ocean breeze cooled the warm sand. |
| 45 | `seventy` | **seventy** | Grandpa celebrated his birthday with seventy candles. |
| 46 | `smoothly` | **smoothly** | The ice skater glided smoothly across the frozen rink. |
| 47 | `shivering` | **shivering** | Wrapped in a blanket, he sat shivering by the fire. |
| 48 | `pearls` | **pearls** | Divers search underwater for oysters containing pearls. |
| 49 | `rezalt` | **result** | Hard work produced a stellar result at the bee. |
| 50 | `foolish` | **foolish** | It would be foolish to hike without fresh water. |

---

## ✨ Features

1. **Audio-First Practice**:
   - Built-in Web Speech Synthesis speaks each word clearly.
   - **Slower (🐢)** button for deliberate enunciation.
   - **Sentence (💬)** and **Definition (📖)** buttons for context (crucial for homophones like *lead*, *groan*, *soared*).
   - **Hint (💡)** reveals word length and first letter without giving away the full spelling.

2. **Adaptive Spaced Repetition**:
   - Tracks individual word mastery levels (⭐ ⭐ ⭐ = 3 consecutive correct spellings to master).
   - When a word is misspelled, it is immediately flagged as **To Fix** and re-queued to appear again within 1–2 words.
   - Mastered words stay in rotation with very low frequency for retention maintenance.

3. **Immediate Visual Feedback & Muscle Memory Retyping**:
   - Character-by-character visual diff highlights exactly what was wrong (red strikeouts for incorrect letters, yellow highlights for missing letters).
   - When wrong, the student is prompted to type the word correctly once before advancing to reinforce muscle memory.

4. **Custom Word Lists**:
   - Create new lists for any spelling bee, class test, or grade level.
   - Paste words (one per line, comma-separated, or with optional `word | sentence | definition` format).
   - Export and import lists as JSON files.

5. **PWA & Offline Ready**:
   - Works fully offline via Service Worker caching.
   - Installable on Android and iOS home screens like a native mobile app.
