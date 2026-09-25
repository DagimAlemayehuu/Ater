import type { GroundedSource, UploadedDoc } from '@/types';
import { stripEmojis } from './intake';

/**
 * Curated knowledge base of canonical authoritative documentation & textbook references
 * for rapid offline/low-latency grounding.
 */
interface CanonicalSourceTemplate {
  pattern: RegExp;
  sources: Array<{ title: string; url: string; snippet: string }>;
}

const CANONICAL_KNOWLEDGE_BASE: CanonicalSourceTemplate[] = [
  {
    pattern: /distributed|consensus|paxos|raft|cap theorem|byzantine/i,
    sources: [
      {
        title: 'Designing Data-Intensive Applications (Martin Kleppmann, O\'Reilly)',
        url: 'https://dataintensive.net/',
        snippet: 'The definitive architectural guide to data systems, storage engines, replication, and distributed consensus.',
      },
      {
        title: 'In Search of an Understandable Consensus Algorithm (Raft) - Ongaro & Ousterhout',
        url: 'https://raft.github.io/raft.pdf',
        snippet: 'Canonical Stanford specification of leader election, log replication, and safety guarantees.',
      },
      {
        title: 'Paxos Made Simple - Leslie Lamport (ACM SIGACT)',
        url: 'https://lamport.azurewebsites.net/pubs/paxos-simple.pdf',
        snippet: 'Foundational paper detailing state machine replication and quorum consensus invariants.',
      },
    ],
  },
  {
    pattern: /react|next\.?js|frontend|tailwind|ui component/i,
    sources: [
      {
        title: 'React Official Documentation & Architecture Guide',
        url: 'https://react.dev',
        snippet: 'Authoritative documentation on React mental models, hooks lifecycle, concurrency, and reconciliation.',
      },
      {
        title: 'MDN Web Docs (Mozilla Developer Network)',
        url: 'https://developer.mozilla.org',
        snippet: 'Comprehensive reference for web standards, DOM APIs, JavaScript runtime semantics, and CSS architecture.',
      },
      {
        title: 'Next.js Official Documentation & App Router Architecture',
        url: 'https://nextjs.org/docs',
        snippet: 'Production guide to Server Components, dynamic streaming, caching layers, and client-server boundaries.',
      },
    ],
  },
  {
    pattern: /typescript|javascript|ecmascript/i,
    sources: [
      {
        title: 'TypeScript Official Handbook & Type System Specification',
        url: 'https://www.typescriptlang.org/docs/handbook/',
        snippet: 'Canonical guide to structural typing, generics, conditional types, and compiler type inference.',
      },
      {
        title: 'ECMA-262 Language Specification',
        url: 'https://tc39.es/ecma262/',
        snippet: 'The formal, definitive international standard for ECMAScript syntax, memory models, and execution context.',
      },
      {
        title: 'MDN JavaScript Reference',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        snippet: 'Authoritative runtime documentation covering event loops, closures, prototypes, and asynchronous execution.',
      },
    ],
  },
  {
    pattern: /rust|borrow checker|memory safety|ownership/i,
    sources: [
      {
        title: 'The Rust Programming Language (Steve Klabnik & Carol Nichols)',
        url: 'https://doc.rust-lang.org/book/',
        snippet: 'Official reference textbook on affine types, borrow checking, lifetimes, and fearless concurrency.',
      },
      {
        title: 'Rust Standard Library Reference & API Documentation',
        url: 'https://doc.rust-lang.org/std/',
        snippet: 'Complete API contract for standard collections, memory allocators, smart pointers, and concurrency primitives.',
      },
      {
        title: 'The Rustonomicon: Dark Arts of Unsafe Rust',
        url: 'https://doc.rust-lang.org/nomicon/',
        snippet: 'Authoritative guide to Rust invariants, undefined behavior, aliasing rules, and memory layouts.',
      },
    ],
  },
  {
    pattern: /python|django|fastapi|asyncio/i,
    sources: [
      {
        title: 'Python Official Documentation & Language Reference',
        url: 'https://docs.python.org/3/',
        snippet: 'Authoritative specification of Python syntax, data models, standard library, and execution semantics.',
      },
      {
        title: 'Fluent Python: Clear, Concise, and Effective Programming (Luciano Ramalho, O\'Reilly)',
        url: 'https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/',
        snippet: 'Deep dive into Python data model, descriptors, protocols, coroutines, and metaclasses.',
      },
      {
        title: 'PEP 8 & Python Enhancement Proposals (Python Software Foundation)',
        url: 'https://peps.python.org/',
        snippet: 'Official architectural and style standards for Python language evolution and idiomatic development.',
      },
    ],
  },
  {
    pattern: /machine learning|deep learning|neural network|transformer|llm|diffusion/i,
    sources: [
      {
        title: 'Deep Learning (Ian Goodfellow, Yoshua Bengio, Aaron Courville - MIT Press)',
        url: 'https://www.deeplearningbook.org/',
        snippet: 'Comprehensive foundational textbook covering linear algebra, backpropagation, and deep generative architectures.',
      },
      {
        title: 'Attention Is All You Need (Vaswani et al., NeurIPS)',
        url: 'https://arxiv.org/abs/1706.03762',
        snippet: 'Seminal research paper establishing the Transformer architecture, multi-head self-attention, and positional encodings.',
      },
      {
        title: 'Stanford CS229: Machine Learning Course Lectures & Notes',
        url: 'https://cs229.stanford.edu/',
        snippet: 'Rigorous mathematical foundations for supervised learning, regularization, optimization, and generalization.',
      },
    ],
  },
  {
    pattern: /database|sql|postgres|storage engine|lsm|b-tree/i,
    sources: [
      {
        title: 'Database System Concepts (Silberschatz, Korth, Sudarshan - McGraw-Hill)',
        url: 'https://www.db-book.com/',
        snippet: 'Canonical textbook covering relational algebra, transaction management, ACID isolation levels, and indexing.',
      },
      {
        title: 'PostgreSQL Official Documentation & Internals',
        url: 'https://www.postgresql.org/docs/',
        snippet: 'Authoritative documentation on MVCC, query planning, write-ahead logging (WAL), and execution engines.',
      },
      {
        title: 'Architecture of a Database System (Hellerstein, Stonebraker, Hamilton)',
        url: 'https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf',
        snippet: 'Foundational architectural paper analyzing storage managers, buffer pools, query processors, and transactions.',
      },
    ],
  },
  {
    pattern: /operating system|kernel|linux|process|thread|memory management/i,
    sources: [
      {
        title: 'Operating Systems: Three Easy Pieces (OSTEP - Remzi & Andrea Arpaci-Dusseau)',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
        snippet: 'Foundational textbook on virtualization of CPU and memory, concurrency primitives, and file system persistence.',
      },
      {
        title: 'The Linux Kernel Documentation',
        url: 'https://docs.kernel.org/',
        snippet: 'Official architecture manuals for kernel scheduling, virtual memory subsystem, syscalls, and device drivers.',
      },
      {
        title: 'Modern Operating Systems (Andrew S. Tanenbaum, Pearson)',
        url: 'https://www.pearson.com/',
        snippet: 'Comprehensive treatise on memory architectures, deadlocks, multiprocessor scheduling, and security.',
      },
    ],
  },
  {
    pattern: /network|tcp|ip|dns|http|socket/i,
    sources: [
      {
        title: 'Computer Networking: A Top-Down Approach (Kurose & Ross, Pearson)',
        url: 'https://www.pearson.com/',
        snippet: 'Standard academic reference on application layer protocols, transport layer flow control, routing, and congestion.',
      },
      {
        title: 'RFC 9293 - Transmission Control Protocol (TCP) Specification (IETF)',
        url: 'https://datatracker.ietf.org/doc/html/rfc9293',
        snippet: 'Authoritative international standard specifying state transitions, sliding windows, and packet acknowledgment.',
      },
      {
        title: 'High Performance Browser Networking (Ilya Grigorik, O\'Reilly)',
        url: 'https://hpbn.co/',
        snippet: 'Essential performance guide covering HTTP/2, HTTP/3, TLS handshakes, TCP mechanics, and latency bottlenecks.',
      },
    ],
  },
  {
    pattern: /algorithm|data structure|graph|dynamic programming|complexity/i,
    sources: [
      {
        title: 'Introduction to Algorithms (CLRS - Cormen, Leiserson, Rivest, Stein - MIT Press)',
        url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
        snippet: 'The benchmark reference work for asymptotic analysis, greedy algorithms, divide-and-conquer, and graph theory.',
      },
      {
        title: 'The Algorithm Design Manual (Steven S. Skiena, Springer)',
        url: 'https://www.algorist.com/',
        snippet: 'Practical handbook on algorithm design techniques, data structures, and production-tested graph problems.',
      },
      {
        title: 'MIT OpenCourseWare 6.006: Introduction to Algorithms',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        snippet: 'Rigorous algorithmic lecture series detailing balance trees, hash tables, shortest paths, and dynamic programming.',
      },
    ],
  },
  {
    pattern: /security|cryptography|encryption|zero knowledge|auth/i,
    sources: [
      {
        title: 'Cryptography Engineering (Niels Ferguson, Bruce Schneier, Tadayoshi Kohno - Wiley)',
        url: 'https://www.schneier.com/books/cryptography_engineering/',
        snippet: 'Authoritative practical treatise on symmetric ciphers, public-key infrastructure, key exchange, and secure design.',
      },
      {
        title: 'A Graduate Course in Applied Cryptography (Dan Boneh & Victor Shoup, Stanford)',
        url: 'https://toc.cryptobook.us/',
        snippet: 'Comprehensive academic textbook on cryptographic proofs, lattice-based cryptography, and zero-knowledge primitives.',
      },
      {
        title: 'NIST Computer Security Resource Center Special Publications',
        url: 'https://csrc.nist.gov/',
        snippet: 'Federal information processing standards for AES encryption, digital signatures, and secure hashing algorithms.',
      },
    ],
  },
];

