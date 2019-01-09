import { AuthenticationConfig, AuthenticationService, AuthResult } from './authentication.service';
export declare class AuthenticationOidcService implements AuthenticationService {
    private config;
    private _identityToken;
    private _accessToken;
    private _user;
    readonly identityToken: string | undefined;
    readonly accessToken: string | undefined;
    readonly userProfile: any | undefined;
    private readonly context;
    constructor(config: AuthenticationConfig);
    loginAsync(): Promise<AuthResult>;
    authorizeAsync(resource: string): Promise<AuthResult>;
    logoutAsync(): Promise<any>;
    private processResult;
}
