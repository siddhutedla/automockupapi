import { TokenRefreshService } from './token-refresh';

interface ZohoToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  api_domain: string;
  token_type: string;
  expires_at: number;
}

export class ZohoClient {
  private tokens: ZohoToken | null = null;
  private baseUrl: string = '';

  constructor(tokens?: ZohoToken) {
    if (tokens) {
      this.tokens = tokens;
      this.baseUrl = this.buildBaseUrl(tokens.api_domain);
    }
  }

  setTokens(tokens: ZohoToken) {
    this.tokens = tokens;
    this.baseUrl = this.buildBaseUrl(tokens.api_domain);
  }

  private buildBaseUrl(apiDomain: string): string {
    // Remove any existing protocol to avoid double https://
    const cleanDomain = apiDomain.replace(/^https?:\/\//, '');
    return `https://${cleanDomain}`;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.tokens) {
      throw new Error('No tokens available');
    }

    // Check if token is expired (with 5 minute buffer)
    if (TokenRefreshService.isTokenExpired(this.tokens.expires_at)) {
      console.log('🔄 [ZOHO-CLIENT] Token expired, refreshing...');
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const tokenData = await TokenRefreshService.refreshAccessToken();
      
      this.tokens = {
        ...this.tokens!,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || this.tokens!.refresh_token,
        expires_in: tokenData.expires_in,
        api_domain: tokenData.api_domain,
        token_type: tokenData.token_type,
        expires_at: TokenRefreshService.calculateExpiryTime(tokenData.expires_in)
      };

      console.log('✅ [ZOHO-CLIENT] Access token refreshed successfully');
    } catch (error) {
      console.error('❌ [ZOHO-CLIENT] Failed to refresh access token:', error);
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContacts(limit: number = 200): Promise<Record<string, unknown>[]> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/Contacts?per_page=${limit}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json();
    return data.data || [];
  }

  async getLeads(limit: number = 200): Promise<Record<string, unknown>[]> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads?per_page=${limit}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch leads');
    }

    const data = await response.json();
    return data.data || [];
  }

  async getAccounts(limit: number = 200): Promise<Record<string, unknown>[]> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/Accounts?per_page=${limit}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const data = await response.json();
    return data.data || [];
  }

  async createContact(contactData: Record<string, unknown>): Promise<Record<string, unknown>> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/Contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [contactData]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create contact');
    }

    return await response.json();
  }

  async updateContact(contactId: string, contactData: Record<string, unknown>): Promise<Record<string, unknown>> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/Contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [contactData]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update contact');
    }

    return await response.json();
  }

  async getModules(): Promise<Record<string, unknown>[]> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/settings/modules`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch modules');
    }

    const data = await response.json();
    return data.modules || [];
  }

  async getUserInfo(): Promise<Record<string, unknown>> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/users`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }

  async getLeadAttachments(leadId: string): Promise<Record<string, unknown>[]> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/${leadId}/Attachments`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead attachments');
    }

    const data = await response.json();
    return data.data || [];
  }

  async getLead(leadId: string): Promise<Record<string, unknown>> {
    await this.refreshTokenIfNeeded();

    console.log('🔍 [ZOHO-CLIENT] Fetching lead:', leadId);
    console.log('🔍 [ZOHO-CLIENT] Base URL:', this.baseUrl);

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/${leadId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [ZOHO-CLIENT] Lead API response status:', response.status);
    console.log('🔍 [ZOHO-CLIENT] Lead API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ZOHO-CLIENT] Failed to fetch lead:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`Failed to fetch lead: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 [ZOHO-CLIENT] Lead API response data:', data);

    const result = data.data?.[0] || {};
    console.log('🔍 [ZOHO-CLIENT] Processed lead data:', {
      hasData: !!result,
      keys: Object.keys(result),
      leadId: result.id
    });

    return result;
  }

  async downloadLeadPhoto(leadId: string): Promise<Buffer> {
    await this.refreshTokenIfNeeded();

    console.log('🔍 [ZOHO-CLIENT] Downloading lead photo for lead ID:', leadId);
    console.log('🔍 [ZOHO-CLIENT] Photo URL:', `${this.baseUrl}/crm/v3/Leads/${leadId}/photo`);

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/${leadId}/photo`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Accept': 'application/octet-stream',
      },
    });

    console.log('🔍 [ZOHO-CLIENT] Photo download response status:', response.status);
    console.log('🔍 [ZOHO-CLIENT] Photo download response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ZOHO-CLIENT] Failed to download lead photo:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        leadId: leadId
      });
      throw new Error(`Failed to download lead photo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('🔍 [ZOHO-CLIENT] Lead photo downloaded successfully, size:', buffer.length, 'bytes');

    return buffer;
  }

  async downloadCustomFile(fileUrl: string): Promise<Buffer> {
    await this.refreshTokenIfNeeded();

    console.log('🔍 [ZOHO-CLIENT] Downloading custom file from URL:', fileUrl);
    console.log('🔍 [ZOHO-CLIENT] Full download URL:', `${this.baseUrl}${fileUrl}`);

    const response = await fetch(`${this.baseUrl}${fileUrl}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Accept': 'application/octet-stream',
      },
    });

    console.log('🔍 [ZOHO-CLIENT] File download response status:', response.status);
    console.log('🔍 [ZOHO-CLIENT] File download response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ZOHO-CLIENT] Failed to download custom file:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        fileUrl: fileUrl
      });
      throw new Error(`Failed to download custom file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('🔍 [ZOHO-CLIENT] File downloaded successfully, size:', buffer.length, 'bytes');
    
    return buffer;
  }
} 