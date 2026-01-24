# Shopping List Generation Fix

## Issue Fixed
Shopping lists generated from meal plans and recipes were appearing empty - no ingredients were being extracted.

## What Was Changed
Updated `/src/lib/api.ts` - specifically the `createFromMealPlanWeek` function.

### Before
```typescript
// Just created an empty list
items: []
```

### After
- Loads meals from meal planner for the specified week
- Extracts all ingredients from each meal
- Deduplicates ingredients (smart matching by name)
- Parses quantities from ingredient strings
- Tracks which recipes use each ingredient

## Features Now Working

### 1. Generate from Recipe ✅
- Tap "From Recipe" button on Shopping Lists screen
- Select any saved recipe
- Shopping list is created with ALL ingredients from that recipe
- Each ingredient includes quantity if available

### 2. Generate from Meal Plan ✅
- Tap "From Meal Plan" button on Shopping Lists screen
- Automatically gets ALL meals from current week
- Combines ingredients from all meals
- **Smart deduplication**: If "flour" appears in 3 recipes, shows:
  - Name: "flour"
  - Quantity: "Used in 3 recipes" or combines quantities
- Creates comprehensive shopping list

## How to Test

1. **Add some meals to your meal planner** (at least 2-3 recipes)
2. **Go to Shopping Lists screen** (bottom navigation)
3. **Test "From Meal Plan":**
   - Tap the "From Meal Plan" button
   - Tap "Create from This Week"
   - ✅ You should now see all ingredients as items in the list
4. **Test "From Recipe":**
   - Tap the "From Recipe" button
   - Select any recipe
   - ✅ You should see all ingredients from that recipe

## Example Output

### Before Fix:
```
Shopping List: "Week of 2026-01-24"
└─ (empty)
```

### After Fix:
```
Shopping List: "Week of 2026-01-24"
├─ flour (2 cups) - (3 recipes)
├─ eggs (Used in 2 recipes)
├─ milk (1 cup)
├─ sugar (1/2 cup) - (2 recipes)
└─ butter (2 tbsp)
```

## Implementation Details

### Ingredient Parsing
The code automatically parses ingredient strings like:
- "2 cups flour" → Name: "flour", Quantity: "2 cups"
- "1/2 tsp salt" → Name: "salt", Quantity: "1/2 tsp"
- "500g chicken" → Name: "chicken", Quantity: "500g"
- "flour" → Name: "flour", Quantity: (none)

### Deduplication Logic
- Ingredients are matched by name (case-insensitive)
- If same ingredient appears multiple times:
  - Keeps track of all recipes using it
  - Shows "Used in X recipes" or combines quantities
  
### Supported Units
- Volume: cup, cups, tbsp, tsp, ml, l
- Weight: oz, lb, g, kg
- Count: piece, pieces, pcs
- Packaging: pkg, pack, can, cans
- Produce: bunch, bunches, clove, cloves, head, heads, stalk, stalks, slice, slices

## Files Modified
- `/src/lib/api.ts` - Fixed `createFromMealPlanWeek` function (lines ~344-464)

## Next Steps
If ingredients still don't show up:
1. Check that meals in your meal planner have `ingredients` array populated
2. Verify meal dates are within the current week
3. Check console logs for any errors
