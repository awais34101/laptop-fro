import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const [warehouse, setWarehouse] = useState([]);
  const [store, setStore] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const [warehouseRes, storeRes, itemsRes] = await Promise.all([
      api.get('/warehouse'),
      api.get('/store'),
      api.get('/items'),
    ]);
    setWarehouse(warehouseRes.data);
    setStore(storeRes.data);
    setItems(itemsRes.data);
    setLoading(false);
  }, []);

  return (
    <InventoryContext.Provider value={{ warehouse, store, items, fetchInventory, loading }}>
      {children}
    </InventoryContext.Provider>
  );
}
