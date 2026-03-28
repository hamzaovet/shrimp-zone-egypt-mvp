import { BRAND_STORY } from "@/lib/data";

export default function BrandStory() {
  return (
    <section className="py-20 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
            {BRAND_STORY.title}
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8 rounded-full" />
          <p className="text-lg md:text-2xl text-gray-300 leading-relaxed font-medium">
            {BRAND_STORY.description}
          </p>
        </div>
      </div>
    </section>
  );
}
