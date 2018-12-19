import * as React from 'react';
interface SecureContentProps {
    config: AuthenticationConfig;
    children?: React.ReactNode;
    authenticatingView?: React.ReactNode;
    onAuthentication?: (result: AuthenticationResult) => void;
    microserviceMode?: boolean;
}
interface SecureContentStatus {
    authenticating: boolean;
    error: string | undefined;
}
interface AuthenticationConfig {
    type: 'adal' | 'oidc';
    clientId: string;
    authority?: string;
    resource?: string;
}
interface AuthenticationResult {
    idToken: string | undefined;
    accessToken: string | undefined;
    error: string | undefined;
}
declare class SecureContent extends React.Component<SecureContentProps, SecureContentStatus> {
    private authenticationService;
    constructor(props: SecureContentProps);
    private onMessageReceived;
    componentWillMount(): void;
    private authenticate;
    render(): {} | null | undefined;
}
export default SecureContent;
