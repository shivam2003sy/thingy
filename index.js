/**
 * @format
 */

// Must be first import — fixes Supabase "Cannot assign to protocol" error in RN
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
