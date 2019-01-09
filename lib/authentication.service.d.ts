export interface AuthenticationService {
    identityToken: string | undefined;
    accessToken: string | undefined;
    userProfile: any | undefined;
    loginAsync(): Promise<AuthResult>;
    authorizeAsync(resource: string): Promise<AuthResult>;
    logoutAsync(): Promise<any>;
}
export interface AuthenticationConfig {
    clientId: string;
    tenant?: string;
    authority?: string;
    resource?: string;
    redirectUri?: string;
    extraQueryParameter?: string;
}
export interface AuthResult {
    idToken: string | undefined;
    accessToken: string | undefined;
    userProfile: UserProfileResult | undefined;
    error: string | undefined;
    logout: () => Promise<any>;
}
export interface UserProfileResult {
    fullName: string | undefined;
    firstName: string | undefined;
    lastName: string | undefined;
    email: string | undefined;
    roles: string[] | undefined;
    profile: any | undefined;
}
