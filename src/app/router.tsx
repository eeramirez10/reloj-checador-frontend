import { createBrowserRouter, redirect } from 'react-router-dom'
import ApplicationLayout from './layout/application-layout'
import AuthGuard from '../features/auth/auth-guard'

export const router = createBrowserRouter([
  { path: '/login', lazy: async () => ({ Component: (await import('../pages/login.page')).default }) },
  { path: '/change-password', lazy: async () => ({ Component: (await import('../pages/change-password.page')).default }) },
  { element: <AuthGuard />, children: [
  {
    path: '/',
    element: <ApplicationLayout />,
    children: [
      { path: 'companies',lazy: async () => ({ Component: (await import('../pages/companies.page')).default }) },
      { path: 'my/profile',lazy: async () => ({ Component: (await import('../pages/my-profile.page')).default }) },
      { path: 'my/today',lazy: async () => ({ Component: (await import('../pages/my-attendance.page')).MyTodayPage }) },
      { path: 'my/card',lazy: async () => ({ Component: (await import('../pages/my-attendance.page')).default }) },
      { path: 'my/permissions',lazy: async () => ({ Component: (await import('../pages/my-permissions.page')).default }) },
      { path: 'accounts', lazy: async () => ({ Component: (await import('../pages/accounts.page')).default }) },
      {
        index: true,
        lazy: async () => {
          const { default: Component } = await import('../pages/dashboard.page')
          return { Component }
        },
      },
      {
        path: 'devices',
        lazy: async () => {
          const { default: Component } = await import('../pages/devices.page')
          return { Component }
        },
      },
      {
        path: 'branches',
        lazy: async () => { const { default: Component } = await import('../pages/branches.page'); return { Component } },
      },
      {
        path: 'schedules',
        lazy: async () => { const { default: Component } = await import('../pages/schedules.page'); return { Component } },
      },
      {
        path: 'assignments',
        lazy: async () => { const { default: Component } = await import('../pages/assignments.page'); return { Component } },
      },
      {
        path: 'daily-attendance',
        lazy: async () => { const { default: Component } = await import('../pages/daily-attendance.page'); return { Component } },
      },
      {
        path: 'overtime',
        lazy: async () => { const { default: Component } = await import('../pages/overtime.page'); return { Component } },
      },
      {
        path: 'leave-requests',
        lazy: async () => { const { default: Component } = await import('../pages/leave-requests.page'); return { Component } },
      },
      {
        path: 'attendance-cards',
        lazy: async () => { const { default: Component } = await import('../pages/attendance-cards.page'); return { Component } },
      },
      {
        path: 'attendance',
        lazy: async () => {
          const { default: Component } = await import('../pages/attendance.page')
          return { Component }
        },
      },
      {
        path: 'users',
        loader: () => redirect('/employees'),
      },
      {
        path: 'employees',
        lazy: async () => {
          const { default: Component } = await import('../pages/employees.page')
          return { Component }
        },
      },
      {
        path: 'employees/:id/attendance',
        lazy: async () => {
          const { default: Component } = await import('../pages/employee-attendance.page')
          return { Component }
        },
      },
      {
        path: 'synchronization',
        lazy: async () => {
          const { default: Component } = await import('../pages/synchronization.page')
          return { Component }
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { default: Component } = await import('../pages/not-found.page')
          return { Component }
        },
      },
    ],
  },
  ] },
], { basename: import.meta.env.BASE_URL })
