import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/lib/types'
import { getProductsByPlace, searchProducts } from '@/lib/api/products'
import { validateArray, ProductSchema } from '@/types/schemas'

interface UseProductsOptions {
  placeId?: string
  searchQuery?: string
  autoLoad?: boolean
}

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  search: (query: string) => Promise<void>
}

/**
 * Custom hook for fetching products
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { placeId, searchQuery, autoLoad = true } = options
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    if (!placeId) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getProductsByPlace(placeId)
      setProducts(data)
    } catch (err: any) {
      console.error('Error loading products:', err)
      setError(err.message || 'فشل في تحميل المنتجات')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [placeId])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      if (placeId) {
        await loadProducts()
      } else {
        setProducts([])
      }
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await searchProducts(query)
      
      // ✅ Validate data with Zod
      const validatedProducts = validateArray(ProductSchema, data, 'useProducts.search')
      setProducts(validatedProducts as Product[])
    } catch (err: any) {
      console.error('Error searching products:', err)
      setError(err.message || 'فشل في البحث عن المنتجات')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [placeId, loadProducts])

  useEffect(() => {
    if (autoLoad) {
      if (searchQuery) {
        handleSearch(searchQuery)
      } else if (placeId) {
        loadProducts()
      }
    }
  }, [autoLoad, placeId, searchQuery, loadProducts, handleSearch])

  return {
    products,
    loading,
    error,
    refresh: loadProducts,
    search: handleSearch,
  }
}
