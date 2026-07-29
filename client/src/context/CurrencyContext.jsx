import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1, label: 'INR (₹)' },
  USD: { symbol: '$', rate: 0.012, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.011, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.0094, label: 'GBP (£)' },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('pricepilot_currency') || 'INR';
  });

  const setCurrency = (code) => {
    if (CURRENCY_CONFIG[code]) {
      setCurrencyState(code);
      localStorage.setItem('pricepilot_currency', code);
    }
  };

  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;

  const formatCurrency = (amountInINR, decimals = 0) => {
    if (amountInINR === undefined || amountInINR === null || isNaN(amountInINR)) return `${config.symbol}0`;
    const converted = Number(amountInINR) * config.rate;
    const formatted = converted.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    });
    return `${config.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, config, formatCurrency, currencies: Object.keys(CURRENCY_CONFIG) }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
