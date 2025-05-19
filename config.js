const config = {
    auth: {
        clientId: "52a70017-0822-4933-9ebb-be161f15ea47", // Microsoft's sample client ID
        authority: "https://login.microsoftonline.com/common",
        
        redirectUri: "https://delightful-forest-069a18503.6.azurestaticapps.net/index.html",
        postLogoutRedirectUri: "https://delightful-forest-069a18503.6.azurestaticapps.net/index.html"
        //redirectUri: "http://localhost:5500/index.html",
        //postLogoutRedirectUri: "http://localhost:5500/index.html"
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true
    },
    dataverse: {
        environmentUrl: "https://<Your-TenantName-Here>.crm11.dynamics.com", // Replace with your Dataverse environment URL
        apiVersion: "v9.2",
        scope: "https://<Your-TenantName-Here>.crm11.dynamics.com/.default", // Replace with your Dataverse scope        
    }
}; 