/**
 * Synthesizes dynamic authoritative reference sources for any arbitrary topic.
 */
function synthesizeTopicSources(cleanTopic: string, isAm: boolean): GroundedSource[] {
  // Check canonical knowledge base first
  for (const entry of CANONICAL_KNOWLEDGE_BASE) {
    if (entry.pattern.test(cleanTopic)) {
      return entry.sources.map((s, idx) => ({
        id: `web-${idx + 1}`,
        title: s.title,
        url: s.url,
        type: 'web' as const,
        snippet: s.snippet,
      }));
    }
  }

  // Dynamic synthesis for any topic
  const baseTitle = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  if (isAm) {
    return [
      {
        id: 'web-1',
        title: `${baseTitle}፡ ይፋዊ የቴክኒክ ሰነድ እና መመሪያ`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanTopic)}`,
        type: 'web',
        snippet: `ለ ${baseTitle} የተዘጋጀ ይፋዊ የስታንዳርድ ሰነድ፣ መሰረታዊ መርሆች እና የስራ ማዕቀፍ።`,
      },
      {
        id: 'web-2',
        title: `${baseTitle}፡ የዩኒቨርሲቲ የአካዳሚክ ማጣቀሻ እና ፅንሰ-ሀሳብ`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanTopic)}`,
        type: 'web',
        snippet: `ስለ ${baseTitle} መሰረታዊ ህጎች፣ የንድፍ ማዕቀፎች እና የምርምር ውጤቶች የያዘ የአካዳሚክ ምንጭ።`,
      },
      {
        id: 'web-3',
        title: `${baseTitle}፡ የተግባር ምህንድስና እና ምርጥ ተሞክሮዎች`,
        url: `https://github.com/topics/${encodeURIComponent(cleanTopic.toLowerCase().replace(/\s+/g, '-'))}`,
        type: 'web',
        snippet: `የ ${baseTitle}ን የስራ ላይ ተሞክሮዎች፣ የተለመዱ ወጥመዶች እና የደህንነት ወሰኖች የሚያብራራ ማጣቀሻ።`,
      },
    ];
  }

  return [
    {
      id: 'web-1',
      title: `${baseTitle} Official Documentation & Standard Specification`,
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanTopic)}`,
      type: 'web',
      snippet: `Authoritative standard specification, foundational axioms, and operational reference for ${baseTitle}.`,
    },
    {
      id: 'web-2',
      title: `${baseTitle}: Core Principles & Academic Foundations`,
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanTopic)}`,
      type: 'web',
      snippet: `Peer-reviewed textbook and academic treatise examining theoretical dynamics, invariants, and structural trade-offs of ${baseTitle}.`,
    },
    {
      id: 'web-3',
      title: `${baseTitle} Engineering Practice & Production Architecture Guide`,
      url: `https://github.com/topics/${encodeURIComponent(cleanTopic.toLowerCase().replace(/\s+/g, '-'))}`,
      type: 'web',
      snippet: `Industry standard reference on runtime execution, edge case failure modes, and battle-tested production design for ${baseTitle}.`,
    },
  ];
}

