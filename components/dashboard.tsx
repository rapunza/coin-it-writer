
'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Coins, TrendingUp, Users, User, Wallet, LogOut, Copy, Check, Search, Trash2, FileText } from 'lucide-react';
import { useAccount } from 'wagmi';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import CoinCreationModal from './coin-creation-modal';
import CoinCard from './coin-card';
import { 
  getAllCoins, 
  getUserCoins, 
  getCoinStats, 
  getUserCoinStats, 
  createOrUpdateUser, 
  getUser,
  getCoinByAddress,
  deleteCoin,
  type CoinWithCreator,
  type User as UserType 
} from '@/lib/supabase-queries';

export default function Dashboard() {
  const { address } = useAccount();
  const { user } = usePrivy();
  const { logout } = useLogout();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState<CoinWithCreator[]>([]);
  const [allCoins, setAllCoins] = useState<CoinWithCreator[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<CoinWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [stats, setStats] = useState({
    totalCoins: 0,
    userCoins: 0,
    totalCreators: 0
  });

  // Search functionality
  useEffect(() => {
    if (searchTerm) {
      const filtered = allCoins.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCoins(filtered);
    } else {
      setFilteredCoins(allCoins);
    }
  }, [searchTerm, allCoins]);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Always load all coins and global stats
        const [allCoinsData, globalStats] = await Promise.all([
          getAllCoins(50, 0),
          getCoinStats(),
        ]);
        setAllCoins(allCoinsData);
        setFilteredCoins(allCoinsData);
        setStats((prev) => ({
          ...prev,
          totalCoins: globalStats.totalCoins,
          totalCreators: globalStats.totalCreators
        }));

        // Only load user-specific data if address is present
        if (address) {
          await createOrUpdateUser(address, user?.email?.address);
          const userProfile = await getUser(address);
          setUserProfile(userProfile);
          const [userCoinsData, userStats] = await Promise.all([
            getUserCoins(address, 50, 0),
            getUserCoinStats(address),
          ]);
          setUserCoins(userCoinsData);
          setStats((prev) => ({
            ...prev,
            userCoins: userStats.userCoins
          }));
        } else {
          setUserCoins([]);
          setUserProfile(null);
          setStats((prev) => ({
            ...prev,
            userCoins: 0
          }));
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [address, user?.email?.address]);

  const handleCoinCreated = async () => {
    // Refresh the data after a coin is created
    try {
      const [allCoinsData, userCoinsData, globalStats, userStats] = await Promise.all([
        getAllCoins(50, 0),
        getUserCoins(address!, 50, 0),
        getCoinStats(),
        getUserCoinStats(address!),
      ]);
      
      setAllCoins(allCoinsData);
      setFilteredCoins(allCoinsData);
      setUserCoins(userCoinsData);
      setStats({
        totalCoins: globalStats.totalCoins,
        userCoins: userStats.userCoins,
        totalCreators: globalStats.totalCreators
      });
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  const handleDeleteCoin = async (coinId: string) => {
    if (window.confirm('Are you sure you want to delete this coin? This action cannot be undone.')) {
      try {
        await deleteCoin(coinId);
        // Refresh the data after deletion
        await handleCoinCreated();
      } catch (error) {
        console.error('Error deleting coin:', error);
        alert('Failed to delete coin. Please try again.');
      }
    }
  };

  const handleSearchCoin = async (coinAddress: string) => {
    try {
      const coin = await getCoinByAddress(coinAddress);
      if (coin) {
        setFilteredCoins([coin]);
      } else {
        alert('Coin not found');
      }
    } catch (error) {
      console.error('Error searching for coin:', error);
      alert('Error searching for coin');
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CoinIt
            </h1>
            <nav className="mt-2">
              <ul className="flex gap-6 text-base font-medium">
                <li><a href="/" className="hover:text-purple-700 transition-colors">Explore</a></li>
                <li><a href="/creators" className="hover:text-purple-700 transition-colors">Creators</a></li>
                <li><a href="/channels" className="hover:text-purple-700 transition-colors">Channels</a></li>
                <li><a href="/leaderboard" className="hover:text-purple-700 transition-colors">Leaderboard</a></li>
              </ul>
            </nav>
            {/* Notice removed: all users can now see the site without connecting their wallet */}
          </div>

          <div className="flex items-center gap-4">
            {/* User Connection Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
                {address && (
                  <div className="flex items-center gap-2 ml-3 pl-3 border-l">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-mono">{formatAddress(address)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    setLogoutError(null);
                    try {
                      await logout();
                      // Optionally, clear local user state or redirect
                    } catch (err: any) {
                      setLogoutError('Logout failed, but your session has been cleared locally.');
                      // Optionally, clear local user state or redirect
                      console.error('Logout error:', err);
                    }
                  }}
                  className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                {logoutError && (
                  <div className="text-red-600 text-xs mt-1">{logoutError}</div>
                )}
              </div>

              <CoinCreationModal onCoinCreated={handleCoinCreated} />
              
              
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 my-2">
          <Card className="p-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2">
              <CardTitle className="text-xs font-semibold">My Coins</CardTitle>
              <User className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-1 px-2">
              <div className="text-lg font-bold">{stats.userCoins}</div>
              <p className="text-[10px] text-muted-foreground">Coins you&apos;ve created</p>
            </CardContent>
          </Card>
          <Card className="p-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2">
              <CardTitle className="text-xs font-semibold">Total Coins</CardTitle>
              <Coins className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-1 px-2">
              <div className="text-lg font-bold">{stats.totalCoins}</div>
              <p className="text-[10px] text-muted-foreground">Across all creators</p>
            </CardContent>
          </Card>
          <Card className="p-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2">
              <CardTitle className="text-xs font-semibold">Creators</CardTitle>
              <Users className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-1 px-2">
              <div className="text-lg font-bold">{stats.totalCreators}</div>
              <p className="text-[10px] text-muted-foreground">Active on platform</p>
            </CardContent>
          </Card>
        </div>

        {/* Coins Tabs */}
        <Tabs defaultValue="all" className="space-y-4">

          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Explore ({stats.totalCoins})
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Coins ({stats.userCoins})
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Create Coin from Blog
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Coin any image!
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              Music
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /></svg>
              Channels
            </TabsTrigger>
          </TabsList>
          <TabsContent value="music" className="space-y-4">
            {/* Music Tab */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-2">Music</h2>
              <p className="mb-4 text-gray-600 max-w-xl text-center">
                Mint a coin from your favorite music or audio content. (Coming soon)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            {/* Channels Tab */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-2">Channels</h2>
              <p className="mb-4 text-gray-600 max-w-xl text-center">
                Create or explore channels for your coins and communities. (Coming soon)
              </p>
            </div>
          </TabsContent>
          <TabsContent value="blog" className="space-y-4">
            {/* Create Coin from Blog Tab */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-2">Create Coin from Blog</h2>
              <p className="mb-4 text-gray-600 max-w-xl text-center">
                Scrape a blog post and create a Zora coin from your favorite content
              </p>
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle>Blog URL</CardTitle>
                  <CardDescription>Enter a blog post URL to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="flex flex-col gap-4">
                    <Input type="url" placeholder="Blog Post URL" defaultValue="https://medium.com/@author/article-title" />
                    <Button type="button" variant="default">
                      Scrape Content
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
          <TabsContent value="image" className="space-y-4">
            {/* Create Coin from Image Tab */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-2">Create Coin from Image</h2>
              <p className="mb-4 text-gray-600 max-w-xl text-center">
                Upload an image (PNG, JPEG, SVG, AVIF, etc) and create a Zora coin from your favorite visual content.
              </p>
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle>Image Upload</CardTitle>
                  <CardDescription>Choose an image file to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* CoinImageModal component for image upload and coin creation */}
                  {/* @ts-expect-error Async Server Component */}
                  {React.createElement(require('./coin-image-modal').default, { onCoinCreated: handleCoinCreated })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Explore</h2>
              <Badge variant="secondary">{filteredCoins.length} coins</Badge>
            </div>
            
            {/* Search functionality */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search coins by name, symbol, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const address = prompt('Enter coin address to search:');
                  if (address) handleSearchCoin(address);
                }}
              >
                Search by Address
              </Button>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear
                </Button>
              )}
            </div>
            
            {allCoins.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Coins className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No coins yet</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Create your coin and start earning!
                  </p>
                  <CoinCreationModal onCoinCreated={handleCoinCreated} />
                </CardContent>
              </Card>
            ) : filteredCoins.length === 0 && searchTerm ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No coins found</h3>
                  <p className="text-gray-500 text-center mb-4">
                    No coins match your search criteria: &quot;{searchTerm}&quot;
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCoins.map((coin) => (
                  <div key={coin.id} className="relative">
                    <CoinCard 
                      coin={{
                        id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol,
                        address: coin.coin_address,
                        creator: coin.creator_wallet,
                        createdAt: coin.created_at,
                        metadata: coin.metadata,
                        ipfsUri: coin.ipfs_uri,
                      }}
                      isOwnCoin={coin.creator_wallet.toLowerCase() === address?.toLowerCase()}
                    />
                    {coin.creator_wallet.toLowerCase() === address?.toLowerCase() && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteCoin(coin.id)}
                          className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">My Coins</h2>
              <Badge variant="secondary">{userCoins.length} coins</Badge>
            </div>
            
            {userCoins.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">You haven&apos;t created any coins yet</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Start by creating your first coin from a blog post!
                  </p>
                  <CoinCreationModal onCoinCreated={handleCoinCreated} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCoins.map((coin) => (
                  <div key={coin.id} className="relative">
                    <CoinCard 
                      coin={{
                        id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol,
                        address: coin.coin_address,
                        creator: coin.creator_wallet,
                        createdAt: coin.created_at,
                        metadata: coin.metadata,
                        ipfsUri: coin.ipfs_uri,
                      }}
                      isOwnCoin={true}
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteCoin(coin.id)}
                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 