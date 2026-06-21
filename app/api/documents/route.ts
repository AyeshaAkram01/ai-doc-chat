import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getEmbedding } from '@/lib/gemini'
import { chunkText } from '@/lib/chunking'

export async function POST(request: Request) {
  try {
    const { name, fileUrl, userId, fileText } = await request.json()

    if (!name || !fileUrl || !userId || !fileText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // check if user exists, if not create them
    const { supabase } = await import('@/lib/supabase')
const { data } = await supabase.auth.getUser()

await prisma.user.upsert({
  where: { id: userId },
  update: {},
  create: {
    id: userId,
    email: data.user?.email || '',
  }
})
    // save document to database
    const document = await prisma.document.create({
      data: {
        name,
        fileUrl,
        userId,
      }
    })

    // split text into chunks
    const chunks = chunkText(fileText)

    // for each chunk, get embedding and save to database
    for (const chunkContent of chunks) {
      const embedding = await getEmbedding(chunkContent)

      // create the chunk first with prisma (without embedding)
      const chunk = await prisma.chunk.create({
  data: {
    content: chunkContent,
    documentId: document.id,
  },
  select: {
    id: true,
    content: true,
    documentId: true,
  }
})

      // then update with embedding using raw SQL since Prisma doesn't support vector type
      await prisma.$executeRawUnsafe(
        `UPDATE "Chunk" SET embedding = $1::vector WHERE id = $2`,
        `[${embedding.join(',')}]`,
        chunk.id
      )
    }

    return NextResponse.json({ document, chunksCreated: chunks.length })

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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ documents })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}