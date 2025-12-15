# Weighted Scoring Algorithm - LegalKonect

## Overview
The weighted scoring algorithm provides intelligent lawyer recommendations by combining multiple factors into a single "match score" to help users find the best lawyer for their needs.

## Algorithm Details

### Adaptive Scoring Formula

The algorithm uses **adaptive weights** that change based on whether the user has shared their location:

#### When User Location Available:
```
Total Score = (Distance × 40%) + (Rating × 30%) + (Experience × 15%) +
              (Reviews × 8%) + (Availability × 5%) + (Price × 2%)
```

#### When User Location NOT Available:
```
Total Score = (Rating × 40%) + (Experience × 25%) + (Reviews × 15%) +
              (Distance × 10%) + (Availability × 5%) + (Price × 5%)
```

### Why Adaptive Weights?

- **With Location**: Distance becomes most important (40%) - users want nearby lawyers
- **Without Location**: Rating becomes most important (40%) - quality is the best indicator

### Factor Breakdown

#### 1. Distance Score
- **Weight**: 40% (with location) / 10% (without location)
- **Purpose**: Prioritize lawyers who are geographically closer
- **Calculation**: `Max(0, ((MAX_DISTANCE - lawyer.distance) / MAX_DISTANCE) × 100)`
- **Max Distance**: 50 km
- **Example**:
  - 2 km away = 96 points
  - 25 km away = 50 points
  - 50 km away = 0 points
- **Fallback**: 50 points if distance not available
- **Why adaptive**: When users share location, proximity becomes critical

#### 2. Rating Score
- **Weight**: 30% (with location) / 40% (without location) - MOST IMPORTANT
- **Purpose**: Prioritize highly-rated lawyers (quality indicator)
- **Calculation**: `(rating / 5.0) × 100`
- **Range**: 0-5 stars
- **Example**:
  - 5.0 stars = 100 points
  - 4.5 stars = 90 points
  - 3.0 stars = 60 points
- **Why adaptive**: Without location data, quality becomes the primary filter

#### 3. Experience Score
- **Weight**: 15% (with location) / 25% (without location)
- **Purpose**: Value experienced professionals
- **Calculation**: `Min(100, (years_experience / MAX_EXPERIENCE) × 100)`
- **Max Experience**: 30 years
- **Example**:
  - 30+ years = 100 points
  - 15 years = 50 points
  - 5 years = 16.7 points
- **Why adaptive**: More important when location isn't a factor

#### 4. Review Count Score
- **Weight**: 8% (with location) / 15% (without location)
- **Purpose**: Trust lawyers with proven track records
- **Calculation**: `Min(100, (total_reviews / MAX_REVIEWS) × 100)`
- **Max Reviews**: 100
- **Example**:
  - 100+ reviews = 100 points
  - 50 reviews = 50 points
  - 10 reviews = 10 points
- **Why this matters**: More reviews = more credibility

#### 5. Availability Score
- **Weight**: 5% (both scenarios)
- **Purpose**: Boost lawyers who are currently available
- **Calculation**: `is_available ? 100 : 0`
- **Binary score**:
  - Available = 100 points
  - Not Available = 0 points

#### 6. Price Score
- **Weight**: 2% (with location) / 5% (without location)
- **Purpose**: Slight preference for competitive pricing
- **Calculation**: `Max(0, ((MAX_PRICE - price) / MAX_PRICE) × 100)`
- **Max Price**: ₱5,000/hour
- **Uses**: consultation_fee or hourly_rate
- **Example**:
  - ₱1,000/hour = 80 points
  - ₱2,500/hour = 50 points
  - ₱5,000/hour = 0 points
- **Why low weight**: Quality matters more than price

## Real-World Examples

### Scenario 1: User HAS Shared Location (Distance Priority)

#### Lawyer A: Maria Santos
- **Distance**: 2 km
- **Rating**: 4.8/5.0 stars
- **Experience**: 15 years
- **Reviews**: 45
- **Availability**: Available
- **Price**: ₱3,000/hour

**Calculation (WITH Location):**
```
Distance:     ((50-2)/50) × 100 × 0.40 = 38.4
Rating:       (4.8/5.0) × 100 × 0.30 = 28.8
Experience:   (15/30) × 100 × 0.15 = 7.5
Reviews:      (45/100) × 100 × 0.08 = 3.6
Availability: 100 × 0.05 = 5.0
Price:        ((5000-3000)/5000) × 100 × 0.02 = 0.8

Total Score: 84.1 / 100
```

