import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channels'
import ChannelMember from '#models/channel_members'
import User from '#models/user' // Import the User model
import transmit from '@adonisjs/transmit/services/main'


export default class ChannelsController {

  public async exists({ params, response }: HttpContext) {
    const channel = await Channel.find(params.id)

    if (!channel) {
      return response.notFound({ exists: false })
    }

    return { exists: true, channel }
  }

  public async create({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const { name, visibility, description, users } = request.only([
        'name',
        'visibility',
        'description',
        'users',
      ])

      console.log('Creating channel with data:', { name, visibility, description, users })

      const existingChannel = await Channel.query()
        .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
        .first()

      if (existingChannel) {
        return response.badRequest({ error: `Channel "${name}" already exists` });
      }

      const channel = await Channel.create({
        name,
        visibility,
        description,
        ownerId: user.id,
      })

      await ChannelMember.create({
        isAdmin: true,
        userId: user.id,
        channelId: channel.id,
      })

      if (users && Array.isArray(users)) {
        for (const username of users) {
          const invitedUser = await User.findBy('nickname', username)
          if (invitedUser) {
            await ChannelMember.create({
              isAdmin: false,
              userId: invitedUser.id,
              channelId: channel.id,
              isInvited: true,
            })
          }
        }
      }

      const payload = { event: 'refresh', userId: user.id }
      const channelMembers = await ChannelMember.query().select('user_id')
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload)
      }

      return response.created({
        message: `Channel "${name}" successfully created`,
        data: channel,
      })
    } catch (err) {
      console.error('Failed to create channel:', err)
      return response.internalServerError({ error: 'Failed to create channel' })
    }
  }

}