import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare body: string

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'channel_id' })
  declare channelId: number

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  toJSON() {
    const serialized = super.toJSON(); 

    if (this.$extras) {
      return {
        ...serialized,
        ...this.$extras 
      };
    }

    return serialized;
  }
}