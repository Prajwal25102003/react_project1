import { Link } from 'react-router-dom'
import { useSignUpForm } from '../../controllers/authController.js'
import AuthLayout from '../components/AuthLayout.jsx'
import CheckboxField from '../components/forms/CheckboxField.jsx'
import PasswordField from '../components/forms/PasswordField.jsx'

function SignUpPage() {
  const { password, termsAccepted } = useSignUpForm()

  return (
    <AuthLayout
      title="Sign Up"
      description="Enter your email and password to sign up!"
      footer={
        <p className="mt-5 text-center text-sm text-gray-700 dark:text-gray-400 sm:text-start">
          Already have an account?{' '}
          <Link to="/signin" className="text-brand-500 hover:text-brand-600">
            Sign In
          </Link>
        </p>
      }
    >
      <form>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                First Name<span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your first name"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Last Name<span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your last name"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Email<span className="text-error-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email"
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
          <CheckboxField
            id="terms"
            label="By creating an account means you agree to the Terms and Conditions, and our Privacy Policy"
            checked={termsAccepted.value}
            onChange={termsAccepted.toggle}
          />
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Sign Up
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default SignUpPage
