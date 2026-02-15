export interface Destination {
  name: string;
  airport: string;
}

export interface Airport {
  code: string;
  name: string;
}

export const POPULAR_DESTINATIONS: Destination[] = [
  // Florida
  { name: 'Florida - Fort Myers', airport: 'RSW' },
  { name: 'Florida - Miami', airport: 'MIA' },
  { name: 'Florida - Fort Lauderdale', airport: 'FLL' },
  { name: 'Florida - Orlando', airport: 'MCO' },
  { name: 'Florida - Tampa', airport: 'TPA' },
  { name: 'Florida - Jacksonville', airport: 'JAX' },
  { name: 'Florida - Key West', airport: 'EYW' },
  { name: 'Florida - West Palm Beach', airport: 'PBI' },
  // US Domestic
  { name: 'Las Vegas', airport: 'LAS' },
  { name: 'Los Angeles', airport: 'LAX' },
  { name: 'San Diego', airport: 'SAN' },
  { name: 'San Francisco', airport: 'SFO' },
  { name: 'Seattle', airport: 'SEA' },
  { name: 'Denver', airport: 'DEN' },
  { name: 'Phoenix', airport: 'PHX' },
  { name: 'Nashville', airport: 'BNA' },
  { name: 'New Orleans', airport: 'MSY' },
  { name: 'Austin', airport: 'AUS' },
  { name: 'Charleston, SC', airport: 'CHS' },
  { name: 'Savannah, GA', airport: 'SAV' },
  { name: 'Chicago', airport: 'ORD' },
  { name: 'New York City', airport: 'JFK' },
  { name: 'Boston', airport: 'BOS' },
  { name: 'Washington, DC', airport: 'DCA' },
  // Hawaii
  { name: 'Hawaii - Honolulu', airport: 'HNL' },
  { name: 'Hawaii - Maui', airport: 'OGG' },
  { name: 'Hawaii - Kona', airport: 'KOA' },
  // Caribbean
  { name: 'Dominican Republic - Punta Cana', airport: 'PUJ' },
  { name: 'Mexico - Cancun', airport: 'CUN' },
  { name: 'Mexico - Cabo San Lucas', airport: 'SJD' },
  { name: 'Mexico - Mexico City', airport: 'MEX' },
  { name: 'Jamaica - Montego Bay', airport: 'MBJ' },
  { name: 'Bahamas - Nassau', airport: 'NAS' },
  { name: 'Turks & Caicos', airport: 'PLS' },
  { name: 'Aruba', airport: 'AUA' },
  { name: 'Costa Rica - San Jose', airport: 'SJO' },
  { name: 'Puerto Rico - San Juan', airport: 'SJU' },
  { name: 'US Virgin Islands - St. Thomas', airport: 'STT' },
  // Europe
  { name: 'Italy - Rome', airport: 'FCO' },
  { name: 'Italy - Milan', airport: 'MXP' },
  { name: 'France - Paris', airport: 'CDG' },
  { name: 'Spain - Barcelona', airport: 'BCN' },
  { name: 'Spain - Madrid', airport: 'MAD' },
  { name: 'United Kingdom - London', airport: 'LHR' },
  { name: 'Greece - Athens', airport: 'ATH' },
  { name: 'Greece - Santorini', airport: 'JTR' },
  { name: 'Portugal - Lisbon', airport: 'LIS' },
  { name: 'Iceland - Reykjavik', airport: 'KEF' },
  // Asia/Pacific
  { name: 'Japan - Tokyo', airport: 'NRT' },
  { name: 'Thailand - Bangkok', airport: 'BKK' },
  { name: 'Bali - Denpasar', airport: 'DPS' },
  { name: 'Maldives', airport: 'MLE' },
  // Americas
  { name: 'Colombia - Cartagena', airport: 'CTG' },
  { name: 'Brazil - Rio de Janeiro', airport: 'GIG' },
  // Middle East
  { name: 'Dubai', airport: 'DXB' },
];

