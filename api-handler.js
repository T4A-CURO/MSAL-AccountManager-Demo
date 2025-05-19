class DynamicsApiHandler {
    constructor(authHandler, customEnvironmentUrl = null) {
        this.authHandler = authHandler;
        this.baseUrl = customEnvironmentUrl || config.dataverse.environmentUrl;
        this.apiVersion = config.dataverse.apiVersion;
        this.maxRetries = 3;
        this.baseDelay = 1000; // 1 second
    }

    updateBaseUrl(newUrl) {
        this.baseUrl = newUrl;
    }

    async makeRequest(endpoint, options = {}) {
        let attempt = 0;
        const requestUrl = `${this.baseUrl}/api/data/${this.apiVersion}/${endpoint}`;
        console.log(`API Request: ${options.method || 'GET'} ${requestUrl}`);
        
        while (attempt < this.maxRetries) {
            try {
                if (!this.authHandler.accessToken) {
                    console.error("No access token available for API request");
                    throw new Error("Authentication token is missing. Please sign in again.");
                }
                
                console.log(`Attempt ${attempt + 1}/${this.maxRetries}`);
                const response = await fetch(requestUrl, {
                    ...options,
                    headers: {
                        'Authorization': `Bearer ${this.authHandler.accessToken}`,
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        ...options.headers
                    }
                });

                // Handle rate limit responses
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After') || 
                        Math.pow(2, attempt) * this.baseDelay;
                    
                    console.warn(`Rate limit hit. Retrying after ${retryAfter}ms. Attempt ${attempt + 1}/${this.maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter));
                    attempt++;
                    continue;
                }

                // Handle other error responses
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData = {};
                    
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (e) {
                        console.error("Could not parse error response:", errorText);
                    }
                    
                    console.error(`API Error (${response.status})`, errorData);
                    
                    throw new Error(JSON.stringify({
                        status: response.status,
                        statusText: response.statusText,
                        errorData
                    }));
                }

                const data = await response.json();
                console.log(`API Response: ${response.status} OK`);
                return data;
            } catch (error) {
                console.error(`API Request failed (attempt ${attempt + 1}/${this.maxRetries}):`, error);
                
                if (attempt === this.maxRetries - 1) {
                    throw error;
                }
                
                const delay = Math.pow(2, attempt) * this.baseDelay;
                console.warn(`Request failed. Retrying after ${delay}ms. Attempt ${attempt + 1}/${this.maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        }
    }

    // Helper methods for common operations
    async searchAccounts(query, select = ['name', 'accountid', 'telephone1', 'emailaddress1']) {
        let filter = "";
        if (query && query.trim() !== "") {
            filter = `$filter=contains(name,'${encodeURIComponent(query.trim())}')&`;
        }
        
        const endpoint = `accounts?${filter}$select=${select.join(',')}`;
        const result = await this.makeRequest(endpoint);
        return result.value;
    }

    async getAccountDetails(accountId) {
        const endpoint = `accounts(${accountId})?$select=name,accountid,telephone1,emailaddress1,websiteurl,address1_line1,address1_city,address1_stateorprovince,address1_postalcode,address1_country&$expand=primarycontactid($select=firstname,lastname),t4a_secondarycontactid($select=firstname,lastname)`;
        return await this.makeRequest(endpoint);
    }

    async getContactDetails(contactId) {
        const endpoint = `contacts(${contactId})?$select=_parentcustomerid_value`;
        return await this.makeRequest(endpoint);
    }
} 