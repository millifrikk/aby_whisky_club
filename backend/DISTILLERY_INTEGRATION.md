# Distillery Integration with WhiskyHunter API

This document explains the distillery integration feature that automatically populates your whisky club database with comprehensive distillery information from the WhiskyHunter API.

## Overview

The distillery integration provides:
- **900+ distilleries** from Scotland, Japan, Taiwan, and other countries
- **Automatic region mapping** for Scottish distilleries
- **Proper relational database structure** between whiskies and distilleries
- **API endpoints** for managing distilleries
- **Automatic linking** of existing whiskies to their distilleries

## Quick Start

### 1. Initial Setup (New Installation)
```bash
# Install dependencies
npm install

# Run complete setup (creates tables + populates distilleries)
npm run setup

# Add sample data (optional)
npm run seed
```

### 2. Existing Installation
```bash
# Just populate distilleries
npm run populate-distilleries
```

## Database Changes

### New Distillery Model
```sql
CREATE TABLE distilleries (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  description TEXT,
  founded_year INTEGER,
  website VARCHAR(500),
  image_url VARCHAR(500),
  location JSON,
  is_active BOOLEAN DEFAULT true,
  whisky_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Updated Whisky Model
- Added `distillery_id` foreign key relationship
- Kept existing `distillery` string field for backward compatibility
- Enhanced queries to include distillery information

## API Endpoints

### Public Endpoints

#### Get All Distilleries
```http
GET /api/distilleries?page=1&limit=20&search=macallan&country=Scotland&region=Speyside
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search by name or description
- `country` - Filter by country
- `region` - Filter by region
- `includeInactive` - Include inactive distilleries (default: false)
- `sortBy` - Sort field: name, country, region, whisky_count, created_at
- `sortOrder` - ASC or DESC

**Response:**
```json
{
  "success": true,
  "data": {
    "distilleries": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 45,
      "totalItems": 892,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Get Single Distillery
```http
GET /api/distilleries/{id_or_slug}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "The Macallan",
    "slug": "macallan",
    "country": "Scotland",
    "region": "Speyside",
    "description": "...",
    "whiskies": [...]
  }
}
```

#### Get Distillery Statistics
```http
GET /api/distilleries/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 892,
    "active": 856,
    "byCountry": [
      {"country": "Scotland", "count": 654},
      {"country": "Japan", "count": 156},
      {"country": "Taiwan", "count": 82}
    ],
    "byRegion": [
      {"region": "Speyside", "count": 143},
      {"region": "Highlands", "count": 98}
    ],
    "withWhiskies": 45
  }
}
```

### Admin Endpoints (Requires Authentication)

#### Create Distillery
```http
POST /api/distilleries
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Distillery",
  "slug": "new_distillery",
  "country": "Scotland",
  "region": "Highlands"
}
```

#### Update Distillery
```http
PUT /api/distilleries/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated description",
  "founded_year": 1824
}
```

#### Delete Distillery
```http
DELETE /api/distilleries/{id}
Authorization: Bearer {token}
```

#### Populate from API
```http
POST /api/distilleries/populate/api
Authorization: Bearer {token}
```

#### Update Whisky Counts
```http
POST /api/distilleries/update-counts
Authorization: Bearer {token}
```

## Updated Whisky API

All whisky endpoints now include distillery information:

```json
{
  "id": "whisky-uuid",
  "name": "Macallan 18",
  "distillery": "The Macallan",
  "distillery_id": "distillery-uuid",
  "distilleryInfo": {
    "id": "distillery-uuid",
    "name": "The Macallan",
    "slug": "macallan",
    "country": "Scotland",
    "region": "Speyside"
  }
}
```

## Scottish Region Mapping

The system automatically maps Scottish distilleries to regions:

- **Speyside**: Aberlour, Balvenie, Cardhu, Macallan, Glenfiddich, etc.
- **Islay**: Ardbeg, Bowmore, Lagavulin, Laphroaig, Bruichladdich, etc.
- **Highlands**: Dalmore, Glenmorangie, Oban, Highland Park, etc.
- **Lowlands**: Auchentoshan, Bladnoch, Glenkinchie, etc.
- **Campbeltown**: Glen Scotia, Springbank, Kilkerran, etc.

## Database Scripts

### Available Scripts
```bash
# Complete setup (recommended for new installations)
npm run setup

# Populate/update distilleries only
npm run populate-distilleries

# Full seed with sample data
npm run seed

