"use client"

import React, { useEffect, useRef, useState } from 'react'

type ImageCropperProps = {
  src: string
  aspect?: number // width/height, e.g., 1 for square, 4/3, etc.
  onCancel: () => void
  onCropped: (file: File) => void
}

export function ImageCropper({ src, aspect = 1, onCancel, onCropped }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 200, h: 200 })
  const [dragging, setDragging] = useState<null | 'move' | 'resize'>(null)
  const [start, setStart] = useState<{x:number;y:number;crop:{x:number;y:number;w:number;h:number}} | null>(null)
  const [ready, setReady] = useState(false)

  // Initialize crop to centered square within displayed image
  const initCrop = () => {
    const img = imgRef.current
    const overlay = overlayRef.current
    if (!img || !overlay) return
    const imgRect = img.getBoundingClientRect()
    const overlayRect = overlay.getBoundingClientRect()
    // Offsets of image inside overlay
    const offsetX = imgRect.left - overlayRect.left
    const offsetY = imgRect.top - overlayRect.top
    const viewW = imgRect.width
    const viewH = imgRect.height
    if (viewW <= 0 || viewH <= 0) return
    // Choose size based on aspect and fit within image
    const base = Math.min(viewW, viewH) * 0.6
    const w = aspect >= 1 ? base : base * aspect
    const h = aspect >= 1 ? base / aspect : base
    const x = offsetX + (viewW - w) / 2
    const y = offsetY + (viewH - h) / 2
    setCrop({ x, y, w, h })
    setReady(true)
  }

  useEffect(() => {
    // Delay to ensure layout ready
    const t = setTimeout(initCrop, 0)
    return () => clearTimeout(t)
  }, [src, aspect])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const rect = overlayRef.current!.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const isHandle = target.dataset.handle === 'se'
    setDragging(isHandle ? 'resize' : 'move')
    setStart({ x: startX, y: startY, crop: { ...crop } })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !start) return
    const overlay = overlayRef.current
    if (!overlay) return
    const rect = overlay.getBoundingClientRect()
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (dragging === 'move') {
      let nx = start.crop.x + dx
      let ny = start.crop.y + dy
      // clamp within overlay bounds
      nx = Math.max(0, Math.min(nx, rect.width - start.crop.w))
      ny = Math.max(0, Math.min(ny, rect.height - start.crop.h))
      // translate back to absolute (relative to overlay top-left)
      setCrop(prev => ({ ...prev, x: nx, y: ny }))
    } else if (dragging === 'resize') {
      // Keep anchor at top-left, resize towards bottom-right with aspect ratio
      const img = imgRef.current
      if (!img) return
      const imgRect = img.getBoundingClientRect()
      const offsetX = imgRect.left - rect.left
      const offsetY = imgRect.top - rect.top
      // Maximum width/height allowed within image view
      const maxW = Math.max(0, (offsetX + imgRect.width) - start.crop.x)
      const maxH = Math.max(0, (offsetY + imgRect.height) - start.crop.y)
      // Determine width based on movement and aspect
      let targetW = start.crop.w + Math.max(dx, dy)
      let targetH = targetW / aspect
      // Clamp to image view bounds
      if (targetW > maxW) { targetW = maxW; targetH = targetW / aspect }
      if (targetH > maxH) { targetH = maxH; targetW = targetH * aspect }
      targetW = Math.max(50, targetW)
      targetH = Math.max(50 / aspect, targetH)
      setCrop(prev => ({ ...prev, w: targetW, h: targetH }))
    }
  }

  const onMouseUp = () => {
    setDragging(null)
    setStart(null)
  }

  const performCrop = async () => {
    const img = imgRef.current
    const overlay = overlayRef.current
    if (!img || !overlay) return
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    const imgRect = img.getBoundingClientRect()
    const overlayRect = overlay.getBoundingClientRect()
    const scaleX = naturalW / imgRect.width
    const scaleY = naturalH / imgRect.height

    // Translate crop box from overlay space into image display space
    const offsetX = imgRect.left - overlayRect.left
    const offsetY = imgRect.top - overlayRect.top
    let relX = crop.x - offsetX
    let relY = crop.y - offsetY
    let relW = crop.w
    let relH = crop.h
    // Clamp to image display bounds
    relX = Math.max(0, Math.min(relX, imgRect.width))
    relY = Math.max(0, Math.min(relY, imgRect.height))
    relW = Math.max(1, Math.min(relW, imgRect.width - relX))
    relH = Math.max(1, Math.min(relH, imgRect.height - relY))

    const sx = relX * scaleX
    const sy = relY * scaleY
    const sw = relW * scaleX
    const sh = relH * scaleY

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(sw)
    canvas.height = Math.round(sh)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.92)!)
    const file = new File([blob], `avatar-cropped-${Date.now()}.jpg`, { type: 'image/jpeg' })
    onCropped(file)
  }

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onMouseUp={onMouseUp} />
      <div className="relative z-[12010] w-[min(92vw,700px)] rounded-2xl bg-slate-900/95 border border-white/10 text-white shadow-2xl p-4">
        <div className="text-lg font-semibold mb-3">Beskär bild</div>
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          <img ref={imgRef} src={src} onLoad={initCrop} alt="Förhandsvisning" className="max-h-[60vh] w-full object-contain select-none" />
          <div
            ref={overlayRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            className="absolute inset-0 cursor-move"
          >
            <div
              style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
              className="absolute border-2 border-sky-400/90 bg-sky-400/10"
            >
              <div data-handle="se" className="absolute -bottom-2 -right-2 h-4 w-4 rounded bg-sky-400" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20">Avbryt</button>
          <button onClick={performCrop} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">Använd bild</button>
        </div>
      </div>
    </div>
  )
}


