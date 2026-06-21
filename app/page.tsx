import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Doc Chat
        </h1>
        <p className="text-gray-600 mb-8">
          Upload any PDF and chat with it using AI
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="border border-black text-black px-6 py-3 rounded-lg hover:bg-gray-100"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}