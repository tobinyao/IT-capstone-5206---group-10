import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
  } from 'chart.js'
  import { Bar, Radar, Scatter } from 'react-chartjs-2'
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
  )
  
  const barData = {
    labels: Array.from({ length: 24 }, (_, i) => i),
    datasets: [
      {
        data: [14, 31, 86, 25, 88, 14, 7, 73, 76, 27, 12, 95, 3, 15, 46, 59, 11, 57, 1, 16, 39, 91, 13, 0],
        backgroundColor: '#5B8FD4',
        borderRadius: 3,
      },
    ],
  }
  
  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Daily Burn Probability',
          font: { size: 11 },
        },
      },
      x: {
        title: {
          display: false,
        },
      },
    },
  }
  
  const radarData = {
    labels: ['Slope', 'Fuel Age', 'Vegetation Density', 'Granite', 'Recent Burn'],
    datasets: [
      {
        data: [8, 7, 6, 5, 7],
        backgroundColor: 'rgba(176, 58, 46, 0.35)',
        borderColor: '#B03A2E',
        borderWidth: 2,
        pointBackgroundColor: '#B03A2E',
      },
    ],
  }
  
  const radarOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, font: { size: 9 } },
        pointLabels: { font: { size: 13, weight: 'bold' as const } },
      },
    },
  }
  
  const generatePoints = (count: number) =>
    Array.from({ length: count }, () => ({
      x: parseFloat((Math.random() * 11).toFixed(1)),
      y: parseFloat((Math.random() * 11).toFixed(1)),
    }))
  
  const scatterData = {
    datasets: [
      {
        label: 'Granite',
        data: generatePoints(8),
        backgroundColor: '#CD853F',
        pointRadius: 6,
      },
      {
        label: 'Fuel Age',
        data: generatePoints(8),
        backgroundColor: '#2E8B57',
        pointRadius: 6,
      },
      {
        label: 'Slope',
        data: generatePoints(8),
        backgroundColor: '#DAA520',
        pointRadius: 6,
      },
      {
        label: 'Vegetation Density',
        data: generatePoints(8),
        backgroundColor: '#6ABF69',
        pointRadius: 6,
      },
    ],
  }
  
  const scatterOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0,
        max: 12,
        title: {
          display: true,
          text: 'Burn Probability vs. Key Drivers',
          font: { size: 11 },
        },
      },
      x: { min: 0, max: 12 },
    },
  }
  
  const ModelInsights = () => {
    return (
      <div className="flex flex-col px-8 py-8 overflow-y-auto h-full gap-4" style={{ background: '#F0EDE8' }}>
  
        {/* Title */}
        <h1 className="text-3xl font-black text-center mb-2">Predictive Model Insights</h1>
  
        {/* Bar Chart */}
        <div className="bg-white rounded-xl p-6">
          <Bar data={barData} options={barOptions} />
        </div>
  
        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-4">
  
          {/* Radar Chart */}
          <div className="bg-white rounded-xl p-6">
            <p className="text-sm text-gray-500 mb-2">Detailed Risk Assessment</p>
            <Radar data={radarData} options={radarOptions} />
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-[#B03A2E]" />
              <p className="text-xs text-[#B03A2E] font-semibold">
                All indicators are normalized to a 1-10 risk scale
              </p>
            </div>
          </div>
  
          {/* Scatter Chart */}
          <div className="bg-white rounded-xl p-6">
            <Scatter data={scatterData} options={scatterOptions} />
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                { label: 'Granite', color: '#CD853F' },
                { label: 'Fuel Age', color: '#2E8B57' },
                { label: 'Slope', color: '#DAA520' },
                { label: 'Vegetation Density', color: '#6ABF69' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
  
        </div>
      </div>
    )
  }
  
  export default ModelInsights