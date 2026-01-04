import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { LineChart as RNLineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function LineChart({ data }) {
 
  const validData = data && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const chartData = {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
    datasets: [
      {
        data: validData,
        color: (opacity = 1) => `rgba(49, 130, 206, ${opacity})`, 
        strokeWidth: 2
      }
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(49, 130, 206, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(160, 174, 192, ${opacity})`, 
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "0", 
      strokeWidth: "0",
      stroke: "#3182CE"
    },
    propsForBackgroundLines: {
        stroke: "#E2E8F0",
        strokeDasharray: "" 
    }
  };

  return (
    <View style={styles.container}>
      <RNLineChart
        data={chartData}
        width={screenWidth - 80} 
        height={280}
        chartConfig={chartConfig}
        bezier 
        style={styles.chart}
        withDots={false}
        withShadow={true}
        fromZero
        yAxisInterval={1}
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
    paddingRight: 30 
  }
});