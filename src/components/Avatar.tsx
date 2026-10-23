interface AvatarProps {
    src?: string | null
    gender?: string | null
    size?: number
    alt?: string
    bgColor?: string
    className?: string
    onClick?: () => void
}

const RING_COLORS: Record<string, string> = {
    female: '#f472b6',
    male: '#60a5fa',
}

function Avatar({ src, gender, size = 40, alt = '', bgColor, className = '', onClick }: AvatarProps) {
    const ringColor = gender ? RING_COLORS[gender] : undefined
    const small = size < 32

    return (
        <div
            onClick={onClick}
            className={`shrink-0 rounded-full ${className}`}
            style={{
                width: size,
                height: size,
                padding: small ? 1 : 2,
                border: `${small ? 1 : 1.5}px solid ${ringColor ?? 'transparent'}`,
                background: bgColor,
            }}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full rounded-full object-cover"
                />
            ) : (
                <div className="w-full h-full rounded-full bg-purple-500" />
            )}
        </div>
    )
}

export default Avatar
