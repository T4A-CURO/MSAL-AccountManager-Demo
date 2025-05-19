# CURO Account Manager

A demo web application for managing CURO accounts with Microsoft Dataverse integration.

This SPA will give you a working example of how to use MSAL to authenticate dataverse connections and work with data in the context of user privileges.

A hosted version of this demo app can be played with here: https://delightful-forest-069a18503.6.azurestaticapps.net/ 

## NOTE to Developers

This demonstration focuses specifically on showcasing MSAL authentication with Dataverse and retrieving data based on user permissions. It is not intended to be a complete production-ready application, but rather a reference implementation for this particular aspect of application development.

When incorporating these concepts into your production applications, you should address additional considerations such as:
- Securing configuration data by moving it to a protected backend service
- Implementing comprehensive security practices and data validation
- Adding proper error handling, logging, and monitoring
- Optimizing performance and implementing caching strategies
- Ensuring compliance with organizational security policies

This demo serves as a starting point to understand the authentication flow and data retrieval patterns that you can then integrate into your broader, properly architected enterprise application.

## Features

- Microsoft Authentication integration (MSAL)
- Account search and filtering
- Detailed account view
- Direct CRM integration
- Responsive design

## Dynamics & Power platform rate limits and entitlements

Dynamics CRM and Power Platform web API is subject to various fair useage limits.  It is recommended that when developing against the dataverse you understand these limits and how to code to handle them.  

See CURO integration Framework documentation for more detail on these limits.

Below are some suggestions on how to handle them: 

Robust Rate Limit Handling:
- Automatically detects 429 (Too Many Requests) responses
- Respects the Retry-After header when provided
- Implements exponential backoff for retries
- Limits maximum retry attempts to prevent infinite loops
Improved Error Handling:
- Better error messages for different types of failures
- Structured error handling with context
- Automatic session refresh on authentication failures
- User-friendly error messages
Centralized API Logic:
- All API calls go through a single handler
- Consistent error handling and retry logic
- Easier to maintain and modify API behavior
- Better separation of concerns
Better User Experience:
- Clear feedback when rate limits are hit
- Automatic retries without user intervention
- Transparent error messages
- Graceful handling of authentication issues

## Setup

1. Clone the repository
2. Configure your Azure AD application:
   - Register a new application in Azure AD
   - Set up redirect URIs
   - Configure API permissions
3. Update the `config.js` file with your Azure AD and Dataverse configuration

## Deployment

This application is configured for deployment to Azure Static Web Apps.

### GitHub Setup

1. Fork the repository to your GitHub account.
2. Ensure your code is pushed to the main branch of your forked repository.
3. If you plan to use GitHub Actions for CI/CD:
   - Create a workflow file (e.g., `.github/workflows/main.yml`).
   - Configure the workflow to build and deploy your application.
   - (Alternatively, Azure Static Web Apps can often auto-generate a GitHub Actions workflow for you during setup).

### Azure Static Web App Setup

1. Create a new Static Web App in Azure Portal:
   - Go to Azure Portal > Create a resource
   - Search for "Static Web App"
   - Fill in the details:
     - Name: Choose a unique name
     - Resource Group: Create new or select existing
     - Hosting Plan: Free
     - Region: Choose the closest to your users
     - Source: GitHub
     - (You will be prompted to authorize Azure to access your GitHub account)
     - Organization: Select your GitHub organization or account
     - Repository: Select your forked repository
     - Branch: main
     - Build Presets: Custom
     - App location: "/"
     - API location: Leave empty
     - Output location: Leave empty

2. Configure Azure AD Application:
   - Go to Azure Portal > Azure Active Directory
   - Navigate to "App registrations"
   - Find your application
   - Add the Static Web App URL to the redirect URIs:
     - `https://<your-app-name>.azurewebsites.net`
   - Add the Static Web App URL to the post-logout redirect URIs:
     - `https://<your-app-name>.azurewebsites.net`

3. Update Configuration:
   - Update your `config.js` file with the new URLs
   - Commit and push the changes to your GitHub repository.

## Configuration

Update the following in `config.js`:

```javascript
const config = {
    auth: {
        clientId: "your-client-id",
        authority: "your-authority",
        redirectUri: "your-redirect-uri",
        postLogoutRedirectUri: "your-post-logout-redirect-uri"
    },
    dataverse: {
        environmentUrl: "your-dataverse-url",
        apiVersion: "v9.2",
        scope: "your-scope"
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    }
};
```

## Development

1. Install dependencies:

   npm install
   ```
2. Start the development server:

   npm start
   ```

3. node server


## License

MIT 