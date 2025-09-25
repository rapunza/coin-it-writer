
import { NextRequest, NextResponse } from 'next/server';
import { pinata } from '@/lib/pinata';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart/form-data (image coin)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageFile = formData.get('image');
      const name = formData.get('name')?.toString() || 'Image Coin';
      const symbol = formData.get('symbol')?.toString() || '';

      if (!imageFile || typeof imageFile === 'string') {
        return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
      }

      // Upload image to Pinata
      const { cid: imageCid } = await pinata.upload.public.file(imageFile);
      const imageIpfsUri = `ipfs://${imageCid}`;
      const imageGatewayUrl = await pinata.gateways.public.convert(imageCid);

      // Prepare metadata for the image coin
      const metadata = {
        name,
        description: `A coin representing the image: ${name}`,
        image: imageIpfsUri,
        external_url: '',
        attributes: [
          { trait_type: 'Type', value: 'Image' },
          { trait_type: 'Symbol', value: symbol },
        ],
      };

      // Upload metadata JSON to Pinata
      const jsonString = JSON.stringify(metadata, null, 2);
      const metaFile = new File([jsonString], `image-metadata-${Date.now()}.json`, {
        type: 'application/json',
      });
      const { cid } = await pinata.upload.public.file(metaFile);
      const gatewayUrl = await pinata.gateways.public.convert(cid);

      return NextResponse.json({
        ipfsHash: cid,
        ipfsUri: `ipfs://${cid}`,
        gatewayUrl,
        metadata,
      });
    }

    // Handle JSON (blog coin)
    const { blogData } = await request.json();
    if (!blogData) {
      return NextResponse.json({ error: 'Blog data is required' }, { status: 400 });
    }
    // ...existing blog coin logic...
    const metadata = {
      name: blogData.title || 'Blog Post Coin',
      description: `A coin representing the blog post: ${blogData.title}`,
      image: blogData.image || '',
      external_url: blogData.url,
      attributes: [
        {
          trait_type: 'Author',
          value: blogData.author || 'Unknown',
        },
        {
          trait_type: 'Source',
          value: new URL(blogData.url).hostname,
        },
        {
          trait_type: 'Type',
          value: 'Blog Post',
        },
        {
          trait_type: 'Original Link',
          value: blogData.url,
        },
        {
          trait_type: 'Publish Date',
          value: blogData.publishDate || 'Unknown',
        },
      ],
      content: {
        uri: blogData.url,
        mime: 'text/html',
      }
    };
    const jsonString = JSON.stringify(metadata, null, 2);
    const file = new File([jsonString], `blog-metadata-${Date.now()}.json`, {
      type: 'application/json',
    });
    const { cid } = await pinata.upload.public.file(file);
    const gatewayUrl = await pinata.gateways.public.convert(cid);
    return NextResponse.json({
      ipfsHash: cid,
      ipfsUri: `ipfs://${cid}`,
      gatewayUrl,
      metadata,
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `Failed to upload to IPFS: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to upload metadata to IPFS' }, { status: 500 });
  }
}