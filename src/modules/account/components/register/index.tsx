import { useState } from "react"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@lib/firebase/firebaseconfig"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"

// Define hardcoded access codes here
const validAccessCodes = ["ACCESS123", "VIPCODE"]

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate access code
    if (!validAccessCodes.includes(accessCode)) {
      setError("Invalid access code.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      // Firebase registration
      await createUserWithEmailAndPassword(auth, email, password)
      setCurrentView(LOGIN_VIEW.SIGN_IN) // Redirect to login after successful registration
    } catch (error) {
      setError("Registration failed. Please try again.")
    }
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Create your account</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Join us by creating an account with your email and password.
      </p>
      <form className="w-full" onSubmit={handleRegister}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="password-input"
          />
          <Input
            label="Access Code"
            name="accessCode"
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            required
            data-testid="access-code-input"
          />
        </div>
        {error && <ErrorMessage error={error} data-testid="register-error-message" />}
        <SubmitButton data-testid="register-button" className="w-full mt-6">
          Register
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Already have an account?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
          data-testid="sign-in-button"
        >
          Sign in
        </button>
        .
      </span>
    </div>
  )
}

export default Register
