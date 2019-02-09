export declare const AuthenticationContext: any;
import { AuthenticationConfig, AuthenticationService, AuthResult } from './authentication.service';
export declare class AuthenticationAdalService implements AuthenticationService {
    private config;
    private _identityToken;
    private _accessTokens;
    private _user;
    private _lastResource;
    private _authPromiseResolver;
    private _rejectPromiseResolver;
    private _authenticationContext;
    private readonly context;
    readonly identityToken: string | undefined;
    readonly accessToken: string | undefined;
    getAccessToken(resource?: string): string | undefined;
    readonly userProfile: any | undefined;
    constructor(config: AuthenticationConfig);
    private onAuthentication;
    loginAsync(): Promise<AuthResult>;
    authorizeAsync(resource: string): Promise<AuthResult>;
    logoutAsync(): Promise<any>;
    private IsUserLoggedIn;
    private GetUserProfile;
    private BuildAuthResultFromContext;
}
