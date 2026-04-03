export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">SK Properties</p>
          <h1 className="mt-2 text-xl font-medium text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">
            CRM access for admin and operator users.
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-400">
              Phone
            </label>
            <input
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600"
              placeholder="+91XXXXXXXXXX"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-400">
              Password
            </label>
            <input
              type="password"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600"
              placeholder="Enter password"
            />
          </div>

          <button className="h-11 w-full rounded-lg bg-gray-900 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            Continue
          </button>
        </form>
      </div>
    </main>
  )
}
