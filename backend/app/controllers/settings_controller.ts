import type { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import ChannelMember from '#models/channel_members'


export default class SettingsController {
  // GET /settings
  public async getSettings({ auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    return response.ok({
      status: user.status,
      notifPref: user.notifPref,
    })
  }

  // POST /settings
  public async updateSettings({ auth, request, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const { status, notifPref } = request.only(['status', 'notifPref'])

    // Direct update without validation
    user.status = status
    user.notifPref = notifPref
    await user.save()

    const payload = { event: 'refresh', userId: user.id };
    const channelMembers = await ChannelMember.query().select('user_id');
    for (const member of channelMembers) {
      transmit.broadcast(`user/${member.userId}`, payload);
    }

    return response.ok({
      status: user.status,
      notifPref: user.notifPref,
    })
  }
}
