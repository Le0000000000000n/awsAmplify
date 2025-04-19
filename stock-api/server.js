// Top of your file:
import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';
import * as dbFunction from './dbFunctions.js';

import { getAlerts, setAlerts } from './alerts.js';
import { createInitialJsonObjectHead } from './helper.js';
import { assetRemove, createPortfolio, deletePortfolio, getAllocation, portfolioPerformance } from './portfolio.js';
import { createS3Bucket } from './s3Functions.js';
import { getHistroicalStockData, stockPerformance, updateHistoryStore, updatePerformanceStore } from './stock/dataCollection.js';
import { userLogin, userRegister } from './user.js';


const OK = 200;
const INPUT_ERROR = 400;
// const swaggerDocument = loadYAML('docs/swagger.yaml');

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const app = express();
app.use(cors());
app.use(express.json());

app.post('/auth/signup', async (req, res) => {
    const { email, password, name } = req.body;
    const response = await userRegister(email, password, name);
    if ('error' in response) {
        return res.status(INPUT_ERROR).json(response);
    }
    res.status(OK).json(response);
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const response = await userLogin(email, password);
    if ('error' in response) {
        return res.status(INPUT_ERROR).json(response);
    }
    res.status(OK).json(response);
});

// API to create portfolio (also route used for adding asset to portfolio so should just change to /add)
app.post('/portfolio/assets', async (req, res) => {
    //assets is an array of object {symbol, price, quantity}
    const { userId, assets } = req.body;

    portfolio.push({ symbol, quantity, buy_price });
    res.status(201).json({ message: `Added ${quantity} shares of ${symbol} to the portfolio` });
});

// API to set up real-time alerts for stock price changes
app.post("/alerts", (req, res) => {
    const { symbol, threshold, type } = req.body;

    alerts.push({ symbol, threshold, type });
    res.status(201).json({ message: `Alert set up for ${symbol} when price is ${type === "rise" ? "above" : "below"} ${threshold}` });
});

// API to get portfolio chart data
app.get("/portfolio/chart", (req, res) => {
    const labels = portfolio.map((stock) => stock.symbol);
    const data = portfolio.map((stock) => stock.quantity);

    res.json({ labels, data });
});



// API to create portfolio
app.post('/portfolio/create', async (req, res) => {
    const { email, password, name, assets } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await createPortfolio(userId, assets);
    if ('error' in response) {
        return res.status(INPUT_ERROR).json(response);
    }
    res.status(OK).json(response);
});

// API to delete portfolio
app.delete('/portfolio/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: 'Portfolio ID is required for deletion.' });
    }

    const response = await deletePortfolio(userId);
    res.status(response.error ? 400 : 200).json(response);
});


// Gets current portfolio allocation
app.get('/portfolio/:userId/allocation', async (req, res) => {
    const { userId } = req.params;

    const response = await getAllocation(userId);
    if ('error' in response) {
      return res.status(INPUT_ERROR).json(response);
    }
    res.json(response);
});

// Removes an asset to portfolio
app.delete('/portfolio/:userId/assets/:symbol/remove', async (req, res) => {
    const { userId, symbol } = req.params;
    
    const response = await assetRemove(userId, symbol);
    if ('error' in response) {
      return res.status(INPUT_ERROR).json(response);
    }
    res.json(response);
});

app.post('/alerts/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const alert = req.body;
        const alertResult = await setAlerts(userId, alert);
        if ('error' in alertResult) {
            return res.status(400).json(alertResult);
        }

        // Use the s3Location from setAlerts in the response
        let jsonObject = createInitialJsonObjectHead(alertResult.s3Location);
        jsonObject.events.push({
            event_type: 'AlertSet',
            attributes: {
                userId: alertResult.userId,
                symbol: alertResult.symbol,
                thresholdHigh: alertResult.thresholdHigh,
                thresholdLow: alertResult.thresholdLow
            }
        });

        // Send the response with s3Location included
        res.status(200).send(JSON.stringify(jsonObject));
    } catch (error) {
        res.status(500).json({ error: `Failed to set alert: ${error.message}` });
    }
});

app.get('/alerts/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { alerts: userAlerts, s3Location } = await getAlerts(userId);
        if (!userAlerts || 'error' in userAlerts) {
            res.status(500).json(userAlerts);
        } else {
            let jsonObject = createInitialJsonObjectHead(s3Location);
            jsonObject.events.push({
            event_type: 'AlertCheck',
            attributes: {
                triggered: userAlerts.length > 0,
                alerts: userAlerts
            }
            });
            res.send(JSON.stringify(jsonObject));
        }
    } catch (error) {
        res.status(500).json({ error: `Failed to check alerts: ${error.message}` });
    }
}); 


