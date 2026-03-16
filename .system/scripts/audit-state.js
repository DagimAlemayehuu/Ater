const fs = require('fs');
const path = require('path');

const tasksPath = path.join(__dirname, '../state/TASKS.md');
const statePath = path.join(__dirname, '../state/STATE.md');

function audit() {
  if (!fs.existsSync(tasksPath) || !fs.existsSync(statePath)) {
    console.log('State or Tasks file missing. Skipping audit.');
    return;
  }

  const tasksContent = fs.readFileSync(tasksPath, 'utf8');
  const stateContent = fs.readFileSync(statePath, 'utf8');

  const totalTasks = (tasksContent.match(/- \[ \]/g) || []).length + (tasksContent.match(/- \[x\]/g) || []).length;
  const completedTasks = (tasksContent.match(/- \[x\]/g) || []).length;
  const percentComplete = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  console.log(`--- STATE AUDIT ---`);
  console.log(`Tasks: ${completedTasks}/${totalTasks} (${percentComplete}%)`);

  // Simple heuristic for phase verification
  if (completedTasks > 0 && stateContent.includes('phase: initialization')) {
    console.warn('WARNING: Tasks are completed but STATE.md still says "initialization". Update STATE.md.');
  }

  if (percentComplete === 100 && !stateContent.includes('status: complete')) {
    console.warn('NOTICE: All tasks checked. Ensure STATE.md is updated to reflecting completion/handover.');
  }

  console.log(`-------------------`);
}

audit();
