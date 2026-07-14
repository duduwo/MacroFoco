import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {MainTabsParamList} from '../types/navigation';
import MainTabBar from './MainTabBar';
import DiaryScreen from './DiaryScreen';
import OrganizationScreen from './OrganizationScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Diario"
      backBehavior="initialRoute"
      tabBar={props => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Transição suave ao trocar de seção (fade + leve deslize) em vez do
        // corte seco padrão.
        animation: 'shift',
      }}>
      <Tab.Screen name="Organizacao" component={OrganizationScreen} options={{title: 'Alimentos'}} />
      <Tab.Screen name="Diario" component={DiaryScreen} options={{title: 'Diário'}} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{title: 'Perfil'}} />
    </Tab.Navigator>
  );
}
