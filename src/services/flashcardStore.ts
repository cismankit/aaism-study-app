// Flashcard Store Service - Spaced Repetition System
import { Flashcard, FlashcardDeck } from '../types';

const CARDS_KEY = 'aaism_flashcards';
const DECKS_KEY = 'aaism_flashcard_decks';

// ============ STORAGE ============

export function loadFlashcards(): Flashcard[] {
  try {
    const stored = localStorage.getItem(CARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveFlashcards(cards: Flashcard[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function loadDecks(): FlashcardDeck[] {
  try {
    const stored = localStorage.getItem(DECKS_KEY);
    return stored ? JSON.parse(stored) : getDefaultDecks();
  } catch {
    return getDefaultDecks();
  }
}

export function saveDecks(decks: FlashcardDeck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

// ============ FLASHCARD CRUD ============

export function addFlashcard(card: Omit<Flashcard, 'id' | 'createdAt' | 'easeFactor' | 'interval' | 'repetitions'>): Flashcard {
  const cards = loadFlashcards();
  const newCard: Flashcard = {
    ...card,
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    easeFactor: 2.5, // Default SM-2 ease factor
    interval: 0,
    repetitions: 0,
  };
  cards.push(newCard);
  saveFlashcards(cards);
  return newCard;
}

export function updateFlashcard(id: string, updates: Partial<Flashcard>): void {
  const cards = loadFlashcards();
  const index = cards.findIndex(c => c.id === id);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updates };
    saveFlashcards(cards);
  }
}

export function deleteFlashcard(id: string): void {
  const cards = loadFlashcards();
  saveFlashcards(cards.filter(c => c.id !== id));
  
  // Also remove from decks
  const decks = loadDecks();
  decks.forEach(deck => {
    deck.cardIds = deck.cardIds.filter(cid => cid !== id);
  });
  saveDecks(decks);
}

export function getFlashcardsByDomain(domainId: number): Flashcard[] {
  return loadFlashcards().filter(c => c.domainId === domainId);
}

// ============ DECK CRUD ============

export function addDeck(deck: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cardIds'>): FlashcardDeck {
  const decks = loadDecks();
  const newDeck: FlashcardDeck = {
    ...deck,
    id: `deck_${Date.now()}`,
    createdAt: new Date().toISOString(),
    cardIds: [],
  };
  decks.push(newDeck);
  saveDecks(decks);
  return newDeck;
}

export function deleteDeck(id: string): void {
  const decks = loadDecks();
  saveDecks(decks.filter(d => d.id !== id));
}

export function addCardToDeck(deckId: string, cardId: string): void {
  const decks = loadDecks();
  const deck = decks.find(d => d.id === deckId);
  if (deck && !deck.cardIds.includes(cardId)) {
    deck.cardIds.push(cardId);
    saveDecks(decks);
  }
}

// ============ SPACED REPETITION (SM-2 Algorithm) ============

export interface ReviewResult {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5; // 0-2: fail, 3-5: pass
}

export function processReview(result: ReviewResult): void {
  const cards = loadFlashcards();
  const card = cards.find(c => c.id === result.cardId);
  
  if (!card) return;
  
  const { quality } = result;
  
  // SM-2 Algorithm
  if (quality >= 3) {
    // Correct response
    if (card.repetitions === 0) {
      card.interval = 1;
    } else if (card.repetitions === 1) {
      card.interval = 6;
    } else {
      card.interval = Math.round(card.interval * card.easeFactor);
    }
    card.repetitions += 1;
  } else {
    // Incorrect response - reset
    card.repetitions = 0;
    card.interval = 1;
  }
  
  // Update ease factor
  card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  
  // Update review dates
  card.lastReviewedAt = new Date().toISOString();
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + card.interval);
  card.nextReviewAt = nextDate.toISOString();
  
  saveFlashcards(cards);
}

export function getDueCards(): Flashcard[] {
  const cards = loadFlashcards();
  const now = new Date();
  
  return cards.filter(card => {
    if (!card.nextReviewAt) return true; // Never reviewed
    return new Date(card.nextReviewAt) <= now;
  }).sort((a, b) => {
    // Prioritize never-reviewed, then by due date
    if (!a.nextReviewAt) return -1;
    if (!b.nextReviewAt) return 1;
    return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
  });
}

export function getDueCardsByDomain(domainId: number): Flashcard[] {
  return getDueCards().filter(c => c.domainId === domainId);
}

// ============ DEFAULT DECKS ============

function getDefaultDecks(): FlashcardDeck[] {
  return [
    {
      id: 'deck_domain1',
      name: 'AI Governance',
      description: 'Key terms and concepts for Domain 1',
      domainId: 1,
      cardIds: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'deck_domain2',
      name: 'AI Risk Management',
      description: 'Risk frameworks and controls for Domain 2',
      domainId: 2,
      cardIds: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'deck_domain3',
      name: 'AI Development',
      description: 'SDLC and security for Domain 3',
      domainId: 3,
      cardIds: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'deck_domain4',
      name: 'AI Operations',
      description: 'Monitoring and incident response for Domain 4',
      domainId: 4,
      cardIds: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

// ============ STATS ============

export function getFlashcardStats() {
  const cards = loadFlashcards();
  const dueCards = getDueCards();
  
  return {
    total: cards.length,
    due: dueCards.length,
    mastered: cards.filter(c => c.interval >= 21).length, // 3+ weeks interval
    learning: cards.filter(c => c.repetitions > 0 && c.interval < 21).length,
    new: cards.filter(c => c.repetitions === 0).length,
  };
}
