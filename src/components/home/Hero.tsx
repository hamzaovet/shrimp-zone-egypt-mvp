import { Button } from '@/components/ui/button'

export default function Hero() {
  return (
    <section className="relative w-full h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        src="/trailer.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#0A1128]/60" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight max-w-3xl drop-shadow-xl">
          مطعم بهيج للمأكولات البحرية (ملك الفسفور العجيب)
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl drop-shadow-md">
          من الإسكندرية.. أصل المأكولات البحرية والفسفور
        </p>
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-white font-bold text-lg px-12 py-6 rounded-full animate-pulse shadow-[0_0_20px_rgba(255,87,34,0.5)] transition-all hover:scale-105"
        >
          اطلب الآن
        </Button>
      </div>
    </section>
  )
}
