class App {
    constructor() {
        // Check localStorage first for a saved URL, otherwise use config
        this.customEnvironmentUrl = localStorage.getItem('crmUrl') || config.dataverse.environmentUrl;
        this.customScope = `${this.customEnvironmentUrl}/.default`;
        this.authHandler = new AuthHandler();
        this.apiHandler = new DynamicsApiHandler(this.authHandler, this.customEnvironmentUrl);
        this.currentAccount = null;
        this.setupEventListeners();
        this.initializeCrmUrlInput();
        
        // Initialize the app after authentication
        this.authHandler.checkAuthStatus().then(() => {
            if (this.authHandler.isAuthenticated) {
                this.handleSearch("");
            }
        });

        // Check for entity details hash parameter
        this.checkForDetailsHash();
    }

    initializeCrmUrlInput() {
        const crmUrlInput = document.getElementById("crmUrlInput");
        // Set initial value from previously saved URL or config
        crmUrlInput.value = this.customEnvironmentUrl;
        
        // Add event listener for changes
        crmUrlInput.addEventListener("change", () => {
            const newUrl = crmUrlInput.value.trim();
            if (newUrl && newUrl !== this.customEnvironmentUrl) {
                this.updateCrmUrl(newUrl);
            }
        });
    }

    updateCrmUrl(newUrl) {
        // Basic URL validation
        if (!newUrl.match(/^https?:\/\/.+/)) {
            alert("Please enter a valid URL starting with http:// or https://");
            // Reset to current value
            document.getElementById("crmUrlInput").value = this.customEnvironmentUrl;
            return;
        }
        
        // Remove trailing slash if present
        if (newUrl.endsWith('/')) {
            newUrl = newUrl.slice(0, -1);
        }
        
        this.customEnvironmentUrl = newUrl;
        this.customScope = `${newUrl}/.default`;
        
        // Save to localStorage for persistence
        localStorage.setItem('crmUrl', newUrl);
        
        // Update API handler with new URL
        this.apiHandler.updateBaseUrl(newUrl);
        
        // Update auth handler with new scope and wait for token refresh
        this.authHandler.updateScope(this.customScope)
            .then(() => {
                console.log(`CRM URL updated to: ${newUrl}`);
                console.log(`Scope updated to: ${this.customScope}`);
                
                // Show success message to user
                const urlInput = document.getElementById("crmUrlInput");
                urlInput.classList.add("is-valid");
                setTimeout(() => urlInput.classList.remove("is-valid"), 2000);
            })
            .catch(error => {
                console.error("Failed to update CRM URL:", error);
                alert("Failed to authenticate with the new CRM URL. Please try again or check the URL.");
                
                // Show error to user
                const urlInput = document.getElementById("crmUrlInput");
                urlInput.classList.add("is-invalid");
                setTimeout(() => urlInput.classList.remove("is-invalid"), 2000);
            });
    }

    checkForDetailsHash() {
        const hash = window.location.hash;
        if (hash) {
            const hashValue = hash.substring(1); // Remove the # symbol
            if (hashValue) {
                // Parse the hash value into entity type and id
                const [entityType, entityId] = hashValue.split('=');
                
                // Wait for authentication before loading entity details
                this.authHandler.checkAuthStatus().then(isAuthenticated => {
                    if (isAuthenticated) {
                        switch (entityType.toLowerCase()) {
                            case 'account':
                                this.viewAccountDetails(entityId);
                                break;
                            case 'contact':
                                this.handleContactRoute(entityId);
                                break;
                            default:
                                console.log(`Unknown entity type: ${entityType}`);
                        }
                    }
                    else {
                        this.authHandler.signIn();
                    }
                });
            }
        }
    }

