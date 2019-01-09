import Oidc from 'oidc-client';
import { AuthenticationConfig, AuthenticationService, AuthResult, UserProfileResult } from './authentication.service';

export class AuthenticationOidcService implements AuthenticationService {
    private config: AuthenticationConfig;

    private _identityToken: undefined | string;
    private _accessToken: undefined | string;
    private _user: undefined | any;

    public get identityToken(): string | undefined {
        return this._identityToken;
    }

    public get accessToken(): string | undefined {
        return this._accessToken;
    }

    public get userProfile(): any | undefined {
        return this._user;
    }

    private get context() {
        this._identityToken = undefined;
        this.loginAsync = this.loginAsync.bind(this);
        this.logoutAsync = this.logoutAsync.bind(this);
        this.processResult = this.processResult.bind(this);

        return new Oidc.UserManager({
            automaticSilentRenew: true,
            authority: this.config.authority,
            client_id: this.config.clientId,
            redirect_uri: window.location.href,
            response_type: "id_token token",
            scope: `openid profile ${this.config.resource}`,
            post_logout_redirect_uri: this.config.redirectUri,
            loadUserInfo: true,            
            userStore: new Oidc.WebStorageStateStore({ store: window.localStorage })
        });
    }    

    constructor(config: AuthenticationConfig) {
        this.config = config;
    }    

    public loginAsync(): Promise<AuthResult> {
        return new Promise((resolve, reject) => {
            var self = this;
            var userManager = this.context;

            userManager.signinRedirectCallback().then(function () {
                userManager.getUser().then(function (user: any) {
                    if (user) {
                        console.log("User logged in", user.profile);
                        resolve(self.processResult(user));
                    }
                    else {
                        console.log("User not logged in");
                        userManager.signinRedirect();
                    }
                });
            }).catch(function (error: any) {
                userManager.getUser().then(function (user: any) {
                    if (user) {
                        console.log("User logged in", user.profile);
                        resolve(self.processResult(user));
                    }
                    else {
                        console.log("User not logged in");
                        userManager.signinRedirect();
                    }
                });
            });
        });
    }

    public authorizeAsync(resource: string): Promise<AuthResult> {
        throw new TypeError("authorize is not supported for oidc authentication service.");
    }

    public logoutAsync(): Promise<any> {
        return this.context.signoutRedirect();
    }

    private processResult(result: any): AuthResult {
        this._identityToken = result.id_token;
        this._accessToken = result.access_token;
        this._user = result.profile;
        
        var profile = result.profile || {}
        
        // // https://docs.microsoft.com/en-us/azure/architecture/multitenant-identity/claims
        return {
            idToken: result.id_token,
            accessToken: result.access_token,            
            userProfile: <UserProfileResult>{
                fullName: profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || profile["name"],
                firstName: profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] || profile["given_name"],
                lastName: profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] || profile["family_name"],
                email: profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || profile["email"],
                roles: profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/roles"] || profile["roles"],
                profile: profile
            },
            error: undefined,            
            logout: this.logoutAsync
        }
    }
}