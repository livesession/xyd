import { useState } from 'react'

import { AuthUiSignInPage } from "@livesession/authjs-ui"
import {Button} from "@livesession/design-system"

function App() {
  return (
    <>
      <LoginForm/>
      <Button>Login</Button>
    </>
  )
}

function LoginForm() {
  return <AuthUiSignInPage
    formSurface=
    {<div>
      <AuthUiSignInPage.InputEmail />
      <AuthUiSignInPage.InputPassword />
    </div>
    }
    secondaryActionSurface={
      <div>
        <AuthUiSignInPage.ButtonGoogle />
      </div>
    }
    signupTo=""
  />
}
export default App
