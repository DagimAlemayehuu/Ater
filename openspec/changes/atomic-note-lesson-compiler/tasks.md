## 1. Markdown Parsing & Section Extraction

- [ ] 1.1 Implement a parser to read an Atomic Note and split it into its four canonical sections (`Mental Model`, H1, H2, and `The Proving Grounds`).
- [ ] 1.2 Implement robust fallback handling for missing or malformed sections so the compiler does not fail.

## 2. Navigation Resolver

- [ ] 2.1 Implement navigation resolution: read the parent Chapter and Hub files to identify previous note, next note, and parent hub path.
- [ ] 2.2 Implement fallback handling when the parent Chapter or Hub file is missing (gracefully omit links).

## 3. HTML Compiler & Variants

- [ ] 3.1 Create the self-contained HTML template containing embedded, offline-runnable CSS with system light/dark theme support.
- [ ] 3.2 Implement the `simple` variant layout (brief summaries, progressive definitions).
- [ ] 3.3 Implement the `deep` variant layout (complete text details).
- [ ] 3.4 Implement the `cram` variant layout (active recall, high-yield highlights).
- [ ] 3.5 Implement the `exam` variant layout (assessments, hidden explanations until answered).
- [ ] 3.6 Ensure the raw markdown source of the note is embedded inside the HTML under `<script type="text/markdown" id="raw-markdown-source">`.

## 4. Compiler Service & API Integration

- [ ] 4.1 Implement `AterLessonCompiler` service class to coordinate note parsing, navigation, compilation, and file writing.
- [ ] 4.2 Implement note frontmatter updater to save generated paths under `lesson_variants`.
- [ ] 4.3 Add a FastAPI endpoint `POST /api/ater/lesson/compile` to trigger compilation.

## 5. Headless Backend Tests

- [ ] 5.1 Add unit tests for markdown section extraction and navigation resolution.
- [ ] 5.2 Add unit tests for HTML layout variants, verifying content structure and CSS embedding.
- [ ] 5.3 Add integration tests in a temporary vault verifying end-to-end compilation, file writing under `lessons/`, and frontmatter updates.
- [ ] 5.4 Ensure all tests run headlessly, require zero network access or live AI calls, and pass successfully using `pytest`.

## 6. Verification & Validation

- [ ] 6.1 Run `openspec validate atomic-note-lesson-compiler` and resolve any validation issues.
- [ ] 6.2 Verify that no tests open a Tauri window or visible browser.
- [ ] 6.3 Verify the old Ater Architect pipeline remains intact.
