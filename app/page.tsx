import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-100" style={{background:'#1a1a1a'}}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'#378ADD'}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className="font-semibold text-white text-sm">AI Doc Chat</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="text-sm text-white px-4 py-2 rounded-lg transition-colors" style={{background:'#378ADD'}}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-4 py-2 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Powered by Google Gemini AI + RAG
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Chat with any
          <span style={{color:'#378ADD'}}> PDF document</span>
          <br />using AI
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          Upload any PDF — research papers, contracts, resumes, reports — and instantly get accurate answers from its content using AI.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="text-sm font-medium text-white px-6 py-3 rounded-xl transition-colors"
            style={{background:'#1a1a1a'}}
          >
            Start for free →
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Login to your account
          </Link>
        </div>
      </section>

      {/* App preview */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <div className="px-5 py-3 flex items-center gap-2" style={{background:'#1a1a1a'}}>
            <div className="w-3 h-3 rounded-full bg-red-400"/>
            <div className="w-3 h-3 rounded-full bg-yellow-400"/>
            <div className="w-3 h-3 rounded-full bg-green-400"/>
            <span className="text-xs text-gray-400 ml-2">ai-doc-chat.vercel.app/dashboard</span>
          </div>
          <div className="bg-gray-50 p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <p className="text-xs text-gray-400 mb-3 font-medium">CHAT — RESEARCH_PAPER.PDF</p>
              <div className="flex flex-col gap-2">
                <div className="self-end bg-blue-600 text-white text-xs px-3 py-2 rounded-xl rounded-br-sm max-w-xs w-fit ml-auto">
                  What is the main conclusion of this paper?
                </div>
                <div className="self-start bg-gray-50 border border-gray-100 text-gray-700 text-xs px-3 py-2 rounded-xl rounded-bl-sm max-w-xs leading-relaxed">
                  Based on the document, the main conclusion is that transformer-based models significantly outperform traditional approaches in NLP tasks, achieving 94.2% accuracy on the benchmark dataset.
                </div>
                <div className="self-end bg-blue-600 text-white text-xs px-3 py-2 rounded-xl rounded-br-sm max-w-xs w-fit ml-auto">
                  What dataset was used?
                </div>
                <div className="self-start bg-gray-50 border border-gray-100 text-gray-700 text-xs px-3 py-2 rounded-xl rounded-bl-sm max-w-xs leading-relaxed">
                  The study used the GLUE benchmark dataset, consisting of 9 different NLP tasks with over 1 million labeled examples.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
            How it works
          </h2>
          <p className="text-gray-500 text-center mb-12 text-sm">
            Three simple steps to chat with your documents
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:'#E6F1FB'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{color:'#185FA5'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">1. Upload your PDF</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Drag and drop any PDF file. We extract and process the text automatically.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:'#E6F1FB'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{color:'#185FA5'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">2. AI processes it</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Gemini AI converts your document into searchable vectors stored in our database.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{background:'#E6F1FB'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{color:'#185FA5'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">3. Ask anything</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Ask questions in plain English and get accurate answers based on your document.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Built with Next.js, Supabase, pgvector and Google Gemini AI
        </p>
      </footer>

    </div>
  )
}