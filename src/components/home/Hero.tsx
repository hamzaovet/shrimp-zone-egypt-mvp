import { Button } from '@/components/ui/button'
import { PhoneCall } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        src="/assets/trailer.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1128]/80 via-[#0A1128]/50 to-[#0A1128]/90" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center">
        <div className="mb-8 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 inline-flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-1000">
          <PhoneCall className="h-5 w-5 text-primary" />
          <span className="text-white font-black tracking-widest text-lg">HOTLINE: 15911</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-white mb-6 leading-tight max-w-5xl drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          SHRIMP ZONE <br/>
          <span className="text-primary tracking-tighter">— شرمب زون —</span>
        </h1>
        
        <p className="text-xl md:text-3xl text-gray-200 mb-10 max-w-3xl font-bold drop-shadow-lg">
          أصل الجمبري في مصر.. الطعم الذي لا يقاوم
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white font-black text-xl px-16 py-8 rounded-2xl shadow-[0_0_40px_rgba(3,105,161,0.4)] transition-all hover:scale-105"
          >
            اطلب الآن 🛒
          </Button>
        </div>
      </div>
    </section>
  )
}
