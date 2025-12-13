import { BaseCommand } from '@adonisjs/core/ace'
import cron from 'node-cron'
import Channel from '#models/channels'
import ChannelMember from '#models/channel_members'
import { DateTime } from 'luxon'

export default class CleanupInactiveChannels extends BaseCommand {

  public static async runCleanup() {
    const cutoff = DateTime.local().minus({ days: 30 }).toJSDate()

    const channels = await Channel.query()
      .leftJoin('messages', 'messages.channel_id', 'channels.id')
      .groupBy('channels.id')
      .havingRaw('MAX(messages.created_at) IS NULL OR MAX(messages.created_at) < ?', [cutoff])

    if (!channels.length) {
      console.log('No inactive channels to delete.')
      return
    }

    for (const channel of channels) {

      await ChannelMember.query().where('channel_id', channel.id).delete()
      await channel.delete()

      console.log(`Deleted inactive channel: ${channel.name}`)
    }

    console.log(`Cleanup complete: ${channels.length} channel(s) deleted.`)
  }


}

cron.schedule('0 0 * * *', async () => {
  try {
    console.log('[Scheduler] Running inactive channels cleanup...')
    await CleanupInactiveChannels.runCleanup()
    console.log('[Scheduler] Cleanup complete.')
  } catch (err) {
    console.error('[Scheduler] Cleanup failed:', err)
  }
})