# Development server
npm run dev
```

### Script Details

#### `npm run setup`
- Tests database connection
- Synchronizes database schema
- Populates distilleries from API
- Perfect for first-time setup

#### `npm run populate-distilleries`
- Fetches latest distillery data from WhiskyHunter API
- Creates new distilleries
- Updates existing distilleries if data changed
- Safe to run multiple times

#### `npm run seed`
- Runs complete database seeding
- Includes distillery population
- Links existing whiskies to distilleries
- Adds sample users, whiskies, and events

## Frontend Integration

### Using Distillery Data in React

```javascript
// Fetch distilleries
const fetchDistilleries = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/distilleries?${params}`);
  return response.json();
};

// Distillery selector component
const DistillerySelect = ({ onSelect }) => {
  const [distilleries, setDistilleries] = useState([]);
  
  useEffect(() => {
    fetchDistilleries({ limit: 100 })
      .then(data => setDistilleries(data.distilleries));
  }, []);
  
  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      <option value="">Select Distillery</option>
      {distilleries.map(distillery => (
        <option key={distillery.id} value={distillery.id}>
          {distillery.name} ({distillery.country})
        </option>
      ))}
    </select>
  );
};
```

### Whisky Form with Distillery

```javascript
const WhiskyForm = () => {
  const [whiskyData, setWhiskyData] = useState({
    name: '',
    distillery_id: '',
    age: '',
    // ... other fields
  });
  
  return (
    <form>
      <input 
        placeholder="Whisky Name"
        value={whiskyData.name}
        onChange={(e) => setWhiskyData({...whiskyData, name: e.target.value})}
      />
      
      <DistillerySelect 
        onSelect={(distillery_id) => 
          setWhiskyData({...whiskyData, distillery_id})
        }
      />
      
      {/* Other form fields */}
    </form>
  );
};
```

## Data Migration

### Linking Existing Whiskies

The system automatically attempts to link existing whiskies to distilleries based on name matching:

```javascript
// This runs automatically during seeding
const linkWhiskiesToDistilleries = async () => {
  const whiskies = await Whisky.findAll({
    where: { distillery_id: null }
  });
  
  for (const whisky of whiskies) {
    const distillery = await Distillery.findOne({
      where: {
        name: { [Op.iLike]: `%${whisky.distillery}%` }
      }
    });
    
    if (distillery) {
      await whisky.update({ distillery_id: distillery.id });
    }
  }
};
```

### Manual Linking

For whiskies that couldn't be automatically linked:

```sql
-- Find unlinked whiskies
SELECT id, name, distillery 
FROM whiskies 
WHERE distillery_id IS NULL;

-- Manual linking example
UPDATE whiskies 
SET distillery_id = (
  SELECT id FROM distilleries 
  WHERE name ILIKE '%Macallan%' 
  LIMIT 1
)
WHERE name ILIKE '%Macallan%' 
AND distillery_id IS NULL;
```

## Error Handling

### Common Issues

1. **API Connection Error**
   ```
   Error: connect ENOTFOUND whiskyhunter.net
   ```
   - Check internet connectivity
   - Verify API endpoint is accessible

2. **Database Connection Error**
   ```
   Error: Unable to connect to database
   ```
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running

3. **Duplicate Distillery Error**
   ```
   SequelizeUniqueConstraintError: Validation error
   ```
   - Distillery already exists
   - Safe to ignore, script continues

### Monitoring

Monitor the population process:

```bash
# Run with verbose logging
NODE_ENV=development npm run populate-distilleries

# Check database after population
psql $DATABASE_URL -c "SELECT country, COUNT(*) FROM distilleries GROUP BY country;"
```

## Security Considerations

- **Rate Limiting**: API calls are throttled to respect WhiskyHunter's servers
- **Authentication**: Admin endpoints require valid JWT tokens
- **Validation**: All input is validated and sanitized
- **Error Handling**: Detailed errors only in development mode

## Performance

- **Batch Processing**: Distilleries processed in batches of 50
- **Indexes**: Database indexes on commonly queried fields
- **Caching**: Consider implementing Redis caching for frequently accessed distilleries
- **Pagination**: All list endpoints support pagination

## Contributing

When adding new distillery features:

1. Update the Distillery model if needed
2. Add appropriate validation
3. Update API documentation
4. Add tests for new functionality
5. Update this README

## Support

For issues or questions:
1. Check logs for error details
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Run setup script again if needed

---

**Last Updated**: June 2025
**API Version**: WhiskyHunter API v1
**Database Version**: PostgreSQL 13+
