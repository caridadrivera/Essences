const queryResult = (result) => {
  const query = {
    select: jest.fn(() => query),
    insert: jest.fn(() => query),
    update: jest.fn(() => query),
    eq: jest.fn(() => query),
    order: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return query
}

const mockQueries = new Map()

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      const query = mockQueries.get(table)
      if (!query) throw new Error(`No query configured for ${table}`)
      return query
    }),
  },
}))

describe('notification service', () => {
  beforeEach(() => {
    mockQueries.clear()
    jest.clearAllMocks()
  })

  it('fetches notifications for the requested recipient in descending order', async () => {
    const query = queryResult({ data: [{ id: 'notification1' }], error: null })
    mockQueries.set('notifications', query)
    const { fetchNotifications } = require('../services/notificationService')

    const result = await fetchNotifications('user123')

    expect(result).toEqual({ success: true, data: [{ id: 'notification1' }] })
    expect(query.eq).toHaveBeenCalledWith('receiverId', 'user123')
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('marks only unread notifications for the recipient as read', async () => {
    const query = queryResult({ error: null })
    mockQueries.set('notifications', query)
    const { markNotificationsAsRead } = require('../services/notificationService')

    const result = await markNotificationsAsRead('user123')

    expect(result).toEqual({ success: true })
    expect(query.update).toHaveBeenCalledWith({ isRead: true })
    expect(query.eq).toHaveBeenNthCalledWith(1, 'receiverId', 'user123')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'isRead', false)
  })

  it('returns a useful error when marking notifications fails', async () => {
    const query = queryResult({ error: { message: 'permission denied' } })
    mockQueries.set('notifications', query)
    const { markNotificationsAsRead } = require('../services/notificationService')

    const result = await markNotificationsAsRead('user123')

    expect(result).toEqual({ success: false, msg: 'permission denied' })
  })
})
