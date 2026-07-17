import { useSignInForm } from "../../controllers/authController.js";
import {
  FORM_STACK_CLASS,
  INPUT_CLASS,
  INPUT_ERROR_CLASS,
  LABEL_CLASS,
} from "../../models/formLayoutModel.js";
import AuthLayout from "../components/AuthLayout.jsx";
import { FieldError, RequiredMark } from "../components/forms/FormHelpers.jsx";
import PasswordField from "../components/forms/PasswordField.jsx";

function SignInPage() {
  const {
    password,
    form,
    fieldErrors,
    error,
    submitting,
    updateField,
    handleSubmit,
  } = useSignInForm();

  return (
    <AuthLayout
      title="Sign In"
      description="Enter your work email and password to access EMP."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className={FORM_STACK_CLASS}>
          {error ? (
            <p className="text-theme-sm text-error-600">{error}</p>
          ) : null}
          <div>
            <label className={LABEL_CLASS} htmlFor="signin-email">
              Email
              <RequiredMark />
            </label>
            <input
              id="signin-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="abc@company.com"
              className={
                fieldErrors.email ? INPUT_ERROR_CLASS : INPUT_CLASS
              }
              autoComplete="email"
            />
            <FieldError message={fieldErrors.email} />
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="signin-password">
              Password
              <RequiredMark />
            </label>
            <PasswordField
              id="signin-password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              showPassword={password.showPassword}
              onToggle={password.onToggle}
              className={`${
                fieldErrors.password ? INPUT_ERROR_CLASS : INPUT_CLASS
              } pr-11`}
              autoComplete="current-password"
            />
            <FieldError message={fieldErrors.password} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default SignInPage;
