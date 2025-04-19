import { QueryCommand, UpdateItemCommand, GetItemCommand, PutItemCommand  } from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { stockPerformance } from './stock/dataCollection.js';
import { s3Client, docClient } from './awsConfig.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucketName = 'mangotango-stocks-data';
const stocksTableName = 'stocks'

export async function setAlerts(userId, alert) {
    const { symbol, thresholdHigh, thresholdLow } = alert;

    if (!symbol || (thresholdHigh === undefined && thresholdLow === undefined)) {
        return { error: 'Symbol and at least one threshold required' };
    }

    const key = {
        userId: { S: userId },
        symbol: { S: symbol }
    };

    const getParams = {
        TableName: stocksTableName,
        Key: key
    };

    let existingItem;
    try {
        const result = await docClient.send(new GetItemCommand(getParams));
        existingItem = result.Item;
    } catch (error) {
        console.error(`Error fetching item for ${symbol}:`, error);
        return { error: `Failed to check existing item: ${error.message}` };
    }

    const alertData = {
        userId,
        symbol,
        thresholdHigh,
        thresholdLow,
        timestamp: new Date().toISOString()
    };

    const alertKey = `alerts/set/${userId}/${symbol}/${Date.now()}.json`;
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: alertKey,
            Body: JSON.stringify(alertData, null, 2),
            ContentType: 'application/json'
        }));

        const s3Location = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
                Bucket: bucketName,
                Key: alertKey
            }),
            { expiresIn: 3600 }
        );

        if (!existingItem) {
            const createParams = {
                TableName: stocksTableName,
                Item: {
                    userId: { S: userId },
                    symbol: { S: symbol },
                    Transactions: { L: [] },
                    ThresholdHigh: thresholdHigh !== undefined ? { N: thresholdHigh.toString() } : { NULL: true },
                    ThresholdLow: thresholdLow !== undefined ? { N: thresholdLow.toString() } : { NULL: true }
                }
            };
            await docClient.send(new PutItemCommand(createParams));
        } else {
            const updateParams = {
                TableName: stocksTableName,
                Key: key,
                UpdateExpression: 'SET ThresholdHigh = :high, ThresholdLow = :low',
                ExpressionAttributeValues: {
                    ':high': thresholdHigh !== undefined ? { N: thresholdHigh.toString() } : { NULL: true },
                    ':low': thresholdLow !== undefined ? { N: thresholdLow.toString() } : { NULL: true }
                }
            };
            await docClient.send(new UpdateItemCommand(updateParams));
        }
        return { userId, symbol, thresholdHigh, thresholdLow, s3Location };
    } catch (error) {
        console.error(`Error in setAlerts for ${symbol}:`, error);
        return { error: `Failed to set alert: ${error.message}` };
    }
}

export async function getAlerts(userId) {
    const stockParams = {
        TableName: stocksTableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': { S: userId }
        }
    };

    let stocks;
    try {
        stocks = await docClient.send(new QueryCommand(stockParams));
    } catch (error) {
        console.error(`Error querying stocks for user ${userId}:`, error);
        return { error: `Failed to query stocks: ${error.message}` };
    }

    if (!stocks.Items || stocks.Items.length === 0) {
        return { error: `userId ${userId} has no stocks in portfolio` };
    }

    const triggeredAlerts = [];
    for (const stock of stocks.Items) {
        const symbol = stock.symbol.S;
        const thresholdHigh = stock.ThresholdHigh?.N ? parseFloat(stock.ThresholdHigh.N) : null;
        const thresholdLow = stock.ThresholdLow?.N ? parseFloat(stock.ThresholdLow.N) : null;

        if (!thresholdHigh && !thresholdLow) continue;

        const performance = await stockPerformance(symbol);
        if ('error' in performance.historicalDataResponse) {
            console.error(`Failed to fetch performance for ${symbol}: ${performance.historicalDataResponse.error}`);
            continue;
        }

        // Access the price from the nested structure
        const currentPrice = performance.historicalDataResponse.events[0].attributes[0].price;
        if (thresholdHigh && currentPrice > thresholdHigh) {
            triggeredAlerts.push({
                symbol,
                currentPrice,
                thresholdHigh,
                type: 'above'
            });
        }
        if (thresholdLow && currentPrice < thresholdLow) {
            triggeredAlerts.push({
                symbol,
                currentPrice,
                thresholdLow,
                type: 'below'
            });
        }
    }

    let s3Location = null;
    if (triggeredAlerts.length > 0) {
        const alertData = {
            alerts: triggeredAlerts,
            timestamp: new Date().toISOString()
        };
        const alertKey = `alerts/${userId}.json`;
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: alertKey,
                Body: JSON.stringify(alertData, null, 2),
                ContentType: 'application/json'
            }));

            s3Location = await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                    Bucket: bucketName,
                    Key: alertKey
                }),
                { expiresIn: 3600 } // URL valid for 1 hour
            );
        } catch (error) {
            console.error(`Failed to store alerts in S3 for ${userId}:`, error);
        }
    }

    return { alerts: triggeredAlerts, s3Location };
}