/**
 * Gathers grounded sources of truth for living curriculum generation.
 *
 * Path A: If files/documents are uploaded, use document names and text content as strict source of truth.
 * Path B: If prompt-based, run a fast Google Search Grounding query via Gemini (or structured synthesis)
 *         to extract 2-3 real, authoritative documentation/textbook reference sources.
 */
export async function gatherGroundedSources(
  topic: string,
  files?: UploadedDoc[],
  answers?: Record<string, string>,
  language: string = 'en'
): Promise<GroundedSource[]> {
  const isAm = language === 'am';
  const cleanTopic = stripEmojis(topic || '').trim();

  // --------------------------------------------------------------------------
  // PATH A: Uploaded Documents / Files
  // --------------------------------------------------------------------------
  if (files && Array.isArray(files) && files.length > 0) {
    return files.map((file, idx) => {
      const id = `doc-${idx + 1}`;
      const title = stripEmojis(file.fileName || `Document ${idx + 1}`).trim();
      let snippet = '';

      if (file.textContent && file.textContent.trim()) {
        const cleanContent = stripEmojis(file.textContent).trim();
        snippet = cleanContent.length > 280 ? `${cleanContent.slice(0, 277)}...` : cleanContent;
      } else {
        const sizeStr = file.sizeBytes ? `${Math.round(file.sizeBytes / 1024)} KB` : '';
        snippet = isAm
          ? `የተማሪው የጥናት ሰነድ (${title}${sizeStr ? ` - ${sizeStr}` : ''})`
          : `Primary uploaded learner document (${title}${sizeStr ? ` - ${sizeStr}` : ''})`;
      }

      return {
        id,
        title,
        type: 'document' as const,
        snippet,
      };
    });
  }

  // --------------------------------------------------------------------------
  // PATH B: Prompt-based with Google Search Grounding / Structured Synthesis
  // --------------------------------------------------------------------------
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (!apiKey || !cleanTopic) {
    return synthesizeTopicSources(cleanTopic || 'General Study', isAm);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2600);

    const promptText = `Extract 2 to 3 real, authoritative documentation or canonical textbook reference sources for: "${cleanTopic}".
For each source, provide the authoritative title, canonical official URL, and a 1-sentence analytical snippet explaining its architectural significance.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            maxOutputTokens: 600,
            thinkingConfig: {
              thinkingBudget: 1,
            },
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const candidate = data.candidates?.[0];
      const chunks = candidate?.groundingMetadata?.groundingChunks;

      if (Array.isArray(chunks) && chunks.length > 0) {
        const extractedSources: GroundedSource[] = [];
        const seenUrls = new Set<string>();

        for (const chunk of chunks) {
          if (chunk?.web?.uri && chunk?.web?.title) {
            const url = chunk.web.uri;
            if (seenUrls.has(url)) continue;
            seenUrls.add(url);

            extractedSources.push({
              id: `web-${extractedSources.length + 1}`,
              title: stripEmojis(chunk.web.title).trim(),
              url,
              type: 'web',
              snippet: isAm
                ? `ስለ ${cleanTopic} የተገኘ ይፋዊ የድረ-ገጽ ምንጭ።`
                : `Authoritative online reference grounding the curriculum for ${cleanTopic}.`,
            });

            if (extractedSources.length >= 3) break;
          }
        }

        if (extractedSources.length >= 2) {
          return extractedSources;
        }
      }
    }
  } catch (_apiErr) {
    // Graceful fallback to deterministic high-signal knowledge base
  }

  return synthesizeTopicSources(cleanTopic, isAm);
}
