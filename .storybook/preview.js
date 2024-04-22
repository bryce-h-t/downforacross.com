import {addDecorator} from '@storybook/react';
import {BrowserRouter as Router} from 'react-router-dom';

addDecorator((story) => <Router>{story()}</Router>);
