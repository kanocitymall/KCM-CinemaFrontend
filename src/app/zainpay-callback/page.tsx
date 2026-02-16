import React, { Suspense } from "react";
import { Card, Spinner } from "react-bootstrap";
import ZainpayCallbackClient from "./ZainpayCallbackClient";

export default function ZainpayCallbackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5", padding: "20px" }}><Card style={{ maxWidth: "500px", width: "100%" }} className="border-0 shadow-lg p-5"><div className="text-center"><Spinner animation="border" role="status" className="mb-3" /><h5 className="fw-bold">Processing Your Payment</h5></div></Card></div>}>
      <ZainpayCallbackClient />
    </Suspense>
  );
}
