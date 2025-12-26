<template>
  <canvas ref="canvas" class="sakura-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let ctx = null
let animationFrameId = null
let petals = []

const props = defineProps({
  petalCount: {
    type: Number,
    default: 50
  },
  speed: {
    type: Number,
    default: 1
  }
})

// Petal class
class Petal {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.reset()
    // Start at random y positions initially to fill screen
    this.y = Math.random() * canvasHeight
  }

  reset() {
    this.x = Math.random() * this.canvasWidth
    this.y = -20
    this.size = Math.random() * 15 + 10 // 10-25px
    this.speedX = Math.random() * 2 - 1
    this.speedY = Math.random() * 1 + 0.5 * props.speed
    this.rotation = Math.random() * 360
    this.rotationSpeed = Math.random() * 2 - 1
    this.opacity = Math.random() * 0.5 + 0.3
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY
    this.rotation += this.rotationSpeed

    if (this.y > this.canvasHeight + 20) {
      this.reset()
    }
    
    // Wrap around horizontally
    if (this.x > this.canvasWidth + 20) this.x = -20
    if (this.x < -20) this.x = this.canvasWidth + 20
  }

  draw(ctx) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate((this.rotation * Math.PI) / 180)
    ctx.globalAlpha = this.opacity
    
    // Draw simple petal shape
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(5, -5, 10, -5, 10, 0)
    ctx.bezierCurveTo(10, 10, 0, 15, 0, 0)
    ctx.bezierCurveTo(0, 15, -10, 10, -10, 0)
    ctx.bezierCurveTo(-10, -5, -5, -5, 0, 0)
    ctx.fillStyle = '#ffc0cb' // Pink
    ctx.fill()
    
    ctx.restore()
  }
}

function init() {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  
  resize()
  window.addEventListener('resize', resize)
  
  // Create petals
  petals = []
  for (let i = 0; i < props.petalCount; i++) {
    petals.push(new Petal(canvas.value.width, canvas.value.height))
  }
  
  animate()
}

function resize() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

function animate() {
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  petals.forEach(petal => {
    petal.update()
    petal.draw(ctx)
  })
  
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.sakura-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
