import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const categories = ['الكل', 'روبيان', 'صواني مشاركة', 'مقالي', 'شوربات', 'مشروبات']
const mockItems = [
  { id: 1, title: 'سطل روبيان كاجون', price: '85 ر.س', image: '/menu-1.png' },
  { id: 2, title: 'صينية بحرية عائلية', price: '199 ر.س', image: '/menu-2.png' },
  { id: 3, title: 'كالاماري مقلي مقرمش', price: '45 ر.س', image: '/menu-3.png' },
]

export default function MenuSkeleton() {
  return (
    <section className="py-12 bg-background w-full">
      <div className="container mx-auto px-4">
        
        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex overflow-x-auto gap-3 pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((cat, index) => (
            <button
              key={index}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
                index === 1 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {mockItems.map((item) => (
            <Card key={item.id} className="bg-white/5 border-white/10 overflow-hidden group">
              <div className="relative h-64 w-full overflow-hidden bg-white/5">
                {/* Fallback pattern if image is missing, but Next Image will try to load it */}
                <Image 
                  src={item.image} 
                  alt={item.title} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <span className="text-primary font-black bg-primary/10 px-3 py-1 rounded-full text-sm">
                    {item.price}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  محضر من أجود المكونات الطازجة والتوابل الخاصة
                </p>
              </CardContent>
              <CardFooter className="p-5 pt-0">
                <Button className="w-full bg-white/10 hover:bg-primary text-white transition-colors duration-300 rounded-xl">
                  إضافة للسلة
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

      </div>
    </section>
  )
}
