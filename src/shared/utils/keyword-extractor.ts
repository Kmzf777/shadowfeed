
import { removeStopwords, porBr as ptbr } from 'stopword';

/**
 * Analisa o texto do slide (sem recorrer a IA) e extrai a palavra-chave mais relevante.
 */
export function extractKeywordFromSlide(headline: string, bodyText?: string | null, fallbackTheme: string = 'business'): string {
    const fullText = `${headline} ${bodyText || ''}`;

    // 1. Limpar pontuação, números e converter para minúsculas
    const cleanText = fullText.replace(/[^\w\sÀ-ú]/g, '').toLowerCase();

    // 2. Tokenizar em palavras (separadas por espaços)
    const tokens = cleanText.split(/\s+/).filter(word => word.length > 2);

    // 3. Remover stopwords em português (de, para, com, etc.)
    const filteredTokens = removeStopwords(tokens, ptbr);

    // 4. Heurística de prioridade:
    // Filtramos palavras muito curtas. Assumimos que as palavras mais longas
    // ou os primeiros substantivos que sobraram têm mais peso semântico.
    const validWords = filteredTokens.filter(w => w.length >= 4);

    if (validWords.length === 0) return fallbackTheme;

    // Pegamos a palavra mais longa dentre as 3 primeiras sobreviventes para formar a keyword
    // (Pexels funciona bem com 1 ou 2 palavras diretas)
    const topWords = validWords.slice(0, 3).sort((a, b) => b.length - a.length);

    return topWords[0] || fallbackTheme;
}
