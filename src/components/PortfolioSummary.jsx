function PortfolioSummary({ totals }) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-4">
        <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Total Invested</p>
            <p className="text-lg font-medium">${totals.totalInvested.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">Current Value</p>
            <p className="text-lg font-medium">${totals.currentValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">Gain/Loss</p>
            <p
              className={totals.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}
            >
              ${totals.gainLoss.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Gain/Loss %</p>
            <p
              className={totals.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}
            >
              {totals.gainLossPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  export default PortfolioSummary;