"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ExternalLink, Coins, FileText, Link as LinkIcon, Plus } from "lucide-react";
import { createCoin, DeployCurrency, ValidMetadataURI } from "@zoralabs/coins-sdk";
import { Address } from "viem";
import { base } from "viem/chains";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { createCoin as createCoinInDb, createOrUpdateUser } from "@/lib/supabase-queries";
import { usePrivy } from "@privy-io/react-auth";


interface ScrapedData {
  url: string;
  title: string;
  description: string;
  author: string;
  publishDate: string;
  image: string;
  content: string;
  tags: string[];
  scrapedAt: string;
}

interface CoinData {
  coinAddress: string;
  coinId: string;
  tokenName: string;
  tokenSymbol: string;
  ipfsUri: string;
  ipfsHash: string;
  gatewayUrl: string;
  coinParams: {
    name: string;
    symbol: string;
    uri: string;
    payoutRecipient: string;
    platformReferrer: string;
    chainId: number;
  };
}

interface CoinCreationModalProps {
  onCoinCreated?: (coinData: CoinData) => void;
}

function CoinCreationModal({ onCoinCreated }: CoinCreationModalProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  // Image coin state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Handle image file selection and preview
  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { user } = usePrivy();

  const handleScrape = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    setIsLoading(true);
    setError("");
    setScrapedData(null);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to scrape content");
      setScrapedData(data);
      setTokenName(data.title.substring(0, 50));
      setTokenSymbol(data.title.substring(0, 10).toUpperCase().replace(/[^A-Z]/g, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoin = async () => {
    if (!scrapedData || !address || !isConnected || !walletClient || !publicClient) {
      setError("Please connect your wallet and scrape a blog post first");
      return;
    }
    if (!tokenName.trim() || !tokenSymbol.trim()) {
      setError("Please enter both token name and symbol");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const metadataResponse = await fetch("/api/upload-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogData: scrapedData }),
      });
      if (!metadataResponse.ok) {
        const metadataError = await metadataResponse.json();
        throw new Error(metadataError.error || "Failed to upload metadata to IPFS");
      }
      const { ipfsUri, ipfsHash, gatewayUrl } = await metadataResponse.json();
      const coinParams = {
        name: tokenName.trim(),
        symbol: tokenSymbol.trim().toUpperCase(),
        uri: ipfsUri as ValidMetadataURI,
        payoutRecipient: address as Address,
        platformReferrer: address as Address,
        chainId: base.id,
        currency: DeployCurrency.ZORA,
      };
      const result = await createCoin(coinParams, walletClient, publicClient, { gasMultiplier: 120 });
      try {
        await createOrUpdateUser(address, user?.email?.address);
        const coinDbData = {
          creator_wallet: address,
          name: coinParams.name,
          symbol: coinParams.symbol,
          coin_address: result.address || '',
          transaction_hash: result.hash || '',
          ipfs_uri: ipfsUri,
          ipfs_hash: ipfsHash,
          gateway_url: gatewayUrl,
          metadata: {
            title: scrapedData.title,
            description: scrapedData.description,
            image: scrapedData.image,
            originalUrl: scrapedData.url,
            author: scrapedData.author,
            publishDate: scrapedData.publishDate,
            tags: scrapedData.tags,
            content: scrapedData.content,
          },
        };
        await createCoinInDb(coinDbData);
      } catch (dbError) {
        // Don't throw here - the coin was created successfully on-chain
      }
      const newCoinData = {
        coinAddress: result.address || 'N/A',
        coinId: result.deployment?.coin || 'N/A',
        tokenName: coinParams.name,
        tokenSymbol: coinParams.symbol,
        ipfsUri,
        ipfsHash,
        gatewayUrl,
        coinParams,
      };
      setCoinData(newCoinData);
      if (onCoinCreated) onCoinCreated(newCoinData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create coin");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setUrl("");
    setScrapedData(null);
    setCoinData(null);
    setError("");
    setTokenName("");
    setTokenSymbol("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Create New Coin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            Create a Coin
          </DialogTitle>
          <DialogDescription>
            Choose a method to create your Zora coin
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="blog" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
          </TabsList>
          <TabsContent value="blog">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Blog URL
                </CardTitle>
                <CardDescription>
                  Enter a blog post URL to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Blog Post URL</label>
                  <Input
                    placeholder="https://medium.com/@author/article-title"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleScrape} 
                    disabled={isLoading || !url}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Scrape Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {scrapedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Scraped Content
                  </CardTitle>
                  <CardDescription>Review the extracted blog content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Name</label>
                      <Input 
                        value={tokenName} 
                        onChange={(e) => setTokenName(e.target.value)}
                        placeholder="Enter token name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Symbol</label>
                      <Input 
                        value={tokenSymbol} 
                        onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                        placeholder="Enter symbol (e.g., BTC)"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={scrapedData.description} readOnly rows={3} />
                  </div>
                  {scrapedData.tags && scrapedData.tags.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {scrapedData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {scrapedData.image && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Featured Image</label>
                      <div className="border rounded-md p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={scrapedData.image} alt="Featured" className="max-h-40 rounded-md" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea value={scrapedData.content} readOnly rows={6} />
                  </div>
                  <Button 
                    onClick={handleCreateCoin}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Coin...
                      </>
                    ) : (
                      <>
                        <Coins className="mr-2 h-4 w-4" />
                        Create Coin
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            {coinData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Coin Created Successfully!
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Your blog post has been converted to a Zora coin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Name</label>
                      <Input value={coinData.tokenName} readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Symbol</label>
                      <Input value={coinData.tokenSymbol} readOnly />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Coin Address</label>
                    <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                      <code className="text-sm flex-1 truncate">{coinData.coinAddress}</code>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(coinData.coinAddress)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">IPFS Metadata</label>
                    <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                      <code className="text-sm flex-1 truncate">{coinData.ipfsUri}</code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                      >
                        <a href={coinData.gatewayUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Close & View Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Create Coin from Image
                </CardTitle>
                <CardDescription>
                  Upload an image and create a Zora coin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image File</label>
                  <Input type="file" accept="image/*" onChange={handleImageFileChange} />
                </div>
                {imagePreview && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preview</label>
                    <div className="border rounded-md p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="max-h-40 rounded-md" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Name</label>
                    <Input 
                      value={tokenName} 
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="Enter token name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Symbol</label>
                    <Input 
                      value={tokenSymbol} 
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="Enter symbol (e.g., IMG)"
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-red-600 text-sm mb-2">
                    {error}
                  </div>
                )}
                <Button 
                  onClick={async () => {
                    if (!imageFile || !tokenName.trim() || !tokenSymbol.trim() || !address || !isConnected || !walletClient || !publicClient) {
                      setError("Please fill all fields and connect your wallet");
                      return;
                    }
                    setIsLoading(true);
                    setError("");
                    try {
                      const formData = new FormData();
                      formData.append("image", imageFile);
                      formData.append("name", tokenName.trim());
                      formData.append("symbol", tokenSymbol.trim().toUpperCase());
                      const metadataResponse = await fetch("/api/upload-metadata", {
                        method: "POST",
                        body: formData,
                      });
                      if (!metadataResponse.ok) {
                        let errorMsg = "Failed to upload image to IPFS";
                        try {
                          const metadataError = await metadataResponse.json();
                          errorMsg = metadataError.error || errorMsg;
                        } catch (jsonErr) {
                          errorMsg += ` (Invalid JSON error: ${jsonErr})`;
                        }
                        setError(errorMsg);
                        console.error('Image coin creation error:', errorMsg);
                        return;
                      }
                      const { ipfsUri, ipfsHash, gatewayUrl } = await metadataResponse.json();
                      const coinParams = {
                        name: tokenName.trim(),
                        symbol: tokenSymbol.trim().toUpperCase(),
                        uri: ipfsUri as ValidMetadataURI,
                        payoutRecipient: address as Address,
                        platformReferrer: address as Address,
                        chainId: base.id,
                        currency: DeployCurrency.ZORA,
                      };
                      const result = await createCoin(coinParams, walletClient, publicClient, { gasMultiplier: 120 });
                      try {
                        await createOrUpdateUser(address, user?.email?.address);
                        const coinDbData = {
                          creator_wallet: address,
                          name: coinParams.name,
                          symbol: coinParams.symbol,
                          coin_address: result.address || '',
                          transaction_hash: result.hash || '',
                          ipfs_uri: ipfsUri,
                          ipfs_hash: ipfsHash,
                          gateway_url: gatewayUrl,
                          metadata: {
                            image: gatewayUrl, // Use HTTP gateway URL for browser compatibility
                            title: tokenName,
                            description: '',
                            originalUrl: '',
                            author: user?.email?.address || '',
                            publishDate: '',
                            tags: [],
                            content: '',
                          },
                        };
                        await createCoinInDb(coinDbData);
                      } catch (dbError) {
                        // Don't throw here - the coin was created successfully on-chain
                        console.error('DB error after coin creation:', dbError);
                      }
                      const newCoinData = {
                        coinAddress: result.address || 'N/A',
                        coinId: result.deployment?.coin || 'N/A',
                        tokenName: coinParams.name,
                        tokenSymbol: coinParams.symbol,
                        ipfsUri,
                        ipfsHash,
                        gatewayUrl,
                        coinParams,
                      };
                      setCoinData(newCoinData);
                      if (onCoinCreated) onCoinCreated(newCoinData);
                    } catch (err) {
                      let errorMsg = "Failed to create coin";
                      let triedSwitch = false;
                      if (err instanceof Error) {
                        if (err.message.includes('ChainMismatchError') || err.message.includes('does not match the target chain')) {
                          // Try to switch the wallet network to Base mainnet (chainId 8453)
                          triedSwitch = true;
                          try {
                            if (window.ethereum) {
                              await window.ethereum.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: '0x2105' }], // 8453 in hex
                              });
                              setError('Switched to Base network. Please try creating the coin again.');
                              return;
                            } else {
                              errorMsg = "Wallet provider not found. Please switch to Base network (chain ID 8453) manually.";
                            }
                          } catch (switchErr: any) {
                            if (switchErr.code === 4001) {
                              errorMsg = "Network switch was rejected. Please switch to Base network (chain ID 8453) and try again.";
                            } else if (switchErr.code === 4902) {
                              // Network not added, try to add it
                              try {
                                await window.ethereum.request({
                                  method: 'wallet_addEthereumChain',
                                  params: [{
                                    chainId: '0x2105',
                                    chainName: 'Base',
                                    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                                    rpcUrls: ['https://mainnet.base.org'],
                                    blockExplorerUrls: ['https://basescan.org'],
                                  }],
                                });
                                setError('Base network added. Please try creating the coin again.');
                                return;
                              } catch (addErr: any) {
                                errorMsg = "Failed to add Base network. Please add it manually in your wallet.";
                              }
                            } else {
                              errorMsg = "Failed to switch network. Please switch to Base network (chain ID 8453) manually.";
                            }
                          }
                        } else {
                          errorMsg = err.message;
                        }
                      }
                      setError(errorMsg);
                      if (!triedSwitch) console.error('Image coin creation error:', err);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !imageFile || !tokenName.trim() || !tokenSymbol.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Coin...
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      Create Coin
                    </>
                  )}
                </Button>
                {coinData && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5" />
                        Coin Created Successfully!
                      </CardTitle>
                      <CardDescription className="text-green-600">
                        Your image has been converted to a Zora coin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Token Name</label>
                          <Input value={coinData.tokenName} readOnly />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Token Symbol</label>
                          <Input value={coinData.tokenSymbol} readOnly />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Coin Address</label>
                        <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                          <code className="text-sm flex-1 truncate">{coinData.coinAddress}</code>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(coinData.coinAddress)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">IPFS Metadata</label>
                        <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                          <code className="text-sm flex-1 truncate">{coinData.ipfsUri}</code>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                          >
                            <a href={coinData.gatewayUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsOpen(false)}
                      >
                        Close & View Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="music">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Create Coin from Music
                </CardTitle>
                <CardDescription>
                  Upload a music file and create a Zora coin (coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">This feature is coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default CoinCreationModal;
