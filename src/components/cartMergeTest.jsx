// src/components/CartMergeTest.jsx - Test component for cart merge functionality
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

const CartMergeTest = () => {
  const { user, isAuthenticated, handleCartMerge } = useAuth();
  const { cartItems, cartCount, addToCart, loading } = useCart();
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  // Test adding items as guest
  const testAddAsGuest = async () => {
    if (isAuthenticated) {
      addTestResult('Please sign out first to test guest functionality', 'error');
      return;
    }

    try {
      setTesting(true);
      addTestResult('Testing: Adding items as guest user...', 'info');
      
      // Add a few test items (assuming you have products with IDs 1, 2, 3)
      await addToCart(1, 2);
      addTestResult('Added 2x Product ID 1 to guest cart', 'success');
      
      await addToCart(2, 1);
      addTestResult('Added 1x Product ID 2 to guest cart', 'success');
      
      addTestResult(`Guest cart now has ${cartCount} items`, 'info');
    } catch (error) {
      addTestResult(`Error adding items as guest: ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  // Test manual cart merge
  const testManualMerge = async () => {
    if (!isAuthenticated) {
      addTestResult('Please sign in first to test cart merge', 'error');
      return;
    }

    try {
      setTesting(true);
      addTestResult('Testing: Manual cart merge...', 'info');
      
      const result = await handleCartMerge();
      
      if (result) {
        addTestResult(`Cart merge successful: ${result.itemsCount} items merged`, 'success');
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            addTestResult(`Warning: ${warning}`, 'warning');
          });
        }
      } else {
        addTestResult('Cart merge returned no result (may be no items to merge)', 'info');
      }
    } catch (error) {
      addTestResult(`Error during cart merge: ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-[#2F674A] mb-6">Cart Merge Test Component</h2>
      
      {/* User Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>User:</strong> {user ? user.email : 'Not authenticated'}</p>
            <p><strong>Authentication:</strong> {isAuthenticated ? 'Logged in' : 'Guest'}</p>
          </div>
          <div>
            <p><strong>Cart Items:</strong> {cartCount}</p>
            <p><strong>Cart Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Current Cart Items */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Cart Contents</h3>
        {cartItems.length > 0 ? (
          <div className="space-y-2">
            {cartItems.map(item => (
              <div key={item.cartId} className="flex justify-between items-center p-2 bg-white rounded">
                <span>{item.product?.productName || 'Unknown Product'}</span>
                <span>Qty: {item.quantity} × ₹{item.product?.productPrice}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Cart is empty</p>
        )}
      </div>

      {/* Test Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={testAddAsGuest}
          disabled={testing || isAuthenticated}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {testing ? 'Testing...' : 'Add Test Items as Guest'}
        </button>
        
        <button
          onClick={testManualMerge}
          disabled={testing || !isAuthenticated}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {testing ? 'Testing...' : 'Test Manual Cart Merge'}
        </button>
        
        <button
          onClick={clearTestResults}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      {/* Test Instructions */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>First, sign out if you're logged in</li>
          <li>Click "Add Test Items as Guest" to add items to guest cart</li>
          <li>Sign in with your account</li>
          <li>The cart should automatically merge during login</li>
          <li>Alternatively, you can click "Test Manual Cart Merge" to trigger merge manually</li>
          <li>Check the results below and verify cart contents above</li>
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
            <p className="text-gray-600 text-center py-4">No test results yet. Run a test to see results here.</p>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Debug Info</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Cart Hook Loading: {loading.toString()}</p>
          <p>Cart Items Array: {JSON.stringify(cartItems.map(i => ({id: i.productId, qty: i.quantity})), null, 2)}</p>
          <p>Browser Cookies: {typeof window !== 'undefined' ? document.cookie.split(';').filter(c => c.includes('guest') || c.includes('sb-') || c.includes('supabase')).length : 0} relevant cookies</p>
        </div>
      </div>
    </div>
  );
};

export default CartMergeTest;