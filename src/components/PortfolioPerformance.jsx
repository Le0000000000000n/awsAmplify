import { useState, useEffect } from 'react';

function PortfolioPerformance({ userId }) {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await fetch(
          `https://aui6flvy73.execute-api.us-east-1.amazonaws.com/portfolio/${userId}/performance`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch portfolio performance');
        }

        setPerformance(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [userId]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium">Totals</h3>
          <p>Total Invested: ${performance.totals.totalInvested.toFixed(2)}</p>
          <p>Current Value: ${performance.totals.currentValue.toFixed(2)}</p>
          <p
            className={
              performance.totals.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }
          >
            Gain/Loss: ${performance.totals.gainLoss.toFixed(2)} (
            {performance.totals.gainLossPercentage.toFixed(2)}%)
          </p>
          <p>Overall: {performance.totals.overall}</p>
        </div>
        <div>
          <h3 className="text-lg font-medium">Stocks</h3>
          {performance.stocks.map((stock) => (
            <div key={stock.symbol} className="mb-2">
              <p>Symbol: {stock.symbol}</p>
              <p>Total Invested: ${stock.totalInvested.toFixed(2)}</p>
              <p>Current Value: ${stock.currentValue.toFixed(2)}</p>
              <p
                className={
                  stock.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                Gain/Loss: ${stock.gainLoss.toFixed(2)} (
                {stock.gainLossPercentage.toFixed(2)}%)
              </p>
              <p>Overall: {stock.overall}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PortfolioPerformance;