# Weighted Scoring Algorithm - LegalKonect

## Overview
The weighted scoring algorithm provides intelligent lawyer recommendations by combining multiple factors into a single "match score" to help users find the best lawyer for their needs.

**Key Feature**: The algorithm is **adaptive** - it changes weights dynamically based on whether the user has provided their location.

## Algorithm Details

### Adaptive Scoring Formula

#### **When User HAS Location** (Location-Optimized)
```
Total Score = (Distance × 40%) + (Rating × 30%) + (Experience × 15%) +
              (Reviews × 8%) + (Availability × 5%) + (Price × 2%)
```
*Prioritizes proximity when location is available*

#### **When User has NO Location** (Quality-Optimized)
```
Total Score = (Rating × 40%) + (Experience × 25%) + (Reviews × 15%) +
              (Distance × 10%) + (Availability × 5%) + (Price × 5%)
```
*Prioritizes quality and experience when location is unavailable*

### Factor Breakdown

#### 1. Distance Score (40% with location / 10% without)
- **Purpose**: Prioritize lawyers who are geographically closer
- **Calculation**: `((MAX_DISTANCE - lawyer.distance) / MAX_DISTANCE) × 100`
- **Max Distance**: 50 km
- **Example**:
  - 2 km away = 96 points
  - 25 km away = 50 points
  - 50 km away = 0 points
- **Fallback**: 50 points if user location not available
- **Why Adaptive**: Distance is highly valuable when known, but shouldn't dominate when unavailable

#### 2. Rating Score (30% with location / 40% without) - CRITICAL FACTOR
- **Purpose**: Prioritize highly-rated lawyers (quality indicator)
- **Calculation**: `(rating / 5.0) × 100`
- **Range**: 0-5 stars
- **Example**:
  - 5.0 stars = 100 points
  - 4.5 stars = 90 points
  - 3.0 stars = 60 points
- **Why Adaptive**: Becomes most important factor when location is unknown

#### 3. Experience Score (15% with location / 25% without)
- **Purpose**: Value experienced professionals
- **Calculation**: `Min(100, (years_experience / MAX_EXPERIENCE) × 100)`
- **Max Experience**: 30 years
- **Example**:
  - 30+ years = 100 points
  - 15 years = 50 points
  - 5 years = 16.7 points

#### 4. Review Count Score (8% with location / 15% without)
- **Purpose**: Trust lawyers with proven track records
- **Calculation**: `Min(100, (total_reviews / MAX_REVIEWS) × 100)`
- **Max Reviews**: 100
- **Example**:
  - 100+ reviews = 100 points
  - 50 reviews = 50 points
  - 10 reviews = 10 points
- **Why this matters**: More reviews = more credibility
- **Why Adaptive**: Social proof becomes more important when location is unknown

#### 5. Availability Score (5% weight - CONSTANT)
- **Purpose**: Boost lawyers who are currently available
- **Calculation**: `is_available ? 100 : 0`
- **Binary score**:
  - Available = 100 points
  - Not Available = 0 points
- **Consistent**: Same weight regardless of location

#### 6. Price Score (2% with location / 5% without)
- **Purpose**: Slight preference for competitive pricing
- **Calculation**: `((MAX_PRICE - price) / MAX_PRICE) × 100`
- **Max Price**: ₱5,000/hour
- **Example**:
  - ₱1,000/hour = 80 points
  - ₱2,500/hour = 50 points
  - ₱5,000/hour = 0 points
- **Why so low**: Quas

### Example 1: User WITH Location

**Scenario**: User has set their location (location-optimized scoring)

#### Lawyer A: Maria Santos
- **Distance**: 2 km
- **Rating**: 4.8/5.0 stars
- **Experience**: 15 years
- **Reviews**: 45
- **Availability**: Available
- **Price**: ₱3,000/hour

**Calculation (WITH LOCATION):**
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

**Calculation (WITH LOCATION):**
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
- ✅ Much better rating (4.8 vs 3.5) → More reliable quality
- ✅ More experience (15 vs 3 years) → More expertise
- ✅ More reviews (45 vs 8) → More proven track record
- ✅ Currently available → Can book now

---

### Example 2: User WITHOUT Location

**Scenario**: User has NOT set their location (quality-optimized scoring)

#### Lawyer C: Elena Rodriguez
- **Distance**: N/A (no user location)
- **Rating**: 4.9/5.0 stars
- **Experience**: 20 years
- **Reviews**: 78
- **Availability**: Available
- **Price**: ₱4,000/hour

**Calculation (NO LOCATION):**
```
Rating:       (4.9/5.0) × 100 × 0.40 = 39.2
Experience:   (20/30) × 100 × 0.25 = 16.67
Reviews:      (78/100) × 100 × 0.15 = 11.7
Distance:     50 × 0.10 = 5.0 (neutral fallback)
Availability: 100 × 0.05 = 5.0
PricAdaptive Intelligence**: Adjusts weights based on available data (location vs no location)
✅ **Context-Aware**: Prioritizes distance (40%) when user location is known, quality (40%) when not
✅ **Balanced Approach**: Considers multiple factors instead of single criterion
✅ **User-Friendly**: Automatically shows best overall match for their situation
✅ **Fair to Lawyers**: Considers multiple dimensions of value
✅ **Flexi
#### Lawyer D: Carlos Mendoza
- **Distance**: N/A
- **Rating**: 3.8/5.0 stars
- *Why Adaptive Weighting?

### Problem Solved:
Traditional static weights don't account for data availability. This adaptive approach ensures:

1. **With Location**: Users get the most geographically convenient lawyers who also meet quality standards
2. **Without Location**: Users still get excellent recommendations based on objective quality metrics
3. **Fair Competition**: Lawyers aren't penalized when user location is unavailable

### Decision Logic:
```typescript
if (hasUserLocation && lawyer.distance !== undefined) {
  // Location-Optimized: Distance becomes primary factor (40%)
  prioritize: [Distance, Quality, Experience]
} else {
  // Quality-Optimized: Rating becomes primary factor (40%)
  prioritize: [Quality, Experience, Reviews]
}
```

## Future Enhancements

### Potential Improvements:
1. **User Preference Weights**: Allow users to customize factor weights
   - Budget-conscious: Increase price weight to 30%
   - Quality-focused: Increase rating weight to 50%
   - Convenience-focused: Keep distance weight at 40% or increase
Rating:       (3.8/5.0) × 100 × 0.40 = 30.4
Experience:   (5/30) × 100 × 0.25 = 4.17
Reviews:      (12/100) × 100 × 0.15 = 1.8
Distance:     50 × 0.10 = 5.0 (neutral fallback)
Availability: 100 × 0.05 = 5.0
Price:        ((5000-1800)/5000) × 100 × 0.05 = 3.2

Total Score: 49.57 / 100
```

**Winner**: Elena Rodriguez (78.57) beats Carlos Mendoza (49.57)

Without location, quality dominates:
- ✅ Much higher rating (4.9 vs 3.8) → 40% weight!
- ✅ More experience (20 vs 5 years) → 25% weight!
- ✅ Many more reviews (78 vs 12) → 15% weight!
- Lower price doesn't compensate for quality differenc (4.8 vs 3.5)
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
