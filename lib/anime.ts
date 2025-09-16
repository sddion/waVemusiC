// Dynamic import for anime.js to avoid SSR issues
// Define the anime.js function type based on its usage in the app
type AnimeFunction = (params: {
  targets: string | Element | NodeList | Array<Element> | null
  opacity?: number | number[]
  translateX?: number | number[]
  translateY?: number | number[]
  scale?: number | number[]
  width?: string
  duration?: number
  easing?: string
  rotate?: number | number[]
  [key: string]: any // Allow other anime.js properties
}) => {
  play: () => void
  pause: () => void
  restart: () => void
  reverse: () => void
  seek: (time: number) => void
  finished: Promise<void>
}

let anime: AnimeFunction | null = null
let animePromise: Promise<AnimeFunction> | null = null

const loadAnime = async () => {
  if (anime) return anime
  if (animePromise) return animePromise
  
  animePromise = import('animejs').then((animeModule) => {
    anime = animeModule.default
    return anime
  })
  
  return animePromise
}

// Export a function that returns the anime instance
const loadAnimeInstance = async (): Promise<AnimeFunction | null> => {
  if (typeof window === 'undefined') return null
  return loadAnime()
}

export default loadAnimeInstance

// Export a synchronous version that returns null if not loaded
export const getAnime = () => anime
