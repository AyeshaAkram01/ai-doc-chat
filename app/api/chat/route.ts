import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getEmbedding, generateAnswer } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { question, documentId, userId } = await request.json()

    if (!question || !documentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Step 1 — convert the question into numbers
    const questionEmbedding = await getEmbedding(question)
    const embeddingString = `[${questionEmbedding.join(',')}]`

    // Step 2 — find the most similar chunks using cosine similarity
    const similarChunks = await prisma.$queryRawUnsafe<{ content: string }[]>(
      `SELECT content FROM "Chunk" 
       WHERE "documentId" = $1 
       ORDER BY embedding <=> $2::vector 
       LIMIT 5`,
      documentId,
      embeddingString
    )

    if (similarChunks.length === 0) {
      return NextResponse.json(
        { error: 'No content found for this document' },
        { status: 404 }
      )
    }

    // Step 3 — combine the chunks into one context string
    const context = similarChunks.map(c => c.content).join('\n\n')

    // Step 4 — ask Gemini to answer using that context
    const answer = await generateAnswer(question, context)

    // Step 5 — save this chat to history
    await prisma.chat.create({
      data: {
        question,
        answer,
        userId,
        documentId,
      }
    })

    return NextResponse.json({ answer })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const userId = searchParams.get('userId')

    if (!documentId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const chats = await prisma.chat.findMany({
      where: { documentId, userId },
      orderBy: { createdAt: 'asc' },
      select: {
        question: true,
        answer: true,
      }
    })

    return NextResponse.json({ chats })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}