import AuthenticationContext_ from './adal';
import { isInsideIframe } from './global.functions.utils';
import { AuthenticationConfig, AuthenticationService, AuthResult, UserProfileResult } from './authentication.service';

export const AuthenticationContext = AuthenticationContext_;

export class AuthenticationAdalService implements AuthenticationService {
    private config: AuthenticationConfig;

    private _identityToken: undefined | string;
    private _accessToken: undefined | string;
    private _user: undefined | any;

    private _authPromiseResolver: undefined | ((value: AuthResult) => void);
    private _rejectPromiseResolver: undefined | ((value: string) => void);

    private _authenticationContext: any;

    private get context() {
        this._authPromiseResolver = undefined;
        this._rejectPromiseResolver = undefined;

        this.onAuthentication = this.onAuthentication.bind(this);
        this.authorizeAsync = this.authorizeAsync.bind(this);
        this.loginAsync = this.loginAsync.bind(this);

        return this._authenticationContext || (this._authenticationContext = new AuthenticationContext({
            clientId: this.config.clientId,
            tenant: this.config.tenant,
            instance: this.config.authority,
            extraQueryParameter: this.config.extraQueryParameter,
            redirectUri: this.config.redirectUri,
            popUp: false,
            callback: this.onAuthentication,
            //redirectUri: window.location.origin + "/tab-auth/silent-end",
            cacheLocation: "localStorage",
            navigateToLoginRequestUrl: false,
        }));
    }

    public get identityToken(): string | undefined {
        return this._identityToken;
    }

    public get accessToken(): string | undefined {
        return this._accessToken;
    }

    public get userProfile(): any | undefined {
        return this._user;
    }

    constructor(config: AuthenticationConfig) {
        this.config = config;
    }

    private onAuthentication(errorDesc: string, token: string, error: any, tokenType: any) {
        if (error) {
            console.error(error);
            console.error(errorDesc);
            if (this._rejectPromiseResolver) {
                this._rejectPromiseResolver(errorDesc);
            }
        } else {
            if (this._authPromiseResolver) {
                this._authPromiseResolver(this.BuildAuthResultFromContext(this.context, undefined));
            }
        }
        this._authPromiseResolver = undefined;
        this._rejectPromiseResolver = undefined;
    }

    public loginAsync(): Promise<AuthResult> {
        return new Promise((resolve, reject) => {            
            this._authPromiseResolver = resolve;            
            
            var self = this;
            var authenticationContext = self.context;
            
            if (authenticationContext.isCallback(window.location.hash)) {
                authenticationContext.handleWindowCallback(window.location.hash);
            }

            if (self.IsUserLoggedIn()) {
                return resolve(self.BuildAuthResultFromContext(authenticationContext, undefined));
            }
            else {
                // No token, or token is expired
                authenticationContext._renewIdToken(
                    function (err: string, idToken: string) {
                        if (err) {
                            // Initiate login
                            authenticationContext.login();
                        } else {
                            if (self._authPromiseResolver) {
                                self._authPromiseResolver(self.BuildAuthResultFromContext(authenticationContext, undefined));
                            }
                            self._authPromiseResolver = undefined;
                            self._rejectPromiseResolver = undefined;
                        }
                    });
            }
        });
    }

    public authorizeAsync(resource: string): Promise<AuthResult> {
        return new Promise((resolve, reject) => {
            
            if (!this.IsUserLoggedIn()) {
                return reject("You need to login first before can obtain any token!");
            }
            
            var self = this;
            var authenticationContext = self.context;

            authenticationContext.acquireToken(resource, function (errorDesc: any, accessToken: string, error: any) {
                if (error) { //acquire token failure
                    if (isInsideIframe()) {
                        // If using popup flows
                        authenticationContext.acquireTokenPopup(resource, null, null, function (errorDesc: any, accessToken: string, error: any) {
                            if (error) {
                                return reject(errorDesc || error);
                            } else {
                                return resolve(self.BuildAuthResultFromContext(authenticationContext, resource));
                            }
                        });
                    }
                    else {
                        // In this case the callback passed in the Authentication request constructor will be called.
                        return  authenticationContext.acquireTokenRedirect(resource, null, null);
                    }
                }
                else {
                    //acquired token successfully
                    return resolve(self.BuildAuthResultFromContext(authenticationContext, resource));
                }
            });
        });
    } 
    
    public logoutAsync(): Promise<any> {
        return this.context.logOut();
    }

    private IsUserLoggedIn(): boolean {
        // See if there's a cached user and it matches the expected user
        var userProfile = this.GetUserProfile();
        
        return userProfile && this.config.clientId == userProfile.aud;
    }

    private GetUserProfile(): any {
        var user = this.context.getCachedUser();

        return user ? user.profile : undefined;
    }

    private BuildAuthResultFromContext(authenticationContext: any, resource: string | undefined): AuthResult {
        this._identityToken = authenticationContext._getItem(authenticationContext.CONSTANTS.STORAGE.IDTOKEN);
        this._accessToken = resource ? authenticationContext.getCachedToken(resource) : undefined;
        this._user = authenticationContext.getCachedUser();

        let profile = this._user.profile;

        // https://docs.microsoft.com/en-us/azure/architecture/multitenant-identity/claims
        return {
            idToken: this._identityToken,
            accessToken: this._accessToken,            
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