# AI Doc Chat

A full-stack AI-powered application that lets users upload PDF documents and chat with them using natural language. Built with Next.js, Supabase, pgvector, and Google Gemini AI.

🔗 **Live Demo:** [your-app.vercel.app](https://ai-doc-chat-hkjs.vercel.app/)

---

## What it does

- Upload any PDF document (research papers, resumes, contracts, reports)
- AI processes the document using RAG (Retrieval-Augmented Generation)
- Ask questions in plain English and get accurate answers based on the document content
- Chat history is saved and loaded automatically per document

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

**Backend**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Supabase)
- pgvector (semantic search)

**AI/ML**
- Google Gemini API (embeddings + answer generation)
- RAG pipeline (Retrieval-Augmented Generation)
- Vector similarity search (cosine similarity)

**Infrastructure**
- Supabase (database + file storage + auth)
- Vercel (deployment)

---

## How the RAG pipeline works

1. User uploads a PDF
2. Text is extracted from the PDF in the browser using pdf.js
3. Text is split into chunks (~1000 characters each)
4. Each chunk is converted to a 768-dimensional vector using Gemini's embedding model
5. Vectors are stored in PostgreSQL using pgvector extension
6. When a user asks a question, the question is also converted to a vector
7. pgvector finds the most semantically similar chunks using cosine similarity
8. The matching chunks + question are sent to Gemini to generate a grounded answer
9. Answer and chat history are saved to the database

---

## Features

- ✅ User authentication (signup/login/logout)
- ✅ Protected routes
- ✅ PDF upload with drag and drop
- ✅ Real-time AI answers grounded in document content
- ✅ Chat history persistence
- ✅ Multiple document support
- ✅ Automatic model fallback for API reliability
- ✅ Fully deployed on Vercel

---

## Running locally

1. Clone the repo
```bash
git clone https://github.com/AyeshaAkram01/ai-doc-chat.git
cd ai-doc-chat
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables — create a `.env.local` file: