'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [selectedDocName, setSelectedDocName] = useState<string>('')
  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [asking, setAsking] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        setUserEmail(session.user.email || null)
        fetchDocuments(session.user.id)
      }
    })

    return () => { authListener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const fetchDocuments = async (uid: string) => {
    const response = await fetch(`/api/documents?userId=${uid}`)
    const data = await response.json()
    setDocuments(data.documents || [])
  }

  const loadChatHistory = async (documentId: string) => {
    if (!userId || !documentId) { setChatHistory([]); return }
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

  const handleUpload = async (uploadFile: File) => {
    if (uploading) return

    if (!uploadFile.name.endsWith('.pdf')) {
      setError('Only PDF files are allowed')
      return
    }

    if (!userId || !userEmail) {
      setError('Still loading your account, please wait a moment')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const fileText = await extractTextFromPDF(uploadFile)

      if (!fileText || fileText.trim().length === 0) {
        throw new Error('Could not extract text. This PDF might be a scanned image.')
      }

      const fileName = `${userId}/${Date.now()}-${uploadFile.name}`

      const { error: uploadError } = await supabase.storage
        .from('document')
        .upload(fileName, uploadFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('document')
        .getPublicUrl(fileName)

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadFile.name,
          fileUrl: publicUrl,
          userId,
          userEmail,
          fileText,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save document')
      }

      setSuccess('PDF uploaded and processed successfully!')
      setFile(null)

      const response2 = await fetch(`/api/documents?userId=${userId}`)
      const data2 = await response2.json()
      setDocuments(data2.documents || [])

      if (data2.documents && data2.documents.length > 0) {
        setSelectedDoc(data2.documents[0].id)
        setSelectedDocName(data2.documents[0].name)
        loadChatHistory(data2.documents[0].id)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) { setFile(selected); handleUpload(selected) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) { setFile(dropped); handleUpload(dropped) }
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
        body: JSON.stringify({ question: currentQuestion, documentId: selectedDoc, userId }),
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="px-6 py-3 flex items-center justify-between sticky top-0 z-10" style={{background:'#1a1a1a'}}>
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'#378ADD'}}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <span className="font-semibold text-white text-sm">AI Doc Chat</span>
  </div>
  <div className="flex items-center gap-3">
    {userEmail && (
      <span className="text-xs px-3 py-1.5 rounded-full" style={{background:'#2d2d2d', color:'#aaaaaa'}}>
        {userEmail}
      </span>
    )}
    <button
      onClick={handleLogout}
      className="text-xs text-white px-3 py-1.5 rounded-lg transition-colors"
      style={{background:'#378ADD'}}
    >
      Logout
    </button>
  </div>
</nav>

      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-4">

        {/* Upload Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload a PDF
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-100 text-green-600 text-xs px-4 py-3 rounded-lg mb-4">
              ✓ {success}
            </div>
          )}

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            {uploading ? (
              <div>
                <p className="text-sm font-medium text-blue-600">Processing your PDF...</p>
                <p className="text-xs text-gray-400 mt-1">Extracting text and generating embeddings</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700">Drop your PDF here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports PDF files up to 10MB</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Document Selector */}
{documents.length > 0 && (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
      </svg>
      Select a document to chat with
    </h2>
    <select
      value={selectedDoc || ''}
      onChange={(e) => {
        const docId = e.target.value
        const docName = documents.find(d => d.id === docId)?.name || ''
        setSelectedDoc(docId)
        setSelectedDocName(docName)
        loadChatHistory(docId)
      }}
      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white text-gray-700"
    >
      <option value="">Choose a document...</option>
      {documents.map((doc) => (
        <option key={doc.id} value={doc.id}>
          {doc.name} — {formatDate(doc.createdAt)}
        </option>
      ))}
    </select>
  </div>
)}
        {/* Chat Card */}
        {selectedDoc && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="truncate">Chat — {selectedDocName}</span>
            </h2>

            <div className="flex flex-col gap-3 mb-4 max-h-80 overflow-y-auto">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Ask anything about this document</p>
                  <p className="text-xs text-gray-400 mt-1">The AI will answer based on the PDF content</p>
                </div>
              )}
              {chatHistory.map((chat, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="self-end bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]">
                    {chat.question}
                  </div>
                  <div className="self-start bg-gray-50 border border-gray-100 text-gray-700 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[80%] leading-relaxed">
                    {chat.answer}
                  </div>
                </div>
              ))}
              {asking && (
                <div className="self-start bg-gray-50 border border-gray-100 text-gray-400 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm">
                  Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question about this document..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !asking && handleAsk()}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
              <button
                onClick={handleAsk}
                disabled={asking || !question.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {asking ? '...' : 'Ask'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}