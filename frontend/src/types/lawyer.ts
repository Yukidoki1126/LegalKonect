// Shared Lawyer type definition
export interface Lawyer {
  id: number;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  experience_years?: number;
  years_experience?: number;
  hourly_rate?: number;
  consultation_fee?: number;
  is_approved?: boolean;
  is_available?: boolean;
  status?: string;
  rating?: number;
  total_reviews?: number;
  profile_photo?: string | null;
  office_address?: string;
  office_latitude?: string;
  office_longitude?: string;
  specialization?: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
  };
  specializations?: Array<{
    id: number;
    name: string;
  }>;
  distance?: number;
}

export interface Specialization {
  id: number;
  name: string;
  description?: string;
}
