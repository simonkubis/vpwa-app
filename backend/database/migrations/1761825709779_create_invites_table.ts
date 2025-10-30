import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Invites extends BaseSchema {
  protected tableName = 'invites'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()

      table.bigInteger('channel_id').unsigned().references('channels.id').onDelete('CASCADE')
      table.bigInteger('user_id').unsigned().references('users.id').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('accepted_at', { useTz: true }).nullable()

      table.unique(['channel_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
