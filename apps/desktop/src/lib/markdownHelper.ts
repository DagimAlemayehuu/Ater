export interface ParsedMarkdown {
  metadata: Record<string, any>;
  body: string;
}

/**
 * Parses Obsidian-compliant YAML frontmatter and the content body.
 */
export function parseFrontmatter(content: string): ParsedMarkdown {
  if (!content.startsWith('---\n')) {
    return { metadata: {}, body: content };
  }

  const endIdx = content.indexOf('\n---', 4);
  if (endIdx === -1) {
    return { metadata: {}, body: content };
  }

  const frontmatterStr = content.slice(4, endIdx);
  const body = content.slice(endIdx + 4).trimStart();

  const metadata: Record<string, any> = {};
  const lines = frontmatterStr.split('\n');
  let currentKey: string | null = null;
  let currentArray: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // List item parsing
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      if (currentKey) {
        const val = trimmed.slice(1).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        currentArray.push(val);
        metadata[currentKey] = currentArray;
      }
    } else {
      // Clear array context when switching keys
      currentArray = [];
      currentKey = null;

      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        const rawVal = line.slice(colonIdx + 1).trim();

        if (rawVal === '') {
          currentKey = key;
          metadata[key] = '';
        } else {
          let val: any = rawVal;
          if (rawVal.toLowerCase() === 'true') {
            val = true;
          } else if (rawVal.toLowerCase() === 'false') {
            val = false;
          } else if (!isNaN(Number(rawVal)) && rawVal !== '') {
            val = Number(rawVal);
          } else {
            // Strip surrounding quotes
            val = rawVal.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
          }
          metadata[key] = val;
        }
      }
    }
  }

  return { metadata, body };
}

/**
 * Serializes a metadata record back into a YAML frontmatter block.
 */
export function serializeFrontmatter(metadata: Record<string, any>): string {
  if (Object.keys(metadata).length === 0) {
    return '';
  }

  const yamlLines = Object.entries(metadata).map(([k, v]) => {
    if (v === null || v === undefined || v === '') {
      return `${k}: ''`;
    }
    if (typeof v === 'boolean' || typeof v === 'number') {
      return `${k}: ${v}`;
    }
    if (Array.isArray(v)) {
      return `${k}:\n${v.map((i: any) => ` - "${String(i)}"`).join('\n')}`;
    }
    const s = String(v);
    if (s.toLowerCase() === 'true' || s.toLowerCase() === 'false') {
      return `${k}: ${s.toLowerCase()}`;
    }
    return `${k}: "${s}"`;
  });

  return `---\n${yamlLines.join('\n')}\n---\n`;
}

/**
 * Surgically adds or updates a frontmatter property key (case-insensitive).
 */
export function updateProperty(content: string, key: string, value: any): string {
  const { metadata, body } = parseFrontmatter(content);
  
  const normalKey = key.toLowerCase();
  const existingKey = Object.keys(metadata).find(k => k.toLowerCase() === normalKey) ?? key;
  metadata[existingKey] = value;

  const prefix = serializeFrontmatter(metadata);
  const separator = prefix ? '\n' : '';
  return `${prefix}${separator}${body.trimStart()}`;
}

/**
 * Surgically deletes a frontmatter property key (case-insensitive).
 */
export function deleteProperty(content: string, key: string): string {
  const { metadata, body } = parseFrontmatter(content);
  
  const normalKey = key.toLowerCase();
  const existingKey = Object.keys(metadata).find(k => k.toLowerCase() === normalKey);
  if (existingKey) {
    delete metadata[existingKey];
  }

  const prefix = serializeFrontmatter(metadata);
  const separator = prefix ? '\n' : '';
  return `${prefix}${separator}${body.trimStart()}`;
}

/**
 * Toggles checkbox lines matching a wikilink destination.
 */
export function toggleChecklistLink(
  content: string,
  targetOrLabel: string,
  isChecked: boolean
): { content: string; updated: boolean } {
  const targetNoteFile = targetOrLabel
    .split('/')
    .pop()
    ?.replace(/\.md$/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .trim() || '';

  let updated = false;
  const lines = content.split('\n');
  const newLines = lines.map((line: string) => {
    const checklistMatch = line.match(/^(\s*[-*]\s+\[)([ xX])(\]\s+)(.*)/);
    if (!checklistMatch) return line;

    const prefix = checklistMatch[1];
    const oldVal = checklistMatch[2];
    const suffix = checklistMatch[3];
    const remainder = checklistMatch[4];

    const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/gi;
    let match;
    let containsTarget = false;

    while ((match = wikilinkRegex.exec(remainder)) !== null) {
      const dest = match[1].trim();
      const destBase = dest.split('/').pop()?.replace(/_/g, ' ').toLowerCase().trim() || '';
      if (destBase === targetNoteFile) {
        containsTarget = true;
        break;
      }
    }

    if (containsTarget) {
      updated = true;
      return `${prefix}${isChecked ? 'x' : ' '}${suffix}${remainder}`;
    }

    return line;
  });

  return { content: newLines.join('\n'), updated };
}
