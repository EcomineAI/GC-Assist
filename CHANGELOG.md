# Changelog

All notable changes to the **GC Assist** project will be documented in this file.

## [v1.4.0-WIP] - 2026-05-04

### Added
- **Premium About Sheet:** Replaced the static About page with a sleek, slide-up "Slide Tab" (Bottom Sheet) available on both mobile and desktop.
- **"More" Navigation Menu:** Introduced a compact hamburger menu on mobile to house secondary links (Updates, About), keeping the main navigation focused on Chat, Explore, and Settings.
- **Advanced Mode:** Added a "Nerd Stuff" toggle in settings to hide technical data like token counts and model names for a cleaner experience.
- **Theme-Aware Logos:** The GC logo now dynamically switches colors to match the active theme (Green, Blue, or Dark Mode) across the entire app.
- **3-Stop Font Size Slider:** Replaced the font toggle with a precision slider for Small, Medium, and Large text scaling.
- **Token Limit Expansion:** Increased the maximum session token limit to **20,000 (20k)** for significantly longer conversation context.

### UI/UX Refinements
- **Compact Mobile Interface:** Scaled down headings, icons, and logo dimensions for better information density on small screens.
- **"Floating" Chat Input:** The mobile chatbox now features a transparent background that becomes solid only when session limits are reached, maximizing readability and aesthetic appeal.
- **Refined Bottom Nav:** Reduced the height of the bottom navigation bar to 56px to reclaim vertical screen space.
- **Advanced Control Relocation:** Moved technical settings like AI Temperature and detailed model identifiers into the new Advanced section.

- **High-Concurrency Support:** Implemented a "Smart Retry" mechanism for the Groq API. The app now detects rate limits (429) and automatically retries requests with a randomized delay to handle multiple students chatting at once.
- **Dynamic Load Balancing:** Expanded the AI model pool to include Llama 3.3, Llama 3.1, Mixtral, and Gemma. The system now automatically rotates between these models if one becomes congested or hit by limits.
- **SPA Routing Fix:** Added `vercel.json` to ensure smooth navigation and prevent "404 Not Found" errors when refreshing the page on Vercel.
- **Onboarding Polish:** The Terms & Conditions modal is now suppressed on Login, Signup, and Password Reset pages to provide a friction-less entry for new users.

### Fixed & Improved
- **Staggered Background Retries:** Added randomized "jitter" to API retries, preventing multiple devices from "clashing" when hitting the server at the same time.
- **Case-Insensitive Admin Auth:** Fixed an issue where "Admin@gmail.com" was not recognized if entered in lowercase; the system now handles all email casing correctly.

---


## [v1.3.0] - 2026-05-03

### Added
- **Admin Dashboard:** A dedicated secure control panel for `Admin` to view all user feedback, conversation history (Q&A context), and system statistics.
- **Per-Account Private History:** Chat history is now linked to individual user IDs, ensuring complete privacy when multiple students share a device.
- **Enhanced Password Security:** Signup now requires an 8-character minimum password containing both letters and numbers.
- **Password Visibility Toggle:** Added "Eye" icons to all login and signup password fields for better UX.

### Fixed & Improved
- **Robust Database Security:** Implemented strict Row Level Security (RLS) policies ensuring only the Admin can see all feedback, and users can only access their own.
- **Link Navigation Fixes:** Enforced HTTPS protocol on Gordon College source links and intercepted AI markdown links to trigger the external confirmation modal safely.
- **Feedback System Overhaul:** Feedback history now stores and displays the full conversation context (User Question + AI Response) to provide meaning to Likes/Dislikes.
- **History Wipe Improvement:** "Clear Chat History" now completely resets both the active view and the sidebar sessions history.
- **Missing Asset Fix:** Resolved an app crash caused by a missing `ExternalLink` icon import during modal display.
- **Admin Routing:** Case-insensitive email checking to ensure smooth redirection to the admin panel upon login.

---


## [v1.2.0] - 2026-04-30

### Added
- **Multi-Provider AI Fallback:** Automatic rotation between local LM Studio and Groq API models to ensure 100% availability.
- **Advanced TTS Engine:** Custom controls for Voice Speed and Pitch with persistent settings.
- **Theme Color Engine:** New Green (GC Branding) and Blue themes for Light Mode, including subtle background tints and immersive surface coloring.
- **Dynamic Branding:** Auto-swapping logos (Green/Blue/Default) based on the active color theme.
- **Accessibility Hub:** Integrated settings for Large Text, High Contrast mode, and Reduced Motion support.
- **Cross-Platform Tooltips:** Premium, mobile-compatible tooltips (long-press for touch, hover for desktop) using Framer Motion glassmorphism.
- **Session Auto-Save:** Continuous real-time persistence of active chats, history, and provider preferences—never lose a conversation on refresh.
- **Security Confirmation:** External link modal that warns and confirms before navigating to the official college website.

