// src/components/OptimizedCartTest.jsx - Test component for optimized cart functionality
import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart, useCartCount } from '@/contexts/CartContext';

// Memoized components to demonstrate no unnecessary re-renders
const CartCounter = memo(() => {
  const cartCount = useCartCount();
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  return (
    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
      <h3 className="font-semibold text-blue-800">Cart Counter Component</h3>
      <p className="text-2xl font-bold text-blue-600">Items: {cartCount}</p>
      <p className="text-xs text-blue-500">Renders: {renderCount}</p>
    </div>
  );
});

CartCounter.displayName = 'CartCounter';

const CartItems = memo(() => {
  const { cartItems, cartTotal } = useCart();
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  return (
    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
      <h3 className="font-semibold text-green-800">Cart Items Component</h3>
      <p className="text-lg text-green-600">Total: ₹{cartTotal}</p>
      <div className="space-y-1 mt-2">
        {cartItems.map(item => (
          <div key={item.cartId} className="text-sm text-green-700">
            {item.product?.productName} × {item.quantity}
          </div>
        ))}
      </div>
      <p className="text-xs text-green-500 mt-2">Renders: {renderCount}</p>
    </div>
  );
});

CartItems.displayName = 'CartItems';

const OptimizedCartTest = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToCart, removeFromCart, refreshCart, loading, error } = useCart();
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [componentRenderCount, setComponentRenderCount] = useState(0);

  useEffect(() => {
    setComponentRenderCount(prev => prev + 1);
  });

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  // Test immediate cart updates
  const testImmediateUpdate = async () => {
    try {
      setTesting(true);
      addTestResult('Testing immediate cart updates...', 'info');
      
      // Add item and check if navbar updates immediately
      await addToCart(1, 1);
      addTestResult('Added item - check navbar for immediate update!', 'success');
      
      setTimeout(async () => {
        await addToCart(2, 2);
        addTestResult('Added another item - navbar should update again!', 'success');
      }, 1000);
      
    } catch (error) {
      addTestResult(`Error: ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  // Test cart merge with immediate updates
  const testCartMergeWithUpdates = async () => {
    try {
      setTesting(true);
      addTestResult('Testing cart merge with immediate updates...', 'info');
      
      if (!isAuthenticated) {
        // Add items as guest
        await addToCart(1, 3);
        await addToCart(3, 1);
        addTestResult('Added items as guest - now login to see merge!', 'info');
      } else {
        // Trigger manual refresh
        refreshCart(true);
        addTestResult('Triggered manual cart refresh', 'info');
      }
      
    } catch (error) {
      addTestResult(`Error: ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  // Test remove with immediate updates
  const testRemoveWithUpdates = async () => {
    try {
      setTesting(true);
      addTestResult('Testing remove with immediate updates...', 'info');
      
      // Remove first available item
      const { cartItems } = useCart();
      if (cartItems.length > 0) {
        await removeFromCart(cartItems[0].productId);
        addTestResult('Removed item - navbar should update immediately!', 'success');
      } else {
        addTestResult('No items to remove', 'warning');
      }
      
    } catch (error) {
      addTestResult(`Error: ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2F674A]">Optimized Cart Test</h2>
        <div className="text-sm text-gray-500">
          Main Component Renders: {componentRenderCount}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p><strong>User:</strong> {user ? user.email : 'Guest'}</p>
            <p><strong>Auth:</strong> {isAuthenticated ? '✅ Logged in' : '❌ Guest'}</p>
          </div>
          <div>
            <p><strong>Cart Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}</p>
            <p><strong>Cart Error:</strong> {error ? '❌ Yes' : '✅ No'}</p>
          </div>
          <div>
            <p><strong>Testing:</strong> {testing ? '⏳ In Progress' : '✅ Ready'}</p>
          </div>
        </div>
      </div>

      {/* Memoized Components Demo */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Component Re-render Test</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CartCounter />
          <CartItems />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          These components are memoized and should only re-render when their specific data changes.
        </p>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Immediate Update Tests</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={testImmediateUpdate}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Add Items (Check Navbar)'}
          </button>
          
          <button
            onClick={testCartMergeWithUpdates}
            disabled={testing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Cart Merge'}
          </button>
          
          <button
            onClick={testRemoveWithUpdates}
            disabled={testing}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Remove Items'}
          </button>
          
          <button
            onClick={clearTestResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🚀 Performance Optimizations</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Cart count uses dedicated selector to prevent unnecessary navbar re-renders</li>
          <li>Components are memoized using React.memo() for minimal re-renders</li>
          <li>Context value is memoized to prevent child re-renders</li>
          <li>Optimistic updates provide immediate UI feedback</li>
          <li>Debounced API calls prevent excessive server requests</li>
          <li>Event-driven updates ensure all components stay in sync</li>
        </ul>
      </div>

      {/* Test Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📋 Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Immediate Updates:</strong> Click "Test Add Items" and watch the navbar cart count update instantly</li>
          <li><strong>Component Efficiency:</strong> Notice how only relevant components re-render (check render counts)</li>
          <li><strong>Cart Merge:</strong> Sign out, add items as guest, then sign back in to test merge</li>
          <li><strong>Consistency:</strong> All cart displays should always show the same count</li>
          <li><strong>Performance:</strong> No delays or flickers when updating cart</li>
        </ol>
      </div>

      {/* Test Results */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          {testResults.length > 0 && (
            <span className="text-sm text-gray-600">{testResults.length} results</span>
          )}
        </div>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {testResults.length > 0 ? (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded text-sm ${
                  result.type === 'success' ? 'bg-green-100 text-green-800' :
                  result.type === 'error' ? 'bg-red-100 text-red-800' :
                  result.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="flex-1">{result.message}</span>
                  <span className="text-xs opacity-75 ml-2">{result.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-4">
              No test results yet. Run a test to see results here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizedCartTest;