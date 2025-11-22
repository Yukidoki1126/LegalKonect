# Weighted Scoring Algorithm - LegalKonect

## Overview
The weighted scoring algorithm provides intelligent lawyer recommendations by combining multiple factors into a single "match score" to help users find the best lawyer for their needs.

## Algorithm Details

### Scoring Formula
```
Total Score = (Distance × 25%) + (Rating × 35%) + (Experience × 20%) +
              (Reviews × 10%) + (Availability × 5%) + (Price × 5%)
```

### Factor Breakdown

#### 1. Distance Score (25% weight)
- **Purpose**: Prioritize lawyers who are geographically closer
- **Calculation**: `((MAX_DISTANCE - lawyer.distance) / MAX_DISTANCE) × 100`
- **Max Distance**: 50 km
- **Example**:
  - 2 km away = 96 points
  - 25 km away = 50 points
  - 50 km away = 0 points
- **Fallback**: 50 points if user location not available

#### 2. Rating Score (35% weight) - MOST IMPORTANT
- **Purpose**: Prioritize highly-rated lawyers (quality indicator)
- **Calculation**: `(rating / 5.0) × 100`
- **Range**: 0-5 stars
- **Example**:
  - 5.0 stars = 100 points
  - 4.5 stars = 90 points
  - 3.0 stars = 60 points
- **Why 35%**: Quality is the most important factor for client satisfaction

#### 3. Experience Score (20% weight)
- **Purpose**: Value experienced professionals
- **Calculation**: `Min(100, (years_experience / MAX_EXPERIENCE) × 100)`
- **Max Experience**: 30 years
- **Example**:
  - 30+ years = 100 points
  - 15 years = 50 points
  - 5 years = 16.7 points

#### 4. Review Count Score (10% weight)
- **Purpose**: Trust lawyers with proven track records
- **Calculation**: `Min(100, (total_reviews / MAX_REVIEWS) × 100)`
- **Max Reviews**: 100
- **Example**:
  - 100+ reviews = 100 points
  - 50 reviews = 50 points
  - 10 reviews = 10 points
- **Why this matters**: More reviews = more credibility

#### 5. Availability Score (5% weight)
- **Purpose**: Boost lawyers who are currently available
- **Calculation**: `is_available ? 100 : 0`
- **Binary score**:
  - Available = 100 points
  - Not Available = 0 points

#### 6. Price Score (5% weight)
- **Purpose**: Slight preference for competitive pricing
- **Calculation**: `((MAX_PRICE - price) / MAX_PRICE) × 100`
- **Max Price**: ₱5,000/hour
- **Example**:
  - ₱1,000/hour = 80 points
  - ₱2,500/hour = 50 points
  - ₱5,000/hour = 0 points
- **Why only 5%**: Quality matters more than price

## Real-World Example

### Lawyer A: Maria Santos
- **Distance**: 2 km
- **Rating**: 4.8/5.0 stars
- **Experience**: 15 years
- **Reviews**: 45
- **Availability**: Available
- **Price**: ₱3,000/hour

**Calculation:**
```
Distance:     ((50-2)/50) × 100 × 0.25 = 24.0
Rating:       (4.8/5.0) × 100 × 0.35 = 33.6
Experience:   (15/30) × 100 × 0.20 = 10.0
Reviews:      (45/100) × 100 × 0.10 = 4.5
Availability: 100 × 0.05 = 5.0
Price:        ((5000-3000)/5000) × 100 × 0.05 = 2.0

Total Score: 79.1 / 100
```

### Lawyer B: Juan Cruz
- **Distance**: 0.5 km (very close!)
- **Rating**: 3.5/5.0 stars
- **Experience**: 3 years
- **Reviews**: 8
- **Availability**: Not Available
- **Price**: ₱1,500/hour (cheaper!)

**Calculation:**
```
Distance:     ((50-0.5)/50) × 100 × 0.25 = 24.75
Rating:       (3.5/5.0) × 100 × 0.35 = 24.5
Experience:   (3/30) × 100 × 0.20 = 2.0
Reviews:      (8/100) × 100 × 0.10 = 0.8
Availability: 0 × 0.05 = 0.0
Price:        ((5000-1500)/5000) × 100 × 0.05 = 3.5

Total Score: 55.55 / 100
```

**Winner**: Maria Santos (79.1) beats Juan Cruz (55.55)

Even though Juan is closer and cheaper, Maria wins because of:
- ✅ Much better rating (4.8 vs 3.5)
- ✅ More experience (15 vs 3 years)
- ✅ More reviews (45 vs 8)
- ✅ Currently available

## Implementation

### Location
**File**: `frontend/src/pages/LawyerSearch.tsx`

### Function
```typescript
const calculateWeightedScore = (lawyer: Lawyer): number => {
  // ... see implementation in LawyerSearch.tsx
}
```

### Usage
Users can select "⭐ Recommended (Best Match)" from the sort dropdown to use this algorithm.

## Sort Options Available

1. **⭐ Recommended (Best Match)** - Weighted scoring algorithm (DEFAULT)
2. **Rating** - Highest rated first
3. **Distance** - Nearest first
4. **Price** - Lowest price first
5. **Experience** - Most experienced first

## Benefits

✅ **Smart Recommendations**: Balances multiple factors instead of single criterion
✅ **Quality First**: Emphasizes rating (35%) as most important factor
✅ **User-Friendly**: Automatically shows best overall match
✅ **Fair to Lawyers**: Considers multiple dimensions of value
✅ **Customizable**: Weights can be adjusted based on business needs

## Future Enhancements

### Potential Improvements:
1. **User Preference Weights**: Allow users to customize factor weights
   - Budget-conscious: Increase price weight to 30%
   - Quality-focused: Increase rating weight to 50%
   - Convenience-focused: Increase distance weight to 40%

2. **Dynamic Weights**: Adjust based on user behavior
   - Track which lawyers users actually book
   - Machine learning to optimize weights over time

3. **Additional Factors**:
   - Response time (how quickly lawyer responds to inquiries)
   - Completion rate (appointments attended vs cancelled)
   - Specialization match score
   - Language proficiency match
   - Time slot availability

4. **A/B Testing**: Test different weight combinations to optimize for:
   - User satisfaction
   - Booking conversion rate
   - Platform revenue

## Technical Notes

- **Performance**: O(n log n) complexity due to sorting
- **Normalization**: All factors normalized to 0-100 scale
- **Fallbacks**: Handles missing data gracefully (null/undefined values)
- **Type Safety**: Fully typed with TypeScript
- **Cache Friendly**: Uses existing cached lawyer data

## References

- Implementation: [frontend/src/pages/LawyerSearch.tsx](../frontend/src/pages/LawyerSearch.tsx)
- Types: [frontend/src/types/lawyer.ts](../frontend/src/types/lawyer.ts)
- Algorithm Design: Multi-criteria decision analysis (MCDA)
