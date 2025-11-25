import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Invite extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'channel_id' })
  declare channelId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'accepted_at' })
  declare acceptedAt: DateTime | null
}