    async handleContactRoute(contactId) {
        try {
            this.showLoading();
            const contact = await this.apiHandler.getContactDetails(contactId);
            if (contact._parentcustomerid_value) {
                const accountId = contact._parentcustomerid_value;
                window.location.hash = `account=${accountId}`;
            } else {
                document.getElementById("accountDetail").innerHTML = "<div class='alert alert-warning'>This contact is not associated with an account</div>";
            }
        } catch (error) {
            console.error("Error fetching contact details:", error);
            this.handleApiError(error, "loading contact details");
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const spinner = document.getElementById("loadingSpinner");
        if (spinner) {
            spinner.classList.remove("d-none");
        }
    }

    hideLoading() {
        const spinner = document.getElementById("loadingSpinner");
        if (spinner) {
            spinner.classList.add("d-none");
        }
    }

    setupEventListeners() {
        document.getElementById("signInButton").addEventListener("click", () => this.authHandler.signIn());
        document.getElementById("signOutButton").addEventListener("click", () => this.authHandler.signOut());
        document.getElementById("searchButton").addEventListener("click", () => {
            const query = document.getElementById("searchInput").value;
            this.handleSearch(query);
        });
        document.getElementById("searchInput").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const query = e.target.value;
                this.handleSearch(query);
            }
        });

        // Add hash change listener
        window.addEventListener('hashchange', () => {
            this.checkForDetailsHash();
        });
    }

    async handleSearch(query) {
        try {
            this.showLoading();
            const accounts = await this.apiHandler.searchAccounts(query);
            this.displayAccounts(accounts);
        } catch (error) {
            console.error("Error searching accounts:", error);
            this.handleApiError(error, "searching accounts");
        } finally {
            this.hideLoading();
        }
    }

    displayAccounts(accounts) {
        const accountList = document.getElementById("accountList");
        accountList.innerHTML = "";

        if (accounts.length === 0) {
            accountList.innerHTML = "<div class='alert alert-info'>No accounts found</div>";
            return;
        }

        const table = document.createElement("table");
        table.className = "table table-striped";
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${accounts.map(account => `
                    <tr>
                        <td>${account.name}</td>
                        <td>${account.telephone1 || '-'}</td>
                        <td>${account.emailaddress1 || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-account" data-id="${account.accountid}">View Details</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        accountList.appendChild(table);

        // Add event listeners to view buttons
        const viewButtons = table.querySelectorAll('.view-account');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const accountId = e.currentTarget.getAttribute('data-id');
                this.viewAccountDetails(accountId);
            });
        });
    }

    async viewAccountDetails(accountId) {
        try {
            this.showLoading();
            const account = await this.apiHandler.getAccountDetails(accountId);
            this.currentAccount = account;
            this.displayAccountDetails(account);
            this.authHandler.showAccountDetail();
        } catch (error) {
            console.error("Error fetching account details:", error);
            this.handleApiError(error, "loading account details");
        } finally {
            this.hideLoading();
        }
    }

    displayAccountDetails(account) {
        const accountDetail = document.getElementById("accountDetailsContent");
        const crmUrl = `${this.customEnvironmentUrl}/main.aspx?pagetype=entityrecord&etn=account&id=${account.accountid}`;
                                                          
        const formatContactName = (contact) => {
            if (!contact) return '-';
            return `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || '-';
        };

        const formatAddress = (account) => {
            const parts = [
                account.address1_line1,
                account.address1_city,
                account.address1_stateorprovince,
                account.address1_postalcode,
                account.address1_country
            ].filter(part => part);
            return parts.length > 0 ? parts.join(', ') : '-';
        };

        accountDetail.innerHTML = `
            <div class="container mt-4">
                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <h2>${account.name}</h2>
                            <a href="${crmUrl}" target="_blank" class="btn btn-primary">
                                <i class="bi bi-box-arrow-up-right"></i> View in CRM
                            </a>
                        </div>
                        <hr>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h4>Contact Information</h4>
                        <table class="table">
                            <tr>
                                <th>Primary Contact:</th>
                                <td>${formatContactName(account.primarycontactid)}</td>
                            </tr>
                            <tr>
                                <th>Secondary Contact:</th>
                                <td>${formatContactName(account.t4a_secondarycontactid)}</td>
                            </tr>
                            <tr>
                                <th>Phone:</th>
                                <td>${account.telephone1 || '-'}</td>
                            </tr>
                            <tr>
                                <th>Email:</th>
                                <td>${account.emailaddress1 || '-'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h4>Address</h4>
                        <p>${formatAddress(account)}</p>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-12">
                        <button class="btn btn-secondary" onclick="app.authHandler.showMainApp()">Back to List</button>
                    </div>
                </div>
            </div>
        `;
    }

    handleApiError(error, context) {
        let message = "An unexpected error occurred";
        
        try {
            const errorData = JSON.parse(error.message);
            if (errorData.status === 429) {
                message = "We've hit the rate limit. Please try again in a few moments.";
            } else if (errorData.status === 401) {
                message = "Your session has expired. Please sign in again.";
                this.authHandler.signIn();
            } else {
                message = `Error ${context}: ${errorData.statusText}`;
            }
        } catch {
            message = error.message;
        }

        const targetElement = context.includes("account details") ? 
            "accountDetailsContent" : "accountList";
        
        const element = document.getElementById(targetElement);
        if (element) {
            element.innerHTML = `<div class='alert alert-danger'>${message}</div>`;
        }
    }
}

// Initialize the app
const app = new App(); 