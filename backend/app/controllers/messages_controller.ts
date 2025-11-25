import type { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import Message from '#models/messages'
import ChannelMember from '#models/channel_members'
import Channel from '#models/channels'


export default class MessagesController {
 public async fetchMessages({ request, response }: HttpContext) {
  try {
    const channelId = request.param('channelId')
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const messages = await Message.query()
      .where('messages.channel_id', channelId)
      .join('users', 'users.id', '=', 'messages.user_id')
      .select(
        'messages.*',
        'users.nickname as user_nickname'
      )
      .orderBy('messages.created_at', 'desc')
      .paginate(page, limit)

    return response.ok({ data: messages })
  } catch (err) {
    console.error('Failed to fetch messages:', err)
    return response.internalServerError({ error: 'Failed to fetch messages' })
  }
}

public async createMessage({ request, auth, response }: HttpContext) {
  try {
    const user = await auth.getUserOrFail();
    const { channelId, body, createdAt } = request.only([
      'channelId',
      'body',
      'createdAt'
    ]);

    // Create the message
    const message = await Message.create({
      userId: user.id,
      channelId,
      body,
      createdAt
    });

    const serializedMessage = message.serialize();

    // Fetch the channel info (including name)
      const channel = await Channel.query()
          .where('id', channelId)
          .firstOrFail();

      // Prepare payload with channel name included
      const payload = {
          event: 'new-message',
          channelId,
          channelName: channel.name, // <-- add this
          message: {
              id: serializedMessage.id,
              body: serializedMessage.body,
              userId: serializedMessage.userId,
              user_nickname: user.nickname,
              createdAt: serializedMessage.createdAt,
              channelId: serializedMessage.channelId
          }
      };

    // Fetch all members of the channel
    const channelMembers = await ChannelMember.query()
      .where('channel_id', channelId)
      .select('user_id');

    // Broadcast to each member's single subscription
    for (const member of channelMembers) {
      transmit.broadcast(`user/${member.userId}`, payload);
    }

    console.log('Broadcast completed to all channel members');

    return response.created({ data: message });
  } catch (err) {
    console.error('Failed to create message:', err);
    return response.internalServerError({ error: 'Failed to create message' });
  }
}
}