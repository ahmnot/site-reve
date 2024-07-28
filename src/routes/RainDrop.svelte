<script>
    export let left = 0;
    export let delay = 0;
    export let duration = 0;
    export let color = 'rgba(0, 0, 0, 0.5)'; // Default color
    export let top = '0'; // Add the new top prop
    export let rainGround = '0'; // Add the new rainGround prop
  </script>
  
  <div class="drop" style="left: {left}%; top: {top}; animation-delay: {delay}s; animation-duration: {duration}s; --rainGround: {rainGround};">
    <div class="stem" style="background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), {color}); animation-delay: {delay}s; animation-duration: {duration}s;"></div>
    <div class="splat" style="border-top: 2px dotted {color}; animation-delay: {delay}s; animation-duration: {duration}s;"></div>
  </div>
  
  <style>
    .drop {
      position: absolute;
      width: 1px;
      height: 100px;
      pointer-events: none;
      animation: drop 0.5s linear infinite;
    }
  
    @keyframes drop {
      0% {
        transform: translateY(0);
      }
      75% {
        transform: translateY(var(--rainGround));
      }
      100% {
        transform: translateY(var(--rainGround));
      }
    }
  
    .stem {
      width: 1px;
      height: 60%;
      margin-left: 7px;
      animation: stem 0.5s linear infinite;
    }
  
    @keyframes stem {
      0% {
        opacity: 1;
      }
      65% {
        opacity: 1;
      }
      75% {
        opacity: 0;
      }
      100% {
        opacity: 0;
      }
    }
  
    .splat {
      width: 15px;
      height: 10px;
      border-radius: 50%;
      opacity: 1;
      transform: scale(0);
      animation: splat 0.5s linear infinite;
      display: block;
    }

  
    @keyframes splat {
      0% {
        opacity: 1;
        transform: scale(0);
      }
      80% {
        opacity: 1;
        transform: scale(0);
      }
      90% {
        opacity: 0.5;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.5);
      }
    }
  </style>
  