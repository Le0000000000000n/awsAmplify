import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { Box } from '@mui/material';

function AllocationPieChart({ allocation }) {
  const chartRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) {
      const root = am5.Root.new(chartRef.current);
      rootRef.current = root;

      root.setThemes([am5themes_Animated.new(root)]);

      const chart = root.container.children.push(
        am5percent.PieChart.new(root, {
          layout: root.verticalLayout,
          innerRadius: am5.percent(50),
        })
      );

      const series = chart.series.push(
        am5percent.PieSeries.new(root, {
          valueField: 'value',
          categoryField: 'category',
          alignLabels: false,
        })
      );

      // Set labels to show only stock symbol
      series.labels.template.setAll({
        text: '{category}',
        visible: true,
        fontSize: 14,
        fill: am5.color('#333'),
      });

      // Add tooltip with percentage only
      series.slices.template.setAll({
        tooltipText: '{value.formatNumber("#.##")}%',
        stroke: am5.color('#fff'), // White outline
        strokeWidth: 1,
      });

      // Generate distinct random colors for stocks
      const colorSet = am5.ColorSet.new(root, { step: 5 }); // Larger step for distinct colors
      const stockColors = {};

      // Process sectorAllocations for pie chart (merge buy dates per stock)
      const stockTotals = {};
      allocation.sectorAllocations?.forEach((sectorEntry) => {
        const stockCount = sectorEntry.assets.length;
        const stockWeight = stockCount > 0 ? sectorEntry.totalWeight / stockCount : 0;
        sectorEntry.assets.forEach((asset) => {
          const symbol = asset.symbol;
          stockTotals[symbol] = (stockTotals[symbol] || 0) + stockWeight;
          // Assign random color to stock if not already assigned
          if (!stockColors[symbol]) {
            stockColors[symbol] = colorSet.next();
          }
        });
      });

      const pieData = Object.entries(stockTotals).map(([symbol, value]) => {
        return {
          category: symbol,
          value,
          fill: stockColors[symbol],
        };
      });

      series.data.setAll(pieData);
      series.slices.template.set('fillField', 'fill');

      // Process legend data (stocks)
      const legendData = Object.entries(stockTotals).map(([symbol, totalWeight]) => ({
        name: `${symbol}: ${totalWeight.toFixed(2)}%`,
        fill: stockColors[symbol] || am5.color('#999999'),
      }));

      const legend = chart.children.unshift(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          layout: root.horizontalLayout,
          marginTop: 10,
          marginBottom: 10,
          paddingTop: 5,
          paddingBottom: 5,
        })
      );

      legend.markerRectangles.template.setAll({
        cornerRadiusTL: 10,
        cornerRadiusTR: 10,
        cornerRadiusBL: 10,
        cornerRadiusBR: 10,
      });

      legend.labels.template.setAll({
        fontSize: 14,
        fill: am5.color('#333'),
        paddingTop: 2,
        paddingBottom: 2,
        maxWidth: 150,
        oversizedBehavior: 'truncate',
      });

      legend.data.setAll(legendData);

      series.appear(1000, 100);
    }

    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
        rootRef.current = null;
      }
    };
  }, [allocation]);

  return (
    <Box>
      <div ref={chartRef} style={{ width: '100%', height: '500px' }} />
    </Box>
  );
}

export default AllocationPieChart;