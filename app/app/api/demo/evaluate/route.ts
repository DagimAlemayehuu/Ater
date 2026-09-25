import { NextResponse } from 'next/server';

const TABOO_WORDS = ['b-tree', 'btree', 'binary search', 'sorted'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const explanation = typeof body.explanation === 'string' ? body.explanation.trim() : '';

    if (!explanation) {
      return NextResponse.json(
        {
          error: 'Explanation cannot be empty.',
          valid: false,
          score: '0/10',
          breakdown: 'No explanation provided.',
          tabooUsed: [],
        },
        { status: 400 }
      );
    }

    const lowerExplanation = explanation.toLowerCase();
    const tabooUsed: string[] = [];

    for (const word of TABOO_WORDS) {
      const regex = new RegExp(`\\b${word.replace('-', '[- ]?')}\\b`, 'i');
      if (regex.test(lowerExplanation)) {
        tabooUsed.push(word);
      }
    }

    if (tabooUsed.length > 0) {
      return NextResponse.json({
        valid: false,
        score: '2/10',
        tabooUsed,
        breakdown: `Taboo term detected (${tabooUsed.join(', ')}). Explain the underlying physical mechanism without using reserved abstractions.`,
      });
    }

    const words = lowerExplanation.split(/\s+/).filter(Boolean);
    if (words.length < 6) {
      return NextResponse.json({
        valid: false,
        score: '3/10',
        tabooUsed: [],
        breakdown: 'Explanation is too brief to convey the causal lookup mechanism.',
      });
    }

    // Explicit mechanistic physical concepts
    const mechanisticSignals = [
      'table of contents',
      'pointer',
      'address',
      'location',
      'page',
      'reference',
      'direct link',
      'lookup reference',
      'catalog',
      'record position',
    ];

    const matchedSignals = mechanisticSignals.filter((signal) => lowerExplanation.includes(signal));

    if (matchedSignals.length >= 2) {
      return NextResponse.json({
        valid: true,
        score: '9/10',
        tabooUsed: [],
        breakdown: 'Causal mechanism cleanly described: maintains a separate lookup reference pointing directly to storage addresses without full sequential scan.',
      });
    } else if (matchedSignals.length === 1) {
      return NextResponse.json({
        valid: true,
        score: '7/10',
        tabooUsed: [],
        breakdown: 'Underlying mechanism partially conveyed; clear physical mapping to data locations without invoking taboo jargon.',
      });
    } else {
      return NextResponse.json({
        valid: true,
        score: '5/10',
        tabooUsed: [],
        breakdown: 'Hand-waving detected: captures the goal of faster retrieval, but misses the physical reference or address pointer mechanism.',
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request payload.' },
      { status: 500 }
    );
  }
}
