"use client"

import { useEffect, useRef, useState } from "react"

interface LiquidationData {
  price: number
  longLiquidations: number
  shortLiquidations: number
  totalLiquidations: number
  lastUpdate: number
}

interface LiquidationHeatmapProps {
  timeframe: string
  scrollPosition: number
  onScrollChange: (position: number) => void
}

export default function LiquidationHeatmap({ timeframe, scrollPosition, onScrollChange }: LiquidationHeatmapProps) {
  const [liquidationMap, setLiquidationMap] = useState<Map<number, LiquidationData>>(new Map())
  const [status, setStatus] = useState<string>("Connecting...")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [lastLiquidation, setLastLiquidation] = useState<{
    price: number
    amount: number
    side: string
    time: number
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const touchStartedRef = useRef<boolean>(false)
  const priceMapRef = useRef<Map<number, LiquidationData>>(new Map())
  const reconnectCountRef = useRef<number>(0)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Round price to nearest 100 USD for grouping
  function roundPriceLevel(price: number): number {
    return Math.round(price / 100) * 100
  }

  // Process a liquidation event
  function processLiquidation(liquidation: { price: number; side: string; amount: number; time: number }) {
    const { price, side, amount, time } = liquidation

    // Update last liquidation for display
    setLastLiquidation({
      price,
      amount,
      side,
      time,
    })

    // Round price to nearest 100 USD level
    const priceLevel = roundPriceLevel(price)

    // Update price level data
    const existingData = priceMapRef.current.get(priceLevel) || {
      price: priceLevel,
      longLiquidations: 0,
      shortLiquidations: 0,
      totalLiquidations: 0,
      lastUpdate: time,
    }

    // Update liquidation amounts based on side
    if (side === "BUY") {
      // Short liquidation (forced buy)
      existingData.shortLiquidations += amount
    } else {
      // Long liquidation (forced sell)
      existingData.longLiquidations += amount
    }

    existingData.totalLiquidations += amount
    existingData.lastUpdate = time

    // Store updated data
    priceMapRef.current.set(priceLevel, existingData)

    // Update state with the new data
    setLiquidationMap(new Map(priceMapRef.current))
  }

  // Connect to Binance WebSocket with proper subscription protocol
  function connectToWebSocket() {
    try {
      // Clear any existing reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }

      setStatus("Connecting to liquidation stream...")

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
        setStatus("Connected, subscribing to liquidation stream...")

        // Send subscription message
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            const subscribeMsg = {
              method: "SUBSCRIBE",
              params: ["btcusdt@forceOrder"],
              id: 1,
            }
            wsRef.current.send(JSON.stringify(subscribeMsg))
            console.log("Subscription message sent:", subscribeMsg)
          } catch (err) {
            console.error("Error sending subscription message:", err)
            setStatus("Error subscribing to stream")
          }
        }
      }

      wsRef.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)

          // Handle subscription response
          if (data.id === 1) {
            if (data.result === null) {
              console.log("Successfully subscribed to liquidation stream")
              setStatus("Connected to live liquidation stream")
              setIsConnected(true)
              reconnectCountRef.current = 0 // Reset reconnect counter on successful connection
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

          // Check if it's a valid liquidation event
          if (data.e === "forceOrder" && data.o && data.o.s === "BTCUSDT") {
            const order = data.o
            const price = Number.parseFloat(order.p)
            const qty = Number.parseFloat(order.q)
            const side = order.S // "BUY" for short liquidations, "SELL" for long liquidations
            const amount = price * qty
            const timestamp = data.E || Date.now()

            console.log("Received liquidation:", { price, qty, side, amount })

            // Process the liquidation
            processLiquidation({
              price,
              side,
              amount,
              time: timestamp,
            })
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error, "Raw message:", e.data)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("Liquidation WebSocket error:", error)
        setStatus("Connection error - will retry")
        setIsConnected(false)
        scheduleReconnect()
      }

      wsRef.current.onclose = (event) => {
        console.log("Liquidation WebSocket closed:", event.code, event.reason)
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

  // Initial setup - try WebSocket connection
  useEffect(() => {
    // Try to connect to WebSocket
    connectToWebSocket()

    // Cleanup function
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }

      if (wsRef.current) {
        try {
          // Send unsubscribe message before closing
          if (wsRef.current.readyState === WebSocket.OPEN) {
            const unsubscribeMsg = {
              method: "UNSUBSCRIBE",
              params: ["btcusdt@forceOrder"],
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

  // Set up touch event handlers that won't interfere with data
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartedRef.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartedRef.current) return
    }

    const handleTouchEnd = () => {
      touchStartedRef.current = false
    }

    // Add passive touch events to prevent interference with scrolling
    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: true })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
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
    ctx.fillText("Liquidation Heatmap by Price Level", margin.left, margin.top - 5)

    if (liquidationMap.size === 0) {
      // Draw "Waiting for data" message
      ctx.fillStyle = "#555"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for liquidation data...", margin.left + width / 2, margin.top + height / 2)

      // If we have a last liquidation, show it
      if (lastLiquidation) {
        ctx.fillStyle = "#777"
        ctx.font = "14px Arial"
        ctx.fillText("Last liquidation:", margin.left + width / 2, margin.top + height / 2 + 30)

        const sideColor = lastLiquidation.side === "BUY" ? "#ff5252" : "#4caf50"
        ctx.fillStyle = sideColor
        const formattedAmount =
          lastLiquidation.amount >= 1000000
            ? `$${(lastLiquidation.amount / 1000000).toFixed(2)}M`
            : `$${(lastLiquidation.amount / 1000).toFixed(2)}K`

        ctx.fillText(
          `${lastLiquidation.side === "BUY" ? "Short" : "Long"} liquidation at $${lastLiquidation.price.toFixed(1)} (${formattedAmount})`,
          margin.left + width / 2,
          margin.top + height / 2 + 50,
        )
      }

      return
    }

    // Convert map to array and sort by price
    const liquidationData = Array.from(liquidationMap.values()).sort((a, b) => a.price - b.price)

    // Find min and max price for scaling
    const minPrice = Math.min(...liquidationData.map((d) => d.price))
    const maxPrice = Math.max(...liquidationData.map((d) => d.price))

    // Find max liquidation value for scaling
    const maxLiquidation = Math.max(...liquidationData.map((d) => Math.max(d.longLiquidations, d.shortLiquidations)))

    // Calculate bar height
    const barHeight = Math.min(20, height / liquidationData.length)

    // Scale functions
    const yScale = (price: number) => {
      const priceRange = maxPrice - minPrice
      if (priceRange === 0) return margin.top + height / 2
      return margin.top + ((maxPrice - price) / priceRange) * height
    }

    const xScaleLong = (value: number) => {
      return margin.left + (value / maxLiquidation) * (width / 2)
    }

    const xScaleShort = (value: number) => {
      return margin.left + width / 2 - (value / maxLiquidation) * (width / 2)
    }

    // Draw center line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin.left + width / 2, margin.top)
    ctx.lineTo(margin.left + width / 2, margin.top + height)
    ctx.stroke()

    // Draw price levels
    liquidationData.forEach((data) => {
      const y = yScale(data.price)

      // Draw price label
      ctx.fillStyle = "#aaa"
      ctx.font = "12px Arial"
      ctx.textAlign = "right"
      ctx.fillText(`$${data.price.toFixed(0)}`, margin.left - 5, y + 4)

      // Draw long liquidations (right side)
      if (data.longLiquidations > 0) {
        const longWidth = xScaleLong(data.longLiquidations) - margin.left

        // Calculate intensity based on value
        const intensity = Math.min(0.9, (data.longLiquidations / maxLiquidation) * 1.5)
        ctx.fillStyle = `rgba(76, 175, 80, ${intensity})` // Green for longs

        ctx.fillRect(margin.left + width / 2, y - barHeight / 2, longWidth, barHeight)

        // Draw value if significant
        if (data.longLiquidations > maxLiquidation * 0.1) {
          let formattedValue: string
          if (data.longLiquidations >= 1000000) {
            formattedValue = `$${(data.longLiquidations / 1000000).toFixed(1)}M`
          } else {
            formattedValue = `$${(data.longLiquidations / 1000).toFixed(1)}K`
          }

          ctx.fillStyle = "#fff"
          ctx.textAlign = "left"
          ctx.font = "10px Arial"
          ctx.fillText(formattedValue, margin.left + width / 2 + longWidth + 2, y + 3)
        }
      }

      // Draw short liquidations (left side)
      if (data.shortLiquidations > 0) {
        const shortWidth = margin.left + width / 2 - xScaleShort(data.shortLiquidations)

        // Calculate intensity based on value
        const intensity = Math.min(0.9, (data.shortLiquidations / maxLiquidation) * 1.5)
        ctx.fillStyle = `rgba(255, 82, 82, ${intensity})` // Red for shorts

        ctx.fillRect(xScaleShort(data.shortLiquidations), y - barHeight / 2, shortWidth, barHeight)

        // Draw value if significant
        if (data.shortLiquidations > maxLiquidation * 0.1) {
          let formattedValue: string
          if (data.shortLiquidations >= 1000000) {
            formattedValue = `$${(data.shortLiquidations / 1000000).toFixed(1)}M`
          } else {
            formattedValue = `$${(data.shortLiquidations / 1000).toFixed(1)}K`
          }

          ctx.fillStyle = "#fff"
          ctx.textAlign = "right"
          ctx.font = "10px Arial"
          ctx.fillText(formattedValue, xScaleShort(data.shortLiquidations) - 2, y + 3)
        }
      }
    })

    // Draw horizontal grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    const priceStep = Math.ceil((maxPrice - minPrice) / 10 / 1000) * 1000
    for (let price = Math.floor(minPrice / priceStep) * priceStep; price <= maxPrice; price += priceStep) {
      const y = yScale(price)

      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(margin.left + width, y)
      ctx.stroke()
    }

    // Draw legend
    ctx.fillStyle = "rgba(17, 17, 17, 0.9)"
    ctx.fillRect(margin.left + width - 200, margin.top - 20, 200, 20)

    // Long liquidation legend
    ctx.fillStyle = "#4caf50"
    ctx.fillRect(margin.left + width - 190, margin.top - 15, 10, 10)
    ctx.fillStyle = "#aaa"
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    ctx.fillText("Long Liquidations", margin.left + width - 175, margin.top - 5)

    // Short liquidation legend
    ctx.fillStyle = "#ff5252"
    ctx.fillRect(margin.left + width - 80, margin.top - 15, 10, 10)
    ctx.fillStyle = "#aaa"
    ctx.textAlign = "left"
    ctx.fillText("Short Liquidations", margin.left + width - 65, margin.top - 5)

    // Draw last liquidation info if available
    if (lastLiquidation) {
      const timeString = new Date(lastLiquidation.time).toLocaleTimeString()
      const sideColor = lastLiquidation.side === "BUY" ? "#ff5252" : "#4caf50"
      const formattedAmount =
        lastLiquidation.amount >= 1000000
          ? `$${(lastLiquidation.amount / 1000000).toFixed(2)}M`
          : `$${(lastLiquidation.amount / 1000).toFixed(2)}K`

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(margin.left, margin.top + height + 5, width, 25)

      ctx.fillStyle = "#fff"
      ctx.font = "12px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Last: ${timeString}`, margin.left + 5, margin.top + height + 20)

      ctx.fillStyle = sideColor
      ctx.fillText(
        `${lastLiquidation.side === "BUY" ? "Short" : "Long"} liquidation at $${lastLiquidation.price.toFixed(1)} (${formattedAmount})`,
        margin.left + 100,
        margin.top + height + 20,
      )
    }
  }, [liquidationMap, lastLiquidation])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
        <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
        {status}
      </div>
    </div>
  )
}
