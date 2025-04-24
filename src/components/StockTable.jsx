import { useState } from 'react';
import StockModal from './StockModal.jsx';

function StockTable({ stocks, userId }) {
  const [selectedStock, setSelectedStock] = useState(null);

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  const handleCloseModal = () => {
    setSelectedStock(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Stocks</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Symbol</th>
              <th className="p-2">Invested</th>
              <th className="p-2">Current Value</th>
              <th className="p-2">Gain/Loss</th>
              <th className="p-2">Gain/Loss %</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.symbol}
                onClick={() => handleStockClick(stock)}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                <td className="p-2">{stock.symbol}</td>
                <td className="p-2">${stock.totalInvested.toFixed(2)}</td>
                <td className="p-2">${stock.currentValue.toFixed(2)}</td>
                <td
                  className={
                    stock.gainLoss >= 0 ? 'p-2 text-green-600' : 'p-2 text-red-600'
                  }
                >
                  ${stock.gainLoss.toFixed(2)}
                </td>
                <td
                  className={
                    stock.gainLoss >= 0 ? 'p-2 text-green-600' : 'p-2 text-red-600'
                  }
                >
                  {stock.gainLossPercentage.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedStock && (
        <StockModal
          userId={userId}
          symbol={selectedStock.symbol}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default StockTable;