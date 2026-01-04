import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { BarChart as RNBarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function BarChart({ data, labels }) {
  const validData = data && data.length > 0 ? data : [0];
  const validLabels = labels && labels.length > 0 ? labels : ["Data"];

  const chartData = {
    labels: validLabels,
    datasets: [
      {
        data: validData
      }
    ]
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(49, 130, 206, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(160, 174, 192, ${opacity})`,
    barPercentage: 0.6,
    propsForBackgroundLines: {
        stroke: "#E2E8F0"
    }
  };

  return (
    <View style={styles.container}>
      <RNBarChart
        data={chartData}
        width={screenWidth - 80}
        height={280}
        yAxisLabel=""
        yAxisSuffix=" Dhs"
        chartConfig={chartConfig}
        verticalLabelRotation={30} 
        style={styles.chart}
        showValuesOnTopOfBars={false}
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden'
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
    paddingRight: 0
  }
});