import { docClient } from './awsConfig.js';
import { PutCommand, GetCommand, UpdateCommand, QueryCommand, BatchWriteCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getSector, quoteStockInfo } from './stock/dataCollection.js';
import { validStockCheck } from './stock/dataCollection.js';

const usersTableName = 'users';
const stocksTableName = 'stocks'

export const createPortfolio = async (userId, assets) => {
    
    const validUserParams = {
        TableName: usersTableName,
        Key: { "userId": { S: userId } }
    }

    const userFound =  async (validUserParams)  => {
        try {
            const response = await docClient.send(new GetItemCommand(validUserParams));
            return response.Item ? true : false;
        } catch (error) {
            return false;
        }
    }
    if (!(await userFound(validUserParams))) {
        return {error:`User ${userId} does not exist`};
    }

    const successfulAssets = [];
    const failedAssets = [];

    for (const asset of assets) {

        if (!isDateValid(asset.date)) {
            failedAssets.push({ symbol: asset.symbol, reason: "error: invalid date" });
            continue;
        }

        const stockKey = {
            userId: userId,
            symbol: asset.symbol
        }
        const getStockParams = {
            TableName: stocksTableName,
            Key: stockKey
        };
        try {
            const stockExists = await docClient.send(new GetCommand(getStockParams));
            if (stockExists.Item) {
                const validStock = await validStockCheck(asset.symbol);
                if ('error' in validStock) {
                    failedAssets.push({ symbol: asset.symbol, reason: validStock.error });
                    continue;
                }
                // Stock exists -> append to transactions
                const updateStockParams = {
                    TableName: stocksTableName,
                    Key: stockKey,
                    UpdateExpression: 'SET Transactions = list_append(Transactions, :addTransaction)',
                    ExpressionAttributeValues: {
                        ':addTransaction': [{ price: asset.price, quantity: asset.quantity, date: asset.date }]
                    }
                };
                await docClient.send(new UpdateCommand(updateStockParams));
                successfulAssets.push(asset.symbol);
            } else {
                // Stock doesn’t exist -> check if valid stock -> create new item
                const validStock = await validStockCheck(asset.symbol);
                if ('error' in validStock) {
                    failedAssets.push({ symbol: asset.symbol, reason: validStock.error });
                    continue;
                }

                const createStockParams = {
                    TableName: stocksTableName,
                    Item: {
                        userId: userId,
                        symbol: asset.symbol,
                        ThresholdHigh: null,
                        ThresholdLow: null,
                        Transactions: [{ price: asset.price, quantity: asset.quantity, date: asset.date}]
                    }
                };
                await docClient.send(new PutCommand(createStockParams));
                successfulAssets.push(asset.symbol);
            }
        } catch (error) {
            failedAssets.push({ symbol: asset.symbol, reason: error.message });
        }

    };
    return assetsSuccessOrFail(successfulAssets,failedAssets);
};

export function isDateValid(dateStr) {
    return !isNaN(new Date(dateStr));
  }

function assetsSuccessOrFail(successfulAssets,failedAssets) {
    if (successfulAssets.length === 0 && failedAssets.length > 0) {
        // All assets failed
        return {
            error: "Failed to add any assets, all invalid",
            details: failedAssets
        };
    } else if (successfulAssets.length > 0 && failedAssets.length === 0) {
        // All assets succeeded
        return {
            message: `Successfully added all assets: ${successfulAssets.join(", ")} to portfolio`,
            successful: successfulAssets
        };
    } else {
        // One or more pass and fail
        return {
            message: `Successfully added valid assets: ${successfulAssets.join(", ")}`,
            successful: successfulAssets,
            failed: failedAssets.map(failedAsset => `${failedAsset.symbol}: ${failedAsset.reason}`)
        };
    }
}
export const deletePortfolio = async (userId) => {
    const deleteStocksParams = {
        TableName: stocksTableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    };
    try {
        const stockData = await docClient.send(new QueryCommand(deleteStocksParams));

        if (!stockData.Items || stockData.Items.length == 0) {
            return { error: `Portfolio with Id '${userId}' has no assets.` };
        }
        const deleteRequests = stockData.Items.map(item => ({
            DeleteRequest: {
                Key: {
                    userId: item.userId,
                    symbol: item.symbol
                }
            }
        }));

        const batchParams = {
            RequestItems: {
                [stocksTableName]: deleteRequests
            }
        };
        await docClient.send(new BatchWriteCommand(batchParams));

        return { message: `Portfolio deleted successfully for Id: ${userId}` };
    } catch (error) {
        return { error: `Error deleting portfolio: ${error.message}` };
    }
};

