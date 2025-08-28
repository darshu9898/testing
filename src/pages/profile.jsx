import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Address management states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    addressLabel: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phoneNumber: '',
    isDefault: false
  });
  const [addressSaving, setAddressSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    userName: '',
    userPhone: '',
    userAddress: ''
  });

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            userName: data.profile.userName || '',
            userPhone: data.profile.userPhone ? String(data.profile.userPhone) : '',
            userAddress: data.profile.userAddress || ''
          });
        }
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      } else {
        console.error('Failed to fetch addresses');
      }
    } catch (error) {
      console.error('Address fetch error:', error);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchProfile();
        fetchAddresses();
      }
    }
  }, [user, authLoading, router]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address form changes
  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save profile changes
  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    if (profile) {
      setFormData({
        userName: profile.userName || '',
        userPhone: profile.userPhone ? String(profile.userPhone) : '',
        userAddress: profile.userAddress || ''
      });
    }
    setEditing(false);
  };

  // Open address modal
  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddressId(address.addressId);
      setAddressFormData({
        addressLabel: address.addressLabel || '',
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
        phoneNumber: address.phoneNumber || '',
        isDefault: address.isDefault || false
      });
    } else {
      setEditingAddressId(null);
      setAddressFormData({
        addressLabel: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phoneNumber: '',
        isDefault: addresses.length === 0 // Make default if first address
      });
    }
    setShowAddressModal(true);
  };

  // Close address modal
  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddressId(null);
    setAddressFormData({
      addressLabel: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phoneNumber: '',
      isDefault: false
    });
  };

  // Save address
  const saveAddress = async () => {
    setAddressSaving(true);
    try {
      const url = editingAddressId 
        ? `/api/user/addresses/${editingAddressId}` 
        : '/api/user/addresses';
      
      const method = editingAddressId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(addressFormData)
      });

      if (response.ok) {
        await fetchAddresses();
        closeAddressModal();
        alert(`Address ${editingAddressId ? 'updated' : 'added'} successfully!`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save address');
      }
    } catch (error) {
      console.error('Save address error:', error);
      alert('Failed to save address');
    } finally {
      setAddressSaving(false);
    }
  };

  // Delete address
  const deleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchAddresses();
        alert('Address deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Delete address error:', error);
      alert('Failed to delete address');
    }
  };

  // Set default address
  const setDefaultAddress = async (addressId) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'set_default' })
      });

      if (response.ok) {
        await fetchAddresses();
        alert('Default address updated!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update default address');
      }
    } catch (error) {
      console.error('Set default address error:', error);
      alert('Failed to update default address');
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>My Profile - Trivedam</title>
          <meta name="description" content="Manage your profile information" />
        </Head>
        
        <div className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto bg-white">
              <CardContent className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <h1 className="text-2xl font-bold mb-4 text-black">Loading Profile...</h1>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Head>
          <title>Profile Error - Trivedam</title>
        </Head>
        
        <div className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto bg-white">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-6">⚠️</div>
                <h1 className="text-2xl font-bold mb-4 text-black">Error Loading Profile</h1>
                <p className="text-gray-600 mb-8">{error}</p>
                <ButtonDemo
                  label="Try Again"
                  bgColor="green"
                  onClick={fetchProfile}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // No profile data
  if (!profile) {
    return (
      <>
        <Head>
          <title>My Profile - Trivedam</title>
        </Head>
        
        <div className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto bg-white">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-6">👤</div>
                <h1 className="text-2xl font-bold mb-4 text-black">No Profile Data</h1>
                <p className="text-gray-600 mb-8">Unable to load your profile information.</p>
                <ButtonDemo
                  label="Go Back"
                  bgColor="green"
                  onClick={() => router.back()}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Safe value extraction with defaults
  const userName = profile.userName || 'User';
  const userEmail = profile.userEmail || '';
  const userId = profile.userId || 'N/A';
  const createdAt = profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A';
  const userInitial = userName.charAt(0).toUpperCase() || 'U';

  // Safe statistics extraction
  const stats = profile.statistics || {};
  const totalOrders = stats.totalOrders || 0;
  const totalSpent = stats.totalSpent || 0;
  const totalReviews = stats.totalReviews || 0;

  // Safe recent orders extraction
  const recentOrders = Array.isArray(profile.recentOrders) ? profile.recentOrders : [];

  return (
    <>
      <Head>
        <title>My Profile - Trivedam</title>
        <meta name="description" content="Manage your profile information" />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Header */}
        <div className="bg-[#2F674A] text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">My Profile</h1>
            <p className="text-xl opacity-90">Manage your account information</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white">
                <CardHeader>
                  <div className="text-center">
                    <div className="h-20 w-20 bg-gradient-to-r from-[#2F674A] to-[#1F5132] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                      {userInitial}
                    </div>
                    <CardTitle className="text-xl text-black">{userName}</CardTitle>
                    <CardDescription>{userEmail}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member Since:</span>
                      <span className="font-semibold">{createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-semibold text-[#2F674A]">{totalOrders}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-semibold text-[#2F674A]">₹{totalSpent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviews:</span>
                      <span className="font-semibold">{totalReviews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Addresses:</span>
                      <span className="font-semibold text-[#2F674A]">{addresses.length}</span>
                    </div> */}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              {recentOrders.length > 0 && (
                <Card className="bg-white mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg text-black">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentOrders.slice(0, 3).map((order, index) => {
                        const orderId = order.orderId || `temp-${index}`;
                        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Date N/A';
                        const orderAmount = order.orderAmount || 0;
                        const paymentStatus = order.paymentStatus || 'pending';
                        
                        return (
                          <div key={orderId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-semibold text-sm">Order #{orderId}</p>
                              <p className="text-xs text-gray-600">{orderDate}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#2F674A]">₹{orderAmount}</p>
                              <p className={`text-xs ${
                                paymentStatus === 'paid' ? 'text-green-600' : 
                                paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {paymentStatus}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4">
                      <ButtonDemo
                        label="View All Orders"
                        bgColor="green"
                        onClick={() => router.push('/orders')}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Details Form */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl text-black">Profile Information</CardTitle>
                    {!editing ? (
                      <ButtonDemo
                        label="Edit Profile"
                        bgColor="green"
                        onClick={() => setEditing(true)}
                      />
                    ) : (
                      <div className="flex gap-2">
                        <ButtonDemo
                          label="Cancel"
                          bgColor="black"
                          onClick={cancelEditing}
                        />
                        <ButtonDemo
                          label={saving ? "Saving..." : "Save Changes"}
                          bgColor="green"
                          onClick={saveProfile}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="userName"
                        value={formData.userName}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent ${
                          !editing ? 'bg-gray-50' : ''
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="userPhone"
                        value={formData.userPhone}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent ${
                          !editing ? 'bg-gray-50' : ''
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {/* Legacy Address (Optional - can be removed after migration) */}
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Legacy Address
                      </label>
                      <textarea
                        name="userAddress"
                        value={formData.userAddress}
                        onChange={handleInputChange}
                        disabled={!editing}
                        rows={3}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent ${
                          !editing ? 'bg-gray-50' : ''
                        }`}
                        placeholder="Legacy address field"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use the Address Book below for better address management</p>
                    </div> */}

                    {/* User ID (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User ID
                      </label>
                      <input
                        type="text"
                        value={String(userId)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Book */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl text-black">Address Book</CardTitle>
                      <CardDescription>Manage your delivery addresses</CardDescription>
                    </div>
                    <ButtonDemo
                      label="Add New Address"
                      bgColor="green"
                      onClick={() => openAddressModal()}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📍</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Addresses Added</h3>
                      <p className="text-gray-500 mb-6">Add your first delivery address to get started</p>
                      <ButtonDemo
                        label="Add Your First Address"
                        bgColor="green"
                        onClick={() => openAddressModal()}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.addressId}
                          className={`p-4 rounded-lg border-2 ${
                            address.isDefault
                              ? 'border-[#2F674A] bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg text-black">
                                  {address.addressLabel}
                                </h4>
                                {address.isDefault && (
                                  <span className="px-2 py-1 bg-[#2F674A] text-white text-xs rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 mb-1">{address.fullAddress}</p>
                              {address.phoneNumber && (
                                <p className="text-gray-600 text-sm">📞 {address.phoneNumber}</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <ButtonDemo
                                label="Edit"
                                bgColor="black"
                                onClick={() => openAddressModal(address)}
                              />
                              {!address.isDefault && (
                                <ButtonDemo
                                  label="Set Default"
                                  bgColor="white"
                                  onClick={() => setDefaultAddress(address.addressId)}
                                />
                              )}
                              <ButtonDemo
                                label="Delete"
                                bgColor="red"
                                onClick={() => deleteAddress(address.addressId)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-black">Account Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ButtonDemo
                      label="View Orders"
                      bgColor="green"
                      onClick={() => router.push('/orders')}
                    />
                    <ButtonDemo
                      label="Cart Items"
                      bgColor="black"
                      onClick={() => router.push('/cart')}
                    />
                    <ButtonDemo
                      label="Continue Shopping"
                      bgColor="white"
                      onClick={() => router.push('/products')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-black">
                    {editingAddressId ? 'Edit Address' : 'Add New Address'}
                  </h2>
                  <button
                    onClick={closeAddressModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Address Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Label *
                    </label>
                    <input
                      type="text"
                      name="addressLabel"
                      value={addressFormData.addressLabel}
                      onChange={handleAddressInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                      placeholder="e.g., Home, Office, Mom's House"
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={addressFormData.addressLine1}
                      onChange={handleAddressInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                      placeholder="Street address, P.O. Box"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={addressFormData.addressLine2}
                      onChange={handleAddressInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                      placeholder="Apartment, suite, building, floor, etc."
                    />
                  </div>

                  {/* City and State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={addressFormData.city}
                        onChange={handleAddressInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={addressFormData.state}
                        onChange={handleAddressInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  {/* Postal Code and Country */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={addressFormData.postalCode}
                        onChange={handleAddressInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                        placeholder="123456"
                        maxLength="6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={addressFormData.country}
                        onChange={handleAddressInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={addressFormData.phoneNumber}
                      onChange={handleAddressInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                      placeholder="Phone number for this address"
                    />
                  </div>

                  {/* Default Address Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={addressFormData.isDefault}
                      onChange={handleAddressInputChange}
                      className="h-4 w-4 text-[#2F674A] focus:ring-[#2F674A] border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                      Set as default address
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <ButtonDemo
                      label="Cancel"
                      bgColor="black"
                      onClick={closeAddressModal}
                    />
                    <ButtonDemo
                      label={addressSaving ? "Saving..." : editingAddressId ? "Update Address" : "Add Address"}
                      bgColor="green"
                      onClick={saveAddress}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}