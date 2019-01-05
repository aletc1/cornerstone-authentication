import React from "react";

export function isInsideIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

export function DefaultAuthenticatingView(props: any) {
    return <div className="loaderContainer">
                <div className="loader">
                    <div className="circle">&nbsp;</div>
                    <div className="circle">&nbsp;</div>
                    <div className="circle">&nbsp;</div>
                    <div className="circle">&nbsp;</div>
                </div>
            </div>;
}

export function DefaultErrorView(props: any) {
    return <div>
            <h1>SORRY, SOMETHING WENT WRONG :(</h1>
            <p>{JSON.stringify(props.error)}</p>
        </div>;
}

export function DefaultAuthenticationFailedView(props: any) {
    return <div>AUTHENTICATION FAILED</div>;
}