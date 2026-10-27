# Classroom layout study

The current direction combines the supplied fixed-navigation reference with the restrained typography and presentation hierarchy of Tesla's website. The approved classroom shell now presents Lesson 1, “Where is the…?”, using the existing holiday vocabulary, example renderer and audio.

## Current presentation

- A blue icon rail at approximately one eighth of the desktop width controls one continuous reading area. There are no floating panels or scenic background objects.
- The desktop rail fills the viewport. Opening Learn makes room for three nested notes inside its white section; the brand area and neighbouring stages smoothly yield space. Clicking Learn again folds them away, and selecting another stage closes them. On phones the submenu expands beneath the four main icons. Direct selection replaces the adjacent lesson without a Next-button sequence.
- Fuller Fredoka lettering gives the sidebar labels the softer character of the supplied reference. The active class stage becomes a white tile with blue icon and text. The parent icon and label stay centred throughout expansion. Nested notes sit directly beneath that compact parent header, using smaller labels, a rounded connecting line and a blue dot. The selected section is one flat white area, with no rounded cards or submenu pills. Warmth comes from the letterforms, generous text rows, parent-to-child spacing and motion. The selected child is blue text with a small dot. A slower single interruptible damped spring drives the occupied space, parent height, chevron and submenu reveal; separate flex and grid transitions are avoided. The expanded section grows only to fit its contents; extra height belongs to the brand and the other stages. The old horizontal note tabs are removed.
- “The idea” uses one full-width blue lesson header and two defined white teaching areas: the question word with aligned Thai and audio, and a familiar Thai situation. Hotel/toilet/taxi choices change only the thing being located; Where stays fixed. Section labels are brief and explanatory paragraphs are removed. This presentation is being reviewed on The idea before carrying it to the remaining lesson panels. The approved sidebar is unchanged.
- White, graphite and light grey supply the reading surfaces. The blue rail follows the supplied sidebar reference, with a single white S set directly on the blue as the brand mark. There is no illustrated avatar, app tile or caption at the top; the accessible brand name remains.
- Recall uses the shared blue lesson header and one white vocabulary area divided into three columns (stacked on phones). The header has one show/hide-translations control; each word also reveals independently. Repeated lesson titles, introductory instructions and the closing caption are removed. Recall introduces hotel, toilet and taxi. Learn introduces Where, then the four-part frame and missing-is/missing-the contrasts. The example offers the existing 20 holiday words on demand. Practise contains listening judgements and Thai meaning contrasts; Review returns to the complete frame and links to the race.
- Text and examples respond to the content area's width and height. On phones, the rail becomes four compact icon tabs below the brand; learning notes remain directly above the content.
- Returning to Learn restores the last learning note. The chosen vocabulary is retained across lesson stages. Reduced-motion preferences disable selection animation.
- Examples reuse `ExampleLanguage` and `SentenceSlot`: English, contextual Thai beneath each unit, then the full Thai sentence. Practice hides example text and translations until an answer is selected. Audio uses the existing recorded holiday files.
- Worked example presents a compact four-unit sentence, sized by its words rather than stretched columns. Red/green/blue lettering keeps the requested colourful palette. A yellow underline and chevron mark the editable noun; it has the same type size and baseline as the other words. Decorative role icons and the large noun card are removed. Contextual Thai stays aligned immediately below each word; full Thai and playback sit directly underneath without a separating rule. The vocabulary tray retains direct word selection and matching audio. The sidebar remains unchanged.
- This is teacher-controlled lesson presentation, with direct section/question selection. It does not alter learner progression, saved notes, homework or live-race settings.

Reference inspected: https://www.tesla.com/model3

The user's latest attached image informed the stable rail and connected content area, rather than character artwork or a cluster of dashboard cards.

## Files

- `../../classroom/index.html`: Vite HTML entry with the approved navigation and spring animation, served at the same `/classroom/index.html` URL.
- `../../src/classroom/lesson.tsx`, `lesson.css` and `lessonOne.ts`: lesson presentation, vocabulary selection and practice, reusing the shared content/components.
- Vite builds both the existing app entry and the classroom entry; the static assets and sidebar stylesheet remain in `public/classroom/`.
- `classroom.css`: the current complete layout and visual treatment.
- `theme-wild.css` and woodland/Mario artwork: retained earlier studies, no longer loaded by the classroom.

The previous woodland art's built-in generation prompts are retained in `assets/woodland-prompts.json`.
