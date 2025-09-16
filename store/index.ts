import { configureStore } from '@reduxjs/toolkit'
import audioReducer from './audioStore'
import { useMusicStore } from './musicStore'
import { localStorageMiddleware } from './middleware'

// Create the Redux store
export const store = configureStore({
  reducer: {
    audio: audioReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(localStorageMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export hooks for use throughout the app
export { useMusicStore }
