# Simple Mockup API

This API endpoint provides a simplified way to generate t-shirt mockups using Company name and Lead ID from Zoho CRM.

## Endpoint

```
POST /api/mockup/simple
```

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "company": "Your Company Name",
  "leadID": "Zoho Lead ID"
}
```

### Parameters

- **company** (string, required): The company name to display on the mockup
- **leadID** (string, required): The Zoho CRM Lead ID to fetch the logo from

## Response

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "success": true,
    "mockups": [
      {
        "type": "tshirt-front",
        "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
      },
      {
        "type": "tshirt-back", 
        "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
      }
    ]
  },
  "message": "Mockups generated successfully",
  "requestId": "req_123456789"
}
```

### Error Responses

#### 400 - Bad Request
```json
{
  "success": false,
  "error": "Validation errors: company is required, leadID is required",
  "requestId": "req_123456789"
}
```

#### 404 - Lead Not Found
```json
{
  "success": false,
  "error": "Lead not found",
  "requestId": "req_123456789"
}
```

#### 500 - Server Error
```json
{
  "success": false,
  "error": "Failed to download lead photo",
  "requestId": "req_123456789"
}
```

## How it Works

1. **Validates Input**: Checks that both `company` and `leadID` are provided
2. **Fetches Lead Data**: Uses Zoho CRM API to get lead information
3. **Downloads Logo**: Downloads the lead's photo from Zoho CRM
4. **Generates Mockups**: Creates t-shirt front and back mockups using the logo
5. **Converts to Base64**: Converts the generated images to base64 strings
6. **Returns Results**: Returns both mockups as base64 data URLs

## Features

- **Automatic Logo Fetching**: Automatically downloads the logo from Zoho CRM using the Lead ID
- **T-Shirt Mockups**: Generates both front and back t-shirt mockups by default
- **Base64 Output**: Returns images as base64 strings for easy integration
- **Error Handling**: Comprehensive error handling for various failure scenarios
- **Caching**: Uses the existing caching system for performance optimization

## Example Usage

### JavaScript/Node.js
```javascript
const response = await fetch('/api/mockup/simple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    company: 'Acme Corporation',
    leadID: '6764494000001367215'
  })
});

const result = await response.json();

if (result.success) {
  const { mockups } = result.data;
  
  // Display front mockup
  const frontMockup = mockups.find(m => m.type === 'tshirt-front');
  document.getElementById('front-image').src = frontMockup.base64;
  
  // Display back mockup
  const backMockup = mockups.find(m => m.type === 'tshirt-back');
  document.getElementById('back-image').src = backMockup.base64;
}
```

### cURL
```bash
curl -X POST http://localhost:3000/api/mockup/simple \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Acme Corporation",
    "leadID": "6764494000001367215"
  }'
```

## Testing

You can test this API using the test page at `/test-simple-mockup` which provides a user interface for testing the endpoint.

## Requirements

- Zoho CRM access tokens must be configured in environment variables
- The Lead ID must exist in Zoho CRM
- The Lead must have a photo/logo attached 