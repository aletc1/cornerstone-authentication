import * as React from 'react';
import communicator from '@cornerstone/communications';
import AuthenticationContext_ from './adal';

export const AuthenticationContext = AuthenticationContext_;

interface SecureContentProps {
    config: AuthenticationConfig;
    children?: React.ReactNode;
    authenticatingView?: React.ReactNode;
    onAuthentication?: (result: AuthenticationResult) => void;
    microserviceMode?: boolean
}

interface SecureContentStatus {
    authenticating: boolean,
    error: string | undefined
}

function AuthenticatingView(props: any) {
    return <div>AUTHENTICATING</div>;
}

interface AuthenticationConfig {
    type: 'adal' | 'oidc',
    clientId: string,
    authority?: string,
    resource?: string,
}

interface AuthenticationResult {
    idToken: string | undefined;
    accessToken: string | undefined;
    error: string | undefined;
}

function isInsideIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

class AuthenticationService {
    private config: AuthenticationConfig;
    private _identityToken: undefined | string;
    private _authPromiseResolver: undefined | ((value: string) => void);
    private _rejectPromiseResolver: undefined | ((value: string) => void);
    private _authenticationContext: any;

    private get context() {
        this._identityToken = undefined;
        this._authPromiseResolver = undefined;
        this._rejectPromiseResolver = undefined;

        this.onAuthentication = this.onAuthentication.bind(this);
        this.acquireTokenAsync = this.acquireTokenAsync.bind(this);
        this.loginAsync = this.loginAsync.bind(this);

        return this._authenticationContext || (this._authenticationContext = new AuthenticationContext({
            clientId: this.config.clientId,
            popUp: isInsideIframe(),
            callback: this.onAuthentication,
            //redirectUri: window.location.origin + "/tab-auth/silent-end",
            cacheLocation: "localStorage",
            navigateToLoginRequestUrl: false,
        }));
    }

    public get identityToken(): string | undefined {
        return this._identityToken;
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
            this._identityToken = token;
            if (this._authPromiseResolver) {
                this._authPromiseResolver(token);
            }
        }
        this._authPromiseResolver = undefined;
        this._rejectPromiseResolver = undefined;
    }

    public acquireTokenAsync(resource: string): Promise<string> {
        return new Promise((resolve, reject) => {
            var self = this;
            if (!this.identityToken) {
                reject("You need to login first before can obtain any token!");
            }
            var authenticationContext = this.context;
            authenticationContext.acquireToken(resource, function (errorDesc: any, token: string, error: any) {
                if (error) { //acquire token failure
                    if (isInsideIframe()) {
                        // If using popup flows
                        authenticationContext.acquireTokenPopup(resource, null, null, function (errorDesc: any, token: string, error: any) {
                            if (error) {
                                reject(errorDesc || error);
                            } else {
                                resolve(token);
                            }
                        });
                    }
                    else {
                        // In this case the callback passed in the Authentication request constructor will be called.
                        authenticationContext.acquireTokenRedirect(resource, null, null);
                    }
                }
                else {
                    //acquired token successfully
                    resolve(token);
                }
            });
        });
    }

    public loginAsync(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._authPromiseResolver = resolve;
            var self = this;
            var authenticationContext = this.context;
            if (authenticationContext.isCallback(window.location.hash)) {
                authenticationContext.handleWindowCallback(window.location.hash);
            }
            // See if there's a cached user and it matches the expected user
            var user = authenticationContext.getCachedUser();
            if (user) {
                resolve();
            }
            else {
                // No token, or token is expired
                authenticationContext._renewIdToken(function (err: string, idToken: string) {
                    if (err) {
                        // Initiate login
                        authenticationContext.login();
                    } else {
                        self._identityToken = idToken;
                        if (self._authPromiseResolver) {
                            self._authPromiseResolver(idToken);
                        }
                        self._authPromiseResolver = undefined;
                        self._rejectPromiseResolver = undefined;
                    }
                });
            }
        });
    }
}

class SecureContent extends React.Component<SecureContentProps, SecureContentStatus> {
    private authenticationService: AuthenticationService;

    constructor(props: SecureContentProps) {
        super(props);
        this.authenticationService = new AuthenticationService(props.config);
        this.state = {
            authenticating: true,
            error: undefined
        }
		
        this.onMessageReceived = this.onMessageReceived.bind(this);
        this.authenticate = this.authenticate.bind(this);
		
        if (props.microserviceMode) {
            communicator.addListener(this.onMessageReceived);
        }
    }

    private onMessageReceived(from: string, type: string, payload: any) {
        switch (type) {
            case 'AUTHENTICATION_REQUEST':
                let { resource } = payload;
                this.authenticate(resource).then(result => {
                    communicator.send('AUTHENTICATION_RESPONSE', result, from);
                }).catch(error => {
                    this.setState({ error: error });
                });
                break;
            case 'AUTHENTICATION_RESPONSE':
                var result = payload as AuthenticationResult
                this.setState({ authenticating: false, error: result.error });
                if (this.props.onAuthentication) {
                    this.props.onAuthentication(result);
                }
                break;
        }
    }

    componentWillMount() {
        if (this.props.microserviceMode && isInsideIframe()) {
            communicator.send('AUTHENTICATION_REQUEST', {
                resource: this.props.config.resource
            }, 'parent')
        } else {
            this.authenticate(this.props.config.resource).then(result => {
                this.setState({ authenticating: false, error: result.error });
                if (this.props.onAuthentication) {
                    this.props.onAuthentication(result);
                }
            }).catch(error => {
                this.setState({ error: error });
            });
        }
    }

    private authenticate(resource: string | undefined): Promise<AuthenticationResult> {
        return new Promise<AuthenticationResult>((resolve, reject) => {
            this.authenticationService.loginAsync().then(idToken => {
                if (resource) {
                    this.authenticationService.acquireTokenAsync(resource).then((accessToken: string) => {
                        resolve({
                            idToken: idToken,
                            accessToken: accessToken,
                            error: undefined
                        });
                    }).catch(err => {
                        reject(err);
                    });
                }
                else {
                    resolve({
                        idToken: idToken,
                        accessToken: undefined,
                        error: undefined
                    });
                }
            }).catch(err => {
                resolve({
                    idToken: undefined,
                    accessToken: undefined,
                    error: err
                });
            });
        });
    }

    public render() {
        if (this.state.error) {
            return <div>
                <h1>ERROR</h1>
                <p>{JSON.stringify(this.state.error)}</p>
            </div>;
        }
        return (this.state.authenticating) ? (this.props.authenticatingView || <AuthenticatingView />) : (this.props.children || <div></div>);
    }
}
export default SecureContent;