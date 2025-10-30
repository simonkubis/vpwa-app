import { BaseSchema } from '@adonisjs/lucid/schema'

export default class KicksVotes extends BaseSchema {
  protected tableName = 'kicks_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()

      table.bigInteger('channel_id').unsigned().references('channels.id').onDelete('CASCADE')
      table.bigInteger('user_id').unsigned().references('users.id').onDelete('CASCADE')

      table.unique(['channel_id', 'user_id'])
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
