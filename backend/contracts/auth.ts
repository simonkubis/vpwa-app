import authConfig from '#config/auth'
import type {
  InferAuthenticators,
  Authenticators as AuthenticatorEvents,
  InferAuthEvents,
} from '@adonisjs/auth/types'

declare module '@adonisjs/auth/types' {
  interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}

declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<AuthenticatorEvents> {}
}