import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class ChannelMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'is_admin' })
  declare isAdmin: boolean

  @column.dateTime({ columnName: 'joined_at', autoCreate: true })
  declare joinedAt: DateTime

  @column.dateTime({ columnName: 'left_at' })
  declare leftAt: DateTime | null

  @column({ columnName: 'is_banned' })
  declare isBanned: boolean

  @column({ columnName: 'is_pinned' })
  declare isPinned: boolean
  
   @column({ columnName: 'is_invited' })
  declare isInvited: boolean

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'channel_id' })
  declare channelId: number
  
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