import type { HttpContext } from '@adonisjs/core/http'
import KickVote from '#models/kick_votes'
import ChannelMember from '#models/channel_members'
import User from '#models/user'
import transmit from '@adonisjs/transmit/services/main'
import is from '@adonisjs/core/helpers/is'

export default class KickVotesController {
    public async kickUser({ request, auth, response }: HttpContext) {
        const kicker = await auth.getUserOrFail()
        const { channelId, nickname } = request.only(['nickname', 'channelId'])

        // Convert channelId to number
        const numericChannelId = Number(channelId)
        if (isNaN(numericChannelId)) {
            return response.badRequest({ error: `Could not kick ${nickname}: Invalid channelId` })
        }

        // Lookup the target user by nickname
        const targetUser = await User.query().where('nickname', nickname).first()
        if (!targetUser) {
            return response.notFound({ error: `Could not kick ${nickname}: User not found` })
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
        console.log(`User ${kicker.nickname} (ID: ${kicker.id}) is attempting to kick ${nickname} (ID: ${userId}) from channel ID ${numericChannelId}. Admin kick: ${isAdminKick}`)
        
        const targetMembership = await ChannelMember.query()
            .where('user_id', userId)
            .andWhere('channel_id', numericChannelId)
            .first()

        if (!targetMembership) {
            return response.badRequest({
                error: `Could not kick ${nickname}: User is not a member of this channel`,
            })
        }

        if (targetMembership.isBanned) {
            return response.badRequest({
                error: `Could not kick ${nickname}: User is already banned from this channel`,
            })
        }

        // Check if the kicker already voted to kick this user
        const existingVote = await KickVote.query()
            .where('user_id', userId)
            .andWhere('channel_id', numericChannelId)
            .andWhere('kicker_id', kicker.id)
            .first()

        if (existingVote && isAdminKick === false) {
            return response.badRequest({ message: `Could not vote for ${nickname}: You've already voted` });
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

        let banned = false;

        if (member) {
            if (isAdminKick || kickCount >= 3) {
                // Admin kick or 3+ votes -> permanent ban
                member.isBanned = true
                await member.save()
                banned = true;
            }
        }

        // 6. Broadcast refresh
        const payload = { event: 'refresh', userId: null };
        for (const member of channelMembers) {
            transmit.broadcast(`user/${member.userId}`, payload);
        }

        const message = banned
        ? `User "${nickname}" has been kicked and banned from this channel.`
        : `Kick vote registered for "${nickname}" (${kickCount}/3).`

        return response.ok({
            message: message,
            totalKicks: kickCount,
            banned: isAdminKick || kickCount >= 3,
        })
    }
}

