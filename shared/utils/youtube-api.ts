// YouTube API helper functions
export const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT) {
      resolve()
      return
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      resolve()
    }
  })
}

export const createYouTubePlayer = (
  elementId: string,
  videoId: string,
  options: {
    autoplay?: number
    controls?: number
    mute?: number
    loop?: number
    modestBranding?: number
  } = {},
): Promise<any> => {
  return new Promise((resolve) => {
    const player = new window.YT.Player(elementId, {
      videoId,
      playerVars: {
        autoplay: options.autoplay ?? 0,
        controls: options.controls ?? 0,
        mute: options.mute ?? 1,
        loop: options.loop ?? 1,
        modestbranding: options.modestBranding ?? 1,
        playlist: videoId, // Required for looping
      },
      events: {
        onReady: (event: any) => {
          resolve(event.target)
        },
      },
    })
  })
}
