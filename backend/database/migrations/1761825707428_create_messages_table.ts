import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Messages extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.text('body').notNullable()

      table.bigInteger('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.bigInteger('channel_id').unsigned().references('channels.id').onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()

      table.index(['channel_id'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
