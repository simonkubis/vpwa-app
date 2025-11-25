import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare visibility: 'public' | 'private'

  @column({ columnName: 'owner_id' })
  declare ownerId: number

  @column()
  declare description: string | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  toJSON() {
    const serialized = super.toJSON(); // Get default attributes

    // Check if $extras exists (i.e., if the query included it) and merge
    if (this.$extras) {
      return {
        ...serialized,
        ...this.$extras // <-- This injects is_admin, joined_at, etc.
      };
    }

    return serialized;
  }
}