export async function getAllocation(userId) {
    if (userId) {
        const getStocksParams = {
            TableName: stocksTableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };

        try {
            const stockAllocations = await docClient.send(new QueryCommand(getStocksParams));

            if (!stockAllocations.Items) {
                return { error: `Portfolio with Id '${userId}' has no assets.` };
            }

            let individualStockAllocations = [];
            let totalHolding = 0;
            for (const stock of stockAllocations.Items) {  
                let calcAllocations = await calculateAllocations(stock);
                individualStockAllocations.push(calcAllocations);
                totalHolding += calcAllocations.totalBought;
                
            }

            let sectorAllocations = [];

            for (const sector of individualStockAllocations) {
                sectorAllocations.push({sector: sector.sector,
                                        totalWeight: parseFloat(((sector.totalBought / totalHolding) * 100).toFixed(2)),
                                        assets: sector.assets})
            }

            return { sectorAllocations }

        } catch (error) {
            return { error: `Error retrieving allocation: ${error.message}` };
        }
    }
    else {
        return { error: 'Enter Portfolio ID' };
    }
}

async function calculateAllocations(stock) {
    try {
        const sector = await getSector(stock.symbol);
        let totalBought = 0;
        for (const buy of stock.Transactions) {
            totalBought += parseFloat(buy.price) * buy.quantity;
        }
    
        let assets = []
        for (const buy of stock.Transactions) {
            assets.push({symbol: stock.symbol,
                        weight: parseFloat((((parseFloat(buy.price) * buy.quantity) / totalBought) * 100).toFixed(2)),
                        date: buy.date});
        }
    
        return { sector: sector, assets: assets, totalBought };
    } catch (error) {
        return {"error": "invalid symbol"};
    }
}

export async function assetRemove(userId, symbol) {
    if (!userId) {
        return { error: "Enter Portfolio ID" };
    }

    if (!symbol) {
        return { error: "Enter stock symbol" };
    }

    const stockParams = {
        TableName: stocksTableName,
        Key: { userId: userId, symbol: symbol }
    };

    try {
        const stock = await docClient.send(new GetCommand(stockParams));

        if (!stock.Item) {
            return { error: `Portfolio '${userId}' does not contain symbol'${symbol}'` };
        }

        const deleteAssetParams = {
            TableName: stocksTableName,
            Key: { userId: userId, symbol: symbol }
        }
        
        await docClient.send(new DeleteCommand(deleteAssetParams));

        return { message: "Asset successfully removed", userId, symbol };
    } catch (error) {
        return { error: `Error while updating assets: ${error.message}` };
    }
}

export async function portfolioPerformance(userId) {
    try {
        const getStocksParams = {
            TableName: stocksTableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }
    
        const stocksData = await docClient.send(new QueryCommand(getStocksParams));
    
        if (!stocksData.Items) {
            return { error: `Portfolio with Id '${userId}' has no assets.` };
        }
    
        return await calculatePortfolioPerformance(stocksData.Items);

    } catch (error) {
        return { error: `Error getting portfolio performance: ${error.message}` };
    }
}



async function calculatePortfolioPerformance(stocksData) {
    let stocksPerformance = [];
    for (const stock of stocksData) {
        stocksPerformance.push(await individualStockPerformance(stock));
    }

    const totalInvested =  stocksPerformance.map(stock => stock.totalInvested).reduce((sum, stockTotalInvested )=> sum + stockTotalInvested, 0);
    const currentValue =  stocksPerformance.map(stock => stock.currentValue).reduce((sum, stockCurrentValue )=> sum + stockCurrentValue, 0);
    const gainLoss = currentValue - totalInvested;

    const totals = {
        totalInvested: totalInvested,
        currentValue: currentValue,
        gainLoss: gainLoss,
        gainLossPercentage: parseFloat(((gainLoss / totalInvested) * 100).toFixed(2)),
        overall: overallPerformance(gainLoss)
    }
    
    return {stocks: stocksPerformance, totals: totals}

}

async function individualStockPerformance(stock) {

    const totalInvested = stock.Transactions.reduce((sum, transaction) => sum + parseFloat(transaction.price * transaction.quantity), 0);
    const currentPrice = (await quoteStockInfo(stock.symbol)).price;
    const totalQuantity = stock.Transactions.reduce((sum, transaction) => sum + parseFloat(transaction.quantity), 0);
    const currentValue = currentPrice * totalQuantity;
    const gainLoss = currentValue - totalInvested;

    return {
        symbol: stock.symbol,
        totalInvested: totalInvested,
        currentValue: currentValue,
        gainLoss: gainLoss,
        gainLossPercentage: parseFloat(((gainLoss / totalInvested) * 100).toFixed(2)),
        overall: overallPerformance(gainLoss)
    };
}

function overallPerformance(gainLoss) {
    if (gainLoss > 0) {
        return 'up';
    } else if (gainLoss < 0) {
        return 'down';
    } else  {
        return "neutral"
    }
}