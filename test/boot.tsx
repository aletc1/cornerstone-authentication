import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import App from './app';

export default function renderApp(): ReactWrapper<any> {
    const wrapper = mount(
            <App />
    );
    return wrapper;
}