import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop/shop.page').then( m => m.ShopPage)
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help/help.page').then( m => m.HelpPage)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.page').then( m => m.CheckoutPage)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then( m => m.NotificationsPage)
  },

  {
    path: 'garden/:id',
    loadComponent: () => import('./pages/garden/garden.page').then( m => m.GardenPage)
  },
  {
    path: 'plant/:id',
    loadComponent: () => import('./pages/plant/plant.page').then( m => m.PlantPage)
  },

  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.page').then( m => m.AuthPage),
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.page').then( m => m.LoginPage)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.page').then( m => m.RegisterPage)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
      }
    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage),
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/settings/profile/profile.page').then( m => m.ProfilePage)
      },
      {
        path: 'security',
        loadComponent: () => import('./pages/settings/security/security.page').then( m => m.SecurityPage)
      },
      {
        path: 'preferences',
        loadComponent: () => import('./pages/settings/preferences/preferences.page').then( m => m.PreferencesPage)
      }
    ]
  }
];
