import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Channels extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.string('name', 100).notNullable()
      table.enum('visibility', ['public', 'private']).notNullable().defaultTo('public')
      table.bigInteger('owner_id').unsigned().references('users.id').onDelete('CASCADE')
      table.text('description').nullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
