// module.exports = {
//   content: [
//     "./src/**/*.{js,jsx,ts,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Add a custom font family for the retro feel
      fontFamily: {
        'press-start': ['"Press Start 2P"', 'cursive'],
      },
      // Define the custom keyframe animations
      keyframes: {
        slide: {
          '0%': { backgroundPositionX: '0' },
          '100%': { backgroundPositionX: '-2400px' },
        },
        'obstacle-slide': {
          '0%': { right: '-30px' },
          '100%': { right: '100%' },
        }
      },
      // Define the animation utilities that use the keyframes
      animation: {
        'ground-slide': 'slide 15s linear infinite',
        'obstacle-slide': 'obstacle-slide 2s linear infinite',
      },
    },
  },
  plugins: [],
}