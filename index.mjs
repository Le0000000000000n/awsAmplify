import yahooFinance from "yahoo-finance2";
// import {LoadPortfolios, LoadPortfolio, LoadStock, LoadStocks} from "./stock-api/dbFunctions.js";
import { getHistroicalStockData, stockPerformance, updateHistoryStore, updatePerformanceStore } from './stock-api/stock/dataCollection.js';
import { userLogin, userRegister } from "./stock-api/user.js";
import {DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getAlerts, setAlerts } from './stock-api/alerts.js';
// // import { Stocks, Stock } from "./shared/Stocks.js";
import {
    DynamoDBDocumentClient,
//     ScanCommand,
    PutCommand,
    GetCommand,
//     DeleteCommand,
  } from "@aws-sdk/lib-dynamodb";
import { createInitialJsonObjectHead } from "./stock-api/helper.js";
import { createPortfolio, deletePortfolio, getAllocation, assetRemove, portfolioPerformance } from "./stock-api/portfolio.js";
const OK = 200;
const INPUT_ERROR = 400;
import dotenv from 'dotenv';
dotenv.config();


export const handler = async (event) => {
    // return {mental : "retardation"} 
    const client = new DynamoDBClient({});
    const dynamo = DynamoDBDocumentClient.from(client);
    // return JSON.stringify(event.routeKey)
    
    try {
        switch (event.routeKey) {
            case "GET /":
                return {
                    statusCode: OK,
                    body: JSON.stringify("Hello, please consult the swagger for the correct routes"),
                };
            case "POST /auth/signup": //Done
                // var { email, password, name } = event.body;
                var body =  JSON.parse(event.body)
                var name = body.name;
                var email = body.email;
                var password = body.password;
                
                var response = await userRegister(email, password, name);
                if (!response) {
                    throw new Error(response)
                }
                return {
                    statusCode: OK,
                    body: JSON.stringify(response)
                };
            case "POST /auth/login": //Done
                // var { email, password, name } = event.body;
                var body =  JSON.parse(event.body)
                var name = body.name;
                var email = body.email;
                var password = body.password;
                var response = await userLogin(email, password);
                if ('error' in response) {
                    throw new Error(response)
                }
                return {
                    statusCode: OK,
                    body: JSON.stringify(response)
                };
            case "GET /stock/{symbol}/performance": //Done
                try {
                    var symbol = event.rawPath.split("/")[2];
                    var result = await yahooFinance.quoteSummary(symbol, { modules: ["price"] });
                    return {
                        statusCode: OK,
                        body : JSON.stringify({
                            symbol: symbol,
                            open: result.price.regularMarketOpen,
                            high: result.price.regularMarketDayHigh,
                            low: result.price.regularMarketDayLow,
                            close: result.price.regularMarketPreviousClose,
                            volume: result.price.regularMarketVolume,
                        })
                    }
                } catch (error) {
                    return {
                        statusCode: INPUT_ERROR,
                        body: JSON.stringify({error: "Error in the body: " + error}) //"Hello, please consult the swagger for the correct routes"),
                    };
                };
            case "POST /stock/{symbol}/performance": //Done
                var symbol = event.rawPath.split("/")[2];
                var currentDate = new Date().toISOString().split('T')[0];
                var s3Key = `performance/${symbol}/${currentDate}.json`;
                try {
                    await updatePerformanceStore(symbol, s3Key);
                    return({ message: `Successfully updated performance data for ${symbol}` });
                } catch (error) {
                    return({statusCode: 400, body: `Failed to update performance data for ${symbol}: ${error.message}` });
                };
            case "GET /stock/{symbol}/compare": //Done
                try {
                    var symbol = event.rawPath.split("/")[2];
                    const stockVsectorInsights = await yahooFinance.insights(symbol, { reportsCount: 0 });
                    let jsonObject = {
                            data_source: "Mango-Tango Stock",
                            dataset_type: "stock_history",
                            dataset_id: "http://mango-tango.s3.aws",
                            time_object: {
                                timestamp: Math.floor((new Date()).getTime() / 1000),
                                timezone: "UTC"
                            },
                            events: []
                        };
                    jsonObject.events.push({
                        event_type: "StockVsSectorComparison",
                        attributes: stockVsectorInsights.companySnapshot       
                    });
                    return {
                        statusCode: OK,
                        body: JSON.stringify(jsonObject) //"Hello, please consult the swagger for the correct routes"),
                    };
                } catch (error) {
                    return {
                        statusCode: INPUT_ERROR,
                        body: JSON.stringify({error: "Error in the body: " + error}) //"Hello, please consult the swagger for the correct routes"),
                    };
                };
            case "GET /stock/{symbol}/history": //Done
                var symbol = event.rawPath.split("/")[2];
                var { historicalDataResponse, s3Location } = await getHistroicalStockData(symbol);
                if (!historicalDataResponse) {
                    return {error: historicalDataResponse.message}//"Error in retrieving historical data"}
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
                return JSON.stringify(jsonObject);
            case "POST /stock/{symbol}/history": //Done
                var symbol = event.rawPath.split("/")[2];
                var s3Key = `history/${symbol}/last-200-days.json`;
                try {
                    await updateHistoryStore(symbol, s3Key);
                    return({'message': 'successfully updated 200 days of historical data'})
            
                } catch (error) {
                    return({statusCode: 400, body: `Failed to update historical data for ${symbol}`})
                };
            case "POST /portfolio": //Not in server.js
                var { portfolioId, symbol, quantity, buy_price } = event.body;
                var rawData = await dynamo.send(new ScanCommand({
                    'TableName': 'stocks',
                }));
                // Double check this
                var currStockPrice = await yahooFinance.quoteSummary(symbol, { modules: ["price"] });

                var currStock = rawData.Items.find((stock) => stock.symbol == symbol && stock.portfolioId == portfolioId);
                if (currStock != null) {
                    currStock.stocks.push({quantity, currStockPrice});
                    await dynamo.send(new PutCommand({
                        'TableName': 'stocks',
                        'Item': currStock
                    }));
                } else {
                    await dynamo.send(new PutCommand({
                        'TableName': 'stocks',
                        'Item': {
                            'Name': 'placeHolderName',
                            'Code': symbol,
                            'StockId' : new GUID(),
                            'PortfolioId' : portfolioId,
                            'Stocks' : [{quantity, currStockPrice}]
                        }
                    }));
                }
                return {
                    statusCode: OK,
                    body: JSON.stringify(response)
                };   
            case "GET /portfolio/chart": //Not in server.js
                // var { portfolioId } = event.body;
                var body =  JSON.parse(event.body)
                var portfolioId = body.portfolioId;
                var assets = body.assets;
                var rawData = await dynamo.send(new ScanCommand({
                    'TableName': 'stocks',
                }));
                var labels = rawData.map((stock) => stock.symbol);
                var data = rawData.map((stock) => stock.quantity);
                
                return {
                    statusCode: OK,
                    body: JSON.stringify({labels: data})
                };
            case "POST /portfolio/create": //Done
                var body =  JSON.parse(event.body)
                var name = body.name;
                var assets = body.assets;
                    // NOT TO BE CREATEPORTFOLIO
                if (!name || !assets) {
                    throw error("error with name and assets!");
                }
                var response = await createPortfolio(name, assets);
                if (!response) {
                    throw error(response)
                }
                return {
                    statusCode: OK,
                    body: JSON.stringify(response)
                };   
            case "POST /portfolio/assets": //Done
                try {
                    
                    var body =  JSON.parse(event.body)
                    var userId = body.userId;
                    var assets = body.assets;
                    // {
                    //     symbol
                    //     price
                    //     quantity
                    //     data
                    // }

                    if (!userId || !assets || assets.length == 0) {
                        // throw new Error("TESTING THE FUCING WATERS");
                        return {error: "Please check the request"}//{picepf: "fuickingshit"}
                    }
                    var response = await createPortfolio(userId, assets);
                    // if ('error' in response) {
                    if (!response) {
                        return {
                            statusCode: 403,
                            body: "Fuck you"
                        }   
                        throw new Error("response");
                    }
                    return {
                        statusCode: OK,
                        body: JSON.stringify(response)
                    }   
                } catch (err) {
                    return {
                        statusCode: INPUT_ERROR,
                        body: JSON.stringify({error: err}) //"Hello, please consult the swagger for the correct routes"),
                    };
                
                }; 
            case "DELETE /portfolio/{userId}": //Done. Weird, it returns an err lookalike but it's 200
                var userId = event.rawPath.split("/")[2];

                if (!userId) {
                    return ({ error: 'Portfolio ID is required for deletion.' });
                }
            
                var response = await deletePortfolio(userId);
                var errCode = 200;
                if (response.error) {
                    errCode = 400
                }
                return ({
                    statusCode : errCode,
                    body: JSON.stringify(response)
                });
            case "GET /portfolio/{userId}/performance": //Done
                var userId = event.rawPath.split("/")[2];
                var response = await portfolioPerformance(userId);
                if (!response) {
                    return {error: "Error in processing this command"}
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify(response) //"Hello, please consult the swagger for the correct routes"),
                };
            case "GET /portfolio/{userId}/allocation": //Done
                var userId = event.rawPath.split("/")[2];
                var response = await getAllocation(userId);
                if (!response) {
                    return {error: "Error in processing this command"}
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify(response) //"Hello, please consult the swagger for the correct routes"),
                };
            case "DELETE /portfolio/{userId}/assets/{symbol}/remove": //Done
                var userId = event.rawPath.split("/")[2];
                var symbol = event.rawPath.split("/")[4];
                var response = await assetRemove(userId, symbol);
                if (!response) {
                    return {error: "Error in processing this command"}
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify(response) //"Hello, please consult the swagger for the correct routes"),
                };
            case "DELETE /portfolio/{id}": //Done
                var userId = event.rawPath.split("/")[2];
                var response = await deletePortfolio(userId, client);

                if ('error' in response) {
                    throw new Error(response.error);
                }
                return {
                    statusCode: 204,
                    body: JSON.stringify(response)
                };   
            case "GET /alerts/{userId}": //Done
                try {
                    var userId = event.rawPath.split("/")[2];
                    var { alerts: userAlerts, s3Location } = await getAlerts(userId);
                    if (!userAlerts || 'error' in userAlerts) {
                        throw new Error(userAlerts);
                    } else {
                        let jsonObject = createInitialJsonObjectHead(s3Location);
                        jsonObject.events.push({
                        event_type: 'AlertCheck',
                        attributes: {
                            triggered: userAlerts.length > 0,
                            alerts: userAlerts
                        }
                        });
                        return {
                            statusCode: OK,
                            body: JSON.stringify(jsonObject)
                        };
                    }
                } catch (error) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify(error.message)
                    };
                };
            case "POST /alerts/{userId}": //Done
                try {
                    var userId = event.rawPath.split("/")[2];
                    var alert = JSON.parse(event.body); //
                    var alertResult = await setAlerts(userId, alert);
                    if (!alertResult) {
                        throw new Error(alertResult);
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
                    return {
                        statusCode: OK,
                        body: JSON.stringify(jsonObject)
                    };
                } catch (error) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify(error.message)
                    };
                };
            default:
                return {
                    statusCode: INPUT_ERROR,
                    body: JSON.stringify("Wrong route")
                };
        }
    } catch (err) {
        return {
            statusCode: INPUT_ERROR,
            body: JSON.stringify(err) //"Hello, please consult the swagger for the correct routes"),
        };
    }
    /* Example dynamoDB command
    try {
        var body = await dynamo.send(new ScanCommand({
            'TableName': 'stocks',
        }));
        var stocks = []
        body.Items.forEach(element => {
        stocks.push(ConvertStock(element)  )
        });
        return {
            statusCode: OK,
            body: JSON.stringify(stocks) //"Hello, please consult the swagger for the correct routes"),
        };
    } catch (err) {
        return {
            statusCode: INPUT_ERROR,
            body: JSON.stringify({error: "Error in the body"}) //"Hello, please consult the swagger for the correct routes"),
        };
    }
    */
};