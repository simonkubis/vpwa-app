import { BaseCommand } from '@adonisjs/core/ace'
import Channel from '#models/channels'
import ChannelMember from '#models/channel_members'
import Message from '#models/messages'
import transmit from '#config/transmit'
import { DateTime } from 'luxon'

export default class CleanupInactiveChannels extends BaseCommand {
  public static commandName = 'channels:cleanup'
  public static description = 'Delete channels with no new messages for 30+ days'

  public async run() {
    const cutoff = DateTime.local().minus({ days: 30 }).toJSDate()

    // Fetch channels where last message is older than cutoff or no messages
    const channels = await Channel.query()
      .select('channels.*')
      .leftJoin('messages', 'messages.channel_id', 'channels.id')
      .groupBy('channels.id')
      .havingRaw('MAX(messages.created_at) IS NULL OR MAX(messages.created_at) < ?', [cutoff])

    if (channels.length === 0) {
      console.log('No inactive channels to delete.')
      return
    }

    for (const channel of channels) {
      console.log(`Deleting inactive channel: ${channel.name}`)

      // Fetch all members BEFORE deletion for broadcasting
      const members = await ChannelMember.query()
        .where('channel_id', channel.id)
        .select('user_id')

      // Delete all memberships
      await ChannelMember.query().where('channel_id', channel.id).delete()

      // Delete the channel
      await channel.delete()

      // Broadcast refresh to all previous members (including revoked)
      const payload = { event: 'refresh', userId: null } // system-triggered
      // for (const member of members) {
      //   transmit.broadcast(`user/${member.userId}`, payload)
      // }
    }

    console.log(`Cleanup complete: ${channels.length} inactive channel(s) deleted.`)
  }
}