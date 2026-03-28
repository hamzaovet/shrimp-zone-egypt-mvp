"use client";

import { useNavigation } from '@/lib/NavigationContext'
import HomeView from '@/components/home/HomeView'
import CartView from '@/components/cart/CartView'
import ProfileView from '@/components/profile/ProfileView'

export default function Home() {
  const { activeTab } = useNavigation();

  return (
    <div className="min-h-screen">
      {activeTab === 'home' && <HomeView />}
      {activeTab === 'cart' && <CartView />}
      {activeTab === 'profile' && <ProfileView />}
    </div>
  )
}
