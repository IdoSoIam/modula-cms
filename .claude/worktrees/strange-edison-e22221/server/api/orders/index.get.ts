import { H3Event } from 'h3'
import { getSessionConfig } from '../../utils/session'

interface Order {
  id: string
  orderNumber: string
  date: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  total: number
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    image?: string
  }>
  deliveryDate?: string
  deliveryMethod: 'pickup' | 'delivery'
  shippingAddress?: {
    addressLine1: string
    addressLine2?: string
    city: string
    postalCode: string
    country: string
  }
}

// Mock data - replace with real database queries
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'CMD-2024-001',
    date: '2024-01-15T10:30:00Z',
    status: 'delivered',
    total: 45.50,
    deliveryMethod: 'pickup',
    deliveryDate: '2024-01-16T14:00:00Z',
    items: [
      {
        id: '1',
        name: 'Pommes de terre bio',
        price: 3.50,
        quantity: 5,
        image: '/images/products/potatoes.jpg'
      },
      {
        id: '2',
        name: 'Carottes bio',
        price: 2.80,
        quantity: 3,
        image: '/images/products/carrots.jpg'
      }
    ]
  },
  {
    id: '2',
    orderNumber: 'CMD-2024-002',
    date: '2024-01-20T15:45:00Z',
    status: 'preparing',
    total: 32.75,
    deliveryMethod: 'delivery',
    deliveryDate: '2024-01-22T16:00:00Z',
    items: [
      {
        id: '3',
        name: 'Tomates cerises bio',
        price: 4.20,
        quantity: 2,
        image: '/images/products/cherry-tomatoes.jpg'
      },
      {
        id: '4',
        name: 'Salade verte bio',
        price: 2.50,
        quantity: 4,
        image: '/images/products/lettuce.jpg'
      }
    ],
    shippingAddress: {
      addressLine1: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    }
  }
]

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await useSession(event, getSessionConfig())
    const userId = session.data.userId

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const status = query.status as string

    // Filter orders by status if provided
    let filteredOrders = mockOrders
    if (status && status !== 'all') {
      filteredOrders = mockOrders.filter(order => order.status === status)
    }

    // Paginate results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      }
    }
  } catch (error: any) {
    console.error('Orders fetch error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while fetching orders'
    })
  }
})
