import type { HttpContext } from '@adonisjs/core/http'
import Invite from '#models/invites'

export default class InvitesController {
  public async me({ auth, response }: HttpContext) {
    try {
      const invites = await Invite.query()
        .where('userId', auth.getUserOrFail().id)

      return response.ok({ data: invites })
    } catch (err) {
      console.error('Failed to fetch invites for me:', err)
      return response.internalServerError({ error: 'Failed to fetch invites' })
    }
  }

  public async create({ request, auth, response }: HttpContext) {
    try {
      await auth.getUserOrFail(); 
      const { channelId, invitedUsers } = request.only(['channelId', 'invitedUsers']);

      if (!Array.isArray(invitedUsers) || !channelId) {
        return response.badRequest({ error: 'Invalid data provided' });
      }

      const invites = invitedUsers.map((userId) => ({
        channelId,
        userId,
      }));

      await Invite.createMany(invites);

      return response.created({ message: 'Invites created successfully' });
    } catch (err) {
      console.error('Failed to create invites:', err);
      return response.internalServerError({ error: 'Failed to create invites' });
    }
  }
}