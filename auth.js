class AuthHandler {
    constructor() {
        console.log("Initializing MSAL with config:", config.auth);
        this.msalInstance = new msal.PublicClientApplication({
            auth: {
                clientId: config.auth.clientId,
                authority: config.auth.authority,
                redirectUri: config.auth.redirectUri,
                postLogoutRedirectUri: config.auth.postLogoutRedirectUri
            },
            cache: config.cache
        });
        this.isAuthenticated = false;
        this.accessToken = null;
        this.username = null;
        
        // Check localStorage for a saved CRM URL to use for scope
        const savedCrmUrl = localStorage.getItem('crmUrl');
        this.currentScope = savedCrmUrl ? 
            `${savedCrmUrl}/.default` : 
            config.dataverse.scope;

        // Handle redirect promise
        this.msalInstance.handleRedirectPromise()
            .then(response => {
                console.log("Redirect handled:", response);
                if (response) {
                    this.isAuthenticated = true;
                    this.accessToken = response.accessToken;
                    this.username = response.account.username;
                    this.updateUsernameDisplay();
                    // Check if we should show account details
                    const hash = window.location.hash;
                    if (hash) {
                        this.showAccountDetail();
                    } else {
                        this.showMainApp();
                    }
                    this.updateAuthButtons(true);
                } else {
                    this.checkAuthStatus();
                }
            })
            .catch(error => {
                console.error("Error handling redirect:", error);
            });
    }

    async checkAuthStatus() {
        try {
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                this.isAuthenticated = true;
                this.account = accounts[0];
                this.username = accounts[0].username;
                this.accessToken = await this.getAccessToken();
                // Check if we should show account details
                const hash = window.location.hash;
                if (hash) {
                    this.showAccountDetail();
                } else {
                    this.showMainApp();
                }
                this.updateUsernameDisplay();
                this.updateAuthButtons(true);
                return true;
            } else {
                this.isAuthenticated = false;
                this.username = null;
                this.showWelcomePage();
                this.updateUsernameDisplay();
                this.updateAuthButtons(false);
                return false;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.isAuthenticated = false;
            this.username = null;
            this.showWelcomePage();
            this.updateUsernameDisplay();
            this.updateAuthButtons(false);
            return false;
        }
    }

    async getAccessToken() {
        try {
            const account = this.msalInstance.getAllAccounts()[0];
            console.log("Getting token for account:", account);
            const response = await this.msalInstance.acquireTokenSilent({
                scopes: [this.currentScope],
                account: account
            });
            return response.accessToken;
        } catch (error) {
            console.error("Error acquiring token:", error);
            return null;
        }
    }

    updateScope(newScope) {
        this.currentScope = newScope;
        // Return a promise for better error handling
        return new Promise((resolve, reject) => {
            // If the user is already authenticated, refresh the token with the new scope
            if (this.isAuthenticated) {
                this.getAccessToken()
                    .then(token => {
                        if (token) {
                            this.accessToken = token;
                            resolve();
                        } else {
                            reject(new Error("Failed to get access token with new scope"));
                        }
                    })
                    .catch(error => {
                        console.error("Error refreshing token with new scope:", error);
                        reject(error);
                    });
            } else {
                // If not authenticated, just update the scope for future auth
                resolve();
            }
        });
    }

    async signIn() {
        try {
            console.log("Initiating sign in with scope:", this.currentScope);
            await this.msalInstance.loginRedirect({
                scopes: [this.currentScope]
            });
        } catch (error) {
            console.error("Error signing in:", error);
        }
    }

    async signOut() {
        try {
            // Clear local state first
            this.isAuthenticated = false;
            this.account = null;
            this.username = null;
            this.accessToken = null;
            this.showWelcomePage();
            this.updateUsernameDisplay();
            this.updateAuthButtons(false);

            // Perform the logout redirect
            await this.msalInstance.logoutRedirect({
                postLogoutRedirectUri: config.auth.postLogoutRedirectUri
            });
        } catch (error) {
            console.error('Error signing out:', error);
            // Even if there's an error, we should still clear the local state
            this.isAuthenticated = false;
            this.account = null;
            this.username = null;
            this.accessToken = null;
            this.showWelcomePage();
            this.updateUsernameDisplay();
            this.updateAuthButtons(false);
        }
    }

    updateUsernameDisplay() {
        const usernameElement = document.getElementById("username");
        if (usernameElement && this.username) {
            usernameElement.textContent = this.username;
            usernameElement.style.display = "inline-block";
        }
    }

    showWelcomePage() {
        document.getElementById("welcomePage").style.display = "block";
        document.getElementById("mainApp").style.display = "none";
        document.getElementById("accountDetail").style.display = "none";
        this.updateUsernameDisplay();
    }

    showMainApp() {
        document.getElementById("welcomePage").style.display = "none";
        document.getElementById("mainApp").style.display = "block";
        document.getElementById("accountDetail").style.display = "none";
        this.updateUsernameDisplay();
    }

    showAccountDetail() {
        document.getElementById("welcomePage").style.display = "none";
        document.getElementById("mainApp").style.display = "none";
        document.getElementById("accountDetail").style.display = "block";
        this.updateUsernameDisplay();
    }

    updateAuthButtons(isAuthenticated) {
        const signInButton = document.getElementById('signInButton');
        const signOutButton = document.getElementById('signOutButton');
        
        if (isAuthenticated) {
            signInButton.classList.add('d-none');
            signOutButton.classList.remove('d-none');
        } else {
            signInButton.classList.remove('d-none');
            signOutButton.classList.add('d-none');
        }
    }
} 