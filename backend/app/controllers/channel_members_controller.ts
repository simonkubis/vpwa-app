import type { HttpContext } from '@adonisjs/core/http'
import ChannelMember from '#models/channel_members'
import Channel from '#models/channels'
import { DateTime } from 'luxon'
import transmit from '@adonisjs/transmit/services/main'
import User from '#models/user'
import KickVote from '#models/kick_votes'

export default class ChannelMembersController {
  public async getUserChannels({ auth, response }: HttpContext) {
    try {
      const user = await auth.getUserOrFail();

      const channels = await Channel.query()
        .join('channel_members', 'channels.id', 'channel_members.channel_id')
        .where('channel_members.user_id', user.id)
        .andWhere('channel_members.is_banned', false)
        .select('channels.*', 'channel_members.*'); 

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

      const channel = await Channel.find(channelId)
      if (!channel) {
        return response.notFound({ error: 'Channel not found' })
      }

      if (channel.visibility !== 'private') {
        return response.unauthorized({ error: 'Revoke can only be used in private channels' })
      }

      const adminMembership = await ChannelMember.query()
        .where('user_id', adminUser.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!adminMembership || !adminMembership.isAdmin) {
        return response.unauthorized({ error: 'Only admins can revoke users in private channels' })
      }

      const targetUser = await User.query().where('nickname', nickname).first()
      if (!targetUser) {
        return response.notFound({ error: 'User with this nickname does not exist' })
      }

      const membership = await ChannelMember.query()
        .where('user_id', targetUser.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership) {
        return response.notFound({ error: 'User is not a member of this channel' })
      }

      const channelMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id')

      await membership.delete()

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
          const existingMembership = await ChannelMember.query()
            .where({ userId: user.id, channelId: channel.id })
            .first();

          if (existingMembership) {
            if (existingMembership.isInvited) {
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

      channel = await Channel.create({
        name,
        visibility,
        ownerId: user.id,
        createdAt: DateTime.local(),
      });

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

      const channel = await Channel.find(channelId)
      if (!channel) {
        return response.notFound({ error: 'Channel not found' })
      }

      const membership = await ChannelMember.query()
        .where('user_id', user.id)
        .andWhere('channel_id', channelId)
        .first()

      if (!membership || !membership.isAdmin) {
        return response.unauthorized({ error: 'Only channel admins can delete channels' })
      }


      const channelMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id');

      await ChannelMember.query()
        .where('channel_id', channelId)
        .delete();

      await channel.delete();

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

      const channelMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id')

      const payload = { event: 'refresh', userId: '' }

      if (membership.isAdmin) {
        for (const member of channelMembers) {
          transmit.broadcast(`user/${member.userId}`, payload)
        }

        await ChannelMember.query().where('channel_id', channelId).delete()

        const channel = await Channel.find(channelId)
        if (channel) {
          await channel.delete()
        }

        return response.ok({
          message: 'Admin left — channel and all memberships deleted',
        })
      }

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
      const { channelId } = request.params() 

      const channel = await Channel.query()
        .where('id', channelId)
        .first()

      if (!channel) {
        return response.notFound({ error: 'Channel not found' })
      }

      const membership = await ChannelMember.query()
        .where('channel_id', channelId)
        .andWhere('user_id', user.id)
        .first()

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

      const channel = await Channel.find(channelId);
      if (!channel) {
        return response.notFound({ error: 'Channel not found' });
      }

      const userToInvite = await User.query().where('nickname', nickname).first();
      if (!userToInvite) {
        return response.notFound({ error: `User "${nickname}" does not exist` });
      }

      if (userToInvite.id === inviter.id) {
        return response.badRequest({ error: 'You cannot invite yourself' });
      }

      const inviterMembership = await ChannelMember.query()
        .where('user_id', inviter.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (channel.visibility === 'private') {
        if (!inviterMembership || !inviterMembership.isAdmin) {
          return response.unauthorized({
            error: 'Only admins can invite users to private channels',
          });
        }
      }

      const existingMembership = await ChannelMember.query()
        .where('user_id', userToInvite.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (existingMembership?.isBanned) {
        const inviterIsAdmin = inviterMembership?.isAdmin === true

        if (!inviterIsAdmin) {
          return response.forbidden({ error: `"User ${nickname}" is banned from this channel` })
        }

        
        existingMembership.isBanned = false;
        existingMembership.isInvited = true;
        existingMembership.leftAt = null;
        await existingMembership.save();

        await KickVote.query()
        .where('user_id', userToInvite.id)
        .andWhere('channel_id', channel.id)
        .delete()

        const payload = { event: 'refresh', userId: inviter.id }
        const channelMembers = await ChannelMember.query().select('user_id');
        for (const member of channelMembers) {
          transmit.broadcast(`user/${member.userId}`, payload)
        }

        return response.ok({
          message: `User ${nickname} has been unbanned and invited again`,
          data: existingMembership,
        });
      }

      if (existingMembership) {
        if (existingMembership.isInvited) {
          return response.badRequest({ error: `User "${nickname}" has already been invited` });
        }

        return response.badRequest({ error: `User "${nickname}" is already a member of this channel` });
      }

      const invite = await ChannelMember.create({
        userId: userToInvite.id,
        channelId: channel.id,
        isInvited: true,
        isAdmin: false,
      });

      const payload = { event: 'refresh', userId: inviter.id };
      const channelMembers = await ChannelMember.query().select('user_id');
      for (const member of channelMembers) {
        transmit.broadcast(`user/${member.userId}`, payload);
      }

      return response.created({
        message: `User "${nickname}" invited successfully`,
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