"use client"

import { useEffect, useRef, useState } from "react"

interface OIVolumeDataPoint {
  timestamp: number
  openInterest: number
  volume: number
  ratio: number
}

export default function OIVolumeRatio() {
  const [oiData, setOiData] = useState<{
    symbol: string
    openInterest: number
    volume: number
    ratio: number
    loading: boolean
    error: string | null
  }>({
    symbol: "BTCUSDT",
    openInterest: 0,
    volume: 0,
    ratio: 0,
    loading: true,
    error: null,
  })

  // Store historical data points
  const [historicalData, setHistoricalData] = useState<OIVolumeDataPoint[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maxDataPoints = 100 // Maximum number of data points to store
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Open Interest data from Binance API
        const oiResponse = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT`)
        if (!oiResponse.ok) {
          throw new Error(`Failed to fetch open interest: ${oiResponse.statusText}`)
        }
        const oiData = await oiResponse.json()
        const openInterest = Number.parseFloat(oiData.openInterest)

        // Fetch 24h Volume data from Binance API
        const volResponse = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT`)
        if (!volResponse.ok) {
          throw new Error(`Failed to fetch volume: ${volResponse.statusText}`)
        }
        const volData = await volResponse.json()
        const volume = Number.parseFloat(volData.volume)

        // Calculate ratio
        const ratio = openInterest / volume

        // Update current data
        setOiData({
          symbol: "BTCUSDT",
          openInterest,
          volume,
          ratio,
          loading: false,
          error: null,
        })

        // Add to historical data
        const newDataPoint = {
          timestamp: Date.now(),
          openInterest,
          volume,
          ratio,
        }

        setHistoricalData((prevData) => {
          const newData = [...prevData, newDataPoint]
          // Keep only the last maxDataPoints
          if (newData.length > maxDataPoints) {
            return newData.slice(newData.length - maxDataPoints)
          }
          return newData
        })
      } catch (error) {
        console.error("Error fetching OI/Volume data:", error)
        setOiData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Error fetching data",
        }))
      }
    }

    // Initial fetch
    fetchData()

    // Set up interval for periodic updates
    updateIntervalRef.current = setInterval(fetchData, 30000) // 30 seconds

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  // Draw the chart whenever historical data changes
  useEffect(() => {
    if (historicalData.length < 2 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Set chart dimensions
    const margin = { top: 10, right: 30, bottom: 30, left: 40 }
    const width = rect.width - margin.left - margin.right
    const height = rect.height - margin.top - margin.bottom

    // Draw background
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Find min and max values for scaling
    const ratios = historicalData.map((d) => d.ratio)
    const minRatio = Math.min(...ratios) * 0.9
    const maxRatio = Math.max(...ratios) * 1.1

    // Scale functions
    const xScale = (i: number) => margin.left + (i * width) / (historicalData.length - 1)
    const yScale = (value: number) => margin.top + height - ((value - minRatio) / (maxRatio - minRatio)) * height

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * height) / gridLines
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(margin.left + width, y)
      ctx.stroke()

      // Draw y-axis labels
      const value = maxRatio - (i / gridLines) * (maxRatio - minRatio)
      ctx.fillStyle = "#aaa"
      ctx.font = "10px Arial"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(3), margin.left - 5, y + 3)
    }

    // Draw time labels on x-axis
    const timeLabels = 5
    for (let i = 0; i <= timeLabels; i++) {
      const x = margin.left + (i * width) / timeLabels
      const dataIndex = Math.floor((i / timeLabels) * (historicalData.length - 1))

      if (dataIndex >= 0 && dataIndex < historicalData.length) {
        const date = new Date(historicalData[dataIndex].timestamp)
        const timeLabel = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`

        ctx.fillStyle = "#aaa"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.fillText(timeLabel, x, margin.top + height + 15)
      }
    }

    // Draw the line
    ctx.strokeStyle = "#4caf50"
    ctx.lineWidth = 2
    ctx.beginPath()

    historicalData.forEach((d, i) => {
      const x = xScale(i)
      const y = yScale(d.ratio)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw data points
    historicalData.forEach((d, i) => {
      const x = xScale(i)
      const y = yScale(d.ratio)

      // Determine color based on ratio
      let color
      if (d.ratio < 0.5) color = "#ff5252"
      else if (d.ratio < 1) color = "#ffc107"
      else color = "#4caf50"

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw axes
    ctx.strokeStyle = "#555"
    ctx.lineWidth = 1

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top + height)
    ctx.lineTo(margin.left + width, margin.top + height)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + height)
    ctx.stroke()

    // Draw title
    ctx.fillStyle = "#fff"
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    ctx.fillText("OI/Volume Ratio History", margin.left, margin.top - 5)
  }, [historicalData])

  // Determine color based on ratio
  const getColor = (ratio: number) => {
    if (ratio < 0.5) return "text-red-500 bg-red-500"
    if (ratio < 1) return "text-amber-500 bg-amber-500"
    return "text-green-500 bg-green-500"
  }

  const colorClass = getColor(oiData.ratio)
  const ratioPercent = Math.min(oiData.ratio * 100, 100)

  return (
    <div className="w-full border-t border-gray-800 p-4">
      <h2 className="text-xl font-bold text-white mb-4">Binance Futures OI/Volume Ratio</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current OI/Volume Data */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          {oiData.loading ? (
            <p className="text-white font-bold">Loading live data from Binance...</p>
          ) : oiData.error ? (
            <p className="text-red-500">{oiData.error}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-left">
                  <p className="text-gray-400">Symbol:</p>
                  <p className="text-gray-400">Open Interest:</p>
                  <p className="text-gray-400">Volume (24h):</p>
                  <p className="text-gray-400">OI/Volume Ratio:</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{oiData.symbol}</p>
                  <p className="text-white font-medium">
                    {oiData.openInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-white font-medium">
                    {oiData.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className={`font-bold ${colorClass.split(" ")[0]}`}>{oiData.ratio.toFixed(4)}</p>
                </div>
              </div>
              <div className="h-5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorClass.split(" ")[1]} transition-all duration-500 ease-in-out`}
                  style={{ width: `${ratioPercent}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-2 text-right">Updated: {new Date().toLocaleTimeString()}</div>
            </>
          )}
        </div>

        {/* Historical Chart */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <div className="h-[200px] w-full">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">
            {historicalData.length === 0
              ? "Collecting data..."
              : `Showing ${historicalData.length} data points - Updates every 30s`}
          </div>
        </div>
      </div>
    </div>
  )
}
