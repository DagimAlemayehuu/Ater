import { describe, expect, it } from 'vitest'

import { buildLessonRoadmap, getSimpleLessonPath } from '@/lib/lessonRoadmap'

describe('lessonRoadmap', () => {
  it('groups curriculum paths by chapter and labels atomic notes clearly', () => {
    const roadmap = buildLessonRoadmap({
      current_note_path: 'database/General/Git/01_Git_Orientation_And_Mental_Model/Why_Git_Exists.md',
      completed_notes: ['database/General/Git/01_Git_Orientation_And_Mental_Model/What_Git_Is.md'],
      active_note_unlocks: [
        'database/General/Git/01_Git_Orientation_And_Mental_Model/What_Git_Is.md',
        'database/General/Git/01_Git_Orientation_And_Mental_Model/Why_Git_Exists.md',
      ],
      curriculum: [
        'database/General/Git/01_Git_Orientation_And_Mental_Model/What_Git_Is.md',
        'database/General/Git/01_Git_Orientation_And_Mental_Model/Why_Git_Exists.md',
        'database/General/Git/02_Git_Core_Vocabulary/Essential_Git_Terms.md',
      ],
    })

    expect(roadmap).toHaveLength(2)
    expect(roadmap[0].title).toBe('Git Orientation And Mental Model')
    expect(roadmap[0].items.map(item => item.title)).toEqual(['What Git Is', 'Why Git Exists'])
    expect(roadmap[0].items.map(item => item.status)).toEqual(['completed', 'active'])
    expect(roadmap[1].title).toBe('Git Core Vocabulary')
    expect(roadmap[1].items[0].status).toBe('locked')
  })

  it('resolves note paths to compiled simple lesson paths', () => {
    expect(getSimpleLessonPath('database/General/Git/01_Foundations/Git_Commit_Graph.md')).toBe(
      'database/General/Git/01_Foundations/lessons/Git_Commit_Graph.simple.html',
    )
  })
})
