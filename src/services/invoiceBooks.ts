export interface InvoiceBook {
  id: string;
  book_number: number;
  seller_name: string;
  start_number: number;
  end_number: number;
  current_number: number;
  status: 'active' | 'exhausted' | 'cancelled';
  created_at: string;
}

const STORAGE_KEY = 'invoice_books';
const SELLER_KEY = 'current_seller';

export const getInvoiceBooks = (): InvoiceBook[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveBooks = (books: InvoiceBook[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
};

export const createBook = (
  sellerName: string,
  startNumber: number,
  endNumber: number
): InvoiceBook | null => {
  if (startNumber >= endNumber) return null;

  const books = getInvoiceBooks();
  const hasOverlap = books.some(
    (b) =>
      b.seller_name === sellerName &&
      b.status === 'active' &&
      !(endNumber < b.start_number || startNumber > b.end_number)
  );
  if (hasOverlap) return null;

  const maxBookNum = books.reduce((max, b) => Math.max(max, b.book_number), 0);

  const newBook: InvoiceBook = {
    id: Date.now().toString(),
    book_number: maxBookNum + 1,
    seller_name: sellerName,
    start_number: startNumber,
    end_number: endNumber,
    current_number: startNumber,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  books.push(newBook);
  saveBooks(books);
  return newBook;
};

export const getNextInvoiceNumber = (bookId: string): string | null => {
  const books = getInvoiceBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index === -1) return null;

  const book = books[index];
  if (book.status !== 'active') return null;
  if (book.current_number > book.end_number) {
    books[index].status = 'exhausted';
    saveBooks(books);
    return null;
  }

  const number = book.current_number;
  books[index].current_number = number + 1;

  if (number >= book.end_number) {
    books[index].status = 'exhausted';
  }

  saveBooks(books);
  return number.toString();
};

export const cancelBook = (bookId: string): boolean => {
  const books = getInvoiceBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index === -1) return false;

  books[index].status = 'cancelled';
  saveBooks(books);
  return true;
};

export const resetBooks = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getActiveBookForSeller = (sellerName: string): InvoiceBook | null => {
  const books = getInvoiceBooks();
  return (
    books.find((b) => b.seller_name === sellerName && b.status === 'active') ||
    null
  );
};

export const getAllBooksSummary = () => {
  const books = getInvoiceBooks();
  const total = books.length;
  const active = books.filter((b) => b.status === 'active').length;
  const exhausted = books.filter((b) => b.status === 'exhausted').length;
  const cancelled = books.filter((b) => b.status === 'cancelled').length;
  const totalNumbersUsed = books.reduce(
    (sum, b) => sum + (b.current_number - b.start_number),
    0
  );

  return {
    total,
    active,
    exhausted,
    cancelled,
    totalNumbersUsed,
    books,
  };
};

export const getCurrentSeller = (): string => {
  return localStorage.getItem(SELLER_KEY) || 'خالد تركي';
};

export const setCurrentSeller = (sellerName: string): void => {
  localStorage.setItem(SELLER_KEY, sellerName);
};

export const getInvoiceNumber = (): string | null => {
  const seller = getCurrentSeller();
  let book = getActiveBookForSeller(seller);

  if (!book) {
    book = createBook(seller, 1001, 1999);
    if (!book) return null;
  }

  return getNextInvoiceNumber(book.id);
};

// ============================================
// QUOTE NUMBERING (عروض الأسعار)
// ============================================
const QUOTE_BOOKS_KEY = 'quote_books';

export const getQuoteBooks = (): InvoiceBook[] => {
  const data = localStorage.getItem(QUOTE_BOOKS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveQuoteBooks = (books: InvoiceBook[]): void => {
  localStorage.setItem(QUOTE_BOOKS_KEY, JSON.stringify(books));
};

export const createQuoteBook = (
  sellerName: string,
  startNumber: number,
  endNumber: number
): InvoiceBook | null => {
  if (startNumber >= endNumber) return null;

  const books = getQuoteBooks();
  const hasOverlap = books.some(
    (b) =>
      b.seller_name === sellerName &&
      b.status === 'active' &&
      !(endNumber < b.start_number || startNumber > b.end_number)
  );
  if (hasOverlap) return null;

  const maxBookNum = books.reduce((max, b) => Math.max(max, b.book_number), 0);

  const newBook: InvoiceBook = {
    id: Date.now().toString(),
    book_number: maxBookNum + 1,
    seller_name: sellerName,
    start_number: startNumber,
    end_number: endNumber,
    current_number: startNumber,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  books.push(newBook);
  saveQuoteBooks(books);
  return newBook;
};

export const getNextQuoteNumber = (bookId: string): string | null => {
  const books = getQuoteBooks();
  const index = books.findIndex((b) => b.id === bookId);
  if (index === -1) return null;

  const book = books[index];
  if (book.status !== 'active') return null;
  if (book.current_number > book.end_number) {
    books[index].status = 'exhausted';
    saveQuoteBooks(books);
    return null;
  }

  const number = book.current_number;
  books[index].current_number = number + 1;

  if (number >= book.end_number) {
    books[index].status = 'exhausted';
  }

  saveQuoteBooks(books);
  return number.toString();
};

export const getActiveQuoteBookForSeller = (sellerName: string): InvoiceBook | null => {
  const books = getQuoteBooks();
  return (
    books.find((b) => b.seller_name === sellerName && b.status === 'active') ||
    null
  );
};

export const getQuoteNumber = (): string | null => {
  const seller = getCurrentSeller();
  let book = getActiveQuoteBookForSeller(seller);

  if (!book) {
    book = createQuoteBook(seller, 1001, 9999);
    if (!book) return null;
  }

  return getNextQuoteNumber(book.id);
};
