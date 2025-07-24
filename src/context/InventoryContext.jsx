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
    const [warehouseRes, availableWarehouseRes, storeRes, store2Res, itemsRes] = await Promise.all([
      api.get('/warehouse'),
      api.get('/warehouse/available'),
      api.get('/store'),
      api.get('/store2'),
      api.get('/items'),
    ]);
    setWarehouse(warehouseRes.data);
    setAvailableWarehouseItems(availableWarehouseRes.data);
    setStore(storeRes.data);
    setStore2(store2Res.data);
    setItems(itemsRes.data);
    setLoading(false);
  }, []);

  return (
    <InventoryContext.Provider value={{ warehouse, availableWarehouseItems, store, store2, items, fetchInventory, loading }}>
      {children}
    </InventoryContext.Provider>
  );
}
