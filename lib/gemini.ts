import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
  const result = await model.embedContent(text)
  
  // Gemini returns 3072 numbers by default, but our database expects 768
  // so we take only the first 768 numbers
  return result.embedding.values.slice(0, 768)
}

export async function generateAnswer(question: string, context: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a helpful assistant answering questions based on the provided document context.

Context from document:
${context}

Question: ${question}

Answer the question using only the information from the context above. If the answer isn't in the context, say "I couldn't find that information in the document."`

  const result = await model.generateContent(prompt)
  return result.response.text()
}