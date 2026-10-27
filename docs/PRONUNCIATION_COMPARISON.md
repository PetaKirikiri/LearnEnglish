# Shared word pronunciation comparison

`src/classroom/pronunciation/PronunciationComparison.tsx` belongs to the four-slot education engine: `SentenceLine` delegates to the shared `SentenceMatrix`, whose `MatrixExplanation` renders the comparison for every selected word. Keep it outside any grammar-profile guard so all four slots get the component.

The classroom explanation is the design reference. Open `/classroom/index.html?lesson=2`, then click a sentence slot to review it in context. Preserve its slot colours, illustrated header, white reference sheet, typography and back navigation. Do not mount this feature in the legacy `learning/WordHelp` popup or recreate that popup’s dark theme. See `AGENTS.md` for the education-view boundary.

The first release is an editable teaching sketch, as requested. These graphs are not measured recordings, phonetic assessment, or a claim about all Thai speakers. Pitch dots and emphasis are independent. The supplied computer example is the user's illustrative melody; English middle-syllable emphasis agrees with https://dictionary.cambridge.org/pronunciation/english/computer. Pitch/stress must not be conflated: https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/q-s/stress.

- Thai-style and English examples each have their own syllable spelling, point count, pitch values (0–1) and optional emphasis index.
- All current lesson-one/two vocabulary and structural words have spelling-based teaching chunks. These are not IPA. Unknown words remain whole until edited, rather than guessing syllable boundaries.
- Known classroom English words have an illustrative stress guide: the curve rises from a lead-in to the stressed syllable, then falls through the following syllables. All syllable labels have equal boldness and colour so the complete word remains readable. This is not a measured pitch trace or the only possible intonation. Only computer has the teacher-supplied Thai contour; other Thai curves remain unset. Thai labels are editable phonetic approximations of the English sound, not the Thai translation. Unknown spellings use an ellipsis until authored. Never derive a national-accent curve mechanically from an English-to-Thai transliteration.
- Choose Edit in Pronunciation, drag/keyboard-adjust dots, enter hyphen-separated syllables, select emphasis, Save or Cancel. Keyboard Up/Down adjusts 5%; Home/End selects minimum/maximum. Graphs use the same pitch scale.
- Sketches are stored per normalized word in browser localStorage. They survive reloads on that browser; they do not sync between teachers or phones. A future shared-authoring store should replace `readGuide/saveGuide` without changing the renderer.
- No audio playback or generated voices are implied by these sketches. Add paired recordings with actual syllable timing when available; do not animate invented timing as measured pronunciation.

## Visual hierarchy

The section is always visible below the word usage information and before word selection, including for words with no data. Use the shared `EducationSectionHeading`; do not turn it back into a collapsed disclosure. Use the lesson’s Fredoka/Avenir/Thai typography, white surfaces, rounded controls, and existing red/blue accents. Flags identify the side-by-side Thai sound spelling and English stress guide; keep graphs compact, with no dark-popup theme.

Thai spelling can encode tone through consonant class, syllable structure, vowel length and marks; an approximate English respelling does not establish a learner’s actual intonation. Reference: https://seasite.niu.edu/thai/tones/default.htm. English stress guidance: https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/q-s/stress. Preserve any teacher-saved sketch when changing defaults.
