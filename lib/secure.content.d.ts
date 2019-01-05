import * as React from 'react';
import { AuthenticationConfig, AuthResult } from './authentication.service';
interface SecureContentProps {
    microserviceMode?: boolean;
    authenticationType: 'adal' | 'oidc' | 'msal';
    authenticationConfiguration: AuthenticationConfig;
    children?: React.ReactNode;
    onAuthentication?: (result: AuthResult) => void;
    authenticatingView?: React.ReactNode;
    authenticationFailedView?: React.ReactNode;
    errorView?: React.ReactNode;
}
interface SecureContentStatus {
    authenticating: boolean;
    authenticated: boolean;
    authorized: boolean;
    result: AuthResult | undefined;
    error: string | undefined;
}
export declare class SecureContent extends React.Component<SecureContentProps, SecureContentStatus> {
    private _authenticationService;
    constructor(props: SecureContentProps);
    GuardProps(props: SecureContentProps): void;
    componentWillMount(): void;
    render(): {};
    private static InstantiateAuthenticationService;
    private onMessageReceived;
    private authenticate;
    private SetStatusDependingOnResponse;
    private SetStatusDependingOnError;
    private RaiseOnAuthenticationEvent;
}
export {};