#### Lawyer B: Juan Cruz
- **Distance**: 0.5 km (very close!)
- **Rating**: 3.5/5.0 stars
- **Experience**: 3 years
- **Reviews**: 8
- **Availability**: Not Available
- **Price**: ₱1,500/hour (cheaper!)

**Calculation (WITH Location):**
```
Distance:     ((50-0.5)/50) × 100 × 0.40 = 39.6
Rating:       (3.5/5.0) × 100 × 0.30 = 21.0
Experience:   (3/30) × 100 × 0.15 = 1.5
Reviews:      (8/100) × 100 × 0.08 = 0.64
Availability: 0 × 0.05 = 0.0
Price:        ((5000-1500)/5000) × 100 × 0.02 = 1.4

Total Score: 64.14 / 100
```

**Winner**: Maria Santos (84.1) beats Juan Cruz (64.14)

Even though Juan is slightly closer and cheaper, Maria wins because:
- ✅ Much better rating (4.8 vs 3.5)
- ✅ More experience (15 vs 3 years)
- ✅ More reviews (45 vs 8)
- ✅ Currently available

---

### Scenario 2: User Has NOT Shared Location (Quality Priority)

#### Lawyer C: Patricia Reyes
- **Distance**: Unknown
- **Rating**: 4.9/5.0 stars
- **Experience**: 20 years
- **Reviews**: 82
- **Availability**: Available
- **Price**: ₱4,000/hour

**Calculation (WITHOUT Location):**
```
Rating:       (4.9/5.0) × 100 × 0.40 = 39.2
Experience:   (20/30) × 100 × 0.25 = 16.67
Reviews:      (82/100) × 100 × 0.15 = 12.3
Distance:     50 × 0.10 = 5.0 (neutral fallback)
Availability: 100 × 0.05 = 5.0
Price:        ((5000-4000)/5000) × 100 × 0.05 = 1.0

Total Score: 79.17 / 100
```

#### Lawyer D: Carlos Mendoza
- **Distance**: Unknown
- **Rating**: 4.0/5.0 stars
- **Experience**: 8 years
- **Reviews**: 25
- **Availability**: Not Available
- **Price**: ₱2,000/hour (cheaper!)

**Calculation (WITHOUT Location):**
```
Rating:       (4.0/5.0) × 100 × 0.40 = 32.0
Experience:   (8/30) × 100 × 0.25 = 6.67
Reviews:      (25/100) × 100 × 0.15 = 3.75
Distance:     50 × 0.10 = 5.0 (neutral fallback)
Availability: 0 × 0.05 = 0.0
Price:        ((5000-2000)/5000) × 100 × 0.05 = 3.0

Total Score: 50.42 / 100
```

**Winner**: Patricia Reyes (79.17) beats Carlos Mendoza (50.42)

Patricia wins because without location data, quality indicators dominate:
- ✅ Much higher rating (4.9 vs 4.0)
- ✅ Significantly more experience (20 vs 8 years)
- ✅ Way more reviews (82 vs 25)
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

✅ **Adaptive Intelligence**: Changes weights based on available data (location vs no location)
✅ **Context-Aware**: Prioritizes distance (40%) when users share location
✅ **Quality First**: Emphasizes rating (40%) when location unavailable
✅ **User-Friendly**: Automatically shows best overall match
✅ **Fair to Lawyers**: Considers multiple dimensions of value
✅ **Flexible**: Different user contexts get different optimal matches

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
- **Adaptive Logic**: Checks `user?.latitude && user?.longitude` to determine which weights to use
- **Fallbacks**: Handles missing data gracefully (null/undefined values)
  - Missing distance: 50 points (neutral)
  - Missing rating: 0 points
  - Missing experience: 0 points
  - Missing reviews: 0 points
- **Type Safety**: Fully typed with TypeScript
- **Cache Friendly**: Uses existing cached lawyer data
- **Price Source**: Uses `consultation_fee || hourly_rate` for flexibility

## References

- Implementation: [frontend/src/pages/LawyerSearch.tsx](../frontend/src/pages/LawyerSearch.tsx)
- Types: [frontend/src/types/lawyer.ts](../frontend/src/types/lawyer.ts)
- Algorithm Design: Multi-criteria decision analysis (MCDA)
