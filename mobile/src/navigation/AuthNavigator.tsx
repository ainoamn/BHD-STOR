import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '@screens/LoginScreen';
import RegisterScreen from '@screens/RegisterScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F8F9FA' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          gestureEnabled: true,
          cardStyle: { backgroundColor: '#F8F9FA' },
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={LoginScreen} // Placeholder - create ForgotPasswordScreen
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
