export async function convertIfHeic(file: File): Promise<File> {
    const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')

    if (!isHeic) return file

    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
    const blob = Array.isArray(converted) ? converted[0] : converted
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
}

export async function resizeImage(file: File, maxDimension: number, quality = 0.82): Promise<File> {
    return new Promise((resolve) => {
        const img = new window.Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            let { width, height } = img

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width)
                    width = maxDimension
                } else {
                    width = Math.round((width * maxDimension) / height)
                    height = maxDimension
                }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url)
                    if (!blob) { resolve(file); return }
                    resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
        img.src = url
    })
}