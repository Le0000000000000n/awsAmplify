import RSI from 'calc-rsi';
import macd from 'macd';

const volumeSignificanceRatio = 1.5;

/*
trends: {
    volume_spkie: 1.5x from baseline average over a 50 day period
    unsual_movement: 5th or 95th percentile over 50 day period
}
*/

async function calculateTrends(historicalData, currentVolume) {
    const closingPriceData50 = historicalData.slice(-50).map(data => data.close);
    const closingPriceData200 = historicalData.slice(-200).map(data => data.close);
    return {
        trends: calVolumeTrends(historicalData, currentVolume),
        momentum_indicators: await calMomentumIndicators(closingPriceData50, closingPriceData200),
        mean_reversion: calMeanReversion(closingPriceData200),
    }
}


/*
volume_spkie: 1.5x from baseline average over a 50 day period
    - TradingView users commonly script alerts for 1.5x or 2x (research exact numbers are hard to find)

unsual_movement: 5th or 95th percentile over 50 day period
*/

function calVolumeTrends(historicalData, currentVolume) {
    const volumeData = historicalData.slice(-50).map(data => data.volume);
    const averageVolume = volumeData.reduce((data1, data2) => data1 + data2, 0) / volumeData.length;
    const volumeRatio = currentVolume / averageVolume;

    const sortedVolume = volumeData.sort((a , b) => a - b);
    const percentile_5th = sortedVolume[Math.floor(0.05 * volumeData.length)];
    const percentile_95th = sortedVolume[Math.floor(0.95 * volumeData.length)];

    
    return {volume_spike: volumeRatio > volumeSignificanceRatio,
        unusual_movement: (currentVolume > percentile_95th || currentVolume < percentile_5th)
    };
}

function macdTrend(macd, signal) {
    if (macd > signal) {
        return "bullish";
    } else if ( macd === signal) {
        return "neutral";
    } else {
        return "bearish";
    }
}


/*
Calculations for momentum indicators (3dp)
    - moving avg 50 day
    - moving avg 200 day
    - relative strength Index (rsi)
    - moving average convergence / divergence (macd)
*/
async function calMomentumIndicators(closingPriceData50, closingPriceData200) {

    //Calc 50 and 200 day averages of closing historical price data
    const movingAvg50 = closingPriceData50.reduce((sum, curPrice) => sum + curPrice, 0) / 50;
    const movingAvg200 = closingPriceData200.reduce((sum, curPrice) => sum + curPrice, 0) / 200;

    //Get rsiValue of latest stock performance day 
    const rsi = new RSI(closingPriceData50.slice(-15).reverse(), 14);
    const rsiValue = await new Promise((resolve, reject) => {
        rsi.calculate((err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result[14].rsi);
        });
    });
    const macdResults = macd(closingPriceData200);
    const macdObject = {macdLine: parseFloat(macdResults.MACD[closingPriceData200.length - 1].toFixed(3)),
                        signalLine: parseFloat(macdResults.signal[closingPriceData200.length - 1].toFixed(3))};
    macdObject.macdTrend = macdTrend(macdObject.macdLine, macdObject.signalLine);
    return {moving_average_50: parseFloat((movingAvg50).toFixed(3)),
            moving_average_200: parseFloat((movingAvg200).toFixed(3)),
            rsi: parseFloat((rsiValue).toFixed(3)),
            MACD: macdObject};
}


//Tendency for price to revert to a mean over longer periods of time
function calMeanReversion(data_200) {
    const priceMean = data_200.reduce((sum, currPrice) => sum + currPrice, 0) / 200;

    //Price diff of lattest price vs the mean
    const lastPriceDeviation = data_200[data_200.length - 1] - priceMean;

    //Relative Price diff of lattest price vs the mean
    const relativePriceDeviation = (lastPriceDeviation / priceMean) * 100;

    return {historical200Avg: parseFloat((priceMean).toFixed(3)),
            priceDeviation: parseFloat((lastPriceDeviation).toFixed(3)),
            relativePriceDeviation: parseFloat((relativePriceDeviation).toFixed(3))}
}


export {calMeanReversion, calMomentumIndicators, calVolumeTrends, calculateTrends, macdTrend};