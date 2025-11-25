import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class KickVote extends BaseModel {
  public static table = 'kicks_votes'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'channel_id' })
  declare channelId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'kicker_id' })
  declare kickerId: number

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime
}