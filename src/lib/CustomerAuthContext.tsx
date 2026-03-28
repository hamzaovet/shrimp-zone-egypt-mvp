"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  addresses: string[];
  totalOrders: number;
  totalSpent: number;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  login: (name: string, phone: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedCustomer = localStorage.getItem("bahij_customer");
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {
        console.error("Failed to parse saved customer", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (name: string, phone: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
        localStorage.setItem("bahij_customer", JSON.stringify(data));
      } else {
        const error = await res.json();
        throw new Error(error.message || "Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem("bahij_customer");
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, login, logout, isLoading }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
