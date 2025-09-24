# CoinIT

A Next.js application that scrapes blog content and creates Zora coins from your favorite articles. Transform any blog post into a collectible digital asset on the Zora network.

[Live Demo](https://coinit-alpha.vercel.app/)

[Pitch Deck](https://drive.google.com/file/d/1JLsH3cT1lfOh2xPnBSgKvs5fLqvkkkBY/view)

[Demo Video](https://youtu.be/z1inJghlAW4)
]
## Features

- **Web Scraping**: Extract content from any blog URL (Medium, personal blogs, etc.)
- **Content Analysis**: Automatically parse title, description, author, publish date, and main content
- **IPFS Upload**: Upload blog metadata to IPFS via Pinata for decentralized storage
- **Zora Integration**: Create coins on the Zora network using the IPFS-stored metadata
- **Supabase Storage**: Store blog posts and coin data in a structured database
- **Modern UI**: Clean, responsive interface built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **IPFS Storage**: Pinata
- **Blockchain**: Zora Protocol SDK, Viem
- **Web Scraping**: Cheerio, Axios

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account
- A wallet address for Zora coin creation

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coin-it-writer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Pinata Configuration (for IPFS uploads)
PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_GATEWAY_URL=your_pinata_gateway_url

# Zora Configuration  
NEXT_PUBLIC_ZORA_API_KEY=your_zora_api_key
NEXT_PUBLIC_ZORA_RPC_URL=your_rpc_url

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Web3 Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

**Pinata Setup:**
1. Create an account at [Pinata](https://pinata.cloud/)
2. Generate a JWT token from your API keys section
3. Set up a dedicated gateway or use the default Pinata gateway
4. Add your JWT and gateway URL to the environment variables

4. Set up Supabase database:
Create the following tables in your Supabase database:

```sql
-- Blog posts table
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  publish_date TIMESTAMP,
  image TEXT,
  content TEXT,
  tags TEXT[],
  scraped_at TIMESTAMP NOT NULL,
  zora_coin_address TEXT,
  zora_coin_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Zora coins table
CREATE TABLE zora_coins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID REFERENCES blog_posts(id),
  coin_address TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Enter Blog URL**: Paste the URL of any blog post you want to scrape
2. **Add Wallet Address**: Enter your wallet address for coin creation
3. **Scrape Content**: Click "Scrape Blog Post" to extract content
4. **Review Content**: Check the extracted title, description, author, and content
5. **Create Coin**: Click "Create Zora Coin" to:
   - Upload metadata to IPFS via Pinata
   - Generate coin parameters with IPFS URI
   - Store everything in Supabase
6. **View Results**: See your newly created coin with IPFS information and coin parameters

## API Endpoints

### POST /api/upload-metadata
Uploads blog metadata to IPFS via Pinata.

**Request:**
```json
{
  "blogData": {
    "url": "https://medium.com/@author/article-title",
    "title": "Article Title",
    "description": "Article description",
    "author": "Author Name",
    "publishDate": "2024-01-15T10:00:00Z",
    "image": "https://example.com/image.jpg",
    "content": "Full article content...",
    "tags": ["tag1", "tag2"],
    "scrapedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Response:**
```json
{
  "ipfsHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "ipfsUri": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "metadata": {
    "name": "Article Title",
    "description": "A coin representing the blog post: Article Title",
    "image": "https://example.com/image.jpg",
    "external_url": "https://medium.com/@author/article-title",
    "attributes": [...],
    "content": {
      "original_link": "https://medium.com/@author/article-title",
      "author_name": "Author Name",
      "title": "Article Title",
      "content_preview": "First 100 words of content...",
      "full_description": "Article description",
      "tags": ["tag1", "tag2"],
      "scraped_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

### POST /api/scrape
Scrapes content from a blog URL.

**Request:**
```json
{
  "url": "https://medium.com/@author/article-title"
}
```

**Response:**
```json
{
  "url": "https://medium.com/@author/article-title",
  "title": "Article Title",
  "description": "Article description",
  "author": "Author Name",
  "publishDate": "2024-01-15T10:00:00Z",
  "image": "https://example.com/image.jpg",
  "content": "Full article content...",
  "tags": ["tag1", "tag2"],
  "scrapedAt": "2024-01-15T10:00:00Z"
}
```

### POST /api/create-coin
Creates a Zora coin from scraped blog data by first uploading metadata to IPFS.

**Request:**
```json
{
  "blogData": {
    "url": "https://medium.com/@author/article-title",
    "title": "Article Title",
    // ... other scraped data
  },
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "blogPost": {
    "id": "uuid",
    "url": "https://medium.com/@author/article-title",
    // ... stored blog data
  },
  "coin": {
    "coinAddress": "0x...",
    "coinId": "1",
    "tokenName": "Article Title",
    "tokenSymbol": "ARTICLE",
    "ipfsUri": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "ipfsHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "coinParams": {
      "name": "Article Title",
      "symbol": "ARTICLE",
      "uri": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "payoutRecipient": "0x...",
      "platformReferrer": "0x...",
      "chainId": 8453
    }
  },
  "ipfsUri": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "ipfsHash": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "message": "Blog post stored, uploaded to IPFS, and coin created successfully"
}
```

## Database Schema

The application uses two main tables:

### blog_posts
- `id`: UUID primary key
- `url`: Original blog post URL (unique)
- `title`: Blog post title
- `description`: Blog post description
- `author`: Author name
- `publish_date`: Original publication date
- `image`: Featured image URL
- `content`: Full blog post content
- `tags`: Array of tags/keywords
- `scraped_at`: When the content was scraped
- `zora_coin_address`: Address of created Zora coin
- `zora_coin_id`: ID of created Zora coin
- `created_at`: Database creation timestamp
- `updated_at`: Database update timestamp

### zora_coins
- `id`: UUID primary key
- `blog_post_id`: Foreign key to blog_posts
- `coin_address`: Zora coin contract address
- `coin_id`: Zora coin ID
- `token_name`: Token name
- `token_symbol`: Token symbol
- `creator_address`: Wallet address that created the coin
- `transaction_hash`: Transaction hash of coin creation
- `created_at`: Database creation timestamp
- `updated_at`: Database update timestamp

## Development

### Project Structure
```
coin-it-writer/
├── app/
│   ├── api/
│   │   ├── scrape/
│   │   │   └── route.ts      # Web scraping endpoint
│   │   ├── upload-metadata/
│   │   │   └── route.ts      # IPFS upload endpoint
│   │   └── create-coin/
│   │       └── route.ts      # Coin creation endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main application page
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── utils.ts             # Utility functions
│   ├── supabase.ts          # Supabase client setup
│   └── pinata.ts            # Pinata IPFS client setup
└── public/                  # Static assets
```

### Key Dependencies
- `@supabase/supabase-js`: Supabase client
- `@zoralabs/protocol-sdk`: Zora protocol integration
- `pinata`: IPFS uploads via Pinata
- `cheerio`: Server-side HTML parsing
- `axios`: HTTP requests
- `viem`: Ethereum interaction
- `react-hook-form`: Form handling
- `lucide-react`: Icons

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the Zora documentation at https://docs.zora.co/
- Review Supabase documentation at https://supabase.com/docs
