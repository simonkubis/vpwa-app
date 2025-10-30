import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.string('nickname', 50).notNullable().unique()
      table.string('first_name', 100).notNullable()
      table.string('last_name', 100).notNullable()
      table.string('email', 255).notNullable().unique()
      table.string('password', 255).notNullable()

      table.enum('status', ['online', 'offline', 'dnd']).notNullable().defaultTo('offline')
      table.enum('notif_pref', ['all', 'mentions_only', 'none']).notNullable().defaultTo('all')
      table.timestamp('last_online', { useTz: true }).defaultTo(this.now())

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
