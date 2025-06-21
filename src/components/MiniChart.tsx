import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({ 
  data, 
  width = 200, 
  height = 60, 
  color = '#2196F3' 
}) => {
  if (data.length < 2) {
    // Show flat line if not enough data
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={[styles.flatLine, { backgroundColor: color }]} />
      </View>
    );
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1; // Avoid division by zero
  
  // Create bars for each data point
  const barWidth = width / data.length;
  
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.chartArea}>
        {data.map((value, index) => {
          const normalizedHeight = ((value - minValue) / range) * height * 0.8 + height * 0.1;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  width: barWidth - 2,
                  height: normalizedHeight,
                  backgroundColor: color,
                  bottom: 0,
                  left: index * barWidth + 1,
                }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  flatLine: {
    width: '100%',
    height: 2,
    position: 'absolute',
    top: '50%',
    borderRadius: 1,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    borderRadius: 1,
    opacity: 0.8,
  },
});

export default MiniChart;
