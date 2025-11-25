import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ChannelMembers extends BaseSchema {
  protected tableName = 'channel_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.boolean('is_admin').notNullable().defaultTo(false)
      table.timestamp('joined_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('left_at', { useTz: true }).nullable()
      table.boolean('is_banned').notNullable().defaultTo(false)
      table.boolean('is_pinned').notNullable().defaultTo(false)
      table.boolean('is_invited').notNullable().defaultTo(false)

      table.bigInteger('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.bigInteger('channel_id').unsigned().references('channels.id').onDelete('CASCADE')

      table.unique(['user_id', 'channel_id'])
      table.index(['channel_id'])
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
