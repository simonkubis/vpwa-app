import type { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import ChannelMember from '#models/channel_members'

export default class TypingController {
  public async sendTyping({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();
      const { channelId, text } = request.only(['channelId', 'text']);

      // Fetch all members of the channel
      const channelMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id');

      // Broadcast typing event to each member except the sender
      for (const member of channelMembers) {
        if (member.userId === user.id) continue; // Skip sender

        transmit.broadcast(`user/${member.userId}`, {
          event: 'user-typing',
          channelId,
          userId: user.id,
          user_nickname: user.nickname,
          text // Optional: text being typed
        });
      }

      console.log(`Typing event broadcasted for channel ${channelId}`);
      return response.ok({ status: 'ok' });
    } catch (err) {
      console.error('Failed to broadcast typing:', err);
      return response.internalServerError({ error: 'Failed to broadcast typing' });
    }
  }
}
