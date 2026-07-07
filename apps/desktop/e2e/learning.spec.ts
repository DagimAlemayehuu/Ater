import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Core Learning Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Inject Tauri Mock Bridge
    const mockPath = path.resolve(__dirname, 'mocks/tauri.js');
    const mockCode = fs.readFileSync(mockPath, 'utf8');
    await page.addInitScript(mockCode);

    // 2. Mock Sidecar API (FastAPI)
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/academics/dashboard')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            courses: [{ id: 'cs101', title: 'Computer Science', semester: 'Semester I', status: 'Active' }],
            study_sessions: [
              {
                id: 'hub1',
                title: 'Computer Science Hub',
                course: 'Computer Science',
                status: 'Active',
                path: 'database/study planner/Computer_Science_Hub.md',
                source_job_id: 'job1'
              }
            ],
            assignments: [],
            exams: [],
            semesters: [{ title: 'Semester I', status: 'Active' }]
          })
        });
      } else if (url.includes('/obsidian/read')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: '# Computer Science Hub\n\n[[DSA Intro]]\n\n```interactive-quiz\n[]\n```',
            metadata: { title: 'Computer Science Hub', type: 'hub', hub: 'Computer Science Hub' }
          })
        });
      } else if (url.includes('/ater/tutor-status') || url.includes('/ater/tutor-session-by-hub')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session_id: 'sess1',
            current_note_path: 'database/study planner/Computer_Science_Hub/DSA_Intro.md',
            roadmap: [
              { title: 'DSA Intro', path: 'database/study planner/Computer_Science_Hub/DSA_Intro.md', status: 'current' }
            ],
            curriculum: ['database/study planner/Computer_Science_Hub/DSA_Intro.md'],
            active_note_unlocks: ['database/study planner/Computer_Science_Hub/DSA_Intro.md'],
            completed_notes: []
          })
        });
      } else if (url.includes('/ater/generate-interactive-quiz')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            questions: [
              {
                id: 'q1',
                type: 'mcq',
                question: 'What is O(n)?',
                options: { 'Linear': 'Linear', 'Quadratic': 'Quadratic' },
                answer: 'Linear',
                explanation: 'Linear time complexity.'
              }
            ]
          })
        });
      } else if (url.includes('/obsidian/list')) {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ files: [] })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
      }
    });

    // 3. Bypass onboarding and activation via mock store
    const mockStore = {
      isActivated: true,
      isProgramConfigured: true,
      appMode: 'beta',
      displayName: 'Test Student',
      obsidianVaultPath: '/mock/vault',
    };

    await page.addInitScript((value) => {
      window.localStorage.setItem('ater_mock_store', JSON.stringify(value));
      // Mock offline to bypass Supabase check in AuthProvider
      Object.defineProperty(navigator, 'onLine', { get: () => false });
    }, mockStore);

    await page.goto('/#/academic');
    // Wait for the app to initialize
    await page.waitForLoadState('networkidle');
  });

  test('completes interactive quiz through roadmap', async ({ page }) => {
    // 1. We should be on the Academic Dashboard.
    // Sometimes the mock data takes a second to load.
    await expect(page.locator('text=COURSES')).toBeVisible({ timeout: 15000 });

    // 2. Open Courses tab
    await page.getByRole('button', { name: 'COURSES' }).click();

    // 3. Find and click a course card.
    // Even if it uses Demo data (CS 201), we just want to proceed.
    const courseCard = page.locator('[data-tour^="course-card-"]').first();
    await expect(courseCard).toBeVisible({ timeout: 10000 });
    await courseCard.click();

    // 4. Open Hub from card - navigate to Obsidian
    const continueBtn = page.locator('button').filter({ hasText: 'CONTINUE LESSON' }).first();
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 5. Now on Obsidian page. Wait for it to load.
    // If it's the real Obsidian page, it has an h1 or some indicator.
    await page.waitForSelector('main-editor', { state: 'attached', timeout: 10000 }).catch(() => {});

    // 6. Enter the interactive Learning Workspace.
    // The button "Continue Lesson" should be in the main content.
    const enterWorkspaceBtn = page.locator('button').filter({ hasText: 'Continue Lesson' }).first();
    await expect(enterWorkspaceBtn).toBeVisible({ timeout: 10000 });
    await enterWorkspaceBtn.click();

    // 7. Navigate through roadmap in LearningWorkspace
    // Roadmap items appear in the sidebar/map.
    const roadmapItem = page.locator('button').filter({ hasText: /DSA Intro|Binary Search|Intro/i }).first();
    await expect(roadmapItem).toBeVisible({ timeout: 15000 });
    await roadmapItem.click();

    // 8. The lesson note should load. If it has a quiz block, it renders "Start Practice".
    const startPracticeBtn = page.locator('button').filter({ hasText: /Start Practice/i }).first();
    await expect(startPracticeBtn).toBeVisible({ timeout: 15000 });
    await startPracticeBtn.click();

    // 9. Interact with the quiz
    await expect(page.getByText(/What is|Question|Recall/i)).toBeVisible({ timeout: 10000 });

    // Attempt to click an option and check
    const option = page.locator('button').filter({ hasText: /Linear|Correct|True/i }).first();
    await option.click();

    const checkBtn = page.locator('button').filter({ hasText: 'Check' });
    if (await checkBtn.isVisible()) {
        await checkBtn.click();
    }

    // Finish session if possible
    const nextOrFinishBtn = page.locator('button').filter({ hasText: /Next Question|Finish|View Score/i }).first();
    await expect(nextOrFinishBtn).toBeVisible({ timeout: 10000 });
    await nextOrFinishBtn.click();

    // Verify completion
    await expect(page.getByText(/Challenge Complete|Score|Result/i)).toBeVisible();
  });
});
