"use client"

import { useEffect, useRef, useState } from "react"

interface PriceLevelDelta {
  price: number
  delta: number
  buys: number
  sells: number
}

interface DailyPriceLevelData {
  date: string // YYYY-MM-DD format
  priceLevels: PriceLevelDelta[]
  priceRange: { min: number; max: number }
}

interface TakerDeltaHeatmapProps {
  timeframe: string
  scrollPosition: number
  onScrollChange: (position: number) => void
}

export default function TakerDeltaHeatmap({ timeframe, scrollPosition, onScrollChange }: TakerDeltaHeatmapProps) {
  const [priceLevelData, setPriceLevelData] = useState<PriceLevelDelta[]>([])
  const [status, setStatus] = useState<string>("Connecting...")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 })
  const [historicalData, setHistoricalData] = useState<DailyPriceLevelData[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("current")
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const priceMapRef = useRef<Map<number, PriceLevelDelta>>(new Map())
  const reconnectCountRef = useRef<number>(0)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPriceRef = useRef<number>(0)

  // Round price to nearest 100 USD
  function roundPriceLevel(price: number): number {
    return Math.round(price / 100) * 100
  }

  // Process trade data
  function processTrade(trade: { price: number; quantity: number; isSell: boolean }) {
    const { price, quantity, isSell } = trade
    const usd = quantity * price
    const delta = isSell ? -usd : usd

    // Update last price for tracking price range
    lastPriceRef.current = price

    // Update price range for the day
    setPriceRange((prev) => ({
      min: prev.min === 0 ? price : Math.min(prev.min, price),
      max: prev.max === 0 ? price : Math.max(prev.max, price),
    }))

    // Round price to nearest 100 USD level
    const priceLevel = roundPriceLevel(price)

    // Update price level data
    priceMapRef.current.set(
      priceLevel,
      priceMapRef.current.has(priceLevel)
        ? {
            price: priceLevel,
            delta: priceMapRef.current.get(priceLevel)!.delta + delta,
            buys: priceMapRef.current.get(priceLevel)!.buys + (isSell ? 0 : usd),
            sells: priceMapRef.current.get(priceLevel)!.sells + (isSell ? usd : 0),
          }
        : {
            price: priceLevel,
            delta: delta,
            buys: isSell ? 0 : usd,
            sells: isSell ? usd : 0,
          },
    )

    // Update state with all price levels sorted by price
    const sortedData = Array.from(priceMapRef.current.values()).sort((a, b) => a.price - b.price)
    setPriceLevelData(sortedData)
  }

  // Save current day's data to historical records
  function saveCurrentDayData() {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    // Create a snapshot of current day's data
    const dailyData: DailyPriceLevelData = {
      date: today,
      priceLevels: [...priceLevelData],
      priceRange: { ...priceRange },
    }

    // Update historical data, replacing today's entry if it exists
    setHistoricalData((prev) => {
      const filtered = prev.filter((item) => item.date !== today)
      return [...filtered, dailyData]
    })

    // Update available dates
    setAvailableDates((prev) => {
      if (!prev.includes(today)) {
        return [...prev, today].sort()
      }
      return prev
    })

    // Save to localStorage
    try {
      const storageData = {
        lastUpdated: new Date().toISOString(),
        data: [...historicalData.filter((item) => item.date !== today), dailyData],
      }
      localStorage.setItem("takerDeltaHistoricalData", JSON.stringify(storageData))
    } catch (error) {
      console.error("Error saving historical data to localStorage:", error)
    }
  }

  // Schedule a reconnection attempt with exponential backoff
  function scheduleReconnect() {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }

    // Calculate backoff time (exponential with max of 30 seconds)
    const backoff = Math.min(Math.pow(2, reconnectCountRef.current) * 1000, 30000)
    reconnectCountRef.current++

    console.log(`Scheduling reconnect attempt ${reconnectCountRef.current} in ${backoff}ms`)
    setStatus(`Reconnecting in ${Math.round(backoff / 1000)}s (attempt ${reconnectCountRef.current})`)

    reconnectTimerRef.current = setTimeout(() => {
      connectToWebSocket()
    }, backoff)
  }

  // Connect to Binance WebSocket with proper subscription protocol
  function connectToWebSocket() {
    try {
      // Clear any existing reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }

      setStatus("Connecting to trade stream...")

      // Close existing connection if any
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch (err) {
          console.error("Error closing existing WebSocket:", err)
        }
      }

      // Create new WebSocket connection
      wsRef.current = new WebSocket("wss://fstream.binance.com/ws")

      wsRef.current.onopen = () => {
        console.log("WebSocket connection opened")
        setStatus("Connected, subscribing to trade stream...")

        // Send subscription message
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            const subscribeMsg = {
              method: "SUBSCRIBE",
              params: ["btcusdt@trade"],
              id: 1,
            }
            wsRef.current.send(JSON.stringify(subscribeMsg))
            console.log("Subscription message sent:", subscribeMsg)
          } catch (err) {
            console.error("Error sending subscription message:", err)
            setStatus("Error subscribing to stream")
            scheduleReconnect()
          }
        }
      }

      wsRef.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)

          // Handle subscription response
          if (data.id === 1) {
            if (data.result === null) {
              console.log("Successfully subscribed to trade stream")
              setStatus("Connected to live trade stream")
              setIsConnected(true)
              reconnectCountRef.current = 0 // Reset reconnect counter on successful connection

              // Load most recent data after successful reconnection
              loadMostRecentData()
            } else {
              console.error("Subscription error:", data)
              setStatus(`Subscription error: ${JSON.stringify(data)}`)
              scheduleReconnect()
            }
            return
          }

          // Handle ping/pong to keep connection alive
          if (data.ping) {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ pong: data.ping }))
            }
            return
          }

          // Process trade data
          if (data.e === "trade") {
            const price = Number.parseFloat(data.p)
            const quantity = Number.parseFloat(data.q)
            const isSell = data.m // true for maker, false for taker

            processTrade({ price, quantity, isSell })
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error, "Raw message:", e.data)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("Trade WebSocket error:", error)
        setStatus("Connection error - will retry")
        setIsConnected(false)
        scheduleReconnect()
      }

      wsRef.current.onclose = (event) => {
        console.log("Trade WebSocket closed:", event.code, event.reason)
        setStatus("Connection closed - will retry")
        setIsConnected(false)
        scheduleReconnect()
      }
    } catch (error) {
      console.error("Error setting up WebSocket:", error)
      setStatus("Failed to setup connection - will retry")
      scheduleReconnect()
    }
  }

  // Add this function after the connectToWebSocket function
  function loadMostRecentData() {
    try {
      // First check if we have data for today
      const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

      const storedData = localStorage.getItem("takerDeltaHistoricalData")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        if (parsedData.data && Array.isArray(parsedData.data)) {
          // Find today's data if it exists
          const todayData = parsedData.data.find((item: DailyPriceLevelData) => item.date === today)

          if (todayData && todayData.priceLevels && todayData.priceLevels.length > 0) {
            console.log("Loading today's saved data from localStorage")

            // Merge stored data with current data instead of replacing
            todayData.priceLevels.forEach((level: PriceLevelDelta) => {
              if (priceMapRef.current.has(level.price)) {
                // If we already have this price level, add the values
                const currentLevel = priceMapRef.current.get(level.price)!
                priceMapRef.current.set(level.price, {
                  price: level.price,
                  delta: currentLevel.delta + level.delta,
                  buys: currentLevel.buys + level.buys,
                  sells: currentLevel.sells + level.sells,
                })
              } else {
                // If we don't have this price level yet, add it
                priceMapRef.current.set(level.price, level)
              }
            })

            // Update price range
            setPriceRange((prev) => ({
              min: prev.min === 0 ? todayData.priceRange.min : Math.min(prev.min, todayData.priceRange.min),
              max: prev.max === 0 ? todayData.priceRange.max : Math.max(prev.max, todayData.priceRange.max),
            }))

            // Update state with all price levels sorted by price
            const sortedData = Array.from(priceMapRef.current.values()).sort((a, b) => a.price - b.price)
            setPriceLevelData(sortedData)

            console.log(`Merged ${todayData.priceLevels.length} price levels from localStorage with current data`)
          }
        }
      }
    } catch (error) {
      console.error("Error loading recent data from localStorage:", error)
    }
  }

  // Initial setup - try WebSocket connection
  useEffect(() => {
    // Try to connect to WebSocket
    connectToWebSocket()

    // Load most recent data to ensure we don't lose accumulated deltas
    loadMostRecentData()

    // Load historical data from localStorage
    try {
      const storedData = localStorage.getItem("takerDeltaHistoricalData")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        if (parsedData.data && Array.isArray(parsedData.data)) {
          setHistoricalData(parsedData.data)
          setAvailableDates(parsedData.data.map((item: DailyPriceLevelData) => item.date).sort())
        }
      }
    } catch (error) {
      console.error("Error loading historical data from localStorage:", error)
    }

    // Set up periodic saving of current day data
    const saveInterval = setInterval(() => {
      if (priceLevelData.length > 0) {
        saveCurrentDayData()
      }
    }, 60000) // Save every minute instead of every 5 minutes

    // Reset data at midnight UTC
    const checkForDayReset = () => {
      const now = new Date()
      if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
        console.log("New day started, saving and resetting price level data")

        // Save current day's data before resetting
        if (priceLevelData.length > 0) {
          saveCurrentDayData()
        }

        // Reset for new day
        priceMapRef.current.clear()
        setPriceLevelData([])
        setPriceRange({ min: 0, max: 0 })
      }
    }

    const resetInterval = setInterval(checkForDayReset, 60000) // Check every minute

    // Cleanup function
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }

      if (resetInterval) {
        clearInterval(resetInterval)
      }

      if (saveInterval) {
        clearInterval(saveInterval)
        // Save one last time before unmounting
        if (priceLevelData.length > 0) {
          saveCurrentDayData()
        }
      }

      if (wsRef.current) {
        try {
          // Save data before unsubscribing
          if (priceLevelData.length > 0) {
            saveCurrentDayData()
          }

          // Send unsubscribe message before closing
          if (wsRef.current.readyState === WebSocket.OPEN) {
            const unsubscribeMsg = {
              method: "UNSUBSCRIBE",
              params: ["btcusdt@trade"],
              id: 2,
            }
            wsRef.current.send(JSON.stringify(unsubscribeMsg))
          }
          wsRef.current.close()
        } catch (err) {
          console.error("Error during WebSocket cleanup:", err)
        }
      }
    }
  }, [])

  // Set up a heartbeat to keep the connection alive
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          // Send a ping to keep the connection alive
          wsRef.current.send(JSON.stringify({ ping: Date.now() }))
        } catch (err) {
          console.error("Error sending heartbeat:", err)
        }
      }
    }, 30000) // Send heartbeat every 30 seconds

    return () => clearInterval(heartbeatInterval)
  }, [])

  // Draw the heatmap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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
    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = rect.width - margin.left - margin.right
    const height = rect.height - margin.top - margin.bottom

    // Draw background
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(margin.left, margin.top, width, height)

    // Draw title
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)" // Semi-transparent background
    ctx.fillRect(margin.left - 5, margin.top - 20, 300, 20)

    ctx.fillStyle = "#fff"
    ctx.font = "bold 14px Arial"
    ctx.textAlign = "left"
    ctx.fillText("Taker Delta Heatmap by Price Level (100 USD)", margin.left, margin.top - 5)

    if (priceLevelData.length === 0) {
      // Draw "Waiting for data" message
      ctx.fillStyle = "#555"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for price level data...", margin.left + width / 2, margin.top + height / 2)
      return
    }

    // Find max absolute delta for scaling
    const maxAbsDelta = Math.max(...priceLevelData.map((d) => Math.abs(d.delta)))

    // Ensure we have price levels for the entire range
    const minPrice =
      priceRange.min > 0 ? roundPriceLevel(priceRange.min - 2000) : roundPriceLevel(lastPriceRef.current - 5000)
    const maxPrice =
      priceRange.max > 0 ? roundPriceLevel(priceRange.max + 2000) : roundPriceLevel(lastPriceRef.current + 5000)

    // Create a complete set of price levels
    const allPriceLevels: PriceLevelDelta[] = []
    for (let price = minPrice; price <= maxPrice; price += 100) {
      const existingLevel = priceLevelData.find((d) => d.price === price)
      if (existingLevel) {
        allPriceLevels.push(existingLevel)
      } else {
        allPriceLevels.push({
          price,
          delta: 0,
          buys: 0,
          sells: 0,
        })
      }
    }

    // Calculate bar height based on number of price levels
    const barHeight = Math.min(14, Math.max(4, height / (allPriceLevels.length || 1)))

    // Scale functions for y-axis (price levels)
    const yScale = (price: number) => {
      const priceRange = maxPrice - minPrice
      if (priceRange === 0) return margin.top + height / 2
      return margin.top + ((maxPrice - price) / priceRange) * height
    }

    // Scale function for x-axis (delta values)
    const xScalePositive = (value: number) => {
      return margin.left + width / 2 + (value / maxAbsDelta) * (width / 2)
    }

    const xScaleNegative = (value: number) => {
      return margin.left + width / 2 - (Math.abs(value) / maxAbsDelta) * (width / 2)
    }

    // Draw center line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin.left + width / 2, margin.top)
    ctx.lineTo(margin.left + width / 2, margin.top + height)
    ctx.stroke()

    // Draw horizontal grid lines for price levels
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Draw price levels at regular intervals
    const priceStep = 1000 // Show price label every 1000 USD
    for (let price = Math.floor(minPrice / priceStep) * priceStep; price <= maxPrice; price += priceStep) {
      const y = yScale(price)

      // Skip if outside visible area
      if (y < margin.top || y > margin.top + height) continue

      // Draw grid line
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(margin.left + width, y)
      ctx.stroke()

      // Draw price label on left side
      ctx.fillStyle = "#aaa"
      ctx.font = "12px Arial"
      ctx.textAlign = "right"
      ctx.fillText(`$${price.toLocaleString()}`, margin.left - 5, y + 4)

      // Draw price label on right side with background
      ctx.fillStyle = "rgba(26, 26, 26, 0.8)" // Semi-transparent background
      ctx.fillRect(margin.left + width + 2, y - 10, 70, 20)

      // Draw right side label
      ctx.fillStyle = "#aaa"
      ctx.textAlign = "left"
      ctx.font = "12px Arial"
      ctx.fillText(`$${price.toLocaleString()}`, margin.left + width + 5, y + 4)
    }

    // Draw current price indicator
    if (lastPriceRef.current > 0) {
      const currentPriceY = yScale(lastPriceRef.current)

      // Draw dashed line at current price
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(margin.left, currentPriceY)
      ctx.lineTo(margin.left + width, currentPriceY)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw current price label
      ctx.fillStyle = "#fff"
      ctx.font = "bold 12px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Current: $${lastPriceRef.current.toLocaleString()}`, margin.left + width + 5, currentPriceY + 4)
    }

    // Draw delta bars for each price level
    allPriceLevels.forEach((data) => {
      const y = yScale(data.price)

      // Skip drawing if outside visible area
      if (y < margin.top || y > margin.top + height) return

      // Draw price level bars
      if (data.delta !== 0) {
        // Determine bar position and width based on delta sign
        const barX = data.delta > 0 ? margin.left + width / 2 : xScaleNegative(data.delta)
        const barWidth =
          data.delta > 0
            ? xScalePositive(data.delta) - (margin.left + width / 2)
            : margin.left + width / 2 - xScaleNegative(data.delta)

        // Calculate intensity based on value
        const intensity = Math.min(0.9, (Math.abs(data.delta) / maxAbsDelta) * 1.5)
        const color =
          data.delta > 0
            ? `rgba(0, 255, 0, ${intensity})` // Green for positive delta
            : `rgba(255, 0, 0, ${intensity})` // Red for negative delta

        // Draw bar
        ctx.fillStyle = color
        ctx.fillRect(barX, y - barHeight / 2, barWidth, barHeight)

        // Format delta value
        let formattedDelta: string
        if (Math.abs(data.delta) >= 1000000) {
          formattedDelta = `$${(data.delta / 1000000).toFixed(1)}M`
        } else if (Math.abs(data.delta) >= 1000) {
          formattedDelta = `$${(data.delta / 1000).toFixed(1)}K`
        } else {
          formattedDelta = `$${data.delta.toFixed(0)}`
        }

        // Draw delta value
        if (Math.abs(data.delta) > maxAbsDelta * 0.05) {
          // Only show significant values
          ctx.fillStyle = "#fff"
          ctx.font = "10px Arial"
          if (data.delta > 0) {
            ctx.textAlign = "left"
            ctx.fillText(formattedDelta, barX + barWidth + 2, y + 3)
          } else {
            ctx.textAlign = "right"
            ctx.fillText(formattedDelta, barX - 2, y + 3)
          }
        }

        // Draw buy/sell ratio indicator
        const totalVolume = data.buys + data.sells
        if (totalVolume > 0) {
          const buyRatio = data.buys / totalVolume

          // Draw small indicator bar at the end
          const indicatorWidth = 40
          const indicatorX = margin.left + width - indicatorWidth

          // Background (gray)
          ctx.fillStyle = "rgba(100, 100, 100, 0.5)"
          ctx.fillRect(indicatorX, y - barHeight * 0.25, indicatorWidth, barHeight * 0.5)

          // Buy portion (blue)
          ctx.fillStyle = "rgba(0, 100, 255, 0.8)"
          ctx.fillRect(indicatorX, y - barHeight * 0.25, indicatorWidth * buyRatio, barHeight * 0.5)

          // Sell portion (yellow)
          ctx.fillStyle = "rgba(255, 200, 0, 0.8)"
          ctx.fillRect(
            indicatorX + indicatorWidth * buyRatio,
            y - barHeight * 0.25,
            indicatorWidth * (1 - buyRatio),
            barHeight * 0.5,
          )
        }
      }
    })

    // Draw legend
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)"
    ctx.fillRect(margin.left + width - 200, margin.top - 20, 200, 20)

    // Draw buy/sell legend
    ctx.fillStyle = "#aaa"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.fillText("Buy", margin.left + width - 60, margin.top - 5)
    ctx.fillStyle = "rgba(0, 100, 255, 0.8)"
    ctx.fillRect(margin.left + width - 55, margin.top - 10, 10, 10)

    ctx.fillStyle = "#aaa"
    ctx.fillText("Sell", margin.left + width - 20, margin.top - 5)
    ctx.fillStyle = "rgba(255, 200, 0, 0.8)"
    ctx.fillRect(margin.left + width - 15, margin.top - 10, 10, 10)

    // Draw price range info
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)"
    ctx.fillRect(margin.left, margin.top + height + 5, 300, 20)

    ctx.fillStyle = "#aaa"
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    ctx.fillText(
      `Price Range: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`,
      margin.left + 5,
      margin.top + height + 18,
    )

    // Draw levels count
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)"
    ctx.fillRect(margin.left + width - 200, margin.top + height + 5, 200, 20)

    ctx.fillStyle = "#aaa"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`${allPriceLevels.length} price levels`, margin.left + width - 5, margin.top + height + 18)

    // Draw historical data indicator
    if (selectedDate !== "current") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(margin.left + width - 200, margin.top + height - 25, 200, 20)

      ctx.fillStyle = "#ff9800" // Orange color
      ctx.font = "bold 12px Arial"
      ctx.textAlign = "right"
      ctx.fillText(`Historical Data: ${selectedDate}`, margin.left + width - 5, margin.top + height - 10)
    }
  }, [priceLevelData, priceRange, selectedDate])

  // Handle date selection
  function handleDateChange(date: string) {
    setSelectedDate(date)

    if (date === "current") {
      // No need to do anything, we're already tracking current data
    } else {
      // Find the historical data for the selected date
      const historicalEntry = historicalData.find((item) => item.date === date)
      if (historicalEntry) {
        // Update the display with historical data
        setPriceLevelData(historicalEntry.priceLevels)
        setPriceRange(historicalEntry.priceRange)
      }
    }
  }

  useEffect(() => {
    const debugInterval = setInterval(() => {
      const totalDelta = priceLevelData.reduce((sum, level) => sum + level.delta, 0)
      console.log(
        `Current total delta: ${totalDelta.toLocaleString()} USD across ${priceLevelData.length} price levels`,
      )
    }, 30000) // Log every 30 seconds

    return () => clearInterval(debugInterval)
  }, [priceLevelData])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
        <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
        {status}
      </div>
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
        <span className="mr-2">Date:</span>
        <select
          className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
        >
          <option value="current">Current (Live)</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
        {selectedDate !== "current" && (
          <button
            className="ml-2 bg-blue-600 hover:bg-blue-700 rounded px-1 py-0.5 text-xs"
            onClick={() => handleDateChange("current")}
          >
            Back to Live
          </button>
        )}
      </div>
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
        Total Delta: ${priceLevelData.reduce((sum, level) => sum + level.delta, 0).toLocaleString()} USD
      </div>
    </div>
  )
}
