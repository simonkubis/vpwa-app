import type { HttpContext } from '@adonisjs/core/http'
import ChannelMember from '#models/channel_members'
import Channel from '#models/channels'
import { DateTime } from 'luxon'
import transmit from '@adonisjs/transmit/services/main'
import User from '#models/user'

export default class ChannelMembersController {
  public async getUserChannels({ auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();

      const channels = await Channel.query()
        .join('channel_members', 'channels.id', 'channel_members.channel_id')
        .where('channel_members.user_id', user.id)
        .andWhere('channel_members.is_banned', false)
        .select('channels.*', 'channel_members.*'); // Include all channel_members columns

      console.log('Fetched channels for user:', channels);

      return response.ok({ data: channels });
    } catch (err) {
      console.error('Failed to fetch user channels:', err);
      return response.internalServerError({ error: 'Failed to fetch user channels' });
    }
  }

  public async revokeUserFromChannel({ request, auth, response }: HttpContext) {
    try {
      const adminUser = await auth.getUserOrFail()
      const { channelId, nickname } = request.only(['channelId', 'nickname'])

      if (!channelId || !nickname) {
        return response.badRequest({ error: 'Missing channelId or nickname' })
      }

      // Fetch the channel
      const channel = await Channel.find(channelId)
      if (!channel) {
        return response.notFound({ error: 'Channel not found' })
      }

      // Only allow revoke in private channels
      if (channel.visibility !== 'private') {
        return response.unauthorized({ error: 'Revoke can only be used in private channels' })
      }

      // Only admins can revoke
      const adminMembership = await ChannelMember.query()
        .where('user_id', adminUser.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!adminMembership || !adminMembership.isAdmin) {
        return response.unauthorized({ error: 'Only admins can revoke users in private channels' })
      }

      // Find the target user by nickname
      const targetUser = await User.query().where('nickname', nickname).first()
      if (!targetUser) {
        return response.notFound({ error: 'User with this nickname does not exist' })
      }

      // Check if the target user is a member
      const membership = await ChannelMember.query()
        .where('user_id', targetUser.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership) {
        return response.notFound({ error: 'User is not a member of this channel' })
      }

      // Fetch all members BEFORE deleting the target membership
      const channelMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id')

      // Delete the target membership
      await membership.delete()

      // Broadcast refresh to all previous members (including the revoked user)
      const payload = { event: 'refresh', userId: null }
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload)
      }


