"use client";

import Hero from '@/components/home/Hero'
import DynamicMenu from '@/components/home/DynamicMenu'
import SonarHub from '@/components/home/SonarHub'
import Footer from '@/components/layout/Footer'

export default function HomeView() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <div id="menu">
        <DynamicMenu />
      </div>
      <SonarHub />
      <Footer />
    </div>
  )
}
