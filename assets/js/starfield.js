/**
 * Interactive starfield background effect
 */

const Starfield = {
  config: {
    numStars: 250,
    baseSpeed: 0.1, // Reduced from 0.3 to make animation much slower
    trailLength: 0.8,
    starColor: 'rgb(255, 255, 255)',
    canvasColor: 'rgba(0, 0, 15, 0.95)',
    hueJitter: 20,
    maxAcceleration: 2, // Reduced from 4 for gentler acceleration
    accelerationRate: 0.05, // Reduced for smoother, more gradual acceleration
    decelerationRate: 0.03, // Reduced for smoother deceleration
    minSpawnRadius: 20, // Start stars closer to center
    maxSpawnRadius: 150, // Maximum initial distance from center
    auto: true,
    originX: null,
    originY: null
  },

  canvas: null,
  ctx: null,
  container: null,
  originElement: null,
  stars: [],
  width: 0,
  height: 0,
  originX: 0,
  originY: 0,
  isAccelerating: false,
  animationFrame: null,

  setup(options = {}) {
    // Merge options with default config
    Object.assign(this.config, options);
    
    // Find container and origin elements
    this.container = document.querySelector('.starfield');
    
    if (!this.container) {
      console.error('Starfield container not found.');
      return;
    }
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
    
    // Style canvas
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '-1';

    // Initialize
    this.resize();
    this.initStars();
    
    if (this.config.auto) {
      this.originElement = document.querySelector('.starfield-origin');
      
      if (this.originElement) {
        // Set initial origin
        this.updateOrigin();
        
        // Add event listeners
        window.addEventListener('resize', () => this.resize());
        this.originElement.addEventListener('mouseenter', () => this.setAccelerate(true));
        this.originElement.addEventListener('mouseleave', () => this.setAccelerate(false));
      } else {
        console.warn('Starfield origin element not found, using center of container.');
        this.originX = this.width / 2;
        this.originY = this.height / 2;
      }
    } else {
      // Manual mode
      this.originX = this.config.originX || this.width / 2;
      this.originY = this.config.originY || this.height / 2;
    }
    
    // Start animation
    this.animate();
  },

  initStars() {
    this.stars = [];
    for (let i = 0; i < this.config.numStars; i++) {
      this.stars.push(this.createStar());
    }
  },

  createStar() {
    // Random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Random spawn distance from center (closer to center)
    const spawnRadius = this.config.minSpawnRadius + 
                        Math.random() * (this.config.maxSpawnRadius - this.config.minSpawnRadius);
    
    return {
      x: this.originX + Math.cos(angle) * spawnRadius,
      y: this.originY + Math.sin(angle) * spawnRadius,
      vx: 0,
      vy: 0,
      targetVx: 0,
      targetVy: 0,
      trail: [], // Store previous positions for trail effect
      color: this.getStarColor(),
      speed: this.config.baseSpeed * (0.5 + Math.random() * 0.5), // Vary base speed slightly
      angle: angle // Store the angle for outward movement
    };
  },
  
  getStarColor() {
    if (this.config.hueJitter === 0) {
      return this.config.starColor;
    }
    
    // Extract RGB components
    const rgbMatch = this.config.starColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return this.config.starColor;
    
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    
    // Convert RGB to HSL, jitter hue, convert back
    const [h, s, l] = this.rgbToHsl(r, g, b);
    const jitter = (Math.random() * 2 - 1) * this.config.hueJitter;
    const newH = (h + jitter / 360) % 1;
    const [newR, newG, newB] = this.hslToRgb(newH, s, l);
    
    return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
  },
  
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return [h, s, l];
  },
  
  hslToRgb(h, s, l) {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [r * 255, g * 255, b * 255];
  },

  resize() {
    // Get container dimensions
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    // Set canvas size
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    if (this.config.auto && this.originElement) {
      this.updateOrigin();
    }
  },
  
  updateOrigin() {
    if (!this.originElement) return;
    
    const rect = this.originElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    this.originX = rect.left + rect.width / 2 - containerRect.left;
    this.originY = rect.top + rect.height / 2 - containerRect.top;
  },

  animate() {
    this.update();
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  },

  update() {
    if (this.config.auto && this.originElement) {
      this.updateOrigin();
    }
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      
      // Calculate direction AWAY from origin (reversed the direction for outward movement)
      const dx = star.x - this.originX;
      const dy = star.y - this.originY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize direction
      let dirX = 0;
      let dirY = 0;
      
      if (distance > 0) {
        dirX = dx / distance;
        dirY = dy / distance;
      } else {
        // If at origin, move in the original random angle
        dirX = Math.cos(star.angle);
        dirY = Math.sin(star.angle);
      }
      
      // Calculate target velocity (moving outward)
      const acceleration = this.isAccelerating ? this.config.maxAcceleration : 0;
      star.targetVx = dirX * star.speed * (1 + acceleration);
      star.targetVy = dirY * star.speed * (1 + acceleration);
      
      // Gradually adjust velocity
      const rate = this.isAccelerating ? this.config.accelerationRate : this.config.decelerationRate;
      star.vx += (star.targetVx - star.vx) * rate;
      star.vy += (star.targetVy - star.vy) * rate;
      
      // Update position
      star.x += star.vx;
      star.y += star.vy;
      
      // Store position for trail effect
      star.trail.push({ x: star.x, y: star.y });
      
      // Limit trail length
      const trailMaxLength = 20; // Adjust for longer/shorter trails
      if (star.trail.length > trailMaxLength) {
        star.trail.shift();
      }
      
      // Reset star if it goes off screen (moved too far away)
      if (
        star.x < -50 || star.x > this.width + 50 || 
        star.y < -50 || star.y > this.height + 50
      ) {
        Object.assign(this.stars[i], this.createStar());
      }
    }
  },

  draw() {
    // Clear canvas with slight opacity for trail effect
    this.ctx.fillStyle = this.config.canvasColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    for (const star of this.stars) {
      if (star.trail.length > 1) {
        // Draw trail
        this.ctx.beginPath();
        this.ctx.moveTo(star.trail[0].x, star.trail[0].y);
        
        for (let i = 1; i < star.trail.length; i++) {
          const point = star.trail[i];
          this.ctx.lineTo(point.x, point.y);
        }
        
        // Create gradient for trail
        const gradient = this.ctx.createLinearGradient(
          star.trail[0].x, star.trail[0].y, 
          star.x, star.y
        );
        
        // Get opacity based on trail position
        const startOpacity = 0; // Trail start (transparent)
        const endOpacity = 0.8; // Trail end (more visible)
        
        gradient.addColorStop(0, this.getColorWithOpacity(star.color, startOpacity));
        gradient.addColorStop(1, this.getColorWithOpacity(star.color, endOpacity));
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2; // Thicker lines
        this.ctx.stroke();
      }
      
      // Draw star
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, 2, 0, Math.PI * 2); // Larger stars (2px instead of 1px)
      this.ctx.fillStyle = star.color;
      this.ctx.fill();
    }
    
    // Add some bright stars
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 3 + 1;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fill();
    }
  },
  
  getColorWithOpacity(color, opacity) {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return color;
    
    const r = rgbMatch[1];
    const g = rgbMatch[2];
    const b = rgbMatch[3];
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  setOrigin(x, y) {
    this.originX = x;
    this.originY = y;
  },
  
  setOriginX(x) {
    this.originX = x;
  },
  
  setOriginY(y) {
    this.originY = y;
  },
  
  setAccelerate(state) {
    this.isAccelerating = state;
  },
  
  resize(newWidth, newHeight) {
    if (newWidth && newHeight) {
      this.width = newWidth;
      this.height = newHeight;
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
    } else {
      // Fix the infinite recursion by calling the actual resize logic directly
      // instead of calling this.resize() which would create infinite recursion
      const rect = this.container.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      
      // Set canvas size
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      
      if (this.config.auto && this.originElement) {
        this.updateOrigin();
      }
    }
  },
  
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    if (this.config.auto) {
      window.removeEventListener('resize', () => this.resize());
      
      if (this.originElement) {
        this.originElement.removeEventListener('mouseenter', () => this.setAccelerate(true));
        this.originElement.removeEventListener('mouseleave', () => this.setAccelerate(false));
      }
    }
  }
};

// Export for module usage
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Starfield;
}