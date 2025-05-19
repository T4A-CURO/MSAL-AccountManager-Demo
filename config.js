const config = {
    auth: {
        clientId: "52a70017-0822-4933-9ebb-be161f15ea47", // T4A's sample client ID - You need to create your own one of these and if using in production you will also require to be registered as an approved publisher.
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