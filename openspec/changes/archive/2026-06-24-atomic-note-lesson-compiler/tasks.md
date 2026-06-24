## 1. Markdown Parsing & Section Extraction

- [x] 1.1 Implement a parser to read an Atomic Note and split it into its four canonical sections (`Mental Model`, H1, H2, and `The Proving Grounds`).
- [x] 1.2 Implement robust fallback handling for missing or malformed sections so the compiler does not fail.

## 2. Navigation Resolver

- [x] 2.1 Implement navigation resolution: read the parent Chapter and Hub files to identify previous note, next note, and parent hub path.
- [x] 2.2 Implement fallback handling when the parent Chapter or Hub file is missing (gracefully omit links).

## 3. HTML Compiler & Variants

- [x] 3.1 Create the self-contained HTML template containing embedded, offline-runnable CSS with system light/dark theme support.
- [x] 3.2 Implement the `simple` variant layout (brief summaries, progressive definitions).
- [x] 3.3 Implement the `deep` variant layout (complete text details).
- [x] 3.4 Implement the `cram` variant layout (active recall, high-yield highlights).
- [x] 3.5 Implement the `exam` variant layout (assessments, hidden explanations until answered).
- [x] 3.6 Ensure the raw markdown source of the note is embedded inside the HTML under `<script type="text/markdown" id="raw-markdown-source">`.

## 4. Compiler Service & API Integration

- [x] 4.1 Implement `AterLessonCompiler` service class to coordinate note parsing, navigation, compilation, and file writing.
- [x] 4.2 Implement note frontmatter updater to save generated paths under `lesson_variants`.
- [x] 4.3 Add a FastAPI endpoint `POST /api/ater/lesson/compile` to trigger compilation.

## 5. Headless Backend Tests

- [x] 5.1 Add unit tests for markdown section extraction and navigation resolution.
- [x] 5.2 Add unit tests for HTML layout variants, verifying content structure and CSS embedding.
- [x] 5.3 Add integration tests in a temporary vault verifying end-to-end compilation, file writing under `lessons/`, and frontmatter updates.
- [x] 5.4 Ensure all tests run headlessly, require zero network access or live AI calls, and pass successfully using `pytest`.

## 6. Verification & Validation

- [x] 6.1 Run `openspec validate atomic-note-lesson-compiler` and resolve any validation issues.
- [x] 6.2 Verify that no tests open a Tauri window or visible browser.
- [x] 6.3 Verify the old Ater Architect pipeline remains intact.
