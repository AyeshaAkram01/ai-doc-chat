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
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite']

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })

      const prompt = `You are a helpful assistant answering questions based on the provided document context.

Context from document:
${context}

Question: ${question}

Answer the question using only the information from the context above. If the answer isn't in the context, say "I couldn't find that information in the document."`

      const result = await model.generateContent(prompt)
      return result.response.text()

    } catch (error) {
      const isOverloaded = error instanceof Error &&
        (error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('unavailable'))

      if (isOverloaded) {
        console.log(`${modelName} overloaded, trying next model...`)
        continue
      }

      throw error
    }
  }

  return 'The AI service is currently busy. Please try again in a moment.'
}