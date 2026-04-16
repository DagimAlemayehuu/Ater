import os
import frontmatter
import re
import unicodedata
from pypdf import PdfReader
from pathlib import Path

VAULT_ROOT = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault"
ACADEMIC_DIR = os.path.join(VAULT_ROOT, "2-Academic")

def get_keywords(text):
    """Extract significant keywords for fuzzy matching."""
    if not text: return set()
    # Normalize and split into words
    text = unicodedata.normalize('NFKD', text).lower()
    words = re.findall(r'[a-z]{4,}', text) # Words of at least 4 chars
    # Basic stop words filter
    stop_words = {'that', 'this', 'with', 'from', 'they', 'your', 'from', 'which', 'their', 'there'}
    return set(words) - stop_words

def find_pages_in_pdf(pdf_path, anchor_text):
    if not os.path.exists(pdf_path):
        return []
    try:
        reader = PdfReader(pdf_path)
        anchor_keywords = get_keywords(anchor_text)
        if not anchor_keywords: return []
        
        matches = [] # List of (page_num, score)
        
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if not page_text: continue
            
            page_keywords = get_keywords(page_text)
            score = len(anchor_keywords.intersection(page_keywords))
            
            # Threshold: at least 4 keywords
            if score >= 4:
                matches.append((i + 1, score))
                
        # Sort by score descending, then by page number
        matches.sort(key=lambda x: (-x[1], x[0]))
        
        # Return unique page numbers only, maintaining sorted order of "relevance"
        seen = set()
        result = []
        for p, s in matches:
            if p not in seen:
                result.append(p)
                seen.add(p)
        return result
                
    except Exception as e:
        pass
    return []

def process_note(file_path):
    try:
        post = frontmatter.load(file_path)
        # Check if source_pages already exists and is a list
        if 'source_pages' in post.metadata and isinstance(post.metadata['source_pages'], list) and len(post.metadata['source_pages']) > 5:
            # Skip if we already have a robust list
            return False
        
        source = post.get('source', '')
        if not source or not isinstance(source, str):
            return False
        
        match = re.search(r'\[\[(.*?)\]\]', source)
        if not match: return False
        
        rel_pdf_path = match.group(1)
        if not rel_pdf_path.lower().endswith('.pdf'):
            rel_pdf_path += '.pdf'
            
        abs_pdf_path = os.path.join(VAULT_ROOT, rel_pdf_path)
        
        content = post.content
        lines = [l.strip() for l in content.split('\n') if l.strip() and not l.startswith('#')]
        
        # Use significant chunk for matching
        combined_anchor = " ".join(lines[:3]) 
        if len(combined_anchor) < 30: 
             combined_anchor = content[:300]
            
        page_nums = find_pages_in_pdf(abs_pdf_path, combined_anchor)
        if page_nums:
            primary_page = page_nums[0]
            sorted_pages = sorted(page_nums)
            print(f"✓ Found {len(page_nums)} pages for: {os.path.basename(file_path)} -> primary: {primary_page}, all: {sorted_pages}")
            post['source_page'] = primary_page 
            post['source_pages'] = sorted_pages
            with open(file_path, 'wb') as f:
                frontmatter.dump(post, f)
            return True
        else:
            # print(f"✗ No match for: {os.path.basename(file_path)}")
            pass
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
    return False

def main():
    print(f"Scanning academic vault for multi-page mapping: {ACADEMIC_DIR}")
    count = 0
    updated = 0
    for root, dirs, files in os.walk(ACADEMIC_DIR):
        for file in files:
            if file.endswith('.md'):
                count += 1
                if process_note(os.path.join(root, file)):
                    updated += 1
    
    print(f"\nSummary: {updated} notes updated out of {count} total notes.")

if __name__ == "__main__":
    main()
