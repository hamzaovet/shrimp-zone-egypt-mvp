import OrderStatusView from "@/components/orders/OrderStatusView";
import Footer from "@/components/layout/Footer";

export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-background">
      <OrderStatusView orderId={id} />
      <Footer />
    </div>
  );
}
