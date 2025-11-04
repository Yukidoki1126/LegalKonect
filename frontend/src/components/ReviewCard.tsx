import React from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  client_name: string;
  lawyer_name: string;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
      {/* Star Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < review.rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Review Comment */}
      <p className="text-white text-base mb-6 leading-relaxed">
        "{review.comment}"
      </p>

      {/* Client Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-2xl">
          {review.client_name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-white">{review.client_name}</p>
          <p className="text-blue-200 text-sm">Consulted with {review.lawyer_name}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;