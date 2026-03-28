import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Reviews() {
  const reviews = [
    {
      name: "أحمد، الرياض",
      text: "أفضل تجربة سي فود! أكياس الجمبري والصوص الدايناميت خرافية.",
    },
    {
      name: "محمود، القاهرة",
      text: "صينية المماليك كفت العيلة كلها وزيادة، الجودة ممتازة والتوصيل سريع.",
    },
    {
      name: "سارة، جدة",
      text: "طعم الليمون والثوم يجنن، تجربة المطعم في البيت حرفياً!",
    }
  ];

  return (
    <section className="py-20 bg-background w-full relative border-t border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-16">
          ماذا يقول مجتمع <span className="text-primary">هاني فوديز</span>؟
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <Card key={idx} className="bg-secondary/40 border-white/10 hover:border-primary/50 transition-colors duration-300 rounded-2xl shadow-lg">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 flex-grow font-medium">
                  "{review.text}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                    <span className="text-primary font-bold text-xl">{review.name.charAt(0)}</span>
                  </div>
                  <span className="text-white font-bold text-lg">{review.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
