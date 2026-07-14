import { Link } from 'react-router-dom'
import { useDarkMode } from '../../controllers/themeController.js'
import CommonGridShape from './CommonGridShape.jsx'

function AuthLayout({ title, description, children, footer }) {
  const { darkMode, toggleDarkMode } = useDarkMode()

  return (
    <div
      className={`relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}
    >
      <div className="relative flex h-screen w-full flex-col justify-center dark:bg-gray-900 sm:p-0 lg:flex-row">
        <div className="flex w-full flex-1 flex-col lg:w-1/2">
          <div className="mx-auto w-full max-w-md pt-10">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ← Back to dashboard
            </Link>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <div className="mb-5 sm:mb-8">
              <h1 className="text-title-sm mb-2 font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
                {title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
            {children}
            {footer}
          </div>
        </div>

        <div className="relative hidden h-full w-full items-center bg-brand-950 dark:bg-white/5 lg:grid lg:w-1/2">
          <div className="z-1 flex items-center justify-center">
            <CommonGridShape />
            <div className="flex max-w-xs flex-col items-center">
              <Link to="/" className="mb-4 block">
                <img src="/images/logo/auth-logo.svg" alt="Logo" />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                Free and Open-Source Tailwind CSS Admin Dashboard Template
              </p>
            </div>
          </div>
        </div>

        <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
