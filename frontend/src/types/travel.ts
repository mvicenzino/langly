export interface Trip {
  id: number;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  notes: string;
  status: 'planning' | 'booked' | 'completed';
  airports: string;
  created_at: string;
  updated_at: string;
}

export interface PackingItem {
  id: number;
  trip_id: number;
  category: string;
  item: string;
  packed: boolean;
  created_at: string;
}

export interface SavedSearch {
  id: number;
  search_type: 'flight' | 'hotel';
  label: string;
  destination: string;
  url: string;
  metadata: Record<string, unknown>;
  trip_id: number | null;
  created_at: string;
}

export interface FlightSegment {
  departure: string;       // ISO datetime
  arrival: string;         // ISO datetime
  origin: string;          // IATA code
  destination: string;     // IATA code
  carrierCode: string;
  flightNumber: string;
  duration: string;        // e.g. "PT5H15M"
}

export interface FlightOffer {
  id: string;
  airline: string;         // carrier code (e.g. "UA")
  airlineName: string;     // full name (e.g. "United Airlines")
  price: number;           // per-person price
  currency: string;
  totalPrice: number;      // price * travelers
  departureTime: string;   // ISO datetime (first segment)
  arrivalTime: string;     // ISO datetime (last segment)
  duration: string;        // total duration e.g. "PT5H15M"
  stops: number;
  segments: FlightSegment[];
}

export interface FlightSearchResult {
  flights: FlightOffer[];
  searchedAt: string;
  origin: string;
  destination: string;
}

export interface HotelOffer {
  id: string;
  name: string;
  price: number;
  totalPrice: number;
  totalPriceFormatted: string;
  currency: string;
  rating: number;
  stars: number;
  reviews: number;
  thumbnailUrl: string;
  link: string;
  propertyToken: string;
  amenities: string[];
}

export interface HotelSearchResult {
  hotels: HotelOffer[];
  searchedAt: string;
  destination: string;
}
