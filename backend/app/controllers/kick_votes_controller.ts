import type { HttpContext } from '@adonisjs/core/http'
import KickVote from '#models/kick_votes'
import ChannelMember from '#models/channel_members'
import User from '#models/user'
import transmit from '@adonisjs/transmit/services/main'

export default class KickVotesController {
    public async kickUser({ request, auth, response }: HttpContext) {
        const kicker = await auth.getUserOrFail()
        const { channelId, nickname } = request.only(['nickname', 'channelId'])

        // Convert channelId to number
        const numericChannelId = Number(channelId)
        if (isNaN(numericChannelId)) {
            return response.badRequest({ error: 'Invalid channelId' })
        }

        // Lookup the target user by nickname
        const targetUser = await User.query().where('nickname', nickname).first()
        if (!targetUser) {
            return response.notFound({ error: 'User not found' })
        }

        const userId = targetUser.id

        // Get the kicker's channel membership
        const kickerMember = await ChannelMember.query()
            .where('user_id', kicker.id)
            .andWhere('channel_id', numericChannelId)
            .first()

        if (!kickerMember) {
            return response.badRequest({ message: 'You are not a member of this channel.' })
        }

        const isAdminKick = kickerMember.isAdmin

        // Check if the kicker already voted to kick this user
        const existingVote = await KickVote.query()
            .where('user_id', userId)
            .andWhere('channel_id', numericChannelId)
            .andWhere('kicker_id', kicker.id)
            .first()

        if (existingVote) {
            return response.badRequest({ message: 'You have already kicked this user.' })
        }

        // Add new kick vote
        await KickVote.create({
            userId,
            channelId: numericChannelId,
            kickerId: kicker.id,
        })

        // Count total kicks for this user in this channel
        const totalKicks = await KickVote.query()
            .where('user_id', userId)
            .andWhere('channel_id', numericChannelId)
            .count('* as count')
            .first()

        const kickCount = totalKicks ? Number(totalKicks.$extras.count) : 0

        // Remove the user from channel_members
        const member = await ChannelMember.query()
            .where('user_id', userId)
            .andWhere('channel_id', numericChannelId)
            .first()


        const channelMembers = await ChannelMember.query().select('user_id');


        if (member) {
            if (isAdminKick || kickCount >= 3) {
                // Admin kick or 3+ votes -> permanent ban
                member.isBanned = true
                await member.save()
            } else {
                // Just remove from channel
                await member.delete()
            }
        }

        // 6. Broadcast refresh
        const payload = { event: 'refresh', userId: kicker.id };
        for (const member of channelMembers) {
            transmit.broadcast(`user/${member.userId}`, payload);
        }

        return response.ok({
            message: 'Kick registered',
            totalKicks: kickCount,
            banned: isAdminKick || kickCount >= 3,
        })
    }
}

