// src/contexts/CartContext.js - Ultra-optimized with smart debouncing and caching
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'

const CartContext = createContext({})

export const CartProvider = ({ children }) => {
  // State management with atomic updates
  const [cartState, setCartState] = useState({
    items: [],
    count: 0,
    total: 0,
    loading: false, // Start as false, not true
    error: null,
    lastFetch: null
  })

  // Refs for preventing unnecessary re-fetches and tracking state
  const fetchingRef = useRef(false)
  const lastUserIdRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const debounceTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  const { user, isAuthenticated } = useAuth()

  // Memoized selectors - only recalculate when needed
  const cartCount = useMemo(() => cartState.count, [cartState.count])
  const cartItems = useMemo(() => cartState.items, [cartState.items])
  const cartTotal = useMemo(() => cartState.total, [cartState.total])
  const cartLoading = useMemo(() => cartState.loading, [cartState.loading])
  const cartError = useMemo(() => cartState.error, [cartState.error])

  // Optimized state updater with deep comparison prevention
  const updateCartState = useCallback((updates) => {
    setCartState(prev => {
      // Check if anything actually changed before updating
      let hasChanges = false
      for (const key in updates) {
        if (prev[key] !== updates[key]) {
          // For arrays and objects, do shallow comparison
          if (Array.isArray(prev[key]) && Array.isArray(updates[key])) {
            if (prev[key].length !== updates[key].length) {
              hasChanges = true
              break
            }
            // Quick length + first item check for performance
            if (prev[key].length > 0 && prev[key][0] !== updates[key][0]) {
              hasChanges = true
              break
            }
          } else {
            hasChanges = true
            break
          }
        }
      }
      
      if (!hasChanges) {
        return prev
      }
      
      return { ...prev, ...updates }
    })
  }, [])

  // Ultra-optimized fetch with smart caching and request deduplication
  const fetchCart = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current && !force) {
      console.log('🛒 CartContext: Fetch already in progress, skipping')
      return
    }

    // Smart debouncing - longer delay for non-forced requests
    const now = Date.now()
    const lastFetch = cartState.lastFetch
    const minInterval = force ? 500 : 3000 // 3 seconds for non-forced, 500ms for forced
    
    if (!force && lastFetch && (now - lastFetch) < minInterval) {
      console.log(`🛒 CartContext: Fetch too recent (${now - lastFetch}ms < ${minInterval}ms), skipping`)
      return
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    fetchingRef.current = true
    
    try {
      console.log('🛒 CartContext: Fetching cart data...', force ? '(forced)' : '(normal)')
      
      // Only show loading for forced requests or initial load
      if (force || !cartState.lastFetch) {
        updateCartState({ 
          loading: true, 
          error: null 
        })
      }

      const response = await fetch('/api/cart', {
        method: 'GET',
        credentials: 'include',
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Cart fetch failed: ${response.status}`)
      }

      const data = await response.json()
      
      console.log('🛒 CartContext: Cart data received:', {
        items: data.items?.length || 0,
        total: data.grandTotal || 0,
        cached: response.headers.get('cache-control')
      })

      // Update state efficiently
      updateCartState({
        items: data.items || [],
        count: data.itemCount || data.items?.length || 0,
        total: data.grandTotal || 0,
        loading: false,
        error: null,
        lastFetch: now
      })

    } catch (error) {
      // Don't log aborted requests as errors
      if (error.name === 'AbortError') {
        console.log('🛒 CartContext: Request aborted')
        return
      }
      
      console.error('❌ CartContext: Cart fetch error:', error)
      
      updateCartState({
        loading: false,
        error: error.message,
        lastFetch: now
      })
      
      // Smart retry with exponential backoff
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      
      const retryDelay = force ? 2000 : 10000 // Longer delay for automatic retries
      retryTimeoutRef.current = setTimeout(() => {
        console.log('🔄 CartContext: Retrying cart fetch...')
        fetchCart(true)
      }, retryDelay)

    } finally {
      fetchingRef.current = false
      abortControllerRef.current = null
    }
  }, [cartState.lastFetch, updateCartState])

  // Debounced fetch function to prevent rapid consecutive calls
  const debouncedFetch = useCallback((force = false, delay = 200) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchCart(force)
    }, delay)
  }, [fetchCart])

  // Optimized cart operations with better error handling
  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      console.log(`🛒 CartContext: Adding ${quantity}x product ${productId}`)
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add item to cart')
      }

      console.log('✅ CartContext: Item added successfully', result)
      
      // Smart optimistic update based on action
      if (result.action === 'created' && result.item) {
        updateCartState(prev => {
          const newItems = [...prev.items, {
            ...result.item,
            itemTotal: result.item.itemTotal || (result.item.product.productPrice * result.item.quantity)
          }]
          const newCount = newItems.length
          const newTotal = newItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0)
          
          return {
            ...prev,
            items: newItems,
            count: newCount,
            total: newTotal
          }
        })
      } else if (result.action === 'updated' && result.item) {
        updateCartState(prev => {
          const newItems = prev.items.map(item => 
            item.productId === productId ? {
              ...result.item,
              itemTotal: result.item.itemTotal || (result.item.product.productPrice * result.item.quantity)
            } : item
          )
          const newTotal = newItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0)
          
          return {
            ...prev,
            items: newItems,
            total: newTotal
          }
        })
      }

      // Delayed consistency check - only if optimistic update happened
      if (result.action === 'created' || result.action === 'updated') {
        debouncedFetch(true, 500) // 500ms delay for consistency check
      }
      
      return result
    } catch (error) {
      console.error('❌ CartContext: Add to cart error:', error)
      // Refresh cart on error to get accurate state
      debouncedFetch(true, 100)
      throw error
    }
  }, [updateCartState, debouncedFetch])

  const updateCartItem = useCallback(async (productId, quantity) => {
    try {
      console.log(`🛒 CartContext: Updating product ${productId} to quantity ${quantity}`)
      
      // Optimistic update with validation
      const currentItem = cartItems.find(item => item.productId === productId)
      if (!currentItem) {
        throw new Error('Item not found in cart')
      }

      const newItemTotal = (currentItem.product?.productPrice || 0) * quantity
      
      updateCartState(prev => {
        const newItems = prev.items.map(item => {
          if (item.productId === productId) {
            return { ...item, quantity, itemTotal: newItemTotal }
          }
          return item
        })
        const newTotal = newItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0)
        
        return {
          ...prev,
          items: newItems,
          total: newTotal
        }
      })
      
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ CartContext: Update failed, reverting optimistic update')
        debouncedFetch(true, 100) // Immediate revert
        throw new Error(result.error || 'Failed to update cart item')
      }

      console.log('✅ CartContext: Item updated successfully')
      
      // Optional consistency check after longer delay
      debouncedFetch(true, 1000)
      
      return result
    } catch (error) {
      console.error('❌ CartContext: Update cart item error:', error)
      throw error
    }
  }, [cartItems, updateCartState, debouncedFetch])

  const removeFromCart = useCallback(async (productId) => {
    try {
      console.log(`🛒 CartContext: Removing product ${productId}`)
      
      // Optimistic removal
      updateCartState(prev => {
        const newItems = prev.items.filter(item => item.productId !== productId)
        const newCount = newItems.length
        const newTotal = newItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0)
        
        return {
          ...prev,
          items: newItems,
          count: newCount,
          total: newTotal
        }
      })
      
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ CartContext: Remove failed, reverting optimistic update')
        debouncedFetch(true, 100) // Immediate revert
        throw new Error(result.error || 'Failed to remove cart item')
      }

      console.log('✅ CartContext: Item removed successfully')
      
      // Optional consistency check
      debouncedFetch(true, 1000)
      
      return result
    } catch (error) {
      console.error('❌ CartContext: Remove from cart error:', error)
      throw error
    }
  }, [updateCartState, debouncedFetch])

  const clearCart = useCallback(async () => {
    try {
      console.log('🛒 CartContext: Clearing entire cart')
      
      // Store items for potential revert
      const itemsToDelete = [...cartItems]
      
      // Optimistic clear
      updateCartState({
        items: [],
        count: 0,
        total: 0
      })
      
      // Delete all items in parallel
      const deletePromises = itemsToDelete.map(item => 
        fetch(`/api/cart/${item.productId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      )
      
      const responses = await Promise.allSettled(deletePromises)
      
      // Check if any deletions failed
      const failures = responses.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        console.warn(`❌ ${failures.length} items failed to delete, refreshing cart`)
        debouncedFetch(true, 100)
      } else {
        console.log('✅ CartContext: All items cleared successfully')
        // Optional consistency check
        debouncedFetch(true, 2000)
      }
      
    } catch (error) {
      console.error('❌ CartContext: Clear cart error:', error)
      // Refresh cart to get accurate state
      debouncedFetch(true, 100)
      throw error
    }
  }, [cartItems, updateCartState, debouncedFetch])

  // Optimized refresh function
  const refreshCart = useCallback((immediate = false) => {
    console.log('🔄 CartContext: Manual cart refresh requested')
    if (immediate) {
      fetchCart(true)
    } else {
      debouncedFetch(true, 100)
    }
  }, [fetchCart, debouncedFetch])

  // Optimized user change handling
  useEffect(() => {
    const currentUserId = user?.id || null
    
    if (lastUserIdRef.current !== currentUserId) {
      console.log('🔄 CartContext: User changed, fetching cart:', {
        from: lastUserIdRef.current,
        to: currentUserId
      })
      
      lastUserIdRef.current = currentUserId
      
      // Reset state
      updateCartState({
        items: [],
        count: 0,
        total: 0,
        loading: true,
        error: null,
        lastFetch: null
      })
      
      // Fetch with minimal delay for user changes
      setTimeout(() => fetchCart(true), 100)
    } else if (!cartState.lastFetch && (isAuthenticated || currentUserId === null)) {
      // Initial fetch for new sessions
      console.log('🔄 CartContext: Initial cart fetch')
      fetchCart(true)
    }
  }, [user?.id, cartState.lastFetch, isAuthenticated, updateCartState, fetchCart])

  // Optimized event listeners
  useEffect(() => {
    const handleCartUpdate = (event) => {
      console.log('🛒 CartContext: Cart update event received:', event.detail)
      debouncedFetch(true, 200)
    }

    const handleVisibilityChange = () => {
      // Refresh cart when user comes back to the page
      if (!document.hidden && cartState.lastFetch) {
        const timeSinceLastFetch = Date.now() - cartState.lastFetch
        if (timeSinceLastFetch > 30000) { // 30 seconds
          console.log('🛒 CartContext: Page visible after 30s, refreshing cart')
          debouncedFetch(true, 500)
        }
      }
    }

    // Listen for custom cart events
    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('cartMerged', handleCartUpdate)
    window.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('cartMerged', handleCartUpdate)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Cleanup timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedFetch, cartState.lastFetch])

  // Memoized context value with dependency optimization
  const contextValue = useMemo(() => ({
    // State (already memoized)
    cartItems,
    cartCount,
    cartTotal,
    loading: cartLoading,
    error: cartError,
    
    // Actions
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    
    // Utilities
    isEmpty: cartCount === 0,
    hasItems: cartCount > 0,
    
    // Debug info (remove in production)
    _debug: process.env.NODE_ENV === 'development' ? {
      lastFetch: cartState.lastFetch,
      fetchInProgress: fetchingRef.current
    } : undefined
  }), [
    cartItems,
    cartCount,
    cartTotal,
    cartLoading,
    cartError,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    cartState.lastFetch
  ])

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

// Optimized hook with error handling
export const useCart = () => {
  const context = useContext(CartContext)
  
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  
  return context
}

// Selective hooks to prevent unnecessary re-renders
export const useCartCount = () => {
  const { cartCount } = useCart()
  return cartCount
}

export const useCartItems = () => {
  const { cartItems } = useCart()
  return cartItems
}

export const useCartTotal = () => {
  const { cartTotal } = useCart()
  return cartTotal
}

export const useCartLoading = () => {
  const { loading } = useCart()
  return loading
}
