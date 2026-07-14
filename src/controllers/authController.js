import { usePasswordToggle, useToggle } from './formController.js'

export function useSignInForm() {
  const password = usePasswordToggle()
  const rememberMe = useToggle(false)

  return { password, rememberMe }
}

export function useSignUpForm() {
  const password = usePasswordToggle()
  const termsAccepted = useToggle(false)

  return { password, termsAccepted }
}