      return response.ok({ message: `User "${nickname}" has been removed from the private channel` })
    } catch (err) {
      console.error('Failed to revoke user from channel:', err)
      return response.internalServerError({ error: 'Failed to revoke user from channel' })
    }
  }


  public async joinOrCreate({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();
      const { name, visibility } = request.only(['name', 'visibility']);

      if (!name || !visibility) {
        return response.badRequest({ error: 'Missing name or visibility' });
      }

      // Check if channel exists
      let channel = await Channel.query().where('name', name).first();

      

      if (channel) {

        const bannedMembership = await ChannelMember.query()
          .where('user_id', user.id)
          .andWhere('channel_id', channel.id)
          .andWhere('is_banned', true)
          .first()

        if (bannedMembership) {
          return response.forbidden({ error: 'You are banned from this channel' })
        }

        if (channel.visibility === 'public') {
          // Check if membership exists
          const existingMembership = await ChannelMember.query()
            .where({ userId: user.id, channelId: channel.id })
            .first();

          if (existingMembership) {
            if (existingMembership.isInvited) {
              // User was invited, now joining
              existingMembership.isInvited = false;
              existingMembership.joinedAt = DateTime.local();
              await existingMembership.save();

              const payload = { event: 'refresh', userId: user.id };
              const channelMembers = await ChannelMember.query().select('user_id');
              for (const member of channelMembers) {
                transmit.broadcast(`user/${member.userId}`, payload);
              }

              return response.ok({
                message: 'User has accepted the invitation and joined the channel',
                data: existingMembership,
              });
            }

            const payload = { event: 'refresh', userId: user.id };
            const channelMembers = await ChannelMember.query().select('user_id');
            for (const member of channelMembers) {
              transmit.broadcast(`user/${member.userId}`, payload);
            }

            return response.ok({
              message: 'User is already a member of this channel',
              data: existingMembership,
            });
          }

          // User not a member, create membership
          const newMembership = await ChannelMember.create({
            userId: user.id,
            channelId: channel.id,
            isAdmin: false,
            joinedAt: DateTime.local(),
            isInvited: false,
          });

          const payload = { event: 'refresh', userId: user.id };
          const channelMembers = await ChannelMember.query().select('user_id');
          for (const member of channelMembers) {
            transmit.broadcast(`user/${member.userId}`, payload);
          }

          return response.created({
            message: 'Joined existing channel',
            data: newMembership,
          });
        }

        return response.badRequest({ error: 'Cannot join a private channel without invitation' });
      }

      // Create new channel if it does not exist
      channel = await Channel.create({
        name,
        visibility,
        ownerId: user.id,
        createdAt: DateTime.local(),
      });

      // Creator automatically becomes admin
      const membership = await ChannelMember.create({
        userId: user.id,
        channelId: channel.id,
        isAdmin: true,
        joinedAt: DateTime.local(),
        isInvited: false,
      });

      const payload = { event: 'refresh', userId: user.id };
      const channelMembers = await ChannelMember.query().select('user_id');
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload);
      }

      return response.created({
        message: 'Channel created and user added as admin',
        data: { channel, membership },
      });
    } catch (err) {
      console.error('Failed to join or create channel:', err);
      return response.internalServerError({
        error: 'Failed to join or create channel',
      });
    }
  }



  public async deleteChannel({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const { channelId } = request.only(['channelId'])

      // Check that the channel exists
      const channel = await Channel.find(channelId)
      if (!channel) {
        return response.notFound({ error: 'Channel not found' })
      }

      // Check if user is admin of this channel
      const membership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership || !membership.isAdmin) {
        return response.unauthorized({ error: 'Only channel admins can delete channels' })
      }


      // 1) Fetch all members of the channel
      const channelMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id');

      // 2) Delete all channel_members rows
      await ChannelMember.query()
        .where('channel_id', channelId)
        .delete();

      // 3) Delete the channel itself
      await channel.delete();

      // 4) Broadcast refresh to all members
      const payload = { event: 'refresh', userId: '' };
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload);
      }



      return response.ok({ message: 'Channel deleted successfully' })
    } catch (err) {
      console.error('Failed to delete channel:', err)
      return response.internalServerError({ error: 'Failed to delete channel' })
    }
  }


  public async leaveChannel({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const { channelId } = request.only(['channelId'])

      const membership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership) {
        return response.notFound({ error: 'Channel membership not found' })
      }

      // Fetch all members before deletion for broadcasting
      const channelMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id')

      const payload = { event: 'refresh', userId: '' }

      if (membership.isAdmin) {
        // Broadcast refresh to all members before deletion
        for (const member of channelMembers) {
          transmit.broadcast(`user/${member.userId}`, payload)
        }

        // Delete all membership rows
        await ChannelMember.query().where('channel_id', channelId).delete()

        // Delete the channel itself
        const channel = await Channel.find(channelId)
        if (channel) {
          await channel.delete()
        }

        return response.ok({
          message: 'Admin left — channel and all memberships deleted',
        })
      }

      // Normal user → broadcast first, then delete only their membership
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload)
      }

      await membership.delete()

      return response.ok({ message: 'Left channel successfully' })
    } catch (err) {
      console.error('Failed to leave channel:', err)
      return response.internalServerError({ error: 'Failed to leave channel' })
    }
  }


  public async declineChannelInvite({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const { channelId } = request.only(['channelId'])

      const membership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership) {
        return response.notFound({ error: 'Channel membership not found' })
      }

      // Delete the membership row
      await membership.delete()

      const payload = { event: 'refresh', userId: user.id };
      const channelMembers = await ChannelMember.query().select('user_id');
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload);
      }

      return response.ok({ message: 'Invite declined successfully' })
    } catch (err) {
      console.error('Failed to decline channel invite:', err)
      return response.internalServerError({ error: 'Failed to decline channel invite' })
    }
  }

  public async getChannelById({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const { channelId } = request.params() // from /channel/:id

      // Fetch channel
      const channel = await Channel.query()
        .where('id', channelId)
        .first()

      if (!channel) {
        return response.notFound({ error: 'Channel not found' })
      }

      // Fetch membership for current user
      const membership = await ChannelMember.query()
        .where('channel_id', channelId)
        .andWhere('user_id', user.id)
        .first()

      // Fetch all members of the channel with their user names
      const members = await ChannelMember.query()
        .where('channel_id', channelId)
        .join('users', 'channel_members.user_id', 'users.id')
        .select(
          'users.id as userId',
          'users.nickname as nickname',
          'users.status as status',
          'channel_members.is_admin',
          'channel_members.joined_at',
          'channel_members.left_at',
          'channel_members.is_banned',
          'channel_members.is_pinned',
          'channel_members.is_invited'
        )

      // Fetch owner name
      const owner = await ChannelMember.query()
        .where('channel_id', channelId)
        .join('users', 'channel_members.user_id', 'users.id')
        .where('channel_members.user_id', channel.ownerId)
        .select('users.nickname as ownerName')
        .first()

      const channelMeta = {
        ...channel.toJSON(),
        ownerName: owner || 'unknown'
      }

      return response.ok({
        data: {
          channel: channelMeta,
          membership,
          members
        }
      })
    } catch (err) {
      console.error('Failed to fetch channel by ID:', err)
      return response.internalServerError({ error: 'Failed to fetch channel' })
    }
  }

  public async inviteUserToChannel({ request, auth, response }: HttpContext) {
    try {
      const inviter = await auth.getUserOrFail();
      const { channelId, nickname } = request.only(['channelId', 'nickname']);

      if (!channelId || !nickname) {
        return response.badRequest({ error: 'Missing channelId or nickname' });
      }

      // 1. Fetch channel
      const channel = await Channel.find(channelId);
      if (!channel) {
        return response.notFound({ error: 'Channel not found' });
      }

      // 2. Find user by nickname
      const userToInvite = await User.query().where('nickname', nickname).first();
      if (!userToInvite) {
        return response.notFound({ error: 'User with this nickname does not exist' });
      }

      const userToInviteMembership = await ChannelMember.query()
        .where('user_id', userToInvite.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (userToInviteMembership?.isBanned) {
        return response.forbidden({ error: 'User is banned from this channel' })
      }

      // Cannot invite yourself
      if (userToInvite.id === inviter.id) {
        return response.badRequest({ error: 'You cannot invite yourself' });
      }

      // 3. Private channel → only admins can invite
      if (channel.visibility === 'private') {
        const inviterMembership = await ChannelMember.query()
          .where('user_id', inviter.id)
          .andWhere('channel_id', channel.id)
          .first();

        if (!inviterMembership || !inviterMembership.isAdmin) {
          return response.unauthorized({
            error: 'Only admins can invite users to private channels',
          });
        }
      }

      // 4. Check if already a member or invited
      const existingMembership = await ChannelMember.query()
        .where('user_id', userToInvite.id)
        .andWhere('channel_id', channel.id)
        .first();

      if (existingMembership) {
        if (existingMembership.isInvited) {
          return response.badRequest({ error: 'User has already been invited' });
        }

        return response.badRequest({ error: 'User is already a member of this channel' });
      }

      // 5. Create invitation
      const invite = await ChannelMember.create({
        userId: userToInvite.id,
        channelId: channel.id,
        isInvited: true,
        isAdmin: false,
      });

      // 6. Broadcast refresh
      const payload = { event: 'refresh', userId: inviter.id };
      const channelMembers = await ChannelMember.query().select('user_id');
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload);
      }

      return response.created({
        message: `User ${nickname} invited successfully`,
        data: invite,
      });

    } catch (err) {
      console.error('Failed to invite user to channel:', err);
      return response.internalServerError({
        error: 'Failed to invite user to channel',
      });
    }
  }


  public async pinChannel({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const { channelId, isPinned } = request.only(['channelId', 'isPinned'])

      // Validate boolean
      if (typeof isPinned !== 'boolean') {
        return response.badRequest({ error: '`isPinned` must be a boolean' })
      }

      const membership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership) {
        return response.notFound({ error: 'Channel membership not found' })
      }

      membership.isPinned = isPinned
      await membership.save()

      return response.ok({ message: 'Channel pin status updated', data: membership })
    } catch (err) {
      console.error('Failed to update pin status:', err)
      return response.internalServerError({ error: 'Failed to update pin status' })
    }
  }

  public async acceptChannelInvite({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail()
      const { channelId } = request.only(['channelId'])

      const membership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership) {
        return response.notFound({ error: 'Channel membership not found' })
      }

      if (!membership.isInvited) {
        return response.badRequest({ error: 'User has already accepted the invite' })
      }

      // Update the membership
      membership.isInvited = false
      membership.joinedAt = DateTime.local()
      await membership.save()

      const payload = { event: 'refresh', userId: user.id };
      const channelMembers = await ChannelMember.query().select('user_id');
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload);
      }

      return response.ok({ data: membership })
    } catch (err) {
      console.error('Failed to accept channel invite:', err)
      return response.internalServerError({ error: 'Failed to accept channel invite' })
    }
  }



  public async assignChannelToUser({ request, auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();
      const { channelId } = request.only(['channelId']);

      const existingMembership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .first();

      if (existingMembership) {
        return response.badRequest({ error: 'User is already a member of this channel' });
      }

      const bannedMembership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .andWhere('is_banned', true)
        .first()

      if (bannedMembership) {
        return response.forbidden({ error: 'You are banned from this channel' })
      }

      const channelMember = await ChannelMember.create({
        userId: user.id,
        channelId,
      });

      const payload = { event: 'refresh', userId: user.id };
      const channelMembers = await ChannelMember.query().select('user_id');
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload);
      }

      return response.created({ data: channelMember });
    } catch (err) {
      console.error('Failed to assign channel to user:', err);
      return response.internalServerError({ error: 'Failed to assign channel to user' });
    }
  }
}