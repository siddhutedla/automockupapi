import { getZohoAccessToken } from './zoho-token';

export class ZohoClientKV {
  private baseUrl: string = 'https://www.zohoapis.com';

  constructor() {
    // No need to pass tokens - they're managed by KV
  }

  private async getAccessToken(): Promise<string> {
    return await getZohoAccessToken();
  }

  async getContacts(limit: number = 200): Promise<Record<string, unknown>[]> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/Contacts?per_page=${limit}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads?per_page=${limit}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/Accounts?per_page=${limit}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/Contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/Contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/settings/modules`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/users`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }

  async getLeadAttachments(leadId: string): Promise<Record<string, unknown>[]> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/${leadId}/Attachments`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
    const accessToken = await this.getAccessToken();

    console.log('🔍 [ZOHO-CLIENT-KV] Fetching lead:', leadId);
    console.log('🔍 [ZOHO-CLIENT-KV] Base URL:', this.baseUrl);

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/${leadId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [ZOHO-CLIENT-KV] Lead API response status:', response.status);
    console.log('🔍 [ZOHO-CLIENT-KV] Lead API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ZOHO-CLIENT-KV] Failed to fetch lead:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`Failed to fetch lead: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 [ZOHO-CLIENT-KV] Lead API response data:', data);

    const result = data.data?.[0] || {};
    console.log('🔍 [ZOHO-CLIENT-KV] Processed lead data:', {
      hasData: !!result,
      keys: Object.keys(result),
      leadId: result.id
    });

    return result;
  }

  async downloadLeadPhoto(leadId: string): Promise<Buffer> {
    const accessToken = await this.getAccessToken();

    console.log('🔍 [ZOHO-CLIENT-KV] Downloading lead photo for lead ID:', leadId);
    console.log('🔍 [ZOHO-CLIENT-KV] Photo URL:', `${this.baseUrl}/crm/v3/Leads/${leadId}/photo`);

    const response = await fetch(`${this.baseUrl}/crm/v3/Leads/${leadId}/photo`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Accept': 'application/octet-stream',
      },
    });

    console.log('🔍 [ZOHO-CLIENT-KV] Photo download response status:', response.status);
    console.log('🔍 [ZOHO-CLIENT-KV] Photo download response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ZOHO-CLIENT-KV] Failed to download lead photo:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        leadId: leadId
      });
      throw new Error(`Failed to download lead photo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('🔍 [ZOHO-CLIENT-KV] Lead photo downloaded successfully, size:', buffer.length, 'bytes');

    return buffer;
  }

  async downloadCustomFile(fileUrl: string): Promise<Buffer> {
    const accessToken = await this.getAccessToken();

    console.log('🔍 [ZOHO-CLIENT-KV] Downloading custom file from URL:', fileUrl);
    console.log('🔍 [ZOHO-CLIENT-KV] Full download URL:', `${this.baseUrl}${fileUrl}`);

    const response = await fetch(`${this.baseUrl}${fileUrl}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Accept': 'application/octet-stream',
      },
    });

    console.log('🔍 [ZOHO-CLIENT-KV] File download response status:', response.status);
    console.log('🔍 [ZOHO-CLIENT-KV] File download response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ZOHO-CLIENT-KV] Failed to download custom file:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        fileUrl: fileUrl
      });
      throw new Error(`Failed to download custom file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('🔍 [ZOHO-CLIENT-KV] File downloaded successfully, size:', buffer.length, 'bytes');
    
    return buffer;
  }
} 