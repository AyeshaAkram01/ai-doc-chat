export function chunkText(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = []
  let currentChunk = ''

  const sentences = text.split(/(?<=[.!?])\s+/)

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim())

  return chunks
}