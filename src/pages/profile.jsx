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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
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
        console.log('Profile data received:', data); // Debug log
        
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

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchProfile();
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-semibold text-[#2F674A]">₹{totalSpent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviews:</span>
                      <span className="font-semibold">{totalReviews}</span>
                    </div>
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

            {/* Profile Details Form */}
            <div className="lg:col-span-2">
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

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        name="userAddress"
                        value={formData.userAddress}
                        onChange={handleInputChange}
                        disabled={!editing}
                        rows={4}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent ${
                          !editing ? 'bg-gray-50' : ''
                        }`}
                        placeholder="Enter your complete address"
                      />
                    </div>

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

              {/* Account Actions */}
              <Card className="bg-white mt-6">
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
      </div>
    </>
  )
}