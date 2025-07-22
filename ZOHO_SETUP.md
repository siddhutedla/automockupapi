# Zoho CRM OAuth Integration Setup

## 🔗 Redirect URI for Zoho CRM

Use this redirect URI when setting up your Zoho CRM OAuth application:

```
https://automockupapi-git-main-siddhutedlas-projects.vercel.app/api/auth/zoho/callback
```

## 🚀 Setup Instructions

### 1. Create Zoho CRM OAuth Application

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Click "Add Client"
3. Choose "Self Client" for server-to-server integration
4. Fill in the details:
   - **Client Name**: AutoMockup API
   - **Homepage URL**: `https://automockupapi-git-main-siddhutedlas-projects.vercel.app`
   - **Authorized Redirect URIs**: `https://automockupapi-git-main-siddhutedlas-projects.vercel.app/api/auth/zoho/callback`
   - **Scopes**: `ZohoCRM.modules.ALL,ZohoCRM.settings.ALL`

### 2. Environment Variables

Add these environment variables to your Vercel deployment:

```env
# Zoho CRM OAuth Configuration
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REDIRECT_URI=https://automockupapi-git-main-siddhutedlas-projects.vercel.app/api/auth/zoho/callback

# Optional: For direct API access (after OAuth)
ZOHO_ACCESS_TOKEN=your_access_token_here
ZOHO_REFRESH_TOKEN=your_refresh_token_here
ZOHO_API_DOMAIN=www.zohoapis.com
```

### 3. API Endpoints

#### OAuth Flow
- **GET** `/api/auth/zoho` - Initiate OAuth flow
- **GET** `/api/auth/zoho/callback` - OAuth callback handler

#### Zoho CRM Data
- **GET** `/api/zoho/contacts` - Fetch contacts
- **POST** `/api/zoho/contacts` - Create contact

### 4. Usage Examples

#### Initiate OAuth
```javascript
const response = await fetch('/api/auth/zoho');
const result = await response.json();
// Redirect to result.data.authUrl
```

#### Fetch Contacts
```javascript
const response = await fetch('/api/zoho/contacts?limit=50');
const result = await response.json();
console.log(result.data.contacts);
```

#### Create Contact
```javascript
const contactData = {
  First_Name: 'John',
  Last_Name: 'Doe',
  Email: 'john.doe@example.com',
  Phone: '+1234567890'
};

const response = await fetch('/api/zoho/contacts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contactData })
});
```

## 🔧 OAuth Flow

1. **User clicks "Connect Zoho CRM"**
2. **Redirect to Zoho**: `https://accounts.zoho.com/oauth/v2/auth`
3. **User authorizes**: User grants permissions
4. **Callback**: Zoho redirects to `/api/auth/zoho/callback`
5. **Token Exchange**: Server exchanges code for access token
6. **Success**: User is redirected back with success status

## 🛡️ Security Notes

- Store tokens securely in production (database, not environment variables)
- Implement token refresh logic
- Use HTTPS for all OAuth communications
- Validate state parameter to prevent CSRF attacks

## 📋 Required Scopes

- `ZohoCRM.modules.ALL` - Access to all CRM modules
- `ZohoCRM.settings.ALL` - Access to CRM settings

## 🔄 Token Refresh

The system automatically handles token refresh when:
- Token is expired (with 5-minute buffer)
- API calls return 401 Unauthorized

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Ensure exact match in Zoho Developer Console
   - Check for trailing slashes

2. **"Client ID not found"**
   - Verify ZOHO_CLIENT_ID environment variable
   - Check client is active in Zoho Developer Console

3. **"Authorization code expired"**
   - Codes expire after 10 minutes
   - Re-initiate OAuth flow

4. **"Invalid scope"**
   - Ensure scopes match exactly: `ZohoCRM.modules.ALL,ZohoCRM.settings.ALL`

## 📞 Support

For Zoho CRM API issues, refer to:
- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/)
- [Zoho OAuth Documentation](https://www.zoho.com/crm/developer/docs/api/oauth-overview.html) 