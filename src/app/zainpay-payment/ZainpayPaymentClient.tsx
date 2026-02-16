"use client";

import React, { useState, Suspense } from "react"; // Added Suspense
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button, Form, Tabs, Tab } from "react-bootstrap";
import showSingleToast from "@/app/utils/single-toast";

// 1. Move your main logic into a separate internal component
function ZainpayPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams?.get("email") || "yahaya@gmail.com";
  const amount = searchParams?.get("amount") || "1000";
  const currency = searchParams?.get("currency") || "NGN";
  const transactionRef = searchParams?.get("reference") || `TXN-${Date.now()}`;
  const paymentMethodId = searchParams?.get("paymentMethodId") || "";

  const [paymentTab, setPaymentTab] = useState<"card" | "bank">("card");
  const [loading, setLoading] = useState(false);

  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    pin: "",
  });

  const [selectedBank, setSelectedBank] = useState("");

  const handleCardPayment = async () => {
    if (!cardData.cardNumber || !cardData.expiry || !cardData.cvv || !cardData.pin) {
      showSingleToast("Please fill all card fields.");
      return;
    }

    setLoading(true);
    try {
      console.log("💳 Processing card payment:", { reference: transactionRef, amount, paymentMethodId, email });
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSingleToast("✅ Payment processed successfully!");
    } catch (err: unknown) {
      console.error(err);
      showSingleToast("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBankPayment = () => {
    if (!selectedBank) {
      showSingleToast("Please select a bank.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      router.push(`/booking/admin-payment-success?ref=${transactionRef}`);
    }, 2000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", padding: "40px 20px" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--primary)", marginBottom: "10px" }}>
            💳 ZAINPAY
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <div style={{ padding: "20px", textAlign: "right" }}>
            <Button variant="outline-secondary" size="sm" onClick={() => router.back()}>Cancel</Button>
          </div>

          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <div style={{ color: "#666", marginBottom: "5px" }}>{email}</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--primary)" }}>
                {currency} {amount}
              </div>
            </div>
            <hr />
            <Tabs activeKey={paymentTab} onSelect={(k) => setPaymentTab(k as "card" | "bank")} className="mb-4">
              <Tab eventKey="card" title="💳 Pay with Card" className="p-3">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">CARD NUMBER</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                      className="form-control-lg"
                    />
                  </Form.Group>
                  <Button variant="primary" size="lg" className="w-100 fw-bold" onClick={handleCardPayment} disabled={loading}>
                    {loading ? "Processing..." : `Pay ${currency} ${amount}`}
                  </Button>
                </Form>
              </Tab>
              <Tab eventKey="bank" title="🏦 Pay with Bank Transfer" className="p-3">
                 <Form>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold">SELECT BANK</Form.Label>
                    <Form.Select size="lg" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                      <option value="">Choose a bank...</option>
                      <option value="gtb">GTB</option>
                      <option value="zenith">Zenith</option>
                    </Form.Select>
                  </Form.Group>
                  <Button variant="primary" size="lg" className="w-100 fw-bold" onClick={handleBankPayment} disabled={loading || !selectedBank}>
                    {loading ? "Processing..." : "I Have Made the Transfer"}
                  </Button>
                </Form>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

// 2. Export this as the default component wrapped in Suspense
export default function ZainpayPaymentPage() {
  return (
    <Suspense fallback={<div className="text-center p-5">Loading Payment Details...</div>}>
      <ZainpayPaymentContent />
    </Suspense>
  );
}