### Fixed & Improved
- **TTS Visualizer Failsafe:** Implemented background monitoring to prevent the voice animation from getting "stuck."
- **Settings UI Polish:** Fixed layout breakages caused by tooltips, ensuring perfect alignment on all screen sizes.
- **Logic Simplification:** Reverted TTS animation to instant-trigger for a snappier, more responsive user experience.
- **Factory Reset:** Added a "Reset All Settings" option to easily wipe the user cache and restore defaults.

---


## [v1.0.10] - 2026-04-18

### Added
- **True RAG (Vector Embeddings):** Semantic search using `@xenova/transformers` and local sentence-transformers.
- **Server-Sent Events (Streaming):** Real-time AI response streaming for an instant typing effect.
- **Rolling Conversation Summary:** Long-term memory logic via hidden background summarizations.
- **Synchronized Web Crawling:** Async `crawl.py` via `aiohttp` to massively speed up campus ingestion.
- **Markdownify Preservation:** The crawler now preserves college website formats, tables, and hyperlinks.

### Changed
- **Precise Tokenization:** Token constraints are now fully monitored using exact calculations via `gpt-tokenizer`.
- **Semantic Chunking:** Knowledge base now splits pages strategically to retain relevant context windows.

---

## [v1.0.2] - 2026-04-10

### Added
- **AI Suggested Follow-ups:** The AI now dynamically generates 2-3 logical follow-up questions at the end of each response.
- **Interactive UI Pills:** Added a stealth regex parser to extract AI follow-up suggestions and render them as clickable, floating wrapper buttons (`.suggested-q-pill`) below the source tags.
- **Direct Image Rendering:** The Academic Calendar is now explicitly defined as an image URL in the `knowledge_base.txt`, allowing the AI to natively render the `.jpg` inside the chat without iframes.

### Changed
- **Default Theme State:** Overrode React's default `matchMedia` system preference so the app strictly boots in Light Mode on the very first visit.
- **Model Prompt Layout:** Moved the "Follow-up" and "Boundary rules" to the absolute bottom of the system payload, preventing small local models (`Qwen2.5-3B-Instruct`) from experiencing "Lost in the Middle" context amnesia. 

### Fixed
- **Strict Guardrail Sycophancy:** Softened the refusal logic template to prevent 2B/3B parameter models from hallucinating the "I'm sorry" refusal text when answering valid preset questions.
- **Placeholder Literalism:** Swapped literal placeholder brackets (`- [Question 1]`) in the prompt rules for real structural examples, preventing the AI from literally typing the word "Question 1".

---

## [v1.0.0] - 2026-04-09

### Added
- **Session Manager:** Full multi-session history archiving. Current chats can be saved as view-only historical documents.
- **History Modal:** Implemented a centered, responsive `/history` UI sheet with interactive previews.
- **Easter Egg Injection:** AI is now structurally aware that it was developed by June Vic M. Abello (EcomineAI) and will inject GitHub profile credentials and images upon inquiry.
- **Agent Interruption Engine:** Wired an `AbortController` deeply into the fetch pipeline, introducing a smooth 'Stop / Square' button to instantly cut AI processing cycles to save tokens.
- **Cloud Delivery System:** Deployed `cloud.py`, executing parallel Cloudflare tunnels that map remote UI traffic securely into the host's local LM Studio server.

### Changed
- **UI Maturity:** Stripped all experimental Emojis from loading strings and replaced them with polished `lucide-react` animated components (Search, Brain, Edit3).
- **Token Constraints:** Imposed a strict 6,000 maximum session token ceiling to maintain fast LM Studio operation, paired with retroactive context-trimming algorithms. 
- **Thinking UI:** Model reasoning payloads (`<think>`) are now neatly tucked inside collapsable markdown blocks.

### Fixed
- **Double Question Bug:** Patched an issue where React 19's Strict Mode caused the 'Explore intent' queries to rapid-fire twice by locking it with a `location.key` guard.
- **Responsive Hovers:** Overhauled responsive boundaries with `overflow: hidden` to ensure hover effects respect strict container box-radii on mobile viewports.
