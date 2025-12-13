export interface RouteConfig {
  path: string;
  component: string; // Component name or lazy import
  allowedRoles: ('student' | 'teacher')[];
  requiresAuth: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    component: 'Home',
    allowedRoles: ['student', 'teacher'],
    requiresAuth: true,
  },
  {
    path: '/login',
    component: 'Auth',
    allowedRoles: [],
    requiresAuth: false,
  },
  {
    path: '/body-parts-game',
    component: 'BodyPartsGame',
    allowedRoles: ['student', 'teacher'],
    requiresAuth: true,
  },
];