export const AIRPORTS: Airport[] = [
  // US - Northeast
  { code: 'EWR', name: 'Newark' },
  { code: 'JFK', name: 'New York JFK' },
  { code: 'LGA', name: 'New York LaGuardia' },
  { code: 'PHL', name: 'Philadelphia' },
  { code: 'BOS', name: 'Boston' },
  { code: 'DCA', name: 'Washington Reagan' },
  { code: 'IAD', name: 'Washington Dulles' },
  { code: 'BWI', name: 'Baltimore' },
  { code: 'PIT', name: 'Pittsburgh' },
  { code: 'BDL', name: 'Hartford' },
  // US - Southeast
  { code: 'ATL', name: 'Atlanta' },
  { code: 'MIA', name: 'Miami' },
  { code: 'FLL', name: 'Fort Lauderdale' },
  { code: 'MCO', name: 'Orlando' },
  { code: 'TPA', name: 'Tampa' },
  { code: 'CLT', name: 'Charlotte' },
  { code: 'RDU', name: 'Raleigh-Durham' },
  { code: 'JAX', name: 'Jacksonville' },
  { code: 'RSW', name: 'Fort Myers' },
  { code: 'PBI', name: 'West Palm Beach' },
  { code: 'EYW', name: 'Key West' },
  { code: 'CHS', name: 'Charleston' },
  { code: 'SAV', name: 'Savannah' },
  { code: 'MSY', name: 'New Orleans' },
  // US - Midwest
  { code: 'ORD', name: 'Chicago O\'Hare' },
  { code: 'MDW', name: 'Chicago Midway' },
  { code: 'DTW', name: 'Detroit' },
  { code: 'MSP', name: 'Minneapolis' },
  { code: 'STL', name: 'St. Louis' },
  { code: 'CLE', name: 'Cleveland' },
  { code: 'CVG', name: 'Cincinnati' },
  { code: 'IND', name: 'Indianapolis' },
  { code: 'MKE', name: 'Milwaukee' },
  // US - South/Central
  { code: 'DFW', name: 'Dallas Fort Worth' },
  { code: 'IAH', name: 'Houston Intercontinental' },
  { code: 'AUS', name: 'Austin' },
  { code: 'SAT', name: 'San Antonio' },
  { code: 'BNA', name: 'Nashville' },
  { code: 'MCI', name: 'Kansas City' },
  { code: 'MEM', name: 'Memphis' },
  { code: 'OKC', name: 'Oklahoma City' },
  // US - West
  { code: 'LAX', name: 'Los Angeles' },
  { code: 'SFO', name: 'San Francisco' },
  { code: 'SEA', name: 'Seattle' },
  { code: 'LAS', name: 'Las Vegas' },
  { code: 'PHX', name: 'Phoenix' },
  { code: 'SAN', name: 'San Diego' },
  { code: 'DEN', name: 'Denver' },
  { code: 'SLC', name: 'Salt Lake City' },
  { code: 'PDX', name: 'Portland' },
  { code: 'OAK', name: 'Oakland' },
  { code: 'SJC', name: 'San Jose' },
  // US - Hawaii/Alaska
  { code: 'HNL', name: 'Honolulu' },
  { code: 'OGG', name: 'Maui' },
  { code: 'KOA', name: 'Kona' },
  { code: 'ANC', name: 'Anchorage' },
  // Canada
  { code: 'YYZ', name: 'Toronto' },
  { code: 'YVR', name: 'Vancouver' },
  { code: 'YUL', name: 'Montreal' },
  // Caribbean
  { code: 'PUJ', name: 'Punta Cana' },
  { code: 'CUN', name: 'Cancun' },
  { code: 'SJD', name: 'Cabo San Lucas' },
  { code: 'MBJ', name: 'Montego Bay' },
  { code: 'NAS', name: 'Nassau' },
  { code: 'PLS', name: 'Providenciales' },
  { code: 'AUA', name: 'Aruba' },
  { code: 'SJU', name: 'San Juan' },
  { code: 'STT', name: 'St. Thomas' },
  { code: 'SJO', name: 'San Jose Costa Rica' },
  { code: 'MEX', name: 'Mexico City' },
  // Europe
  { code: 'LHR', name: 'London Heathrow' },
  { code: 'CDG', name: 'Paris CDG' },
  { code: 'FCO', name: 'Rome Fiumicino' },
  { code: 'BCN', name: 'Barcelona' },
  { code: 'MAD', name: 'Madrid' },
  { code: 'MXP', name: 'Milan Malpensa' },
  { code: 'ATH', name: 'Athens' },
  { code: 'JTR', name: 'Santorini' },
  { code: 'LIS', name: 'Lisbon' },
  { code: 'KEF', name: 'Reykjavik' },
  { code: 'AMS', name: 'Amsterdam' },
  { code: 'FRA', name: 'Frankfurt' },
  { code: 'ZRH', name: 'Zurich' },
  // Asia/Pacific
  { code: 'NRT', name: 'Tokyo Narita' },
  { code: 'BKK', name: 'Bangkok' },
  { code: 'DPS', name: 'Bali Denpasar' },
  { code: 'SIN', name: 'Singapore' },
  // Middle East/Africa
  { code: 'DXB', name: 'Dubai' },
  { code: 'DOH', name: 'Doha' },
  // South America
  { code: 'GIG', name: 'Rio de Janeiro' },
  { code: 'CTG', name: 'Cartagena' },
  { code: 'BOG', name: 'Bogota' },
  // Maldives
  { code: 'MLE', name: 'Male Maldives' },
];
