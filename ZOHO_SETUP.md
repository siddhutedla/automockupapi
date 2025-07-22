# Zoho CRM API Integration Setup

## 🚀 Setup Instructions

### 1. Get Zoho CRM Access Tokens

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create a Self Client application
3. Generate access tokens for API access
4. Note down your access token, refresh token, and API domain

### 2. Environment Variables

Add these environment variables to your deployment:

```env
# Zoho CRM API Configuration
# Direct API access using access tokens
ZOHO_ACCESS_TOKEN=your_access_token_here
ZOHO_REFRESH_TOKEN=your_refresh_token_here
ZOHO_API_DOMAIN=www.zohoapis.com
```

### 3. API Endpoints

#### Zoho CRM Data
- **GET** `/api/test-lead` - Test lead data retrieval

### 4. Using Custom File Upload Fields

The system now uses Zoho CRM custom file upload fields (like Image_Logo):
- Upload logo images to the Image_Logo custom field on your leads
- The system will automatically download and use the image from this field
- Supported formats: JPG, JPEG, PNG, GIF, WEBP, SVG
- The image will be downloaded and used for mockup generation
- Uses the correct Zoho CRM v2 API endpoints:
  - `GET /crm/v2/Leads/{lead_id}` - Get lead with Image_Logo field
  - `GET /crm/v2/file/{file_id}` - Download the image file

### 5. Usage Examples

#### Test Lead Data
```javascript
const response = await fetch('/api/test-lead?leadId=6764494000001367215');
const result = await response.json();
console.log(result.data);
// Returns lead info, attachment details, and download test results
```

#### Mockup Generation with Lead Attachments
```javascript
const response = await fetch('/api/mockup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadID: '6764494000001367215', // Lead ID with attachments
    industry: 'technology',
    companyName: 'Your Company',
    tagline: 'Your tagline',
    mockupTypes: ['tshirt-front', 'tshirt-back']
  })
});
```

## 🛡️ Security Notes

- Store tokens securely in production (database, not environment variables)
- Implement token refresh logic
- Use HTTPS for all API communications
- Rotate tokens regularly

## 📋 Required Scopes

- `ZohoCRM.modules.ALL` - Access to all CRM modules
- `ZohoCRM.settings.ALL` - Access to CRM settings

## 🔗 Documentation

- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/)
- [Zoho API Console](https://api-console.zoho.com/) 