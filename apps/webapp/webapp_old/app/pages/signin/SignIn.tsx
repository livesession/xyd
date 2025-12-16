import { useState } from 'react'

import { SignInPage } from '~/components'
import { useAuth } from '~/contexts/AuthContext'

export async function clientLoader() { }
clientLoader.hydrate = true as const

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { initiateGoogleAuth } = useAuth()

  async function handleLogin() {
    console.log(email, password)
    // TODO: Implement email/password login
  }

  async function handleGoogleLogin() {
    try {
      setIsLoading(true)
      initiateGoogleAuth()
    } catch (error) {
      console.error('Google login failed:', error)
      setIsLoading(false)
    }
  }

  return <>
    <SignInPage
      onButtonGoogleClick={handleGoogleLogin}
      onButtonLoginClick={handleLogin}
      onInputEmailChange={(e) => setEmail(e.target.value)}
      onInputPasswordChange={(e) => setPassword(e.target.value)}
      loading={isLoading}
    />
  </>
}
