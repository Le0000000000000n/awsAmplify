import yahooFinance from 'yahoo-finance2';
import { s3Client } from '../awsConfig.js';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { calculateTrends } from './performance.js';
import { createInitialJsonObjectHead } from '../helper.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from 'dotenv';
config();

yahooFinance.suppressNotices(['ripHistorical', 'yahooSurvey']);

const bucketName = 'mangotango-stocks-data';
const currentDate = new Date().toISOString().split('T')[0];

//returns intraday information for a stock
async function quoteStockInfo(symbol) {
    const data = await yahooFinance.quote(symbol);
    return {
        symbol: data.symbol,
        price: data.regularMarketPrice,
        volume: data.regularMarketVolume,
        marketCap: data.marketCap,
    };
}

async function validStockCheck(symbol) {
    let queryOptions = {
        period1: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        interval: '1d'
    };
    const historicalData = await getHistroicalStockData(symbol);
    if ('error' in historicalData) {
        return {"error": "invalid symbol"};
    } else {
        return {"message": "valid data"}
    }
}

async function getSector(symbol) {
    const queryOptions = { lang: 'en-US', reportsCount: 0, region: 'US' }
    const stockInsight = await yahooFinance.insights(symbol, queryOptions);
    return stockInsight.instrumentInfo.technicalEvents.sector;
  }

const getHistroicalStockData = async (symbol) => {
    const s3Key = `history/${symbol}/last-200-days.json`;

    try {
        const s3Params = {
            Bucket: bucketName,
            Key: s3Key
        };

        
        const storedData = await s3Client.send(new GetObjectCommand(s3Params))
            .then(data => data.Body.transformToString())
            .then(body => JSON.parse(body))
            .catch(() => null);

        if (storedData) {
            const s3Location = await getSignedUrl(
                s3Client,
                new GetObjectCommand(s3Params),
                { expiresIn: 3600 } // Expiration miliseconds
            );
            return { historicalDataResponse: storedData, s3Location };
        }
        return await updateHistoryStore(symbol, s3Key);
    } catch (error) {

        return { error: `Error fetching stock history: ${error.message}` };
    }
};

async function updateHistoryStore(symbol, s3Key) {
    const s3Params = {
        Bucket: bucketName,
        Key: s3Key
    };
    const approx200TradingDays = Math.round(((200 / 5) * 7) + 15);
    const endDate = new Date();
    const queryOptions = {
        period1: new Date(endDate.setDate(endDate.getDate() - approx200TradingDays)),
        period2: new Date(),
        interval: '1d'
    }
    const history = await yahooFinance.historical(symbol, queryOptions);
    if ('error' in history) {
        return {"error": error}
    }

    
    const formattedHistory = history.map(day => ({
        date: day.date.toISOString().split('T')[0],
        open: day.open,
        high: day.high,
        low: day.low,
        close: day.close,
        volume: day.volume
    }));

    try {
        const response = await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: JSON.stringify(formattedHistory, null, 2), // Fixed JSON.stringify formatting
            ContentType: 'application/json'
        }));
    } catch (error) {
        console.error('Error uploading to S3:', error);
    }

    const s3Location = await getSignedUrl(
        s3Client,
        new GetObjectCommand(s3Params),
        { expiresIn: 3600 } // Expiration miliseconds
    );
    return { historicalDataResponse: formattedHistory, s3Location };

}

async function stockPerformance(symbol) {
    const currentDate = new Date().toISOString().split('T')[0];
    const s3Key = `performance/${symbol}/${currentDate}.json`;

    try {
        // Check S3 first
        const s3Params = {
            Bucket: bucketName,
            Key: s3Key
        };
        const storedData = await s3Client.send(new GetObjectCommand(s3Params))
            .then(data => data.Body.transformToString())
            .then(body => JSON.parse(body))
            .catch(() => null);

        if (storedData) {
            const s3Location = await getSignedUrl(
                s3Client,
                new GetObjectCommand(s3Params),
                { expiresIn: 3600 } // Expiration in seconds
            );
            return { historicalDataResponse: storedData, s3Location };
        }

        return await updatePerformanceStore(symbol, s3Key);
    } catch (error) {
        return { 'error': 'Failed to retrieve stock data: ' + error.message };
    }
};

async function updatePerformanceStore(symbol, s3Key) {
    const approx200TradingDays = Math.round(((200 / 5) * 7) + 15);
    let queryOptions = {
        period1: new Date(Date.now() - approx200TradingDays * 24 * 60 * 60 * 1000),
        interval: '1d'
    };

    try {
        const { historicalDataResponse: historicalData } = await getHistroicalStockData(symbol, queryOptions);
        if ('error' in historicalData) {
            throw new Error(historicalData.error);
        }

        const basicStockInfo = await quoteStockInfo(symbol);
        const trendIndicators = await calculateTrends(historicalData, basicStockInfo.volume);
        let price = basicStockInfo.regularMarketPrice;
        if (!basicStockInfo.regularMarketPrice) {
            price = parseFloat(parseFloat(historicalData[historicalData.length - 1].close).toFixed(2));
        }

        let jsonObject = createInitialJsonObjectHead(); // Assuming this doesn’t need s3Location yet
        const attributesObject = {
            symbol: basicStockInfo.symbol,
            price: price,
            volume: basicStockInfo.volume,
            marketCap: basicStockInfo.marketCap,
            previous_close: basicStockInfo.previousClose,
            change: basicStockInfo.change,
            change_percent: basicStockInfo.changePercent,
            trends: trendIndicators.trends,
            momentum_indicators: trendIndicators.momentum_indicators,
            mean_reversion: trendIndicators.mean_reversion
        };

        jsonObject.events.push({
            time_object: {
                timestamp: Math.floor((new Date()).getTime() / 1000),
                timezone: 'UTC'
            },
            event_type: 'stock_performance_analysis',
            attributes: [attributesObject],
        });

        // Define s3Params here
        const s3Params = {
            Bucket: bucketName,
            Key: s3Key
        };

        // Cache the complete result in S3
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: JSON.stringify(jsonObject, null, 2),
            ContentType: 'application/json'
        }));

        const s3Location = await getSignedUrl(
            s3Client,
            new GetObjectCommand(s3Params),
            { expiresIn: 3600 } // Expiration in seconds
        );

        return { historicalDataResponse: jsonObject, s3Location };
    } catch (error) {
        return {"error" : `Failed to update performance store: ${error.message}`};
    }
}

export { getHistroicalStockData, stockPerformance, updateHistoryStore, updatePerformanceStore, quoteStockInfo, getSector, validStockCheck };
