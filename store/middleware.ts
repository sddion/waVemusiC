import { Middleware } from '@reduxjs/toolkit'

export const localStorageMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // Save to localStorage after state changes
  if (typeof window !== 'undefined') {
    const state = store.getState()
    const audioState = state.audio
    
    try {
      const stateToSave = {
        volume: audioState.volume,
        isMuted: audioState.isMuted,
        isShuffled: audioState.isShuffled,
        repeatMode: audioState.repeatMode,
        recentlyPlayed: audioState.recentlyPlayed,
        lastPlayedSongId: audioState.lastPlayedSongId,
        lastPlayedTime: audioState.lastPlayedTime,
        lastPlayedIndex: audioState.lastPlayedIndex,
      }
      
      localStorage.setItem('wave-music-audio-state', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Error saving audio state to localStorage:', error)
    }
  }
  
  return result
}
