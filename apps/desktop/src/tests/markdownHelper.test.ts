import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  serializeFrontmatter,
  updateProperty,
  deleteProperty,
  toggleChecklistLink,
} from '../lib/markdownHelper';

describe('markdownHelper', () => {
  describe('parseFrontmatter', () => {
    it('parses valid frontmatter and separates body content', () => {
      const content = `---\ntitle: "My Note"\nread: true\ndifficulty: 3\ntags:\n - "math"\n - "geometry"\n---\n\nThis is the body content.\n`;
      const parsed = parseFrontmatter(content);
      
      expect(parsed.metadata.title).toBe('My Note');
      expect(parsed.metadata.read).toBe(true);
      expect(parsed.metadata.difficulty).toBe(3);
      expect(parsed.metadata.tags).toEqual(['math', 'geometry']);
      expect(parsed.body).toBe('This is the body content.\n');
    });

    it('returns empty metadata if frontmatter is missing', () => {
      const content = `This is a simple note.\nNo yaml here.`;
      const parsed = parseFrontmatter(content);

      expect(parsed.metadata).toEqual({});
      expect(parsed.body).toBe(content);
    });

    it('parses empty or empty-string properties correctly', () => {
      const content = `---\nempty_prop:\ntags:\n - ""\n---\nBody`;
      const parsed = parseFrontmatter(content);

      expect(parsed.metadata.empty_prop).toEqual('');
      expect(parsed.metadata.tags).toEqual(['']);
    });
  });

  describe('serializeFrontmatter', () => {
    it('serializes a record back to valid frontmatter block', () => {
      const meta = {
        title: 'Serialized Title',
        read: false,
        level: 1.5,
        tags: ['one', 'two'],
      };

      const result = serializeFrontmatter(meta);
      expect(result).toContain('title: "Serialized Title"');
      expect(result).toContain('read: false');
      expect(result).toContain('level: 1.5');
      expect(result).toContain('tags:\n - "one"\n - "two"');
    });

    it('returns empty string if metadata is empty', () => {
      expect(serializeFrontmatter({})).toBe('');
    });
  });

  describe('updateProperty', () => {
    it('surgically adds a new property to a note', () => {
      const content = `---\ntitle: "Initial Title"\n---\nBody content here`;
      const updated = updateProperty(content, 'read', true);

      const parsed = parseFrontmatter(updated);
      expect(parsed.metadata.title).toBe('Initial Title');
      expect(parsed.metadata.read).toBe(true);
      expect(parsed.body).toBe('Body content here');
    });

    it('surgically updates an existing property case-insensitively', () => {
      const content = `---\nRead: false\n---\nBody content`;
      const updated = updateProperty(content, 'read', true);

      const parsed = parseFrontmatter(updated);
      expect(parsed.metadata.Read).toBe(true);
      expect(parsed.metadata.read).toBeUndefined(); // Kept original casing
    });
  });

  describe('deleteProperty', () => {
    it('deletes an existing property case-insensitively', () => {
      const content = `---\ntitle: "To Keep"\nTo_Delete: "Bye"\n---\nBody`;
      const updated = deleteProperty(content, 'to_delete');

      const parsed = parseFrontmatter(updated);
      expect(parsed.metadata.title).toBe('To Keep');
      expect(parsed.metadata.To_Delete).toBeUndefined();
    });

    it('strips frontmatter block completely if all properties are deleted', () => {
      const content = `---\ntemp: 1\n---\nBody`;
      const updated = deleteProperty(content, 'temp');

      expect(updated.trim()).toBe('Body');
    });
  });

  describe('toggleChecklistLink', () => {
    it('updates checklist checkbox matching the note link', () => {
      const content = `Some intro text.\n- [ ] Review [[math_note]] concept.\n- [x] Check [[history_note]] date.\nOther details.`;
      
      const res = toggleChecklistLink(content, 'math_note', true);
      expect(res.updated).toBe(true);
      expect(res.content).toContain('- [x] Review [[math_note]] concept.');

      const res2 = toggleChecklistLink(content, 'history_note', false);
      expect(res2.updated).toBe(true);
      expect(res2.content).toContain('- [ ] Check [[history_note]] date.');
    });

    it('returns original content with updated=false if no link matches', () => {
      const content = `- [ ] Check [[science_note]] detail.`;
      const res = toggleChecklistLink(content, 'math_note', true);
      expect(res.updated).toBe(false);
      expect(res.content).toBe(content);
    });
  });
});
