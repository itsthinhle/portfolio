'use server'
import { signIn as authSignin } from '@/auth'

export async function signIn(_provider = 'google') {
  await authSignin(_provider)
}