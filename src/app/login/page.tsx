"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-secondary/30 p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm">
        <div className="flex justify-center mb-8">
          <div className="relative w-40 h-16">
            <Image src="/assets/logo.png" alt="شرمب زون ملك الجمبري" fill sizes="(max-width: 768px) 100vw, 200px" className="object-contain" priority />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-8">شرمب زون - تسجيل الدخول للإدارة</h1>
        
        {error && (
          <div className="bg-destructive/20 text-destructive border border-destructive/50 p-3 rounded-lg mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="admin@shrimp-zone.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0369a1] hover:bg-[#0369a1]/90 text-white font-bold h-12 rounded-xl text-lg transition-transform hover:scale-[1.02]"
          >
            {loading ? "جاري التحقق..." : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
