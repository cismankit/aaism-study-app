// Document Store Service - Manages uploaded documents for AI context
import { UploadedDocument } from '../types';

const STORAGE_KEY = 'aaism_documents';

// Load documents from localStorage
export function loadDocuments(): UploadedDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save documents to localStorage
export function saveDocuments(docs: UploadedDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// Add a new document
export function addDocument(doc: Omit<UploadedDocument, 'id' | 'uploadedAt'>): UploadedDocument {
  const docs = loadDocuments();
  const newDoc: UploadedDocument = {
    ...doc,
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uploadedAt: new Date().toISOString(),
  };
  docs.push(newDoc);
  saveDocuments(docs);
  return newDoc;
}

// Delete a document
export function deleteDocument(id: string): void {
  const docs = loadDocuments();
  saveDocuments(docs.filter(d => d.id !== id));
}

// Get documents by domain
export function getDocumentsByDomain(domainId: number): UploadedDocument[] {
  return loadDocuments().filter(d => d.domainId === domainId);
}

// Search documents for relevant content
export function searchDocuments(query: string): UploadedDocument[] {
  const docs = loadDocuments();
  const queryLower = query.toLowerCase();
  
  return docs.filter(doc => 
    doc.name.toLowerCase().includes(queryLower) ||
    doc.content.toLowerCase().includes(queryLower)
  );
}

// Get context from documents for AI
export function getDocumentContext(query: string, maxChars: number = 2000): string {
  const relevantDocs = searchDocuments(query);
  
  if (relevantDocs.length === 0) return '';
  
  let context = '\n\n📎 From your uploaded documents:\n';
  let charCount = 0;
  
  for (const doc of relevantDocs.slice(0, 3)) {
    const snippet = extractRelevantSnippet(doc.content, query, 500);
    if (charCount + snippet.length > maxChars) break;
    
    context += `\n[${doc.name}]: ${snippet}\n`;
    charCount += snippet.length;
  }
  
  return context;
}

// Extract relevant snippet from content
function extractRelevantSnippet(content: string, query: string, maxLength: number): string {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Find the position of the query in content
  const pos = contentLower.indexOf(queryLower);
  
  if (pos === -1) {
    // Query not found, return start of content
    return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
  
  // Extract snippet around the match
  const start = Math.max(0, pos - 100);
  const end = Math.min(content.length, pos + maxLength - 100);
  
  let snippet = content.slice(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet += '...';
  
  return snippet;
}

// Parse text from file (basic implementation - can be enhanced)
export async function parseFileContent(file: File): Promise<{ content: string; type: UploadedDocument['type'] }> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Handle text-based files
  if (['txt', 'md', 'markdown'].includes(extension || '')) {
    const content = await file.text();
    return { 
      content, 
      type: extension === 'md' || extension === 'markdown' ? 'markdown' : 'text' 
    };
  }
  
  // Handle images - extract any text (placeholder for OCR)
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) {
    return { 
      content: `[Image: ${file.name}] - Image content cannot be extracted without OCR. You can describe what's in this image when asking questions.`,
      type: 'image' 
    };
  }
  
  // Handle PDF - basic extraction
  if (extension === 'pdf') {
    // Note: Full PDF parsing would require a library like pdf.js
    // For now, we'll notify the user
    return { 
      content: `[PDF: ${file.name}] - PDF text extraction requires additional setup. Please copy-paste key content or use a text file.`,
      type: 'pdf' 
    };
  }
  
  // Default: try to read as text
  try {
    const content = await file.text();
    return { content, type: 'text' };
  } catch {
    return { 
      content: `[${file.name}] - Could not extract content from this file type.`,
      type: 'text' 
    };
  }
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
