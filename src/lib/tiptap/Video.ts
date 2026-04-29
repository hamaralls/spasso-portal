import { mergeAttributes, Node } from '@tiptap/core'

export interface VideoOptions {
  HTMLAttributes: Record<string, string>
}

export interface SetVideoOptions {
  src: string
  controls?: boolean
  playsinline?: boolean
  preload?: 'auto' | 'metadata' | 'none'
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: SetVideoOptions) => ReturnType
    }
  }
}

const Video = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
        parseHTML: (element: HTMLElement) => element.hasAttribute('controls'),
        renderHTML: (attributes: { controls?: boolean }) => (
          attributes.controls ? { controls: 'controls' } : {}
        ),
      },
      playsinline: {
        default: true,
        parseHTML: (element: HTMLElement) => element.hasAttribute('playsinline'),
        renderHTML: (attributes: { playsinline?: boolean }) => (
          attributes.playsinline ? { playsinline: 'playsinline' } : {}
        ),
      },
      preload: {
        default: 'metadata',
        parseHTML: (element: HTMLElement) => element.getAttribute('preload') || 'metadata',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: options,
      }),
    }
  },
})

export default Video
