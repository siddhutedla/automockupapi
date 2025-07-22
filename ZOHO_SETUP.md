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

### 4. Using Attachments

The system now uses Zoho CRM attachments instead of custom fields:
- Upload logo images as attachments to your leads
- The system will automatically find and use the first image attachment
- Supported formats: JPG, JPEG, PNG, GIF, WEBP, SVG
- The attachment will be downloaded and used for mockup generation

### 5. Usage Examples

#### Test Lead Data
```javascript
const response = await fetch('/api/test-lead?leadId=6764494000001367196');
const result = await response.json();
console.log(result.data);
// Returns lead info and attachment details
```

#### Mockup Generation with Lead Attachments
```javascript
const response = await fetch('/api/mockup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadID: '6764494000001367196', // Lead ID with attachments
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