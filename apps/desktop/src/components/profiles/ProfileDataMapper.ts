
export interface ProfileField {
    label: string;
    question?: string;
    value: string;
}

export interface ProfileSection {
    title: string;
    fields: ProfileField[];
}

export interface ProfileData {
    title: string;
    sections: ProfileSection[];
    extraContent: string;
}

/**
 * Strip ALL markdown formatting from a string.
 * Removes: **, *, _, ~, `, ##, leading - or * bullets, numbered lists
 */
const stripMarkdown = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/!\[.*?\]\(.*?\)/g, '')       // ![alt](url) -> ""
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')    // [text](url) -> text
        .replace(/\*\*(.+?)\*\*/g, '$1')       // **bold** -> bold
        .replace(/\*(.+?)\*/g, '$1')            // *italic* -> italic
        .replace(/__(.+?)__/g, '$1')            // __bold__ -> bold
        .replace(/_(.+?)_/g, '$1')              // _italic_ -> italic
        .replace(/~~(.+?)~~/g, '$1')            // ~~strike -> strike
        .replace(/`(.+?)`/g, '$1')              // `code` -> code
        .replace(/^#{1,6}\s+/gm, '')            // ## heading -> heading
        .replace(/^>\s+/gm, '')                 // > quote -> quote
        .replace(/^[\s\t]*[-*+]\s+/gm, '')      // - list -> list
        .replace(/^[\s\t]*\d+\.\s+/gm, '')      // 1. list -> list
        .replace(/^-{3,}/gm, '')                // --- -> ""
        .trim();
};

const cleanLabel = (str: string): string => {
    if (!str) return '';
    return stripMarkdown(str)
        .replace(/^\d+[.)]\s*/, '')         // Remove leading "1." or "1)"
        .trim();
};

const cleanValue = (str: string): string => {
    return stripMarkdown(str);
};

export const parseMarkdownToProfileData = (markdown: string, fallbackTitle: string): ProfileData => {
    if (!markdown) return { title: fallbackTitle, sections: [], extraContent: '' };

    const lines = markdown.split('\n');
    const title = fallbackTitle;
    const sections: ProfileSection[] = [];
    let currentSection: ProfileSection | null = null;
    let introText = '';
    let footerText = '';
    let inSections = false;

    // Header matching (## Title or ## **Title**)

    // Section matching (### Section or **1. Section** or **Section**)
    const sectionRegex = /^(?:#{1,3}\s+(.+?)|\*\*+\s*(?:\d+[.)]\s*)?(.+?)\s*\*\*+)$/;
    // Field matching: "- Label: Value" or "- **Label:** Value" or "- **Label**: Value"
    const fieldPrefixRegex = /^[-*]\s+(?:\*\*)?(.+?)(?:\*\*)?\s*:\s*(.*)$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip horizontal rules
        if (/^-{3,}$/.test(line)) continue;

        // Title match is handled by fallback or if it's the very first line and NOT a section
        // We'll skip explicit title matching for now to avoid consuming section headers
        // as they are more important.

        // Try section match: **1. Section Title** or ### Section Title
        const sectionMatch = line.match(sectionRegex);
        if (sectionMatch) {
            inSections = true;
            if (currentSection) sections.push(currentSection);
            const rawSectionTitle = (sectionMatch[1] || sectionMatch[2] || "").trim();
            currentSection = {
                title: cleanLabel(rawSectionTitle),
                fields: []
            };
            continue;
        }

        // Try field match: "- **Label:** Value" or "- Label: Value"
        const fieldMatch = line.match(fieldPrefixRegex);
        if (fieldMatch && currentSection) {
            currentSection.fields.push({
                label: cleanLabel(fieldMatch[1]),
                value: cleanValue(fieldMatch[2])
            });
            continue;
        }

        // Handle extra / unmatched content
        if (!inSections) {
            if (!line.startsWith('#')) introText += line + '\n';
        } else if (currentSection) {
            if (line.startsWith('|')) {
                footerText += lines.slice(i).join('\n');
                break;
            }
        }
    }

    if (currentSection) sections.push(currentSection);

    return { title, sections, extraContent: (introText.trim() + '\n\n' + footerText.trim()).trim() };
};

/**
 * Convert profile data back to clean markdown.
 * NO markdown formatting in field labels - just plain text with a dash prefix.
 */
export const profileDataToMarkdown = (data: ProfileData): string => {
    let markdown = `## ${data.title}\n\n`;

    if (data.extraContent && !data.extraContent.includes('|')) {
        markdown += data.extraContent + '\n\n';
    }

    data.sections.forEach((section, index) => {
        markdown += `### ${index + 1}. ${section.title}\n\n`;
        section.fields.forEach(field => {
            const label = field.label.trim();
            const val = field.value.trim();
            markdown += `- ${label}: ${val}\n`;
        });
        markdown += '\n';
    });

    if (data.extraContent && (data.extraContent.includes('|') || data.extraContent.includes('---'))) {
        const tables = data.extraContent.split('\n\n').filter(p => p.includes('|') || p.startsWith('---'));
        if (tables.length > 0) {
            markdown += '\n---\n\n' + tables.join('\n\n');
        }
    }

    return markdown.trim();
};
