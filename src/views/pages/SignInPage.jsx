import { Link } from 'react-router-dom'
import { useSignInForm } from '../../controllers/authController.js'
import AuthLayout from '../components/AuthLayout.jsx'
import CheckboxField from '../components/forms/CheckboxField.jsx'
import PasswordField from '../components/forms/PasswordField.jsx'

function SignInPage() {
  const { password, rememberMe } = useSignInForm()

  return (
    <AuthLayout
      title="Sign In"
      description="Enter your email and password to sign in!"
      footer={
        <p className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400 sm:text-start">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-brand-500 hover:text-brand-600">
            Sign Up
          </Link>
        </p>
      }
    >
      <form>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Email<span className="text-error-500">*</span>
            </label>
            <input
              type="email"
              placeholder="info@gmail.com"
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Password<span className="text-error-500">*</span>
            </label>
            <PasswordField
              showPassword={password.value}
              onToggle={password.toggle}
              className="h-11 w-full rounded-lg border border-gray-300 py-2.5 pr-11 pl-4 text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div className="flex items-center justify-between">
            <CheckboxField
              id="remember-me"
              label="Keep me logged in"
              checked={rememberMe.value}
              onChange={rememberMe.toggle}
            />
            <a href="#" className="text-sm text-brand-500 hover:text-brand-600">
              Forgot password?
            </a>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Sign In
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default SignInPage
