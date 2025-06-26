import { Logo } from './logo'
import { createGradient, COLORS } from '@/lib/brand'

export function LogoShowcase() {
  return (
    <div className="grid grid-cols-2 gap-8">
      {/* 01 - White on Gradient */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">01 White on Gradient</div>
        <div 
          className="p-8 rounded-lg flex items-center justify-center"
          style={{ 
            background: createGradient(135, [COLORS.primary.deepBlue, COLORS.primary.brightBlue, COLORS.primary.cyan])
          }}
        >
          <Logo size="xl" showText background="gradient" />
        </div>
      </div>

      {/* 02 - White or color over image */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">02 White or color over image</div>
        <div 
          className="p-8 rounded-lg flex items-center justify-center relative overflow-hidden"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <Logo size="xl" showText background="image" className="relative z-10" />
        </div>
      </div>

      {/* 03 - White on Black */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">03 White on Black</div>
        <div className="p-8 rounded-lg flex items-center justify-center bg-brand-black">
          <Logo size="xl" showText background="black" />
        </div>
      </div>

      {/* 04 - Color on Neutral */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">04 Color on Neutral</div>
        <div className="p-8 rounded-lg flex items-center justify-center bg-gray-100">
          <Logo size="xl" showText background="neutral" variant="color" />
        </div>
      </div>
    </div>
  )
} 