# Common Components

Reusable UI components with consistent styling using CSS variables.

## Available Components

### `Button`
Standardized button component.

```tsx
import { Button } from '@/components/common'

<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `fullWidth`: boolean

### `Input`
Form input with label and error handling.

```tsx
import { Input } from '@/components/common'

<Input
  label="Email"
  type="email"
  error={errors.email}
  helperText="Enter your email address"
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- All standard HTML input props

### `Card`
Container component with consistent styling.

```tsx
import { Card } from '@/components/common'

<Card padding="md" hover>
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

**Props:**
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hover`: boolean

### `Modal`
Modal dialog component.

```tsx
import { Modal } from '@/components/common'

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content</p>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `closeOnOverlayClick`: boolean

### `LoadingSpinner`
Loading indicator.

```tsx
import { LoadingSpinner } from '@/components/common'

<LoadingSpinner size="md" text="Loading..." />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `text`: string

## Usage Guidelines

- Always use common components instead of creating custom styled elements
- Components automatically use CSS variables for theming
- All components support dark mode through CSS variables
