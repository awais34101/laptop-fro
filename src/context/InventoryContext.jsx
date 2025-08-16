import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const [warehouse, setWarehouse] = useState([]);
  const [availableWarehouseItems, setAvailableWarehouseItems] = useState([]);
  const [store, setStore] = useState([]);
  const [store2, setStore2] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/warehouse'),
        api.get('/warehouse/available'),
        api.get('/store'),
        api.get('/store2'),
        api.get('/items'),
      ]);
      if (results[0].status === 'fulfilled') setWarehouse(results[0].value.data); else setWarehouse([]);
      if (results[1].status === 'fulfilled') setAvailableWarehouseItems(results[1].value.data); else setAvailableWarehouseItems([]);
      if (results[2].status === 'fulfilled') setStore(results[2].value.data); else setStore([]);
      if (results[3].status === 'fulfilled') setStore2(results[3].value.data); else setStore2([]);
      if (results[4].status === 'fulfilled') setItems(results[4].value.data); else setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <InventoryContext.Provider value={{ warehouse, availableWarehouseItems, store, store2, items, fetchInventory, loading }}>
      {children}
    </InventoryContext.Provider>
  );
}
