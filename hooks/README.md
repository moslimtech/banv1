# Custom Hooks

This directory contains reusable React hooks for data fetching and state management.

## Available Hooks

### `useAuth`
Authentication and user profile management.

```tsx
import { useAuth } from '@/hooks'

const { user, profile, loading, isAdmin, isAffiliate, refresh } = useAuth()
```

### `usePlaces`
Fetch places data.

```tsx
import { usePlaces, usePlace } from '@/hooks'

// Fetch all places
const { places, loading, error, refresh } = usePlaces()

// Fetch featured places
const { places, loading } = usePlaces({ featured: true })

// Fetch user's places
const { places, loading } = usePlaces({ userId: user.id })

// Fetch single place
const { place, loading, error, refresh } = usePlace(placeId)
```

### `useProducts`
Fetch products data.

```tsx
import { useProducts } from '@/hooks'

// Fetch products by place
const { products, loading, error, refresh, search } = useProducts({ placeId })

// Search products
const { products, loading } = useProducts({ searchQuery: 'laptop' })
```

### `useMessages`
Fetch and manage messages.

```tsx
import { useMessages } from '@/hooks'

const {
  messages,
  loading,
  error,
  unreadCount,
  refresh,
  markAsRead,
  sendMessage,
} = useMessages({ placeId: 'place-id' })

// Send a message
await sendMessage('Hello!', imageUrl, audioUrl, productId, recipientId)

// Mark as read
await markAsRead(messageId)
```

## Usage Guidelines

- Always use hooks instead of writing data fetching logic directly in components
- Hooks handle loading states, errors, and real-time updates automatically
- Use the `refresh` function to manually reload data when needed
