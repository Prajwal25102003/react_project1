/** Apex option shells for EMS dashboard charts (series filled by dashboardModel). */
export const chartTwoOptions = {
  series: [0],
  colors: ["#465FFF"],
  chart: {
    fontFamily: "Outfit, sans-serif",
    type: "radialBar",
    height: 330,
    sparkline: {
      enabled: true,
    },
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: {
        size: "80%",
      },
      track: {
        background: "#E4E7EC",
        strokeWidth: "100%",
        margin: 5,
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          fontSize: "36px",
          fontWeight: "600",
          offsetY: 20,
          color: "#1D2939",
          formatter(val) {
            return `${val}%`;
          },
        },
      },
    },
  },
  fill: {
    type: "solid",
    colors: ["#465FFF"],
  },
  stroke: {
    lineCap: "round",
  },
  labels: ["Progress"],
};
