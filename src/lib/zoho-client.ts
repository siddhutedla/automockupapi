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
      this.baseUrl = `https://${tokens.api_domain}`;
    }
  }

  setTokens(tokens: ZohoToken) {
    this.tokens = tokens;
    this.baseUrl = `https://${tokens.api_domain}`;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.tokens) {
      throw new Error('No tokens available');
    }

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() > this.tokens.expires_at - 300000) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID || '',
        client_secret: process.env.ZOHO_CLIENT_SECRET || '',
        refresh_token: this.tokens.refresh_token,
      }),
    });

    const tokenData = await response.json();

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    this.tokens = {
      ...this.tokens,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
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

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/${leadId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead');
    }

    const data = await response.json();
    return data.data?.[0] || {};
  }

  async downloadAttachment(attachmentId: string): Promise<Buffer> {
    await this.refreshTokenIfNeeded();

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/Attachments/${attachmentId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.tokens!.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download attachment');
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
} 