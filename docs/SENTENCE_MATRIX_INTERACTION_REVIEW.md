# Sentence matrix interaction review

Reference: [Nintendo's official Switch HOME menu overview](https://www.nintendo.com/au/support/articles/home-menu-overview/), including its screenshot. Inspected 27 October 2026. The observations below are design judgments from that reference and our component, not Nintendo specifications.

## Why the previous tray felt unlike a console interface

1. **Unstable stage.** The complete sentence/translation/tray block was vertically centred. Opening the tray increased its height and changed the surrounding padding, shifting the four cards by roughly 94 pixels in the observed 610×673 viewport. A selection action moved the thing being edited.
2. **Too many competing containers.** An outer rounded panel, heavy top rule, individual outlines, selected fill and floating controls all competed. The reference separates primary tiles from secondary controls with considerably less enclosing chrome.
3. **Weak selection hierarchy.** Selection relied mostly on a tint/border change. Browsing focus, the currently chosen word and activation needed distinct visible states.
4. **Inconsistent proportions.** Tall word cards, variable label wrapping, compressed edge controls and an oversized detached translation weakened the relationship between the word list and sentence.
5. **Navigation without predictable steps.** Previous/next scrolled a fixed pixel distance. Opening the selected word used `scrollIntoView`, which could also scroll ancestor containers. These are document behaviours, not a controlled horizontal selector.

## Shared-engine changes

- Anchor the sentence at a fixed top position; define card heights for desktop, shorter laptop screens and narrow screens.
- Keep the natural translation in a stable row immediately beneath the sentence, followed by a reserved word dock. Opening/closing or switching dropdowns does not change card geometry.
- Replace the enclosing tray panel with a quiet separator and a regular rail of tiles. Every tile has consistent picture, English and Thai rows.
- Show the chosen word with an outline and checkmark. Keyboard focus has its own ring. Selection is still understandable without colour.
- Keep arrows outside the scrolling content, disable them at the ends, and give close its own location.
- Arrow buttons and left/right keys move focus one enabled word at a time. Home/End go to the boundaries. Activation selects; Escape returns to the originating dropdown. No word changes merely because it is being browsed.
- Scroll only the horizontal rail. The tray fades in with a small 5px movement, without moving the sentence; reduced-motion preferences remove the animation.
- Preserve the established colours, vocabulary artwork, grammatical grouping, explanations and per-lesson settings. No additional instructional copy on the learner screen.

## Verification

Browser measurement at 1024×576: all four cards remain at y=110px and height=224px before and after opening; translation remains at y=344px; the full dock ends at y=564px inside the viewport. Existing feature-switch and lesson-boundary tests plus the added keyboard-navigation test check engine behaviour. Production verification is recorded in the task response.
