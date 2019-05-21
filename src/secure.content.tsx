import * as React from 'react';
import communicator from '@cornerstone/communications';
import { isInsideIframe, DefaultErrorView, DefaultAuthenticatingView, DefaultAuthenticationFailedView } from './global.functions.utils';
import { AuthenticationService, AuthenticationConfig, AuthResult } from './authentication.service';
import { AuthenticationOidcService } from './authentication.oidc.service';
import { AuthenticationAdalService } from './authentication.adal.service';

interface SecureContentProps {
    microserviceMode?: boolean;
    authenticationType: 'adal' | 'oidc' | 'msal'; // TODO: Implement msal for Azure AD v2 API
    authenticationConfiguration: AuthenticationConfig;    
    children?: React.ReactNode;    
    onAuthentication?: (result: AuthResult) => void;    
    authenticatingView?: React.ReactNode;
    authenticationFailedView?: React.ReactNode;
    errorView?: React.ReactNode;    
}

interface SecureContentStatus {
    authenticating: boolean,
    authenticated: boolean,
    authorized: boolean,
    result: AuthResult | undefined,
    error: string | undefined
}

export class SecureContent extends React.Component<SecureContentProps, SecureContentStatus> {    
    private _authenticationService: AuthenticationService;
    private _renewTokenTimer: any;

    constructor(props: SecureContentProps) {
        super(props);

        this.GuardProps(props);

        this._authenticationService = SecureContent.InstantiateAuthenticationService(props);
        this.state = {
            authenticating: true,
            authenticated: false,
            authorized: false,
            result: undefined,
            error: undefined
        }
		
        this.onMessageReceived = this.onMessageReceived.bind(this);
        this.authenticate = this.authenticate.bind(this);
		
        if (props.microserviceMode) {
            communicator.addListener(this.onMessageReceived);
        }
    }

    GuardProps(props: SecureContentProps) {
        if (!props.authenticationType
            || !props.authenticationConfiguration){
                throw new TypeError("authentication type and authentication configuration are mandatory properties.");
            }
    }

    componentWillMount() {
        if (this.props.microserviceMode && isInsideIframe()) {
            communicator.send('AUTHENTICATION_REQUEST', {
                resource: this.props.authenticationConfiguration.resource
            }, 'parent')
        } else {
            this.authenticate(this.props.authenticationConfiguration.resource).then(result => {
                this.SetStatusDependingOnResponse(result);
                this.RaiseOnAuthenticationEvent(result);
            }).catch(error => {
                this.SetStatusDependingOnError(error);
            });
        }
    }    

    public render() {
        if (this.state.error) {
            return this.props.authenticatingView || DefaultErrorView({error: this.state.error});
        }

        if (this.state.authenticating){
            return this.props.authenticatingView || <DefaultAuthenticatingView />;
        }

        if (this.state.authenticated == false || (this.props.authenticationConfiguration.resource && this.state.authorized == false)) {
            return this.props.authenticationFailedView || <DefaultAuthenticationFailedView/>;
        }

        return this.props.children || <div></div>;
    }

    private static InstantiateAuthenticationService(props: SecureContentProps): AuthenticationService {
        switch(props.authenticationType){
            case 'adal':
                return new AuthenticationAdalService(props.authenticationConfiguration);

            case 'oidc':
                return new AuthenticationOidcService(props.authenticationConfiguration);

            case 'msal':
                throw new TypeError("msal authentication type is not yet supported");
        }
    }

    private onMessageReceived(from: string, type: string, payload: any) {
        switch (type) {
            case 'AUTHENTICATION_REQUEST':
                let { resource } = payload;
                this.authenticate(resource).then(result => {
                    communicator.send('AUTHENTICATION_RESPONSE', result, from);
                }).catch(error => {
                    this.SetStatusDependingOnError(error);
                });
                break;
            case 'AUTHENTICATION_RESPONSE':
                var result = payload as AuthResult                
                this.SetStatusDependingOnResponse(result);                
                this.RaiseOnAuthenticationEvent(result);
                break;
        }
    }    

    private authenticate(resource: string | undefined): Promise<AuthResult> {
        return new Promise<AuthResult>((resolve, reject) => {
            if (this._authenticationService.identityToken) {
                this._authenticationService.authorizeAsync(resource as string).then((authorizationResult: AuthResult) => {
                    return resolve(authorizationResult);
                }).catch(err => {
                    reject(err);
                });
            }
            this._authenticationService.loginAsync().then((loginResult: AuthResult) => {
                if (loginResult && resource) {
                    this._authenticationService.authorizeAsync(resource).then((authorizationResult: AuthResult) => {
                        return resolve(authorizationResult);
                    }).catch(err => {
                        reject(err);
                    });
                }
                else {
                    return resolve(loginResult);
                }
            }).catch(error => {
                return resolve({
                    idToken: undefined,
                    accessToken: undefined,
                    userProfile: undefined,         
                    error: error,           
                    logout: this._authenticationService.logoutAsync
                });
            });
        });
    }

    private SetStatusDependingOnResponse(result: AuthResult){
        let authenticating = false;
        let authenticated = result && result.userProfile ? true : false;
        let authorized = this.props.authenticationConfiguration.resource && result && result.accessToken ? true : false;
        let error = result ? result.error : "unknown error";

        if (authenticated) {
            if (this._renewTokenTimer) {
                window.clearInterval(this._renewTokenTimer);
                this._renewTokenTimer = null;
            }
            this._renewTokenTimer = setInterval(() => {
                this.authenticate(this.props.authenticationConfiguration.backendApplicationId || this.props.authenticationConfiguration.serviceUrl).then(result => {
                    this.RaiseOnAuthenticationEvent(result);
                })
            }, 300000)
        }

        this.setState({ 
            authenticating: authenticating, 
            authenticated: authenticated,
            authorized: authorized,
            error: error });
    }

    private SetStatusDependingOnError(error: string){
        let authenticating = false;
        let authenticated = false;
        let authorized = false;

        this.setState({ 
            authenticating: authenticating, 
            authenticated: authenticated,
            authorized: authorized,
            error: error });
    }

    private RaiseOnAuthenticationEvent(result: AuthResult){
        if (this.props.onAuthentication) {
            this.props.onAuthentication(result);
        }
    }
}