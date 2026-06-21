'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Document {
  id: string
  name: string
  createdAt: string
}

interface ChatMessage {
  question: string
  answer: string
}

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [asking, setAsking] = useState(false)
  const router = useRouter()

  const [userEmail, setUserEmail] = useState<string | null>(null)

useEffect(() => {
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      setUserEmail(user.email || null)
      fetchDocuments(user.id)
    }
  }
  getUser()
}, [])

  const fetchDocuments = async (uid: string) => {
    const response = await fetch(`/api/documents?userId=${uid}`)
    const data = await response.json()
    setDocuments(data.documents || [])
  }
  const loadChatHistory = async (documentId: string) => {
  if (!userId || !documentId) {
    setChatHistory([])
    return
  }

  const response = await fetch(`/api/chat?documentId=${documentId}&userId=${userId}`)
  const data = await response.json()
  setChatHistory(data.chats || [])
}

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first')
      return
    }

    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are allowed')
      return
    }

    if (!userId || !userEmail) {
  setError('Still loading your account info, please wait a moment and try again')
  return
}

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const fileText = await extractTextFromPDF(file)

      if (!fileText || fileText.trim().length === 0) {
        throw new Error('Could not extract text from this PDF. It might be a scanned image.')
      }

      const fileName = `${userId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('document')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('document')
        .getPublicUrl(fileName)

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          fileUrl: publicUrl,
          userId: userId,
          fileText: fileText,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save document')
      }

      setSuccess('PDF uploaded and processed successfully! ✅')
setFile(null)

const response2 = await fetch(`/api/documents?userId=${userId}`)
const data2 = await response2.json()
setDocuments(data2.documents || [])

if (data2.documents && data2.documents.length > 0) {
  setSelectedDoc(data2.documents[0].id)
  loadChatHistory(data2.documents[0].id)
}

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async () => {
    if (!question.trim() || !selectedDoc || !userId) return

    setAsking(true)
    const currentQuestion = question
    setQuestion('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          documentId: selectedDoc,
          userId: userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setChatHistory(prev => [...prev, { question: currentQuestion, answer: data.answer }])

    } catch (err) {
      setChatHistory(prev => [...prev, { 
        question: currentQuestion, 
        answer: err instanceof Error ? err.message : 'Something went wrong' 
      }])
    } finally {
      setAsking(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            AI Doc Chat
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-black underline"
          >
            Logout
          </button>
        </div>

        {/* Upload Box */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload a PDF
          </h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm"
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="bg-black text-white py-3 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {uploading ? 'Processing PDF... (this can take a minute)' : 'Upload PDF'}
            </button>
          </div>
        </div>

        {/* Document Selector + Chat */}
        {documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Chat with your document
            </h2>

            <select
  value={selectedDoc || ''}
  onChange={(e) => {
    setSelectedDoc(e.target.value)
    loadChatHistory(e.target.value)
  }}
  className="border border-gray-300 rounded-lg px-4 py-3 text-sm w-full mb-4"
>
              <option value="">Select a document</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>

            {selectedDoc && (
              <>
                <div className="flex flex-col gap-4 mb-4 max-h-96 overflow-y-auto">
                  {chatHistory.map((chat, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="bg-gray-100 rounded-lg p-3 text-sm self-end max-w-[80%]">
                        {chat.question}
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-sm max-w-[80%]">
                        {chat.answer}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question about this document..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    className="border border-gray-300 rounded-lg px-4 py-3 text-sm flex-1"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={asking || !question.trim()}
                    className="bg-black text-white px-6 py-3 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
                  >
                    {asking ? '...' : 'Ask'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </main>
  )
}