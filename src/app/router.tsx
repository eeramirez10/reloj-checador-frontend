import { createBrowserRouter, redirect } from 'react-router-dom'
import ApplicationLayout from './layout/application-layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ApplicationLayout />,
    children: [
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
])
