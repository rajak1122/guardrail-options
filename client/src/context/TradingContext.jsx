import { useMemo, useState } from 'react'
import { TradingContext } from './tradingContext'

export function TradingProvider({ children }) {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY')
  const value = useMemo(() => ({ selectedSymbol, setSelectedSymbol }), [selectedSymbol])
  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
}
