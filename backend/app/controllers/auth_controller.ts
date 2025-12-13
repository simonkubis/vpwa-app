import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import { errors as authErrors } from '@adonisjs/auth'

const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2),
    lastName: vine.string().trim().minLength(2),
    email: vine.string().trim().email(),
    nickname: vine.string().trim().minLength(3),
    password: vine.string().minLength(8),
  })
)

const loginValidator = vine.compile(
  vine.object({
    username: vine.string().trim(),   
    password: vine.string(),
  })
)

function toPublicUser(u: User) {
  return {
    id: u.id,
    nickname: u.nickname,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    status: u.status,
    notifPref: u.notifPref,
    lastOnline: u.lastOnline,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}


export default class AuthController {
  async register({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    const [emailExists, nickExists] = await Promise.all([
      User.findBy('email', payload.email),
      User.findBy('nickname', payload.nickname),
    ])

    if (emailExists || nickExists) {
      const errors = []
      if (nickExists) errors.push({ message: 'Nickname is already taken' })
      if (emailExists) errors.push({ message: 'Email is already registered' })
      return response.status(409).send({ errors })
    }

    const user = await User.create({
      nickname: payload.nickname,
      firstName: payload.name,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      status: 'online',
      notifPref: 'all',
    })

    const token = await auth.use('api').createToken(user)

    return response.created({
      token: token.value!.release(),
      user: toPublicUser(user)
    })
  }


  async login({ request, auth, response }: HttpContext) {
    const { username, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(username, password)
      const token = await auth.use('api').createToken(user)
      return { token: token.value!.release(), user: toPublicUser(user) }
    } catch (error) {
      if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
        return response.unauthorized({message: 'Login failded. Invalid credentials.' })
      }
      throw error
    }
  }


  async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken() 
    return response.noContent()
  }

  async me({ auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    return { user: toPublicUser(user) }
  }
}