import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider, AccessToken } from '@adonisjs/auth/access_tokens'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'nickname'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true }) declare id: number

  @column() declare nickname: string
  @column({ columnName: 'first_name' }) declare firstName: string
  @column({ columnName: 'last_name' }) declare lastName: string
  @column() declare email: string

  @column({ serializeAs: null }) declare password: string

  @column() declare status: 'online' | 'offline' | 'dnd'
  @column({ columnName: 'notif_pref' }) declare notifPref: 'all' | 'mentions_only' | 'none'
  @column.dateTime({ columnName: 'last_online' }) declare lastOnline?: DateTime

  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })
  declare currentAccessToken?: AccessToken
}