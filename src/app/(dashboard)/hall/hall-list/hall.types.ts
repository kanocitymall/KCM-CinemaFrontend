export interface Hall {
  id: number;
  name: string;
  code?: string;
  capacity: number;
  details?: string;
  price: number;
  agent_commission: number;
  checkin_price: number;
  status: "active" | "inactive";
  images?: string[]; // ✅ Added this line
}
export interface Hall {
  id: number;
  name: string;
  capacity: number;
  details?: string;
  price: number;
  agent_commission: number;
  checkin_price: number;
  status: "active" | "inactive";
  images?: string[]; // ✅ important for carousel
}
