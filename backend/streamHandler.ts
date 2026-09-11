import type { DynamoDBStreamEvent } from 'aws-lambda';
import { Client } from '@opensearch-project/opensearch';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const opensearchClient = new Client({
  node: process.env.OPENSEARCH_ENDPOINT || '',
});

const INDEX_NAME = 'listings';

export const handler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    if (!record.dynamodb) continue;

    const eventName = record.eventName; // 'INSERT' | 'MODIFY' | 'REMOVE'
    
    // Process only Master Records (SK = METADATA)
    const oldImage = record.dynamodb.OldImage 
      ? unmarshall(record.dynamodb.OldImage as Record<string, any>) 
      : null;

    const newImage = record.dynamodb.NewImage 
      ? unmarshall(record.dynamodb.NewImage as Record<string, any>) 
      : null;
    const image = newImage || oldImage;
    if (!image || image.SK !== 'METADATA') continue;

    const listingId = image.id;

    try {
      if (eventName === 'REMOVE') {
        await opensearchClient.delete({
          index: INDEX_NAME,
          id: listingId,
        });
      } else if ((eventName === 'INSERT' || eventName === 'MODIFY') && newImage) {
        await opensearchClient.index({
          index: INDEX_NAME,
          id: listingId,
          body: {
            id: newImage.id,
            title: newImage.title,
            description: newImage.description || '',
            type: newImage.type,
            emoji: newImage.emoji,
            district: newImage.district,
            latitude: newImage.latitude,
            longitude: newImage.longitude,
            createdAt: newImage.createdAt,
            expiryDate: newImage.expiryDate,
          },
        });
      }
    } catch (error) {
      console.error(`Error processing stream record for ID ${listingId}:`, error);
    }
  }
};