app.get('/stock/:symbol/history', async (req, res) => {
    try {
        const { historicalDataResponse, s3Location } = await getHistroicalStockData(req.params.symbol);
        if ('error' in historicalDataResponse) {
            return res.status(400).json({ error: historicalDataResponse.error });
        }
        let jsonObject = createInitialJsonObjectHead(s3Location);
        jsonObject.events.push({
            time_object: {
                timestamp: Math.floor((new Date()).getTime() / 1000),
                duration: 86400,
                duration_unit: 'second',
                timezone: 'UTC'
            },
            event_type: '200_daily_price',
            attributes: historicalDataResponse
        });
        res.send(JSON.stringify(jsonObject));
    } catch (error) {
        res.status(500).json({ 'error': 'Failed to retrieve stock data' });
    }
});

app.post('/stock/:symbol/history', async (req, res) => {
    const symbol = req.params.symbol;
    const s3Key = `history/${symbol}/last-200-days.json`;
    try {
        await updateHistoryStore(symbol, s3Key);
        res.send({'message': 'successfully updated 200 days of historical data'})

    } catch (error) {
        res.status(400).send({'error': `Failed to update historical data for ${symbol}`})
    }
});


app.get('/stock/:symbol/performance', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const performanceResults = await stockPerformance(symbol);
        res.send(JSON.stringify(performanceResults));
    } catch (error) {
        res.status(500).json({ 'error': 'Failed to retrieve stock data' });
    }
});

app.post('/stock/:symbol/performance', async (req, res) => {
    const symbol = req.params.symbol;
    const currentDate = new Date().toISOString().split('T')[0];
    const s3Key = `performance/${symbol}/${currentDate}.json`;
    try {
        await updatePerformanceStore(symbol, s3Key);
        res.send({ message: `Successfully updated performance data for ${symbol}` });
    } catch (error) {
        res.status(400).send({ error: `Failed to update performance data for ${symbol}: ${error.message}` });
    }
});

app.get('/stock/:symbol/compare', async (req, res) => {
    try {
        const stockVsectorInsights = await yahooFinance.insights(req.params.symbol, { reportsCount: 0 });
        let jsonObject = createInitialJsonObjectHead('https://mangotango-stocks-data.s3.us-east-1.amazonaws.com/history/AAPL/last-200-days.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA2MIYRWT47HZPX3KJ%2F20250320%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250320T052917Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCXVzLXdlc3QtMiJHMEUCIQDhFMdyjObAM47Lgz6jvrct6soH%2FZl91Vt7ta4YkwGgegIgNYtzNkDFBh8BlZ0gkWtuztOwIdTNi%2BzIbXLjFj6i%2FgYqtwIIhf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw3MTM1NTI5MzQxMzciDLJjsiALbVLKXaVWcyqLApCwz5Ysm2VyvH23o3XmWJp4jD3wnrtPoBzq95P6lm05VZzclDNdpMvFyiAkoO9%2B4W2PDb7VHHEJE0Y87UaUIBZtymvocYX9AeEnm7WadPicZFiacF%2FZ6cs4sxeMlHNg5UNNRC7csknEB0VJBDfo3S1s5k084Hs%2BedS8wENdjrIRERXinpzIO4ESI9h4DJak%2BKPCal7gFfbldrXNg0wD6AS2udPxZa%2FZVLQ%2Bpz9oJgryIVagErwgJk%2BhTa9v9Avni8PdjnkyHjl0uF1RT4Rm0IQF6YgnrEPOU6uwHuTFQzzTGWVIwcA9%2B1o%2FZ9jC2op1YBUu3RYzyjvHQ7b%2BCd8oIW1rsYAY%2B93k56cfnDDJle6%2BBjqdAb0QzWeIGAWeYzvxEJxk4tBPoZNJNXTfM5Qo70%2F0VbRZhXICVe3YfKAru1iJmZdopBpMRW3mMAvy23ExvHN7GDly4TzKEo3rbAU3%2FoJTMU0LufkD0nJ70YT3l3Uy0Iwfmj%2F9UDFzW%2BZqs1r1aZfdGOlu5kXFqwqcmwCfHyTXJMIAoBTSd5LfhHtNpOvwvb5H19vGHbNaHONmYo2Fakk%3D&X-Amz-Signature=45a99d5c314f9faa32c067317e210c869dfab6cfb4a74469b4e460fac5ca1142&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject');
        jsonObject.events.push({
            event_type: 'StockVsSectorComparison',
            attributes: stockVsectorInsights.companySnapshot       
        });
        res.send(JSON.stringify(jsonObject));
    } catch (error) {
        res.status(500).json({ 'error': 'Failed to retrieve stock data' });
    }
});


app.get('/portfolio/:userId/performance', async (req, res) => {
    const userId = req.params.userId;
    const response = await portfolioPerformance(userId);
    if ('error' in response) {
        return res.status(INPUT_ERROR).json(response);
    }
    res.status(OK).json(response); 
});

export async function initialise() {
    try {
        await dbFunction.CreateTables();
        await createS3Bucket();
        console.log('AWS instances initialised successfully');
    } catch (error) {
        console.error('Error initialising AWS instances:', error);
        throw error;
    }
}

if (process.env.NODE_ENV !== 'lambda') {
    const PORT = 3000;
    initialise().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running at: http://localhost:${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to start server due to initialisation error:', err);
        process.exit(1);
    });
}