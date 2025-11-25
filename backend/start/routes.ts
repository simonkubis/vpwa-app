import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import transmit from '@adonisjs/transmit/services/main'

transmit.registerRoutes()

const AuthController = () => import('#controllers/auth_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const ChannelMembersController = () => import('#controllers/channel_members_controller')
const MessagesController = () => import('#controllers/messages_controller')
const SettingsController = () => import('#controllers/settings_controller')
const TypingController = () => import('#controllers/typing_controller')
const KickVotesController = () => import('#controllers/kick_votes_controller')



router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/logout', [AuthController, 'logout']).use(
  middleware.auth({ guards: ['api'] })
)
router.get('/auth/me', [AuthController, 'me']).use(
  middleware.auth({ guards: ['api'] })
)
router.post('/channels', [ChannelsController, 'create']).use(
  middleware.auth({ guards: ['api'] })
)
router.get('/channels/members', [ChannelMembersController, 'getUserChannels']).use(
  middleware.auth({ guards: ['api'] })
)
router.get('/channels/:channelId/messages', [MessagesController, 'fetchMessages']).use(
  middleware.auth({ guards: ['api'] })
)
router.post('/message', [MessagesController, 'createMessage']).use(
  middleware.auth({ guards: ['api'] })
)
router.post('/channels/invite/accept', [ChannelMembersController, 'acceptChannelInvite']).use(
  middleware.auth({ guards: ['api'] })
)
router.delete('/channels/invite/decline', [ChannelMembersController, 'declineChannelInvite'])
  .use(middleware.auth({ guards: ['api'] })
  )
router.delete('/channels/leave', [ChannelMembersController, 'leaveChannel'])
  .use(middleware.auth({ guards: ['api'] }))

router.delete('/channels/delete', [ChannelMembersController, 'deleteChannel'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/channels/join-or-create', [ChannelMembersController, 'joinOrCreate'])
  .use(middleware.auth({ guards: ['api'] }))

router.get('/channels/:id/exists', [ChannelsController, 'exists'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/channels/pin', [ChannelMembersController, 'pinChannel'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/channels/invite', [ChannelMembersController, 'inviteUserToChannel'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/channels/revoke', [ChannelMembersController, 'revokeUserFromChannel'])
  .use(middleware.auth({ guards: ['api'] }))

router.put('/channels/ban', [ChannelMembersController, 'revokeUserFromChannel'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/kicks', [KickVotesController, 'kickUser']).use(
  middleware.auth({ guards: ['api'] })
)

router.get('/channels/:channelId', [ChannelMembersController, 'getChannelById'])
  .use(middleware.auth({ guards: ['api'] }))

router.get('/settings', [SettingsController, 'getSettings'])
  .use(middleware.auth({ guards: ['api'] }))

router.put('/settings', [SettingsController, 'updateSettings'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/typing', [TypingController, 'sendTyping'])
  .use(middleware.auth({ guards: ['api'] }))
  