import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});

export const getIndex = () => {
  return pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME!);
};