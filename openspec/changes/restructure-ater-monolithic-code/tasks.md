## 1. React Hook Fix

- [ ] 1.1 Move `useMemo` and `useEffect` hooks above early return block in `UnifiedSandboxViewer.tsx`
- [ ] 1.2 Use optional chaining (`activeArtifact?.id`, etc.) to prevent null property access errors

## 2. FastAPI PDF.js static assets refactoring

- [ ] 2.1 Decode base64 strings from `assets_data.py` and write them as raw static files (js, css, workers) to a new static directory
- [ ] 2.2 Delete `assets_data.py` file to remove the 1.9 MB source code bloat
- [ ] 2.3 Modify `src/api/main.py` asset routes to stream static files from disk or use static files middleware

## 3. Extract Domain Matrix from agents.py

- [ ] 3.1 Create `domain_matrix.yaml` configuration file with contents of `DOMAIN_MATRIX` and `DYNAMIC_DOMAIN_MATRIX`
- [ ] 3.2 Update `agents.py` to load matrices from `domain_matrix.yaml` at startup instead of hardcoding them
- [ ] 3.3 Verify that agents continue to load correct personas and rules

## 4. Split backend service.py monolith

- [ ] 4.1 Extract PDF extraction fallbacks into `pdf_extractor.py` and import in `service.py`
- [ ] 4.2 Extract SRS logic and DB sync into `srs_engine.py`
- [ ] 4.3 Extract quiz/practice generation into `quiz_builder.py`
- [ ] 4.4 Extract session caching and serialization into `session_store.py`
- [ ] 4.5 Refactor `service.py` to be a facade delegating to the extracted submodules

## 5. Split frontend practice.tsx route file

- [ ] 5.1 Extract nested views (Dashboard, History, Configurator, Session, Results) into standalone components
- [ ] 5.2 Extract state machine and data fetching into a custom React hook `usePracticeConfig`
- [ ] 5.3 Import subcomponents and hook in `practice.tsx` and verify dashboard functionality

## 6. Verification and testing

- [ ] 6.1 Run test suite `uv run pytest` to ensure all 162 backend tests pass
- [ ] 6.2 Run desktop build command to ensure TypeScript types compile cleanly
- [ ] 6.3 Manually verify that the React Hooks crash is resolved on app load
