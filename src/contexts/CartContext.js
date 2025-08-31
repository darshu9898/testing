// src/contexts/CartContext.js - Optimized cart context with immediate state updates
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'

const CartContext = createContext({})

export const CartProvider = ({ children }) => {
  // State management with atomic updates
  const [cartState, setCartState] = useState({
    items: [],
    count: 0,
    total: 0,
    loading: true,
    error: null,
    lastFetch: null
  })

  // Refs for preventing unnecessary re-fetches
  const fetchingRef = useRef(false)
  const lastUserIdRef = useRef(null)
  const retryTimeoutRef = useRef(null)

  const { user, isAuthenticated } = useAuth()

  // Memoized selectors to prevent unnecessary re-renders
  const cartCount = useMemo(() => cartState.count, [cartState.count])
  const cartItems = useMemo(() => cartState.items, [cartState.items])
  const cartTotal = useMemo(() => cartState.total, [cartState.total])
  const cartLoading = useMemo(() => cartState.loading, [cartState.loading])
  const cartError = useMemo(() => cartState.error, [cartState.error])

  // Optimized state updater to prevent unnecessary re-renders
  const updateCartState = useCallback((updates) => {
    setCartState(prev => {
      const newState = { ...prev, ...updates }
      
      // Only update if something actually changed
      if (JSON.stringify(prev) === JSON.stringify(newState)) {
        return prev
      }
      
      return newState
    })
  }, [])

  // Debounced cart fetch to prevent rapid API calls
  const fetchCart = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current && !force) {
      console.log('🛒 CartContext: Fetch already in progress, skipping')
      return
    }

    // Check if we need to fetch (debounce logic)
    const now = Date.now()
    const lastFetch = cartState.lastFetch
    if (!force && lastFetch && (now - lastFetch) < 2000) {
      console.log('🛒 CartContext: Fetch too recent, skipping')
      return;
    }

    fetchingRef.current = true
    
    try {
      console.log('🛒 CartContext: Fetching cart data...')
      
      if (!force) {
        updateCartState({ 
          loading: true, 
          error: null 
        })
      }

      const response = await fetch('/api/cart', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
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
        total: data.grandTotal || 0
      })

      updateCartState({
        items: data.items || [],
        count: data.items?.length || 0,
        total: data.grandTotal || 0,
        loading: false,
        error: null,
        lastFetch: now
      })

    } catch (error) {
      console.error('❌ CartContext: Cart fetch error:', error)
      
      updateCartState({
        loading: false,
        error: error.message,
        lastFetch: now
      })
      
      // Retry logic with exponential backoff
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        console.log('🔄 CartContext: Retrying cart fetch...')
        fetchCart(true)
      }, 5000)

    } finally {
      fetchingRef.current = false
    }
  }, [cartState.lastFetch, updateCartState])

  // Optimized cart operations with immediate state updates
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
      
      // Immediate optimistic update for immediate UI feedback
      if (result.action === 'created' && result.item) {
        updateCartState(prev => {
          const newItems = [...prev.items, result.item]
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
        // Handle quantity updates for existing items
        updateCartState(prev => {
          const newItems = prev.items.map(item => 
            item.productId === productId ? result.item : item
          )
          const newCount = newItems.length
          const newTotal = newItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0)
          
          return {
            ...prev,
            items: newItems,
            count: newCount,
            total: newTotal
          }
        })
      }

      // Fetch fresh data to ensure consistency (delayed to allow optimistic update to show first)
      setTimeout(() => fetchCart(true), 100)
      
      return result
    } catch (error) {
      console.error('❌ CartContext: Add to cart error:', error)
      throw error
    }
  }, [updateCartState, fetchCart])

  const updateCartItem = useCallback(async (productId, quantity) => {
    try {
      console.log(`🛒 CartContext: Updating product ${productId} to quantity ${quantity}`)
      
      // Optimistic update first
      updateCartState(prev => {
        const newItems = prev.items.map(item => {
          if (item.productId === productId) {
            const newItemTotal = (item.product?.productPrice || 0) * quantity
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
        throw new Error(result.error || 'Failed to update cart item')
        // Revert optimistic update on error
        fetchCart(true)
      }

      console.log('✅ CartContext: Item updated successfully')
      
      // Fetch fresh data to ensure consistency
      setTimeout(() => fetchCart(true), 100)
      
      return result
    } catch (error) {
      console.error('❌ CartContext: Update cart item error:', error)
      // Revert optimistic update on error
      fetchCart(true)
      throw error
    }
  }, [fetchCart, updateCartState])

  const removeFromCart = useCallback(async (productId) => {
    try {
      console.log(`🛒 CartContext: Removing product ${productId}`)
      
      // Optimistic update first (immediate feedback)
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
        throw new Error(result.error || 'Failed to remove cart item')
        // Revert optimistic update on error
        fetchCart(true)
      }

      console.log('✅ CartContext: Item removed successfully')
      
      // Fresh fetch for accuracy (delayed to allow optimistic update to show first)
      setTimeout(() => fetchCart(true), 100)
      
      return result
    } catch (error) {
      console.error('❌ CartContext: Remove from cart error:', error)
      // Revert optimistic update on error
      fetchCart(true)
      throw error
    }
  }, [updateCartState, fetchCart])

  const clearCart = useCallback(async () => {
    try {
      console.log('🛒 CartContext: Clearing entire cart')
      
      // Optimistic update first
      updateCartState({
        items: [],
        count: 0,
        total: 0
      })
      
      const promises = cartItems.map(item => 
        fetch(`/api/cart/${item.productId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      )
      
      await Promise.all(promises)
      
      // Fetch fresh data to ensure consistency
      setTimeout(() => fetchCart(true), 100)
      
    } catch (error) {
      console.error('❌ CartContext: Clear cart error:', error)
      // Revert on error
      fetchCart(true)
      throw error
    }
  }, [cartItems, updateCartState, fetchCart])

  // Enhanced cart refresh for external triggers
  const refreshCart = useCallback((immediate = false) => {
    console.log('🔄 CartContext: Manual cart refresh requested')
    if (immediate) {
      fetchCart(true)
    } else {
      // Debounced refresh
      setTimeout(() => fetchCart(true), 200)
    }
  }, [fetchCart])

  // Initial cart fetch and user change handling
  useEffect(() => {
    const currentUserId = user?.id || null
    
    // Check if user changed
    if (lastUserIdRef.current !== currentUserId) {
      console.log('🔄 CartContext: User changed, fetching cart:', {
        from: lastUserIdRef.current,
        to: currentUserId
      })
      
      lastUserIdRef.current = currentUserId
      
      // Reset state and fetch
      updateCartState({
        items: [],
        count: 0,
        total: 0,
        loading: true,
        error: null
      })
      
      // Slight delay to ensure auth is fully settled
      setTimeout(() => fetchCart(true), 300)
    } else if (!cartState.lastFetch) {
      // Initial fetch if no previous fetch
      fetchCart(true)
    }
  }, [user?.id, cartState.lastFetch, updateCartState, fetchCart])

  // Listen for cart update events (including merge)
  useEffect(() => {
    const handleCartUpdate = (event) => {
      console.log('🛒 CartContext: Cart update event received:', event.detail)
      
      // Force immediate refresh on cart events
      refreshCart(true)
    }

    const handleStorageUpdate = () => {
      console.log('🛒 CartContext: Storage update detected, refreshing cart')
      refreshCart(true)
    }

    // Listen for custom cart events
    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('cartMerged', handleCartUpdate)
    window.addEventListener('storage', handleStorageUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('cartMerged', handleCartUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
      
      // Cleanup timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [refreshCart])

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State (memoized)
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
    hasItems: cartCount > 0
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
    refreshCart
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

// Selectors for specific cart data (prevents unnecessary re-renders)
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