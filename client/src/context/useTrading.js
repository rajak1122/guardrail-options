import { useContext } from 'react'
import { TradingContext } from './tradingContext'

export function useTrading() {
  const context = useContext(TradingContext)
  if (!context) throw new Error('useTrading must be used within a TradingProvider.')
  return context
}
